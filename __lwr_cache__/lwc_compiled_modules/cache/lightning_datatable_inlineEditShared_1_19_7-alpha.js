/**
 * Retrieves the dirty/unsaved value of a cell that resulted from an inline
 * edit change. If no change was made on the cell, this function
 * returns `undefined`.
 *
 * @param {Object} state - datatable's state object
 * @param {String} rowKeyValue - computed id for the row
 * @param {String} colKeyValue - computed id for the column
 * @returns {String} The dirty/unsaved value of the cell.
 *                   If no change was made, this returns `undefined`
 */
export function getDirtyValueFromCell(state, rowKeyValue, colKeyValue) {
  const dirtyValues = state.inlineEdit.dirtyValues;
  if (dirtyValues &&
  // eslint-disable-next-line no-prototype-builtins
  dirtyValues.hasOwnProperty(rowKeyValue) &&
  // eslint-disable-next-line no-prototype-builtins
  dirtyValues[rowKeyValue].hasOwnProperty(colKeyValue)) {
    return dirtyValues[rowKeyValue][colKeyValue];
  }
  return undefined;
}