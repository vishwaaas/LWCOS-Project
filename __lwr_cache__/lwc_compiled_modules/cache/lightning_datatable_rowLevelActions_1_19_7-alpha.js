import { unwrap } from 'lwc';
import { getUserRowByCellKeys } from './rows';
import { getUserColumnIndex } from './columns';

/**
 * Handles the `privatecellactiontriggered` event on lightning-datatable
 *
 * @param {CustomEvent} event - `privatecellactiontriggered`
 */
export function handleRowActionTriggered(event) {
  event.stopPropagation();
  const {
    action,
    colKeyValue,
    rowKeyValue
  } = event.detail;
  const selectedRow = getUserRowByCellKeys(this.state, rowKeyValue, colKeyValue);
  this.dispatchEvent(new CustomEvent('rowaction', {
    detail: {
      action: unwrap(action),
      row: unwrap(selectedRow)
    }
  }));
}

/**
 * Handles the `privatecellactionmenuopening` event on lightning-datatable
 *
 * @param {CustomEvent} event - `privatecellactionmenuopening`
 */
export function handleLoadDynamicActions(event) {
  event.stopPropagation();
  const {
    actionsProviderFunction,
    colKeyValue,
    doneCallback,
    rowKeyValue,
    saveContainerPosition
  } = event.detail;
  const selectedRow = getUserRowByCellKeys(this.state, rowKeyValue, colKeyValue);
  saveContainerPosition(this.getViewableRect());
  actionsProviderFunction(unwrap(selectedRow), doneCallback);
}

/**
 * Handles the `privatecellbuttonclicked` event on lightning-datatable
 *
 * @param {CustomEvent} event - `privatecellbuttonclicked`
 */
export function handleCellButtonClick(event) {
  event.stopPropagation();
  const {
    colKeyValue,
    rowKeyValue
  } = event.detail;
  const row = getUserRowByCellKeys(this.state, rowKeyValue, colKeyValue);
  const userColumnIndex = getUserColumnIndex(this.state, colKeyValue);
  const userColumnDefinition = this._columns[userColumnIndex];
  this.dispatchEvent(new CustomEvent('rowaction', {
    detail: {
      action: unwrap(userColumnDefinition.typeAttributes),
      row: unwrap(row)
    }
  }));
}