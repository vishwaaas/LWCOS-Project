import { assert } from 'lightning/utilsPrivate';
import { getColumnName } from './columns-shared';
const VALID_SORT_DIRECTIONS = {
  asc: true,
  desc: true
};

/**
 * Determines if the supplied sort direction is valid.
 * Refer to `VALID_SORT_DIRECTIONS` for valid solid directions.
 *
 * @param {String} value The sort direction to validate
 * @returns {Boolean} Whether the supplied sort direction is valid
 */
export function isValidSortDirection(value) {
  return !!VALID_SORT_DIRECTIONS[value];
}

/**
 * Gets the default sort direction. When clicking on a header to sort,
 * the default sort direction is applied first. Clicking again reverses it
 *
 * @param {Object} state The current datatable state
 * @returns {String} The default sort direction
 */
export function getDefaultSortDirection(state) {
  return state.defaultSortDirection;
}

/**
 * Sets the default sort direction. When clicking on a header to sort,
 * the default sort direction is applied first. Clicking again reverses it
 *
 * @param {Object} state The current datatable state
 * @param {String} value The value to update the default sort direction to
 */
export function setDefaultSortDirection(state, value) {
  assert(isValidSortDirection(value), `The "defaultSortDirection" value passed into lightning:datatable
        is incorrect, "defaultSortDirection" value should be one of
        ${Object.keys(VALID_SORT_DIRECTIONS).join()}.`);
  state.defaultSortDirection = isValidSortDirection(value) ? value : getDefaultSortDirection(state);
}

/**
 * Gets the current sort direction
 *
 * @param {Object} state The current datatable state
 * @returns {String} The current sort direction
 */
export function getSortedDirection(state) {
  return state.sortedDirection;
}

/**
 * Sets the current sort direction.
 * In the case an invalid sort direction is provided, throw
 * an error providing resolution information. In an error case,
 * `sortedDirection` will be `undefined`
 *
 * @param {Object} state The current datatable state
 * @param {String} value The value to update the sort direction to
 */
export function setSortedDirection(state, value) {
  assert(isValidSortDirection(value), `The "sortedDirection" value passed into lightning:datatable
        is incorrect, "sortedDirection" value should be one of
        ${Object.keys(VALID_SORT_DIRECTIONS).join()}.`);
  state.sortedDirection = isValidSortDirection(value) ? value : undefined;
}

/**
 * Gets the current sort value. The value will match the name
 * of a given column in the datatable
 *
 * @param {Object} state The current datatable state
 * @returns {String} The current sort value
 */
export function getSortedBy(state) {
  return state.sortedBy;
}

/**
 * Sets the current sort value. The value should match the name
 * of a given column in the datatable. In the case that a
 * non-string value is provided, the sort value with fallback
 * to `undefined`
 *
 * @param {Object} state The current datatable state
 * @param {String} value The value to update the sort state to
 */
export function setSortedBy(state, value) {
  if (typeof value === 'string') {
    state.sortedBy = value;
  } else {
    state.sortedBy = undefined;
  }
}

/**
 * Applies sorting to each datatable column
 *
 * @param {Object} state The current datatable state
 */
export function updateSorting(state) {
  const columns = state.columns;
  columns.forEach(column => updateColumnSortingState(column, state));
}

/**
 * Applies sorting to a datatable column
 *
 * @param {Object} column The datatable column name to sort
 * @param {Object} state The current datatable state
 */
export function updateColumnSortingState(column, state) {
  const {
    sortedBy,
    sortedDirection,
    defaultSortDirection
  } = state;
  if (getColumnName(column) === sortedBy && column.sortable) {
    Object.assign(column, {
      sorted: true,
      sortAriaLabel: sortedDirection === 'desc' ? 'descending' : 'ascending',
      sortedDirection
    });
  } else {
    Object.assign(column, {
      sorted: false,
      sortAriaLabel: column.sortable ? 'other' : null,
      sortedDirection: defaultSortDirection
    });
  }
}