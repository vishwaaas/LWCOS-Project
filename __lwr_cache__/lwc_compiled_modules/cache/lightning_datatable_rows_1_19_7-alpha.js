import { assert } from 'lightning/utilsPrivate';
import { classSet, isObjectLike, styleToString } from './utils';
import { isTreeType, getAttributesNames } from './types';
import { isSelectedRow, isDisabledRow, getRowSelectionInputType } from './rowSelectionShared';
import { getTreeStateIndicatorFieldNames, getStateTreeColumn } from './tree';
import { getColumns, getTypeAttributesValues, getSubTypeAttributesValues, getCellAttributesValues, isCustomerColumn, generateColKeyValue } from './columns';
import { isRowNumberColumn, getRowNumberErrorColumnDef } from './rowNumber';
import { getRowError } from './errors';
import { getDirtyValueFromCell } from './inlineEditShared';
export function getData(state) {
  return state.data;
}
export function setData(state, data) {
  if (Array.isArray(data)) {
    state.data = data;
  } else {
    state.data = [];
  }
}
export function getRows(state) {
  return state.rows;
}
export function getKeyField(state) {
  return state.keyField;
}
export function setKeyField(state, value) {
  assert(typeof value === 'string', `The "keyField" value expected in lightning:datatable must be type String.`);
  if (typeof value === 'string') {
    state.keyField = value;
  } else {
    state.keyField = undefined;
  }
}
export function hasValidKeyField(state) {
  const keyField = getKeyField(state);
  return typeof keyField === 'string';
}

/**
 * Resolves the CSS classes for a row based on the row.isSelected state
 *
 * @param {object} row - a row object in state.rows collection
 * @returns {string} the classSet string
 */
export function resolveRowClassNames(row) {
  const classes = classSet('slds-hint-parent');
  if (row.isSelected) {
    classes.add('slds-is-selected');
  }
  return classes.toString();
}

/**
 *
 * @param {object} state - data table state
 * @param {string} rowKeyValue - computed id for the row
 * @param {string} colKeyValue - computed id for the column
 * @returns {object} The user row that its related to the action.
 */
export function getUserRowByCellKeys(state, rowKeyValue, colKeyValue) {
  const rowIndex = state.indexes[rowKeyValue][colKeyValue][0];
  return getData(state)[rowIndex];
}

/**
 * It creates a row key generator based on the keyField passed in by the consumer.
 * If the keyField passed in through the generator does not point to a value in the row object,
 * it falls back to a generated key using indexes. Ex. row-0/row-1
 *
 * @param {String} keyField  - keyField provided by the consumer
 * @returns {Function} - function with the unique row key generator
 */
export function uniqueRowKeyGenerator(keyField) {
  let index = 0;
  return function (row) {
    if (row[keyField]) {
      return row[keyField];
    }
    return `row-${index++}`;
  };
}

/**
 * It compute the state.rows collection based on the current normalized (data, columns)
 * and generate cells indexes map(state.indexes)
 *
 * TODO: Reduce redundant calls to this function. This is indirectly called by the
 * setters of 'data' and 'columns'. Additionally, for the role-based table, if we are
 * attaching the 'cell' class, calling this from connectedCallback of datatable would
 * eliminate the need for updateCellClassForRoleBasedMode.
 *
 * @param {object} state - the current datatable state
 */
export function updateRowsAndCellIndexes() {
  const {
    state,
    privateTypes: types
  } = this;
  const {
    keyField,
    renderModeRoleBased,
    virtualize,
    rowHeight
  } = state;
  const data = getData(state);
  const columns = getColumns(state);
  const computeUniqueRowKey = uniqueRowKeyGenerator(keyField);
  const scopeCol = columns.find(colData => types.isValidType(colData.type) && colData.isScopeCol);
  // initializing indexes
  state.indexes = {};
  state.rows = data.reduce((prev, rowData, rowIndex) => {
    const row = {
      key: computeUniqueRowKey(rowData),
      // attaching unique key to the row
      cells: []
    };
    const rowErrors = getRowError(state, row.key);
    state.indexes[row.key] = {
      rowIndex
    };
    row.rowIndex = rowIndex;
    row.rowNumber = rowIndex + 1; // for UTAM since methods are base-1
    row.ariaRowIndex = rowIndex + 2; // aria attrs are base-1 and also count header as a row
    row.inputType = getRowSelectionInputType(state);
    row.isSelected = isSelectedRow(state, row.key);
    row.ariaSelected = row.isSelected ? 'true' : false;
    row.isDisabled = isDisabledRow(state, row.key);
    row.classnames = resolveRowClassNames(row);
    Object.assign(row, getRowStateForTree(rowData, state));
    row.tabIndex = -1;
    if (virtualize) {
      row.style = styleToString({
        position: 'absolute',
        top: `${rowIndex * rowHeight}px`
      });
    }
    columns.reduce((currentRow, colData, colIndex) => {
      const {
        fieldName
      } = colData;
      const colKeyValue = generateColKeyValue(colData, colIndex);
      const dirtyValue = getDirtyValueFromCell(state, row.key, colKeyValue);
      const cellHasErrors = hasCellErrors(rowErrors, colData.fieldName, colData.columnKey);
      const computedCellValue = dirtyValue !== undefined ? dirtyValue : rowData[fieldName];
      // cell object creation
      const cell = {
        columnType: colData.type,
        columnSubType: colData.typeAttributes ? colData.typeAttributes.subType : undefined,
        dataLabel: colData.label,
        value: computedCellValue,
        // value based on the fieldName
        displayValue: rowData.displayValue ? rowData.displayValue : '',
        rowKeyValue: row.key,
        // unique row key value
        colKeyValue,
        // unique column key value
        tabIndex: -1,
        // tabindex
        isCheckbox: colData.type === 'SELECTABLE_CHECKBOX',
        class: computeCellClassNames(rowData, colData, cellHasErrors, dirtyValue, renderModeRoleBased),
        hasError: cellHasErrors,
        isDataType: types.isValidType(colData.type) && !colData.isScopeCol,
        isDataTypeScope: types.isValidType(colData.type) && colData.isScopeCol,
        wrapText: state.wrapText[colKeyValue],
        // wrapText state
        wrapTextMaxLines: state.wrapText[colKeyValue] ? state.wrapTextMaxLines : undefined,
        style: computeCellStyles(types, colData, renderModeRoleBased)
      };
      if (isCustomerColumn(colData)) {
        assignCustomerColumnAttributes(cell, row, rowData, colData, types);
      } else if (isRowNumberColumn(colData)) {
        assignRowNumberColumnAttributes(cell, rowData, types, rowErrors, scopeCol);
      }

      // adding cell indexes to state.indexes
      // Keeping the hash for backward compatibility, but we need to have 2 indexes, 1 for columns and one for rows,
      // because of memory usage and also at certain point we might have the data but not the columns
      state.indexes[row.key][colKeyValue] = [rowIndex, colIndex];
      currentRow.push(cell);
      return currentRow;
    }, row.cells);
    prev.push(row);
    return prev;
  }, []);
}

/**
 * Checks whether there are errors for the specified column
 * When a columnKey exists for a column, we will look for its errors inside the
 * cells property of rowErrors. Only when it doesn't exist will we look for a
 * reference to the column's fieldName.
 *
 * This maintains backwards compatibility with those continuing to use fieldName
 * as column identifiers.
 */
function hasCellErrors(rowErrors, fieldName, columnKey) {
  const rowErrorsHasColumnKey = rowErrors.cells && rowErrors.cells[columnKey];
  const rowErrorsHasFieldName = rowErrors.fieldNames && rowErrors.fieldNames.includes(fieldName);
  return rowErrorsHasColumnKey || !columnKey && rowErrorsHasFieldName;
}

/**
 * Computes and sets the following resolved values in the cell object:
 * 1. `typeAttributes` specified in the column definition
 * 2. `cellAttributes` specified in the column definition
 * 3. Editability of the cell and subsequently the ariaReadOnly property
 * 4. Visibility of read only icon
 *
 * Computes and sets the following tree specific attributes
 * into typeAttributes21/22 in the cell object:
 * 1. row.hasChildren
 * 2. row.isExpanded
 *
 * @param {Object} cell - cell metadata
 * @param {Object} row - row metadata
 * @param {Object} rowData - data to be rendered in the cells of that row
 * @param {Object} colData - column definition
 * @param {Object} types - instance of DatatableTypes from `./types.js`
 */
function assignCustomerColumnAttributes(cell, row, rowData, colData, types) {
  Object.assign(cell, computeCellTypeAttributes(rowData, colData, types), computeCellAttributes(rowData, colData), computeCellEditable(rowData, colData), computeCellDisplayReadOnlyIcon(colData));
  if (!cell.editable) {
    cell.ariaReadOnly = true;
  }

  // If this is tree grid, this maps and sets into the cell object the tree specific attributes:
  // 1) row.hasChildren to typeAttribute21 and
  // 2) row.isExpanded to and typeAttribute22
  if (isTreeType(colData.type)) {
    Object.assign(cell, computeCellStateTypeAttributes(row));
  }
}

/**
 * Computes and sets the resolved typeAttribute for the row number column error state
 *
 * @param {Object} cell - cell metadata
 * @param {Object} rowData - data to be rendered in the cells of that row
 * @param {Object} types - instance of DatatableTypes from `./types.js`
 * @param {Object} rowErrors - contains the errors present in that row
 * @param {Object} scopeCol - column with scope=row
 */
function assignRowNumberColumnAttributes(cell, rowData, types, rowErrors, scopeCol) {
  const scopeColValue = rowData[scopeCol.fieldName];
  const errorColumnDef = getRowNumberErrorColumnDef(rowErrors, scopeColValue);
  Object.assign(cell, computeCellTypeAttributes(rowData, errorColumnDef, types));
}

/**
 * This function extracts the `cellAttributes` and their values that are specified
 * in the column definition.
 * If a cell attribute points to a fieldName in a row, that value is resolved here.
 *
 * This object that contains the resolved mapping is then set in the `cell` object
 * in each row.
 *
 * @param {Object} row - current row data. Required for cases cellAttributes refers to a fieldName in a row
 * @param {Object} column - column definition
 * @returns {Object} - contains the resolved mapping of cellAttributes and their values
 */
export function computeCellAttributes(row, column) {
  const cellAttributesValues = getCellAttributesValues(column);
  return Object.keys(cellAttributesValues).reduce((attrs, attrName) => {
    const attrValue = cellAttributesValues[attrName];
    attrs[attrName] = resolveAttributeValue(attrValue, row);
    return attrs;
  }, {});
}

/**
 * This function retrieves the allowlisted type attributes for a particular type and
 * maps the value set in the column definition to `typeAttribute{index}`.
 *
 * The types and their corresponding allowlisted attributes can be seen in types.js
 *
 * Ex. For the type 'url', there are 3 type attributes allowlisted: label, target, tooltip
 * If you pass typeAttributes: {label: 'My Label', target: '_blank', myattr: false}
 * in the column definition, this function would map ->
 * typeAttribute0: 'My Label', typeAttribute1: '_blank' and typeAttribute2: undefined
 * `myattr` is not allowlisted so it is discarded
 *
 * This mapping is later set into the `cell` object for each row and
 * will be passed in to primitive-cell-factory as
 * type-attribute-0={cell.typeAttribute0}
 * type-attribute-1={cell.typeAttribute1}
 * ...
 *
 * @param {Object} row - current row data. Required for cases typeAttributes refers to a fieldName in a row
 * @param {Object} column - column definition
 * @param {Object} types - instance of DatatableTypes from `./types.js`
 * @returns {Object} - object containing all the typeAttributes{index} and their mapped values
 */
export function computeCellTypeAttributes(row, column, types) {
  if (column.typeAttributes && column.typeAttributes.subType) {
    return computeCellSubTypeAttributes(row, column);
  }
  const attributesNames = types.getType(column.type).typeAttributes;
  const typeAttributesValues = getTypeAttributesValues(column);
  return attributesNames.reduce((attrs, attrName, index) => {
    const typeAttributeName = `typeAttribute${index}`;
    attrs[typeAttributeName] = resolveAttributeValue(typeAttributesValues[attrName], row);
    return attrs;
  }, {});
}
export function computeCellSubTypeAttributes(row, column) {
  const attributesNames = getAttributesNames(column.typeAttributes.subType);
  const typeAttributesValues = getSubTypeAttributesValues(column);
  return attributesNames.reduce((attrs, attrName, index) => {
    const typeAttributeName = `typeAttribute${index}`;
    attrs[typeAttributeName] = resolveAttributeValue(typeAttributesValues[attrName], row);
    return attrs;
  }, {});
}
function computeCellEditable(row, column) {
  return {
    editable: isCellEditable(row, column)
  };
}

/**
 * Returns true in the following three cases:
 *
 * (1) typeof column.editable !== 'object' && column.editable
 * (2) typeof column.editable === 'object' && !column.editable.fieldName
 * (3) typeof column.editable === 'object' && column.editable.fieldName && row[column.editable.fieldName]
 *
 * Returns false in all other cases.
 *
 * @param {object} row - a row data object stored in datatable state. Must be truthy.
 * @param {object} column - a column data object stored in datatable state. Must be truthy.
 */
export function isCellEditable(row, column) {
  return !!resolveAttributeValue(column.editable, row);
}
function computeCellDisplayReadOnlyIcon(column) {
  return {
    displayReadOnlyIcon: !!column.displayReadOnlyIcon
  };
}

/**
 * Computes styles to be set on the cell
 * 1. Remove padding from the cell if the cell is of a custom type
 *    and has opted out of using the standard layout
 * 2. Set width of the cell. Width of each cell needs to be set and
 *    managed by ourselves unlike the <table> version.
 *
 * @param {Object} types - instance of DatatableTypes from `./types.js`
 * @param {Object} colData - column definition
 * @param {Boolean} renderModeRoleBased - render mode of datatable (div || table)
 * @returns {String} - styles to be set on the cell
 */
function computeCellStyles(types, colData, renderModeRoleBased) {
  let style = '';
  const columnType = colData.type;

  // When a custom type is not using the standard layout,
  // remove the padding that comes with the standard layout
  if (types.isCustomType(columnType) && !types.isStandardCellLayoutForCustomType(columnType)) {
    style = 'padding: 0;';
  }

  // Width needs to be managed when rendering as divs
  if (renderModeRoleBased) {
    const columnWidth = colData.columnWidth;
    style += columnWidth > 0 ? `width:${columnWidth}px;` : '';
  }
  return style;
}
function computeCellClassNames(row, column, cellHasErrors, dirtyValue, renderModeRoleBased) {
  const classNames = classSet('');
  // TODO: With the current SLDS design, the 'slds-cell-edit' class is required on a cell in cases
  // where the read only icon is to be displayed. This is an issue with their design that will need to
  // be addressed on their end, so once they do that we can modify this code accordingly.
  classNames.add({
    'slds-cell-edit': isCellEditable(row, column) || column.displayReadOnlyIcon,
    'slds-tree__item': isTreeType(column.type),
    'slds-has-error': cellHasErrors,
    'slds-is-edited': dirtyValue !== undefined,
    cell: renderModeRoleBased
  });
  return classNames.toString();
}

/**
 * Attaches if the row containing this cell hasChildren or not and isExpanded or not
 * attributes to typeAttribute21 and typeAttribute22 respectively
 * typeAttribute0-typeAttribute20 are reserved for  types supported by tree
 * @param {object}row - current row which is stored in state.rows
 * @returns {{typeAttribute21, typeAttribute22: boolean}} typeAttributes
 * describing state of the row associated
 */
function computeCellStateTypeAttributes(row) {
  return {
    typeAttribute21: row.hasChildren,
    typeAttribute22: row.isExpanded === 'true'
  };
}
export function getRowIndexByKey(state, key) {
  if (!state.indexes[key]) {
    return undefined;
  }
  return state.indexes[key].rowIndex;
}
export function getRowByKey(state, key) {
  const rows = getRows(state);
  return rows[getRowIndexByKey(state, key)];
}
export function rowKeyExists(state, key) {
  return !!state.indexes[key];
}
export function getRowsTotal(state) {
  return getRows(state).length;
}
function resolveAttributeValue(attrValue, row) {
  if (isObjectLike(attrValue)) {
    const fieldName = attrValue.fieldName;
    if (fieldName) {
      return row[fieldName];
    }
  }
  return attrValue;
}
function getRowStateForTree(row, state) {
  const column = getStateTreeColumn(state);
  if (column) {
    return {
      level: getRowLevel(column, row),
      posInSet: getRowPosInSet(column, row),
      setSize: getRowSetSize(column, row),
      isExpanded: isRowExpanded(column, row),
      hasChildren: getRowHasChildren(column, row)
    };
  }
  return {};
}
export function getRowLevel(column, row) {
  const typeAttributesValues = getTypeAttributesValues(column);
  const attrValue = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().level], row);
  return attrValue ? attrValue : 1;
}
function getRowPosInSet(column, row) {
  const typeAttributesValues = getTypeAttributesValues(column);
  const attrValue = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().position], row);
  return attrValue ? attrValue : 1;
}
function getRowSetSize(column, row) {
  const typeAttributesValues = getTypeAttributesValues(column);
  const attrValue = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().setsize], row);
  return attrValue ? attrValue : 1;
}
export function isRowExpanded(column, row) {
  const typeAttributesValues = getTypeAttributesValues(column);
  const hasChildren = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().children], row);
  if (hasChildren) {
    const attrValue = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().expanded], row);
    return !!attrValue + '';
  }
  return undefined;
}
export function getRowHasChildren(column, row) {
  const typeAttributesValues = getTypeAttributesValues(column);
  const hasChildren = resolveAttributeValue(typeAttributesValues[getTreeStateIndicatorFieldNames().children], row);
  return !!hasChildren;
}

/**
 * For the role-based table, we need to manage the width of each cell separately.
 * Re-compute the cell styles so that the width of the cell is set
 * to that of its column.
 *
 * @param {Object} state - Datatable's state object
 */
export function recomputeCellStyles(types, state) {
  const columns = getColumns(state);
  state.rows.forEach(row => {
    row.cells.forEach((cell, colIndex) => {
      const colData = columns[colIndex];
      cell.style = computeCellStyles(types, colData, true);
    });
  });
}

/**
 * The cells' classes are normally updated via `updateRowsAndCellIndexes()`. This ideally
 * happens after renderMode is set since `updateRowsAndCellIndexes` requires the final
 * renderMode value in order to set the 'cell' class on each cell.
 *
 * However, in some cases, it's possible that updateRowsAndCellIndexes is called
 * before the renderMode is set (to 'role-based'). This will cause the 'cell' class to NOT be set
 * in the individual cells because state.renderModeRoleBased will be `false` at that point.
 * As a result, positioning of the cell content will be off.
 *
 * In such a case where the renderMode is 'role-based' and when the updateRowsAndCellIndexes
 * has already been called (indicated by the presence of 'state.rows'), retroactively
 * add the 'cell' class to each cell.
 *
 * TODO: The 'cell' class will not be required once we move to the SLDS blueprint.
 * Remove this and usages once datatable migrates to using the SLDS blueprint for the role-based table.
 *
 * @param {Object} state - Datatable's state object
 */
export function updateCellClassForRoleBasedMode(state) {
  if (state.renderModeRoleBased && state.rows) {
    state.rows.forEach(row => {
      row.cells.forEach(cell => {
        const classes = classSet(cell.class);
        classes.add('cell');
        cell.class = classes.toString();
      });
    });
  }
}