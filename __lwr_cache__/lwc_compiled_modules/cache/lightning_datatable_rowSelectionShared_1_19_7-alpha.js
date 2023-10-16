/**
 * This file exists in order to get around circular dependencies.
 * In this case, rowSelection.js has a dependency on rows.js;
 * but rows.js also has a dependency on rowSelection.js for
 * `isSelectedRow()` among others.
 *
 * We split out the functions that could cause circular dependencies with
 * `rowSelection.js` into the `*Shared.js` files.
 */

/**
 * Returns whether or not the row is selected using the state and the `rowKeyValue`.
 * The state maintains the list of selected rows from which this value can be retrieved.
 *
 * @param {Object} state Datatable state object
 * @param {String} rowKeyValue The row key value to lookup
 * @returns {Boolean} Whether the row is currently selected
 */
export function isSelectedRow(state, rowKeyValue) {
  return !!state.selectedRowsKeys[rowKeyValue];
}

/**
 * Returns whether the row (whose row key value is specified) should be disabled or not.
 * Should not disable if the row is selected. If the particular row is not selected, the
 * row should be disabled when `max-row-selection` > 1 and the selection limit is reached.
 *
 * NOTE: Do not disable selection when `max-row-selection` is 1 and a row has been selected.
 *
 * @param {Object} state Datatable state object
 * @param {String} rowKeyValue The row key value to lookup
 * @returns {Boolean} Whether the row should be disabled or not
 */
export function isDisabledRow(state, rowKeyValue) {
  if (!isSelectedRow(state, rowKeyValue)) {
    const maxRowSelection = getMaxRowSelection(state);

    // when selection is 1, we should not disable selection
    return maxRowSelection !== 1 && getCurrentSelectionLength(state) === maxRowSelection;
  }
  return false;
}

/**
 * Returns which input type to use for row selection.
 * If `max-row-selection` is 1, use radio buttons. Otherwise, use checkboxes.
 *
 * @param {Object} state Datatable state object
 * @returns {String} `radio` is only one row is allowed to be selected, otherwise `checkbox`
 */
export function getRowSelectionInputType(state) {
  if (getMaxRowSelection(state) === 1) {
    return 'radio';
  }
  return 'checkbox';
}

/**
 * Retrieves the maximum number of rows that can be selected from state.
 *
 * @param {Object} state Datatable state object
 * @returns {Integer} The maximum rows that can be selected
 */
export function getMaxRowSelection(state) {
  return state.maxRowSelection;
}

/**
 * Determines the number of rows currently selected.
 *
 * @param {Object} state Datatable state object
 * @returns {Integer} The number of currently selected rows
 */
export function getCurrentSelectionLength(state) {
  return getSelectedRowsKeys(state).length;
}

/**
 * Retrieves the row keys that are currently selected.
 *
 * @param {Object} state Datatable state object
 * @returns {Array} An array of the row keys that are currently selected
 */
export function getSelectedRowsKeys(state) {
  return Object.keys(state.selectedRowsKeys).filter(key => state.selectedRowsKeys[key]);
}