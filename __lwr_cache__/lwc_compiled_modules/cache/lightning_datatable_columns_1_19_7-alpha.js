import { normalizeBoolean } from 'lightning/utilsPrivate';
import { isObjectLike } from './utils';
import { getRowNumberColumnDef, hasRowNumberColumn, setShowRowNumberColumn } from './rowNumber';
import { isTreeType, isValidTypeForTree } from './types';
import { updateColumnSortingState } from './sort';
import rowActionsDefaultAriaLabel from '@salesforce/label/LightningDatatable.rowActionsDefaultAriaLabel';
const i18n = {
  rowActionsDefaultAriaLabel
};
export const SELECTABLE_ROW_CHECKBOX = 'SELECTABLE_CHECKBOX';
const SELECTABLE_COLUMN = {
  type: SELECTABLE_ROW_CHECKBOX,
  fixedWidth: 32,
  tabIndex: -1,
  internal: true
};

/**
 * Returns the columns default state.
 *
 * @returns {Object} The default column state.
 */
export function getColumnsDefaultState() {
  return {
    columns: []
  };
}

/**
 * Returns whether or not the datatable has columns.
 *
 * @param {Object} state The datatable's state.
 * @returns {Boolean} Whether the datatable has columns.
 */
export function hasColumns(state) {
  return getColumns(state).length > 0;
}

/**
 * Returns whether or not the column has been specified by the customer.
 *
 * @param {Object} column The column definition object.
 * @returns {Boolean} Whether the column is customer defined or not.
 */
export function isCustomerColumn(column) {
  return column.internal !== true;
}

/**
 * Returns the datatable's columns from state.
 *
 * @param {Object} state  The datatable's state.
 * @returns {Array} The datatable's columns definition.
 */
export function getColumns(state) {
  return state.columns;
}

/**
 * Returns whether any of the datatable's columns are editable.
 *
 * @param {Array} columns The datatable's column definition.
 * @returns {Boolean} Whether any of the columns are editable.
 */
export function hasEditableColumn(columns) {
  return columns.some(column => column.editable);
}

/**
 * Given an array of column definitions, returns a filtered array containing only those
 * elements from the original array that are editable. For any two columns, C_1 and C_2,
 * that are present in both the input and output array, the relative ordering between
 * them that existed in the input array is maintained in the output array.
 *
 * @param {Array} columns The datatable's column definition. Must be truthy and must be
 *                        filled with truthy column definition objects.
 */
export function getEditableColumns(columns) {
  return columns.filter(column => column.editable);
}

/**
 * Normalizes the editable property of the column after checking whether the column type
 * is a valid editable standard type or if it's a customType and uses standardCellLayout.
 * If column.editable is associated with an object that also has a 'fieldName' key, then
 * the invocation of this function results in a no-op because we instead rely on later
 * row level checks to determine cell editability.
 *
 * @param {Object} column The column definition object.
 * @param {Object} types The DatatableTypes object.
 */
export function normalizeEditable(column, types) {
  if (types.isEditableType(column.type)) {
    if (!(typeof column.editable === 'object' && column.editable.fieldName)) {
      column.editable = normalizeBoolean(column.editable);
    }
    column.editTemplate = types.getCustomTypeEditTemplate(column.type);
  } else {
    column.editable = false;
    column.editTemplate = undefined;
  }
}

/**
 * Steps through and corrects column definitions inconsistencies.
 *
 * For customer-specified columns, we verify all parameters are valid and set
 * how we would expect them to prevent errors from bubbling up.
 * See `normalizeColumnDataType`, `normalizeEditable`.
 *
 * For tree-types, we verify all sub-type attributes are within our allowed
 * parameters. See `getNormalizedSubTypeAttribute`.
 *
 * @param {Object} state The datatable state.
 * @param {Array} columns The datatable's column definitions.
 * @param {Object} types  The type handling factory.
 */
export function normalizeColumns(state, columns, types) {
  if (columns.length !== 0) {
    let firstColumnForReaders = 0;
    // Workaround: https://git.soma.salesforce.com/raptor/raptor/issues/763
    const normalizedColumns = Object.assign([], columns);
    if (!state.hideCheckboxColumn) {
      firstColumnForReaders++;
      normalizedColumns.unshift(SELECTABLE_COLUMN);
    }
    if (hasRowNumberColumn(state) || hasEditableColumn(columns)) {
      firstColumnForReaders++;
      setShowRowNumberColumn(state, true);
      normalizedColumns.unshift(getRowNumberColumnDef());
    }
    const columnKeyMap = {};
    state.columns = normalizedColumns.map((column, index) => {
      // Verify `columnKey` is unique
      const columnKey = column.columnKey;
      if (columnKey && columnKeyMap[columnKey]) {
        console.error(`The "columnKey" column property must be unique. Found a duplicate of columnKey "${columnKey}".`);
      }
      columnKeyMap[columnKey] = true;
      const normalizedColumn = Object.assign(getColumnDefaults(column), column);
      normalizedColumn.ariaLabel = normalizedColumn.label || normalizedColumn.ariaLabel || null;

      // `customType` attribute is needed to render default iedit component
      normalizedColumn.editableCustomType = types.isStandardCellLayoutForCustomType(normalizedColumn.type);
      if (isCustomerColumn(normalizedColumn)) {
        normalizeColumnDataType(normalizedColumn, types);
        normalizeEditable(normalizedColumn, types);
        updateColumnSortingState(normalizedColumn, state);
      }
      if (isTreeType(normalizedColumn.type)) {
        normalizedColumn.typeAttributes = getNormalizedSubTypeAttribute(normalizedColumn.type, normalizedColumn.typeAttributes);
      }
      return Object.assign(normalizedColumn, {
        tabIndex: -1,
        colKeyValue: generateColKeyValue(normalizedColumn, index),
        isScopeCol: index === firstColumnForReaders
      });
    });
  } else {
    state.columns = [];
  }
}

/**
 * Normalizes the subType and subTypeAttributes in the typeAttributes.
 *
 * @param {String} type The type of this column
 * @param {Object} typeAttributes The type attributes of the column
 * @returns {Object} A new typeAttributes object with the sybtype and subTypeAttributes normalized.
 */
export function getNormalizedSubTypeAttribute(type, typeAttributes) {
  const typeAttributesOverrides = {};
  if (!isValidTypeForTree(typeAttributes.subType)) {
    typeAttributesOverrides.subType = getColumnDefaults({
      type
    }).subType;
  }
  if (!typeAttributes.subTypeAttributes) {
    typeAttributesOverrides.subTypeAttributes = {};
  }
  return Object.assign({}, typeAttributes, typeAttributesOverrides);
}

/**
 * Retrieves the type attributes for a given column.
 *
 * @param {Object} column The column definition object.
 * @returns Type attributes for the given column, if they exist.
 */
export function getTypeAttributesValues(column) {
  if (isObjectLike(column.typeAttributes)) {
    return column.typeAttributes;
  }
  return {};
}

/**
 * Retrieves the sub-type attributes for a given column.
 *
 * @param {Object} column The column definition object.
 * @returns {Object} Sub-type attributes for the given column, if they exist.
 */
export function getSubTypeAttributesValues(column) {
  if (isObjectLike(column.typeAttributes.subTypeAttributes)) {
    return column.typeAttributes.subTypeAttributes;
  }
  return {};
}

/**
 * Retrieves the cell attributes for a given column.
 *
 * @param {Object} column The column definition object.
 * @returns {Object} Cell attributes for the given column, if they exist.
 */
export function getCellAttributesValues(column) {
  if (isObjectLike(column.cellAttributes)) {
    return column.cellAttributes;
  }
  return {};
}

/**
 * Generates a unique column key value.
 *
 * @param {Object} columnMetadata The object for an specific column metadata
 * @param {Integer} index Optionally, the index of the column.
 * @returns {String} It generates the column key value based on the column field name and type.
 */
export function generateColKeyValue(columnMetadata, index) {
  const {
    columnKey,
    fieldName,
    type
  } = columnMetadata;
  const prefix = columnKey || fieldName || index;
  return `${prefix}-${type}-${index}`;
}

/**
 * Return the index in dt.columns (user definition) related to colKeyValue.
 *      -1 if no column with that key exist or if its internal.
 *
 * @param {Object} state The datatable state
 * @param {String} colKeyValue The generated key for the column
 * @returns {Number} The index in `dt.columns`. -1 if not found or if its internal.
 */
export function getUserColumnIndex(state, colKeyValue) {
  const stateColumnIndex = getStateColumnIndex(state, colKeyValue);
  let internalColumns = 0;
  if (state.columns[stateColumnIndex].internal) {
    return -1;
  }
  for (let i = 0; i < stateColumnIndex; i++) {
    if (state.columns[i].internal) {
      internalColumns++;
    }
  }
  return stateColumnIndex - internalColumns;
}

/**
 * It generate headerIndexes based in the current metadata
 * headerIndexes represent the position of the header(column)
 * based on the unique colKeyValue
 *
 * These indexes are set in the state object - `state.headerIndexes`
 *
 * @param {Object} columns The current normalized column metadata
 * @returns {Object} headerIndexes e.g. { 'name-text': 0, 'amount-number': 1 }
 */
export const generateHeaderIndexes = function (columns) {
  return columns.reduce((prev, col, index) => {
    prev[generateColKeyValue(col, index)] = index;
    return prev;
  }, {});
};

/**
 * Return the index in state.columns (internal definition) related to colKeyValue.
 *
 * @param {Object} state The datatable state
 * @param {String} colKeyValue The generated key for the column
 * @returns {Number} The index in state.columns
 */
export function getStateColumnIndex(state, colKeyValue) {
  return state.headerIndexes[colKeyValue];
}

/**
 * Retrieves a column index number by its key.
 *
 * @param {Object} state The datatable state
 * @param {String} key The key of the column. Defaults to field name if 'columnKey' is not provided.
 * @returns {Number} The index in state.columns, -1 if it does not exist
 */
export function getColumnIndexByColumnKey(state, key) {
  let i = 0;
  const columns = getColumns(state);
  const existFieldName = columns.some((column, index) => {
    i = index;
    return column.columnKey === key || !column.columnKey && column.fieldName === key;
  });
  return existFieldName ? i : -1;
}

/************************** PRIVATE METHODS ***************************/

/**
 * If the specified column type is not supported, resets it to default.
 *
 * @param {Object} column The column definition object.
 * @param {Object} types The type handling factory.
 */
function normalizeColumnDataType(column, types) {
  if (!types.isValidType(column.type)) {
    column.type = getRegularColumnDefaults().type;
  }
}

/**
 * Returns the column defaults based on its type.
 *
 * @param {Object} column The column definition object.
 * @returns {Object} The column defaults.
 */
function getColumnDefaults(column) {
  switch (column.type) {
    case 'action':
      return getActionColumnDefaults();
    case 'tree':
      return getTreeColumnDefaults();
    default:
      return getRegularColumnDefaults();
  }
}

/**
 * Retrieves the defaults for regular columns.
 *
 * @returns {Object} Regular column defaults
 */
function getRegularColumnDefaults() {
  return {
    type: 'text',
    typeAttributes: {},
    cellAttributes: {}
  };
}

/**
 * Retrieves the defaults for action columns.
 *
 * @returns {Object} Action column defaults
 */
function getActionColumnDefaults() {
  return {
    fixedWidth: 50,
    resizable: false,
    ariaLabel: i18n.rowActionsDefaultAriaLabel
  };
}

/**
 * Retrieves the defaults for tree columns.
 *
 * @returns {Object} Tree column defaults
 */
function getTreeColumnDefaults() {
  return {
    type: 'tree',
    subType: 'text',
    typeAttributes: {},
    cellAttributes: {}
  };
}