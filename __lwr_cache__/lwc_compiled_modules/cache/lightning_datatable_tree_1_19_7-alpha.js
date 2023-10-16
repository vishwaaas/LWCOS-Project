import { getColumns } from './columns';
import { isTreeType } from './types';

/**
 * Retrieves the default values for the tree state indicator field names.
 * These values are used to make logic decisions later and may be updated
 * during normal operation.
 *
 * @returns {Object} The default tree state indicator field names
 */
export function getTreeStateIndicatorFieldNames() {
  return {
    children: 'hasChildren',
    level: 'level',
    expanded: 'isExpanded',
    position: 'posInSet',
    setsize: 'setSize'
  };
}

/**
 * Determines if any of the columns in the datatable are of a tree-type.
 *
 * @param {Object} state The datatable state
 * @returns {Boolean} Whether any of the columns are of a tree-type
 */
export function hasTreeDataType(state) {
  const columns = getColumns(state);
  return columns.some(column => {
    return isTreeType(column.type);
  });
}

/**
 * Retrieves the first tree-type column from the state.
 *
 * @param {Object} state The datatable state
 * @returns {Object} The first tree-type column, else `null`
 */
export function getStateTreeColumn(state) {
  const columns = getColumns(state);
  for (let i = 0; i < columns.length; i++) {
    if (isTreeType(columns[i].type)) {
      return columns[i];
    }
  }
  return null;
}

/**
 * Dispatches an event when a row is toggled to be expanded or collapsed.
 *
 * @param {String} rowKeyValue The row key being acted upon
 * @param {Boolean} expanded The current expand/collapse state of the row
 */
export function fireRowToggleEvent(rowKeyValue, expanded) {
  const customEvent = new CustomEvent('privatetogglecell', {
    bubbles: true,
    composed: true,
    cancelable: true,
    detail: {
      name: rowKeyValue,
      nextState: expanded ? false : true // True = expanded, False = collapsed
    }
  });

  this.dispatchEvent(customEvent);
}