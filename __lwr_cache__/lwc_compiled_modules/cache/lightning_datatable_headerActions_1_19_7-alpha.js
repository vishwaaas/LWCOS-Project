import { unwrap } from 'lwc';
import { getUserColumnIndex, getColumns } from './columns';
import { getActions, handleTriggeredAction } from './wrapText';

// Height of a clickable menu item
const ACTION_REM_HEIGHT = 2.125;

// Height of the menu divider, 1 rem + 1px (1/16px)
const DIVIDER_REM_HEIGHT = 1.0625;

/************************** PUBLIC METHODS ***************************/

/**
 * Merges wrapText internal actions.
 * If there are new internal actions in the future, they may be added here.
 *
 * @param {Object} state The state of the datatable
 * @param {Object} columnDefinition The column definition to extract internal actions from
 * @returns {Array} All wrapText internal actions
 */
export function getInternalActions(state, columnDefinition) {
  return [...getActions(state, columnDefinition)];
}

/**
 * Overrides the actions with the internal ones, plus the customer ones.
 *
 * @param {Object} state The state of the datatable
 */
export function updateHeaderActions(state) {
  const columns = getColumns(state);
  columns.forEach((column, idx) => {
    column.actions = {
      menuAlignment: getMenuAlignment(columns, idx),
      customerActions: Array.isArray(column.actions) ? column.actions : [],
      internalActions: getInternalActions(state, column)
    };
  });
}

/**
 * For internal actions, handles triggering the action.
 * Then dispatches the header action event.
 *
 * @param {Event} event
 */
export function handleHeaderActionTriggered(event) {
  event.stopPropagation();
  const {
    action,
    actionType,
    colKeyValue
  } = event.detail;
  if (actionType !== 'customer') {
    handleTriggeredAction(this.state, action, colKeyValue);
  }
  dispatchHeaderActionEvent(this, action, colKeyValue);
}

/**
 * Calculates the size and positioning of the header action
 * menu when it is opened.
 *
 * @param {Event} event
 */
export function handleHeaderActionMenuOpening(event) {
  event.stopPropagation();
  event.preventDefault();
  const actionsHeight = event.detail.actionsCount * ACTION_REM_HEIGHT;
  const dividersHeight = event.detail.dividersCount * DIVIDER_REM_HEIGHT;
  const wrapperHeight = 1;
  this._actionsMinHeightStyle = `min-height:${actionsHeight + dividersHeight + wrapperHeight}rem`;
  event.detail.saveContainerPosition(this.getViewableRect());
}

/**
 * Resets header action menu height when closed.
 */
export function handleHeaderActionMenuClosed() {
  this._actionsMinHeightStyle = '';
}

/************************** PRIVATE METHODS ***************************/

/**
 * Dispatches the `headeraction` event.
 *
 * @param {Object} dt The datatable
 * @param {Object} action The action to dispatch
 * @param {String} colKeyValue The column to dispatch the action on
 */
function dispatchHeaderActionEvent(dt, action, colKeyValue) {
  const userColumnIndex = getUserColumnIndex(dt.state, colKeyValue);
  const customerColumnDefinition = dt.columns[userColumnIndex];
  dt.dispatchEvent(new CustomEvent('headeraction', {
    detail: {
      action: unwrap(action),
      columnDefinition: unwrap(customerColumnDefinition)
    }
  }));
}

/**
 * Determines the menu alignment based on column placement.
 *
 * @param {Array} columns Array of all the columns
 * @param {Integer} index The current column index to check
 * @returns {String} The computed alignment
 */
function getMenuAlignment(columns, index) {
  const isLastColumn = index === columns.length - 1;
  return isLastColumn || columns[index + 1].type === 'action' ? 'auto-right' : 'auto-left';
}