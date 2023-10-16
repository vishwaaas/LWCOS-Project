// Default empty error state
const DEFAULT_ERROR_STATE = {
  rows: {},
  table: {}
};

/**
 * Retrieves the errors object from datatable's state object
 * Returns the set of row-level errors and table-level errors
 */
export function getErrors(state) {
  return state.errors;
}

/**
 * Sets the row-level errors and table-level errors in datatable's state object
 * Errors being set here overwrite the previous error object in the state
 */
export function setErrors(state, errors) {
  return state.errors = Object.assign({}, DEFAULT_ERROR_STATE, errors);
}

/**
 * Retrieves the row-level errors of a particular row from datatable's state object
 */
export function getRowError(state, rowKey) {
  const rows = getErrors(state).rows;
  return rows && rows[rowKey] || {};
}

/**
 * Retrieves the table-level errors from the datatable's state object
 */
export function getTableError(state) {
  return getErrors(state).table || {};
}