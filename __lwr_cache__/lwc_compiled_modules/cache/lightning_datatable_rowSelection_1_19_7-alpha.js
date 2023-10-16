import { resolveRowClassNames, getRows, getRowByKey, getRowsTotal, getRowIndexByKey, rowKeyExists } from './rows';
import { getColumns, getStateColumnIndex, SELECTABLE_ROW_CHECKBOX } from './columns';
import { isNonNegativeInteger } from './utils';
import { getCurrentSelectionLength, isSelectedRow, isDisabledRow, getRowSelectionInputType, getMaxRowSelection, getSelectedRowsKeys } from './rowSelectionShared';
export { getCurrentSelectionLength, isSelectedRow, isDisabledRow, getRowSelectionInputType, getMaxRowSelection, getSelectedRowsKeys } from './rowSelectionShared';
const MAX_ROW_SELECTION_DEFAULT = undefined;
const ROWS_ACTION = {
  SELECT_ALL_ROWS: 'selectAllRows',
  DESELECT_ALL_ROWS: 'deselectAllRows',
  ROW_SELECT: 'rowSelect',
  ROW_DESELECT: 'rowDeselect'
};

/************************** EVENT HANDLERS **************************/

/**
 * Marks all possible rows as selected depending on the max-row-selection value.
 * Fires the `rowselection` event with the new set of selected rows.
 *
 * @param {CustomEvent} event - `selectallrows`
 */
export function handleSelectAllRows(event) {
  event.stopPropagation();
  markAllRowsSelected(this.state);
  this.fireSelectedRowsChange(this.getSelectedRows(), {
    action: ROWS_ACTION.SELECT_ALL_ROWS
  });
}

/**
 * Marks all rows as de-selected. Does not need to account for max-row-selection.
 * Fires the `rowselection` event with the new set of selected rows.
 * @param {CustomEvent} event - `deselectallrows`
 */
export function handleDeselectAllRows(event) {
  event.stopPropagation();
  markAllRowsDeselected(this.state);
  this.fireSelectedRowsChange(this.getSelectedRows(), {
    action: ROWS_ACTION.DESELECT_ALL_ROWS
  });
}

/**
 * Handles selection of row(s)
 * 1. Marks the relevant rows as selected
 *     Depends on whether a single row or multiple rows (interval) were selected
 * 2. Records the last selected row's row key value in the state
 * 3. Fires the `rowselection` event with the new selected rows in the details object
 *
 * @param {CustomEvent} event - `selectrow` event
 */
export function handleSelectRow(event) {
  event.stopPropagation();
  const {
    rowKeyValue,
    isMultiple
  } = event.detail;
  let fromRowKey = rowKeyValue;
  if (isMultiple) {
    fromRowKey = getLastRowSelection(this.state) || rowKeyValue;
  }
  markSelectedRowsInterval(this.state, fromRowKey, rowKeyValue);
  setLastRowSelection(this.state, rowKeyValue);
  this.fireSelectedRowsChange(this.getSelectedRows(), {
    action: ROWS_ACTION.ROW_SELECT,
    value: rowKeyValue
  });
}

/**
 * Handles the de-selection of row(s)
 * 1. Marks the relevant rows as de-selected
 *     Depends on whether a single row or multiple rows (interval) was de-selected
 * 2. Records the last selected row's row key value in the state
 * 3. Fires the `rowselection` event with the new selected rows in the details object
 *
 * @param {CustomEvent} event - `deselectrow` event
 */
export function handleDeselectRow(event) {
  event.stopPropagation();
  const {
    rowKeyValue,
    isMultiple
  } = event.detail;
  let fromRowKey = rowKeyValue;
  if (isMultiple) {
    fromRowKey = getLastRowSelection(this.state) || rowKeyValue;
  }
  markDeselectedRowsInterval(this.state, fromRowKey, rowKeyValue);
  setLastRowSelection(this.state, rowKeyValue);
  this.fireSelectedRowsChange(this.getSelectedRows(), {
    action: ROWS_ACTION.ROW_DESELECT,
    value: rowKeyValue
  });
}

/**
 * Handles the `rowselection` event
 */
export function handleRowSelectionChange() {
  updateBulkSelectionState(this.state);
}

/************************** ROW SELECTION **************************/

/**
 * Marks all rows as selected.
 * Retrieve all rows from the state object. Iterate over these rows; for each:
 *     1. If the index is less than the specified max-row-selection value or
 *        if max-row-selection is not specified at all, set `isSelected` and
 *        `ariaSelected` to true and resolve `classnames` to reflect that the
 *        row is selected on each row object.
 *     2. If max-row-selection has been reached, mark the remaining rows
 *        to reflect that they are not selected and disable them.
 *
 * @param {Object} state - datatable's state object
 */
export function markAllRowsSelected(state) {
  const rows = getRows(state);
  const maxRowSelection = getMaxRowSelection(state);
  resetSelectedRowsKeys(state);
  rows.forEach((row, index) => {
    if (index < maxRowSelection || maxRowSelection === undefined) {
      setRowSelectedAttributes(true, row);
      addKeyToSelectedRowKeys(state, row.key);
    } else {
      row.isDisabled = true;
      setRowSelectedAttributes(false, row);
    }
  });
}

/**
 * Marks all rows as de-selected.
 * Retrieve all rows from the state object. Iterate over these rows; for each row
 * set `isSelected` and `ariaSelected` to false and enable the row. Also resolve
 * the `classnames` for the row to reflect that it is not selected.
 *
 * @param {Object} state - datatable's state object
 * @returns
 */
export function markAllRowsDeselected(state) {
  const rows = getRows(state);
  resetSelectedRowsKeys(state);
  rows.forEach(row => {
    row.isDisabled = false;
    setRowSelectedAttributes(false, row);
  });
}

/**
 * Marks rows as selected for all rows within the interval.
 * An interval is created when the user had initially selected a cell,
 * then does a Shift + click on a different row selection checkbox.
 * By doing so, all the rows (and checkboxes) between those two rows
 * will all be selected.
 *
 * Note that this function is also used not only for intervals but also
 * for single row selections. In that case, the startRowKey and
 * endRowKey will both have the same value.
 *
 * This does not handle the case when the header checkbox that selects
 * all rows of the table is clicked. That is handled by - `handleSelectAllRows`
 *
 * @param {Object} state - datatable's state object
 * @param {String} startRowKey - row key value of the first row that was selected (start of the interval)
 * @param {String} endRowKey - row key value of the last row that was selected (end of the interval)
 */
function markSelectedRowsInterval(state, startRowKey, endRowKey) {
  const rows = getRows(state);
  const {
    start,
    end
  } = getRowIntervalIndexes(state, startRowKey, endRowKey);
  const maxRowSelection = getMaxRowSelection(state) || getRowsTotal(state);
  let i = start,
    maxSelectionReached;
  while (i <= end && !maxSelectionReached) {
    markRowSelected(state, rows[i].key);
    maxSelectionReached = getCurrentSelectionLength(state) >= maxRowSelection;
    i++;
  }
}

/**
 * Marks rows as de-selected for all rows within the interval.
 * An interval for de-selection is created when the user ended selection or
 * de-selects a row and then does a Shift + click on a row that was previously selected.
 * By doing so, all the rows (and checkboxes) between the two rows will be de-selected
 *
 * Note that this function is also used not only for intervals but also
 * for single row de-selections. In that case, the startRowKey and
 * endRowKey will both have the same value.
 *
 * This does not handle the case when the header checkbox is clicked to de-select all rows
 * That is handledd by - `handleDeselectAllRows`
 *
 * @param {Object} state - datatable's state object
 * @param {String} startRowKey - row key value of the first row that was selected (start of the interval)
 * @param {String} endRowKey - row key value of the last row that was selected (end of the interval)
 */
function markDeselectedRowsInterval(state, startRowKey, endRowKey) {
  const rows = getRows(state);
  const {
    start,
    end
  } = getRowIntervalIndexes(state, startRowKey, endRowKey);
  for (let i = start; i <= end; i++) {
    markRowDeselected(state, rows[i].key);
  }
}

/**
 * Marks a row with the specified row key value as selected. This is done by:
 *     1. Sets `isSelected`, `ariaSelected` to true and resolves `classnames`
 *        to that which reflect that the row is selected, on the row object.
 *        These are used by the template to render the appropriate values.
 *     2. If max-row-selection > 1 (checkbox/multi-selection),
 *         a. If with this selection, the max-row-selection value is reached,
 *            disable all the other un-selected rows
 *         b. Add the row key value of that row to the state
 *     3. If max-row-selection = 1 (radio button selector),
 *         a. If another row was previously selected before, de-select that row
 *         b. Add the row key value of that row to the state
 *
 * @param {Object} state - datatable's state object
 * @param {String} rowKeyValue - row key value of row to mark selected
 */
export function markRowSelected(state, rowKeyValue) {
  const row = getRowByKey(state, rowKeyValue);
  const maxRowSelection = getMaxRowSelection(state) || getRowsTotal(state);
  const previousSelectionLength = getCurrentSelectionLength(state);
  setRowSelectedAttributes(true, row);
  if (maxRowSelection > 1) {
    addKeyToSelectedRowKeys(state, row.key);
    if (previousSelectionLength + 1 === maxRowSelection) {
      markDeselectedRowDisabled(state);
    }
  } else {
    if (previousSelectionLength === 1) {
      const previousSelectedRow = getRowByKey(state, Object.keys(state.selectedRowsKeys)[0]);
      setRowSelectedAttributes(false, previousSelectedRow);
      resetSelectedRowsKeys(state);
    }
    addKeyToSelectedRowKeys(state, row.key);
  }
}

/**
 * Marks a row with the specified row key value as de-selected. This is done by:
 *     1. Sets `isSelected`, `ariaSelected` to false and resolves `classnames`
 *        to that which reflect that the row is not selected, on the row object.
 *        These are used by the template to render the appropriate values.
 *     2. The row key value of this row is removed from list of selected row keys
 *     3. Before the current de-selection, if the remaining unselected rows were
 *        disabled (max-row-selection was reached), enable all unselected rows
 *        so that they can be selected.
 *
 * @param {Object} state - datatable's state object
 * @param {String} rowKeyValue - row key value of row to mark selected
 */
export function markRowDeselected(state, rowKeyValue) {
  const row = getRowByKey(state, rowKeyValue);
  const maxRowSelection = getMaxRowSelection(state);
  setRowSelectedAttributes(false, row);
  removeKeyFromSelectedRowKeys(state, row.key);
  if (getCurrentSelectionLength(state) === maxRowSelection - 1) {
    markDeselectedRowEnabled(state);
  }
}

/**
 * Iterates over the row key values passed in and sets the relevant
 * values on the row object to reflect that it is selected.
 * Sets `isSelected`, `ariaSelected` and `classnames` on the row object
 * which are used by the template to render the appropriate values.
 *
 * @param {Object} state - datatable's state object
 * @param {Array} keys - a list of row key values to be marked selected
 */
function markRowsSelectedByKeys(state, keys) {
  keys.forEach(rowKeyValue => {
    const row = getRowByKey(state, rowKeyValue);
    setRowSelectedAttributes(true, row);
  });
}

/**
 * Iterates over the row key values passed in and un-sets the relevant
 * values on the row object to reflect that it is not selected.
 * Sets `isSelected`, `ariaSelected` to false and resolves `classnames`
 * to one which reflects that the row is not selected on the row object.
 * These are used by the template to render the appropriate values.
 *
 * @param {Object} state - datatable's state object
 * @param {Array} keys - a list of row key values to be marked selected
 */
function markRowsDeselectedByKeys(state, keys) {
  keys.forEach(rowKeyValue => {
    const row = getRowByKey(state, rowKeyValue);
    setRowSelectedAttributes(false, row);
  });
}

/**
 * Marks all deselected rows as disabled. This prevents the user
 * from selecting any more rows.
 * This is typically called once the selection has reached the
 * max-row-selection value and no more rows are allowed to be selected.
 *
 * @param {Object} state - datatable's state object
 */
export function markDeselectedRowDisabled(state) {
  const rows = getRows(state);
  rows.forEach(row => {
    if (!isSelectedRow(state, row.key)) {
      row.isDisabled = true;
    }
  });
}

/**
 * Marks all the deselected rows as enabled. This allows the user
 * to select more rows.
 * This is typically called when the maximum number of rows were
 * previously selected but a row was deselected, now allowing
 * any other row to be selected - for this, all rows should be enabled
 *
 * @param {Object} state - datatable's state object
 */
export function markDeselectedRowEnabled(state) {
  const rows = getRows(state);
  rows.forEach(row => {
    if (!isSelectedRow(state, row.key)) {
      row.isDisabled = false;
    }
  });
}

/************************** SELECTED ROW KEYS **************************/

/**
 * This is called when the `selected-rows` attribute is set on the datatable
 * The 'value' parameter should be an Array of key-field values. If it is not an array,
 * we throw an error stating so and all rows are de-selected.
 *
 * If the 'value' param is valid, we filter the 'value' array for only the valid keys.
 * If the number of valid keys exceeds the max-row-selection value, we use only the
 * number of keys from the valid list as that of the max-row-selection value.
 *
 * Compute the differences between the currently selected rows vs
 * the newly selected rows to find out which rows need to be additionally
 * selected and de-selected.
 * Based on the above computation, mark rows as selected or de-selected and
 * set the new `selectedRowsKeys` in the state object.
 *
 * If we select the max number of rows allowed and if max-row-selection > 1 (multi-select),
 * disable all the other rows.
 * If the previous selection had reached the max limit and the new selection
 * is less than the limit, re-enable the de-selected rows to allow for new selection.
 *
 * @param {Object} state - datatable's state object
 * @param {Array} value - key-field values of rows to set as selected
 */
export function setSelectedRowsKeys(state, value) {
  if (Array.isArray(value)) {
    const maxRowSelection = getMaxRowSelection(state);
    const previousSelectionLength = getCurrentSelectionLength(state);
    let selectedRows = filterValidKeys(state, value);
    if (selectedRows.length > maxRowSelection) {
      // eslint-disable-next-line no-console
      console.warn(`The number of keys in selectedRows for lightning:datatable exceeds the limit defined by maxRowSelection.`);
      selectedRows = selectedRows.slice(0, maxRowSelection);
    }

    // Convert the selectedRows Array to an Object that state.selectedRowKeys expects
    // ['a', 'b'] -> { a : true, b : true}
    const normalizedSelectedRowsKeys = normalizeSelectedRowsKey(selectedRows);

    // Compute differences between currently selected rows and
    // newly selected row keys. The diff will tell which new rows
    // need to be selected and which already selected rows need to
    // be deselected
    const selectionOperations = getSelectedDiff(state, selectedRows);
    const deselectionOperations = getDeselectedDiff(state, normalizedSelectedRowsKeys);
    markRowsSelectedByKeys(state, selectionOperations);
    markRowsDeselectedByKeys(state, deselectionOperations);
    state.selectedRowsKeys = normalizedSelectedRowsKeys;

    // If we select the max number of rows allowed and if max-row-selection > 1 (multi-select),
    // disable all the other rows to prevent further selection
    if (selectedRows.length === maxRowSelection && maxRowSelection > 1) {
      markDeselectedRowDisabled(state);
    } else if (selectedRows.length < maxRowSelection && previousSelectionLength === maxRowSelection) {
      // If the previous selection had reached the max limit and the new selection
      // is less than the limit, re-enable the de-selected rows to allow for new selection.
      markDeselectedRowEnabled(state);
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(`The "selectedRows" passed into "lightning:datatable" must be an Array with the keys of the selected rows. We receive instead ${value}`);
    markAllRowsDeselected(state);
  }
}
export function syncSelectedRowsKeys(state, selectedRows) {
  let changed = false;
  const {
    selectedRowsKeys,
    keyField
  } = state;
  const maxRowSelection = getMaxRowSelection(state) || getRowsTotal(state);
  if (Object.keys(selectedRowsKeys).length !== selectedRows.length) {
    changed = true;
    state.selectedRowsKeys = updateSelectedRowsKeysFromSelectedRows(selectedRows, keyField);
  } else {
    changed = selectedRows.some(row => !selectedRowsKeys[row[keyField]]);
    if (changed) {
      state.selectedRowsKeys = updateSelectedRowsKeysFromSelectedRows(selectedRows, keyField);
    }
  }
  if (maxRowSelection > 1 && changed) {
    if (selectedRows.length < maxRowSelection) {
      markDeselectedRowEnabled(state);
    } else {
      markDeselectedRowDisabled(state);
    }
  }
  updateBulkSelectionState(state);
  return {
    ifChanged: callback => {
      if (changed && typeof callback === 'function') {
        callback(selectedRows);
      }
    }
  };
}
function updateSelectedRowsKeysFromSelectedRows(selectedRows, keyField) {
  return selectedRows.reduce((selectedRowsKeys, row) => {
    selectedRowsKeys[row[keyField]] = true;
    return selectedRowsKeys;
  }, {});
}
function addKeyToSelectedRowKeys(state, key) {
  state.selectedRowsKeys[key] = true;
}
function removeKeyFromSelectedRowKeys(state, key) {
  // not using delete this.state.selectedRowsKeys[key]
  // because that causes perf issues
  state.selectedRowsKeys[key] = false;
}
function normalizeSelectedRowsKey(value) {
  return value.reduce((map, key) => {
    map[key] = true;
    return map;
  }, {});
}
function filterValidKeys(state, keys) {
  return keys.filter(key => rowKeyExists(state, key));
}
export function resetSelectedRowsKeys(state) {
  state.selectedRowsKeys = {};
}

/************************** LAST SELECTED ROW KEYS **************************/

/**
 * Returns the row key value of the row that was last selected
 * Returns undefined if the row key value is invalid
 *
 * @param {Object} state - the datatable state.
 * @returns {String | undefined } the row key or undefined.
 */
function getLastRowSelection(state) {
  const lastSelectedRowKey = state.lastSelectedRowKey;
  const keyIsValid = lastSelectedRowKey !== undefined && getRowIndexByKey(state, lastSelectedRowKey) !== undefined;
  return keyIsValid ? lastSelectedRowKey : undefined;
}
function setLastRowSelection(state, rowKeyValue) {
  state.lastSelectedRowKey = rowKeyValue;
}

/************************** INPUT TYPES **************************/

/**
 * Computes whether or not the input type rendered for row selection needs to change
 * The input type may need to change if:
 *     1. The max-row-selection value was previously 1 and is now either
 *        greater than 1 or is undefined OR
 *     2. The max-row-selection value was previously greater than 1 or undefined
 *        and is now 1 OR
 *     3. Previous max-row-selection value was 0 OR
 *     4. New max-row-selection value is 0
 *
 * @param {Number} previousMaxRowSelection
 * @param {Number} newMaxRowSelection
 * @returns
 */
export function inputTypeNeedsToChange(previousMaxRowSelection, newMaxRowSelection) {
  return previousMaxRowSelection === 1 && isMultiSelection(newMaxRowSelection) || isMultiSelection(previousMaxRowSelection) && newMaxRowSelection === 1 || previousMaxRowSelection === 0 || newMaxRowSelection === 0;
}
export function updateRowSelectionInputType(state) {
  const type = getRowSelectionInputType(state);
  const rows = getRows(state);
  rows.forEach(row => {
    row.inputType = type;
    row.isDisabled = isDisabledRow(state, row.key);
  });
}

/************************** MAX ROW SELECTION **************************/

/**
 * Sets maxRowSelection to the provided value,
 * only keeping up to maxRowSelection values selected.
 *
 * Use input type checkbox if maxRowSelection > 1
 * and input type is radio if maxRowSelection = 1.
 * Invalid values are set to default and an error is logged
 *
 * @param {Object} state - the datatable state.
 * @param {Number | String} - value to set for maxRowSelection
 */
export function setMaxRowSelection(state, value) {
  const previousSelectedRowsKeys = getSelectedRowsKeys(state);
  markAllRowsDeselected(state);
  if (isNonNegativeInteger(value)) {
    const previousMaxRowSelection = getMaxRowSelection(state);
    state.maxRowSelection = Number(value);
    const newMaxRowSelection = getMaxRowSelection(state);
    // reselect up to maxRowSelection rows
    const numberOfRows = Math.min(previousSelectedRowsKeys.length, newMaxRowSelection);
    for (let i = 0; i < numberOfRows; i++) {
      markRowSelected(state, previousSelectedRowsKeys[i]);
    }
    if (inputTypeNeedsToChange(previousMaxRowSelection, getMaxRowSelection(state))) {
      updateRowSelectionInputType(state);
      updateBulkSelectionState(state);
    }
  } else {
    state.maxRowSelection = MAX_ROW_SELECTION_DEFAULT;
    // suppress console error if no value is passed in
    if (value !== null && value !== undefined) {
      // eslint-disable-next-line no-console
      console.error(`The maxRowSelection value passed into lightning:datatable should be a positive integer. We receive instead (${value}).`);
    }
  }
}

/************************** BULK SELECTION STATE **************************/

export function updateBulkSelectionState(state) {
  const selectBoxesColumnIndex = getSelectBoxesColumnIndex(state);
  if (selectBoxesColumnIndex >= 0) {
    state.columns[selectBoxesColumnIndex] = Object.assign({}, state.columns[selectBoxesColumnIndex], {
      bulkSelection: getBulkSelectionState(state),
      isBulkSelectionDisabled: isBulkSelectionDisabled(state)
    });
  }
}
function getBulkSelectionState(state) {
  const selected = getCurrentSelectionLength(state);
  const total = getMaxRowSelection(state) || getRowsTotal(state);
  if (selected === 0) {
    return 'none';
  } else if (selected === total) {
    return 'all';
  }
  return 'some';
}
function isBulkSelectionDisabled(state) {
  return getRowsTotal(state) === 0 || getMaxRowSelection(state) === 0;
}

/************************** HELPER FUNCTIONS **************************/

/**
 * Gets the interval of row indexes based on the start and end row key values
 * Retrieves the index of the row with startRowKey and the same with endRowKey
 * Returns an object that contains the start index which is the lower index value of the two
 * and the end index which is the higher value of the two.
 *
 * @param {Object} state - datatable's state object
 * @param {String} startRowKey - row key value of the first row that was selected (start of the interval)
 * @param {String} endRowKey - row key value of the last row that was selected (end of the interval)
 * @returns {Object} - object with start index and end index
 */
function getRowIntervalIndexes(state, startRowKey, endRowKey) {
  const start = startRowKey === 'HEADER' ? 0 : getRowIndexByKey(state, startRowKey);
  const end = getRowIndexByKey(state, endRowKey);
  return {
    start: Math.min(start, end),
    end: Math.max(start, end)
  };
}

/**
 * Sets aria-selected to 'true' on the cell identified by the rowKeyValue and colKeyValue.
 * This will reflect on the td or th or corresponding element in the role-based table.
 *
 * Note: This change is volatile, and will be reset (lost) in the next index regeneration.
 *
 * @param {Object} state - the state of the datatable
 * @param {String} rowKeyValue - the row key of the cell to mark selected
 * @param {String} colKeyValue - the col key of the cell to mark selected
 */
export function setAriaSelectedOnCell(state, rowKeyValue, colKeyValue) {
  const row = getRowByKey(state, rowKeyValue);
  const colIndex = getStateColumnIndex(state, colKeyValue);
  if (row && colIndex) {
    row.cells[colIndex].ariaSelected = 'true';
  }
}

/**
 * Sets aria-selected to 'false' on the cell identified by the rowKeyValue and colKeyValue.
 * This aria-selected attribute will be removed from the cell (if it was previously added))
 * on the td or th or the corresponding element in the role-based table.
 *
 * Note: This change is volatile, and will be reset (lost) in the next index regeneration.
 *
 * @param {Object} state - the state of the datatable
 * @param {String} rowKeyValue - the row key of the cell to select
 * @param {String} colKeyValue - the col key of the cell to select
 */
export function unsetAriaSelectedOnCell(state, rowKeyValue, colKeyValue) {
  const row = getRowByKey(state, rowKeyValue);
  const colIndex = getStateColumnIndex(state, colKeyValue);
  if (row && colIndex) {
    row.cells[colIndex].ariaSelected = false;
  }
}

/**
 * Sets `isSelected`, `ariaSelected` to true | false and resolves `classnames`
 * to one which reflects the selected value of the row on the row object.
 * These are used by the template to render the appropriate values.
 *
 * @param {Boolean} selectedValue - is the row selected or not
 * @param {Object} row - the row on which to set the selected attributes
 */
function setRowSelectedAttributes(selectedValue, row) {
  row.isSelected = selectedValue;
  row.ariaSelected = selectedValue;
  row.classnames = resolveRowClassNames(row);
}
function getSelectedDiff(state, value) {
  const selectedRowsKeys = state.selectedRowsKeys;
  return value.filter(key => !selectedRowsKeys[key]);
}
function getDeselectedDiff(state, value) {
  const currentSelectedRowsKeys = state.selectedRowsKeys;
  return Object.keys(currentSelectedRowsKeys).filter(key => currentSelectedRowsKeys[key] && !value[key]);
}
function getSelectBoxesColumnIndex(state) {
  const columns = getColumns(state) || [];
  let selectBoxColumnIndex = -1;
  columns.some((column, index) => {
    if (column.type === SELECTABLE_ROW_CHECKBOX) {
      selectBoxColumnIndex = index;
      return true;
    }
    return false;
  });
  return selectBoxColumnIndex;
}

/**
 * Represents whether the select all rows checkbox on the header
 * should be visible or not.
 * If max-row-selection = 1, then the select all rows checkbox
 * should not be visible/rendered.
 *
 * @param {Object} state - datatable's state object
 * @returns
 */
export function getHideSelectAllCheckbox(state) {
  return getMaxRowSelection(state) === 1;
}

/**
 * Represents whether the datatable should enable multiselection or not
 * depending on the max-row-selection value passed in
 *
 * @param {Number} value - max-row-selection value
 * @returns
 */
function isMultiSelection(value) {
  return value > 1 || value === undefined;
}