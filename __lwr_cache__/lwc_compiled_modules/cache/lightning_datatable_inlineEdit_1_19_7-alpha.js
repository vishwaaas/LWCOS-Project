import { startPositioning, stopPositioning, Direction } from 'lightning/positionLibrary';
import { setFocusActiveCell, reactToTabBackward, reactToTabForward, getActiveCellElement, updateActiveCell, isActiveCellEditable, isValidCell } from './keyboard';
import { updateRowsAndCellIndexes, getRowByKey, getKeyField, getUserRowByCellKeys, isCellEditable } from './rows';
import { getColumnIndexByColumnKey, getColumns, getStateColumnIndex, getEditableColumns } from './columns';
import { setErrors } from './errors';
import { setAriaSelectedOnCell, unsetAriaSelectedOnCell, isSelectedRow, getCurrentSelectionLength, getSelectedRowsKeys } from './rowSelection';
import { isObjectLike } from './utils';
export { getDirtyValueFromCell } from './inlineEditShared';
const IEDIT_PANEL_SELECTOR = '[data-iedit-panel="true"]';
const HIDE_PANEL_THRESHOLD = 5; // hide panel on scroll

/************************** EVENT HANDLERS **************************/

/**
 * Event handler to open/start the inline edit flows that are triggered by datatable cells
 *
 * @param {CustomEvent} event - An object representing the event that was fired by the datatable cell for
 *                              which to open the inline edit panel. Must be valid and truthy.
 */
export function handleEditCell(event) {
  openInlineEdit(this, event.target);
}

/**
 * Handles the completion of inline edit.
 * Closes and destroys the panel and processes completion of the edit
 *
 * @param {CustomEvent} event - `ieditfinished`
 */
export function handleInlineEditFinish(event) {
  stopPanelPositioning(this);
  const {
    reason,
    rowKeyValue,
    colKeyValue
  } = event.detail;
  processInlineEditFinish(this, reason, rowKeyValue, colKeyValue);
}

/**
 * Sets the `aria-selected` value on the cell based on the checked value
 * If the mass update checkbox is checked, set aria-selected on those cells
 * which are to be updated to true
 * If not, set aria-selected to true on only the cell that is being edited
 */
export function handleMassCheckboxChange(event) {
  const state = this.state;
  if (event.detail.checked) {
    setAriaSelectedOnAllSelectedRows(state);
  } else {
    unsetAriaSelectedOnAllSelectedRows(this.state);
    setAriaSelectedOnCell(state, state.inlineEdit.rowKeyValue, state.inlineEdit.colKeyValue);
  }
}

/**
 * Handles management of the inline edit panel when user scrolls horizontally or vertically.
 * On either horizontal or vertical scroll:
 *   - If the user scrolls past the pre-determined threshold,
 *     hide the inline edit panel and process the completion of inline edit.
 *   - If the user scrolls within the pre-determined threshold,
 *     keep the panel open but reposition it to align with the cell
 *
 * @param {Event} event - `scroll`
 * @returns
 */
export function handleInlineEditPanelScroll(event) {
  const {
    isPanelVisible,
    rowKeyValue,
    colKeyValue
  } = this.state.inlineEdit;
  if (!isPanelVisible) {
    return;
  }
  let delta = 0;
  const container = event.target;

  // When user scrolls horizontally
  if (container.classList.contains('slds-scrollable_x')) {
    const scrollX = container.scrollLeft;
    if (this.privateLastScrollX == null) {
      this.privateLastScrollX = scrollX;
    } else {
      delta = Math.abs(this.privateLastScrollX - scrollX);
    }
  } else {
    // When user scrolls vertically
    const scrollY = container.scrollTop;
    if (this.privateLastScrollY == null) {
      this.privateLastScrollY = scrollY;
    } else {
      delta = Math.abs(this.privateLastScrollY - scrollY);
    }
  }

  // If user has scrolled past threshold,
  // reset stored scroll values, hide panel and
  // process inline edit completion
  if (delta > HIDE_PANEL_THRESHOLD) {
    this.privateLastScrollX = null;
    this.privateLastScrollY = null;
    stopPanelPositioning(this);
    processInlineEditFinish(this, 'lost-focus', rowKeyValue, colKeyValue);
  } else {
    // we want to keep the panel attached to the cell before
    // reaching the threshold and hiding the panel
    repositionPanel(this);
  }
}

/************************** EVENT DISPATCHER **************************/

/**
 * Dispatches the `cellchange` event with the `draftValues` in the
 * detail object.
 *
 * @param {Object} dtInstance - datatable instance
 * @param {Object} cellChange - object containing cell changes
 */
function dispatchCellChangeEvent(dtInstance, cellChange) {
  dtInstance.dispatchEvent(new CustomEvent('cellchange', {
    detail: {
      draftValues: getResolvedCellChanges(dtInstance.state, cellChange)
    }
  }));
}

/************************** INLINE EDIT STATE MANAGEMENT **************************/

export function isInlineEditTriggered(state) {
  return Object.keys(state.inlineEdit.dirtyValues).length > 0;
}
export function cancelInlineEdit(dt) {
  dt.state.inlineEdit.dirtyValues = {};
  setErrors(dt.state, {});
  updateRowsAndCellIndexes.call(dt);
}
export function closeInlineEdit(dt) {
  const inlineEditState = dt.state.inlineEdit;
  if (inlineEditState.isPanelVisible) {
    processInlineEditFinish(dt, 'lost-focus', inlineEditState.rowKeyValue, inlineEditState.colKeyValue);
  }
}

/**
 * Handles processing when the datatable has finished an inline edit flow.
 * Evaluates if data from the inline edit panel should be saved or not.
 * Data should be saved
 *   - if inline edit was not canceled by the user and
 *   - if in mass inline edit, the 'Apply' button is clicked (don't save when focus is lost) and
 *   - if the cell being edited is a valid cell
 *
 * If the data should be saved, check that the value has changed or if mass edit is enabled.
 * If so, one or more cells need to reflect the updated value.
 * All changes to the cell(s) (`cellChange`) are stored in the following format:
 * cellChange = {
 *   rowKeyValue1: {
 *     colKeyValue: 'changed value'
 *   },
 *   rowKeyValue2: {
 *     colKeyValue: 'changed value'
 *   }
 * }
 *
 * The above cell changes are used to update state.inlineEdit.dirtyValues.
 * The draft values are retrieved using the cell changes that were gathered here and
 * the `cellchange` event is dispatched passing the draftValues in the detail object.
 *
 * If the user inline edit panel lost focus, the datatable should react accordingly.
 *
 * @param {Object} dt - datatable instance
 * @param {string} reason - reason to finish the edit; valid reasons are: edit-canceled | lost-focus | tab-pressed | submit-action
 * @param {string} rowKeyValue - row key of the edited cell
 * @param {string} colKeyValue - column key of the edited cell
 */
function processInlineEditFinish(dt, reason, rowKeyValue, colKeyValue) {
  const state = dt.state;
  const inlineEditState = state.inlineEdit;
  const shouldSaveData = reason !== 'edit-canceled' && !(inlineEditState.massEditEnabled && reason === 'lost-focus') && isValidCell(dt.state, rowKeyValue, colKeyValue);
  if (shouldSaveData) {
    const panel = dt.template.querySelector(IEDIT_PANEL_SELECTOR);
    const editValue = panel.value;
    const isValidEditValue = panel.validity.valid;
    const updateAllSelectedRows = panel.isMassEditChecked;
    const currentValue = getCellValue(state, rowKeyValue, colKeyValue);
    if (isValidEditValue && (editValue !== currentValue || updateAllSelectedRows)) {
      const cellChange = {};
      cellChange[rowKeyValue] = {};
      cellChange[rowKeyValue][colKeyValue] = editValue;
      if (updateAllSelectedRows) {
        const selectedRowKeys = getSelectedRowsKeys(state);
        selectedRowKeys.forEach(rowKey => {
          cellChange[rowKey] = {};
          cellChange[rowKey][colKeyValue] = editValue;
        });
      }
      updateDirtyValues(state, cellChange);
      dispatchCellChangeEvent(dt, cellChange);

      // TODO: do we need to update all rows in the dt or just the one that was modified?
      updateRowsAndCellIndexes.call(dt);
    }
  }
  if (reason !== 'lost-focus') {
    switch (reason) {
      case 'tab-pressed-next':
        {
          reactToTabForward(dt.template, state);
          break;
        }
      case 'tab-pressed-prev':
        {
          reactToTabBackward(dt.template, state);
          break;
        }
      default:
        {
          setFocusActiveCell(dt.template, state, 0);
        }
    }
  }
  unsetAriaSelectedOnAllSelectedRows(state);
  unsetAriaSelectedOnCell(state, rowKeyValue, colKeyValue);
  inlineEditState.isPanelVisible = false;
}

/************************** INLINE EDIT **************************/

/**
 * Opens the inline edit panel for the given target element/cell. This function is the endpoint of all
 * event-driven open inline edit flows but can also be used to open the inline edit panel in a direct
 * programmatic fashion.
 *
 * - Open and position the inline edit panel relative to the cell it was opened from.
 * - Retrieve and set the required inline edit properties in the state object.
 * - Resolve typeAttributes from the column definition so that it can be passed down to the inline edit panel input
 * - Set aria-selected to `true` on the cell which is being edited
 * - Once the panel is open, set focus on the input element
 *
 * @param {Object} dt - The datatable instance. Must be a truthy and valid datatable reference.
 * @param {Object} target - The LWC component instance (lightning-primitive-cell-factory) representing the cell in the
 *                          datatable for which the inline edit panel is to be opened. Must be a truthy and valid reference.
 */
function openInlineEdit(dt, target) {
  startPanelPositioning(dt, target.parentElement);
  const {
    state,
    template,
    privateTypes: types
  } = dt;
  const inlineEdit = state.inlineEdit;
  if (inlineEdit.isPanelVisible) {
    // A special case when we are trying to open a edit but we have one open. (click on another edit while editing)
    // in this case we will need to process the values before re-open the edit panel with the new values or we may lose the edition.
    processInlineEditFinish(dt, 'lost-focus', inlineEdit.rowKeyValue, inlineEdit.colKeyValue);
  }
  const {
    rowKeyValue,
    colKeyValue
  } = target;
  inlineEdit.isPanelVisible = true;
  inlineEdit.rowKeyValue = rowKeyValue;
  inlineEdit.colKeyValue = colKeyValue;
  inlineEdit.editedValue = getCellValue(state, rowKeyValue, colKeyValue);
  inlineEdit.massEditSelectedRows = getCurrentSelectionLength(state);
  inlineEdit.massEditEnabled = isSelectedRow(state, rowKeyValue) && inlineEdit.massEditSelectedRows > 1;

  // pass the column definition
  const colIndex = getStateColumnIndex(state, colKeyValue);
  inlineEdit.columnDef = getColumns(state)[colIndex];
  const typeAttributesFromColumnDef = inlineEdit.columnDef && inlineEdit.columnDef.typeAttributes;
  if (typeAttributesFromColumnDef) {
    // when the inline edit panel is opened resolve the typeAttributes if available
    // then assign the resolved values to inlineEdit.resolvedTypeAttributes
    inlineEdit.resolvedTypeAttributes = resolveNestedTypeAttributes(state, rowKeyValue, colKeyValue, types, typeAttributesFromColumnDef, colIndex);
  }
  setAriaSelectedOnCell(state, rowKeyValue, colKeyValue);

  // eslint-disable-next-line @lwc/lwc/no-async-operation
  setTimeout(() => {
    const panel = template.querySelector('lightning-primitive-datatable-iedit-panel');
    if (!panel.isEditableValid) {
      // if panel can't be edited, cancel edit process
      processInlineEditFinish(dt, 'edit-canceled', inlineEdit.rowKeyValue, inlineEdit.colKeyValue);
    } else {
      // if panel can be edited, focus
      panel.focus();
    }
  }, 0);
}

/**
 * Attempts to open the inline edit panel for the datatable's currently active cell. If the active cell is not
 * editable, then the panel is instead opened for the first editable cell in the table. Used to open inline edit
 * in a direct, programmatic fashion.
 *
 * If there is no data in the table or there are no editable cells in the table then calling this function
 * results in a no-op.
 *
 * @param {Object} dt - The datatable instance. Must be a truthy and valid datatable reference.
 */
export function openInlineEditOnActiveCell(dt) {
  const hasData = dt.state.data && dt.state.data.length > 0;
  if (hasData) {
    if (!isActiveCellEditable(dt.state)) {
      const firstEditableCell = getFirstEditableCell(dt);
      if (firstEditableCell) {
        updateActiveCell(dt.state, firstEditableCell.rowKeyValue, firstEditableCell.colKeyValue);
        setFocusAndOpenInlineEdit(dt, dt.state.activeCell);
      }
    } else {
      setFocusAndOpenInlineEdit(dt, dt.state.activeCell);
    }
  }
}

/**
 * Async function to await setting focus on an editable cell before opening inline-edit panel
 *
 * @param {Object} dt - The datatable instance
 */
// eslint-disable-next-line @lwc/lwc/no-async-await
async function setFocusAndOpenInlineEdit(dt) {
  await setFocusActiveCell(dt.template, dt.state, 0);
  const cell = getActiveCellElement(dt.template, dt.state);
  openInlineEdit(dt, cell);
}

/************************** PANEL POSITIONING **************************/

/**
 * Begin positioning the inline edit panel based on the following constraints:
 * Align to the 'top-left' edge of the inline edit panel to the `top-left` edge of the cell
 *
 * `align` refers to the alignment of the inline edit panel
 *   - horizontal - Left -> align left edge of panel
 *   - vertical   - Top  -> align top of panel
 *
 * `targetAlign` refers to the cell against which the panel should be aligned
 *   - horizontal - Left -> align panel to left edge of cell
 *   - vertical   - Top  -> align panel to top of the cell
 *
 * @param {Object} dt - datatable instance
 * @param {HTMLElement} target - cell on which inline edit should open
 */
function startPanelPositioning(dt, target) {
  // eslint-disable-next-line @lwc/lwc/no-async-operation
  requestAnimationFrame(() => {
    // we need to discard previous binding otherwise the panel
    // will retain previous alignment
    stopPanelPositioning(dt);
    dt.privatePositionRelationship = startPositioning(dt, {
      target,
      element: () => dt.template.querySelector(IEDIT_PANEL_SELECTOR).getPositionedElement(),
      align: {
        horizontal: Direction.Left,
        vertical: Direction.Top
      },
      targetAlign: {
        horizontal: Direction.Left,
        vertical: Direction.Top
      },
      autoFlip: true
    });
  });
}
function stopPanelPositioning(dt) {
  if (dt.privatePositionRelationship) {
    stopPositioning(dt.privatePositionRelationship);
    dt.privatePositionRelationship = null;
  }
}

/**
 * Repositions the inline edit panel. this does not realign the element,
 * so it doesn't fix alignment when size of panel changes
 *
 * @param {Object} dt - datatable instance
 */
function repositionPanel(dt) {
  // eslint-disable-next-line @lwc/lwc/no-async-operation
  requestAnimationFrame(() => {
    if (dt.privatePositionRelationship) {
      dt.privatePositionRelationship.reposition();
    }
  });
}

/************************** DIRTY/UNSAVED VALUES **************************/

/**
 * @param {Object} state - Datatable state object.
 * @returns {Array} - An array of objects, each object describing the dirty values in the form { colName : dirtyValue }.
 *                   A special key is the { [keyField]: value } pair used to identify the row containing this changed values.
 *                   The returned array will be in the form - [{colName : dirtyValue, ... , [keyField]: value }, {...}, {...}]
 */
export function getDirtyValues(state) {
  return getResolvedCellChanges(state, state.inlineEdit.dirtyValues);
}

/**
 * Sets the dirty values in the datatable.
 *
 * @param {Object} state Datatable state object.
 * @param {Array} value An array of objects, each object describing the dirty values in the form { colName : dirtyValue }.
 *                      A special key is the { [keyField]: value } pair used to identify the row containing this changed values.
 */
export function setDirtyValues(state, value) {
  const keyField = getKeyField(state);
  const dirtyValues = Array.isArray(value) ? value : [];
  state.inlineEdit.dirtyValues = dirtyValues.reduce((result, rowValues) => {
    const changes = getCellChangesFromCustomer(state, rowValues);
    delete changes[keyField];
    result[rowValues[keyField]] = changes;
    return result;
  }, {});
}

/**
 * Updates the dirty values specified in rowColKeyValues
 *
 * @param {Object} state - state of the datatable
 * @param {Object} rowColKeyValues - An object in the form of { rowKeyValue: { colKeyValue1: value, ..., colKeyValueN: value } ... }
 */
function updateDirtyValues(state, rowColKeyValues) {
  const dirtyValues = state.inlineEdit.dirtyValues;
  Object.keys(rowColKeyValues).forEach(rowKey => {
    if (!Object.prototype.hasOwnProperty.call(dirtyValues, rowKey)) {
      dirtyValues[rowKey] = {};
    }
    Object.assign(dirtyValues[rowKey], rowColKeyValues[rowKey]);
  });
}

/**
 * Constructs and returns an object that contains the cell changes which can
 * be referenced by the column key value. It follows this format:
 * { <colKeyValue: "<editedValue>"> }; Ex. { "name-text-2": "My changes" }
 *
 * @param {Object} state - datatable's state object
 * @param {Object} changes - internal representation of changes in a row
 * @returns {Object} - changes in a column that can be referenced by the column key
 */
function getCellChangesFromCustomer(state, changes) {
  return Object.keys(changes).reduce((result, externalColumnKey) => {
    const columns = getColumns(state);
    const columnIndex = getColumnIndexByColumnKey(state, externalColumnKey);
    if (columnIndex >= 0) {
      const colKey = columns[columnIndex].colKeyValue;
      result[colKey] = changes[externalColumnKey];
    }
    return result;
  }, {});
}

/**
 * Retrieves the changes in cells in a particular column
 * Returns an object where each item follows this format:
 * { <columnName>: "<changes>"} -> Ex. { name: "My changes" }
 *
 * @param {Object} state - Datatable state
 * @param {Object} changes - The internal representation of changes in a row
 * @returns {Object} - the list of customer changes in a column
 */
function getCellChangesByColumn(state, changes) {
  return Object.keys(changes).reduce((result, colKey) => {
    const columns = getColumns(state);
    const columnIndex = getStateColumnIndex(state, colKey);
    const columnDef = columns[columnIndex];
    result[columnDef.columnKey || columnDef.fieldName] = changes[colKey];
    return result;
  }, {});
}

/**
 * Constructs an array of resolved cell changes made via inline edit
 * Each array item consists of an identifier of the row and column in order to locate
 * the cell in which the changes were made
 *
 * It follows this format: [{ <columnName>: "<changes>", <keyField>: "<keyFieldIdentifier>" }]
 * Ex. [{ name: "My changes", id: "2" }]; where column name is 'name' and 'id' is the keyField
 * The keyField can be used to identify the row.
 *
 * @param {Object} state - datatable state object
 * @param {Object} changes - list of cell changes to be resolved
 * @returns {Array} - array containing changes and identifiers of column and row where the changes
 *                    should be applied
 */
function getResolvedCellChanges(state, changes) {
  const keyField = getKeyField(state);
  return Object.keys(changes).reduce((result, rowKey) => {
    // Get the changes made by column
    const cellChanges = getCellChangesByColumn(state, changes[rowKey]);
    if (Object.keys(cellChanges).length > 0) {
      // Add identifier for which row has change
      cellChanges[keyField] = rowKey;
      result.push(cellChanges);
    }
    return result;
  }, []);
}

/************************** TYPE ATTRIBUTES RESOLUTION **************************/

/**
 * Returns the resolved typeAttributes
 *
 * @param {Object} state - state of the datatable
 * @param {String} rowKeyValue - row key
 * @param {String} colKeyValue - column key
 * @param {object} types - types
 * @param {object} typeAttributesFromColumnDef - values of typeAttributes from column definition
 * @param {number} stateColIndex - state column index
 *
 * @returns {Object} the resolved typeAttributes.
 */
export function resolveNestedTypeAttributes(state, rowKeyValue, colKeyValue, types, typeAttributesFromColumnDef, stateColIndex) {
  const rowData = getUserRowByCellKeys(state, rowKeyValue, colKeyValue);
  const column = state.columns[stateColIndex];
  const validTypeAttributes = types.getType(column.type).typeAttributes;
  const resolvedTypeAttributes = {};

  // Check if typeAttributesValues and typeAttributes are available
  if (isObjectLike(typeAttributesFromColumnDef) && validTypeAttributes) {
    // We only want to resolve typeAttributes based on the custom types configuration
    // If the attribute is not in that configuration, the value of typeAttributesValues
    // for that will be undefined. This behavior is consistent with view cell.

    Object.keys(validTypeAttributes).forEach(key => {
      const typeAttributeName = validTypeAttributes[key];
      const typeAttributesValue = typeAttributesFromColumnDef[typeAttributeName];
      if (typeAttributesValue) {
        resolvedTypeAttributes[typeAttributeName] = resolveNestedTypeAttributesHelper(rowData, typeAttributesValue);
      }
    });
    return resolvedTypeAttributes;
  }
  return typeAttributesFromColumnDef;
}

/**
 * Helper function to recursively traverse and resolve the nested typeAttributesValues object.
 * For example, resolve {
 *     editTypeAttributes: {
 *         value: {
 *             fieldName: 'name'
 *         }
 *     }
 * }
 * to be ...
 * {
 *     editTypeAttributes: {
 *         value: 'resolvedValue'
 *     }
 * }
 */
function resolveNestedTypeAttributesHelper(rowData, typeAttributesValue) {
  let resolvedTypeAttributes = {};
  if (typeAttributesValue !== undefined) {
    if (isObjectLike(typeAttributesValue)) {
      Object.keys(typeAttributesValue).forEach(key => {
        const value = typeAttributesValue[key];
        if (value !== undefined) {
          // since resolveNestedTypeAttributes will be creating the top level attribute
          // and we  resolve values while creating the new object, the typeAttributesValue passed in
          // could be something like {fieldName: 'someField'}.
          // For example, if the typeAttributes is { targetName: {fieldName: 'name'}},
          // {fieldName: 'name'} will be the typeAttributesValue passed in to the function,
          // so we need to check if key is 'fieldName' or not and resolve it immediately.
          if (key === 'fieldName') {
            resolvedTypeAttributes = rowData[value];
          } else if (isObjectLike(value)) {
            // This is the case when typeAttributesValue is something like {label: {fieldName: 'name'}}.
            // It's an object but the value maps a field name
            if (value.fieldName) {
              resolvedTypeAttributes[key] = rowData[value.fieldName];
            } else {
              // Nested object case, need to recursively resolve it.
              // For example, { targetName: {value: {fieldName: 'name'}}}}.
              resolvedTypeAttributes[key] = resolveNestedTypeAttributesHelper(rowData, value);
            }
          } else {
            // Primitive value
            resolvedTypeAttributes[key] = value;
          }
        }
      });
    } else {
      // Primitive value.
      // For example, if the typeAttributes is { count: 5},
      // 5 will be the typeAttributesValue passed in to the function.
      // nothing needs to be resolved, just return it.
      return typeAttributesValue;
    }
  }
  return resolvedTypeAttributes;
}

/************************** HELPER FUNCTIONS **************************/

/**
 * Returns the row and column keys of the first editable cell in the table.
 * If no editable cells exist in the table then undefined is returned.
 *
 * @param {Object} dt - The datatable instance. Must be a truthy and valid datatable reference.
 */
function getFirstEditableCell(dt) {
  const columns = getColumns(dt.state);
  const editableColumns = getEditableColumns(columns);
  if (editableColumns.length > 0) {
    const rows = dt.state.rows;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      for (let i = 0; i < editableColumns.length; i++) {
        // Loop through the editable columns in order and examine the corresponding cells
        // in the current row for editability, returning the first such cell that is editable
        const editableColumn = editableColumns[i];
        if (isCellEditable(rows[rowIndex], editableColumn)) {
          return {
            rowKeyValue: rows[rowIndex].key,
            colKeyValue: editableColumn.colKeyValue
          };
        }
      }
    }
  }
  return undefined;
}

/**
 * Returns the current value of the cell, already takes into account the dirty value
 *
 * @param {Object} state - state of the datatable
 * @param {String} rowKeyValue - row key
 * @param {String} colKeyValue - column key
 *
 * @returns {Object} the value for the current cell.
 */
function getCellValue(state, rowKeyValue, colKeyValue) {
  const row = getRowByKey(state, rowKeyValue);
  const colIndex = getStateColumnIndex(state, colKeyValue);
  return row.cells[colIndex].value;
}

/**
 * Sets `aria-selected` to true on cells whose rows are selected
 * and are in the same column as the cell being currently edited
 *
 * @param {Object} state - datatable's state object
 */
function setAriaSelectedOnAllSelectedRows(state) {
  const {
    colKeyValue
  } = state.inlineEdit;
  const selectedRowKeys = getSelectedRowsKeys(state);
  selectedRowKeys.forEach(rowKeyValue => {
    setAriaSelectedOnCell(state, rowKeyValue, colKeyValue);
  });
}

/**
 * Sets `aria-selected` to false on cells whose rows are selected
 * and are in the same column as the cell being currently edited
 *
 * @param {Object} state - datatable's state object
 */
function unsetAriaSelectedOnAllSelectedRows(state) {
  const {
    colKeyValue
  } = state.inlineEdit;
  const selectedRowKeys = getSelectedRowsKeys(state);
  selectedRowKeys.forEach(rowKeyValue => {
    unsetAriaSelectedOnCell(state, rowKeyValue, colKeyValue);
  });
}