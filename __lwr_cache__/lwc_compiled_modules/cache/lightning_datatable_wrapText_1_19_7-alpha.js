import labelClipText from '@salesforce/label/LightningDatatable.clipText';
import labelWrapText from '@salesforce/label/LightningDatatable.wrapText';
import { normalizeBoolean } from 'lightning/utilsPrivate';
import { getStateColumnIndex, getColumns } from './columns';
import { normalizeNumberAttribute } from './utils';
import { getDefaultState } from './state';
const WRAP_TEXT_DEFAULT = false;
const NON_WRAPPABLE_TYPES = ['action', 'boolean', 'button', 'button-icon', 'date-local', 'rowNumber'];
const i18n = {
  clipText: labelClipText,
  wrapText: labelWrapText
};

/************************** WRAP TEXT STATE **************************/

/**
 * Returns a boolean representing whether or not the column should be text wrapped
 *
 * NOTE: Wrap text is not supported in IE, so default parameters are fine here.
 *
 * @param {Object} state Datatable's state object
 * @param {String} colKeyValue The column key value to look up wrap text configuration
 * @returns {Boolean} Whether the text is currently wrapped
 */
export function getWrapTextState(state = getDefaultState(), colKeyValue) {
  return state.wrapText[colKeyValue] || WRAP_TEXT_DEFAULT;
}

/**
 * Sets a boolean value in state's wrapText object against the column key value
 * representing whether or not the column is text wrapped.
 *
 * NOTE: Wrap text is not supported in IE, so default parameters are fine here.
 *
 * @param {Object} state Datatable's state object
 * @param {Object} columnDefinition Datatable's column definitions
 */
export function setWrapTextState(state = getDefaultState(), columnDefinition) {
  const {
    colKeyValue,
    type,
    wrapText
  } = columnDefinition;
  if (isWrappableType(type)) {
    state.wrapText[colKeyValue] = normalizeBoolean(wrapText) || WRAP_TEXT_DEFAULT;
  }
}

/************************** WRAP TEXT MAX LINES **************************/

/**
 * Normalizes and sets wrapTextMaxLines in datatable's state object.
 * The normalized value should be a positive integer or it'll fall back to undefined.
 *
 * @param {Object} state Datatable's state object
 * @param {Integer} value The maximum lines allowed
 */
export function setWrapTextMaxLines(state, value) {
  state.wrapTextMaxLines = normalizeNumberAttribute('wrapTextMaxLines', value, 'positive', undefined);
}

/**
 * Sets the `wrapText` and `wrapTextMaxLines` values in the cell object for all cells in a column.
 * These values are used by primitiveCellFactory to set the required classes on the cell for wrapping
 *
 * @param {Object} state Datatable's state object
 * @param {Number} colIndex The column index to update
 * @param {String} colKeyValue The column key value to look up wrap text configuration
 */
function updateWrapTextAndMaxLinesValuesInCells(state, colIndex, colKeyValue) {
  state.rows.forEach(row => {
    const cell = row.cells[colIndex];
    cell.wrapText = state.wrapText[colKeyValue];
    cell.wrapTextMaxLines = cell.wrapText ? state.wrapTextMaxLines : undefined;
  });
}

/************************** HEADER ACTIONS **************************/

/**
 * Returns an object representing the two internal header actions that datatable
 * provides - Wrap Text and Clip Text.
 * Each header action contains a label, title, action name and its selected value (checked)
 *
 * @param {Object} state Datatable's state object
 * @param {Object} columnDefinition Datatable's column definitions
 * @returns {Array} An array of wrap text actions
 */
export function getActions(state, columnDefinition) {
  const wrapTextActions = [];
  const {
    hideDefaultActions,
    type,
    colKeyValue
  } = columnDefinition;

  // must be done first, so getWrapTextState correctly resolves
  setWrapTextState(state, columnDefinition);

  // if not hidden and isWrapable, sets the internal actions
  if (isWrappableType(type) && !hideDefaultActions) {
    const isTextWrapped = getWrapTextState(state, colKeyValue);
    wrapTextActions.push({
      label: `${i18n.wrapText}`,
      title: `${i18n.wrapText}`,
      checked: isTextWrapped,
      name: 'wrapText'
    });
    wrapTextActions.push({
      label: `${i18n.clipText}`,
      title: `${i18n.clipText}`,
      checked: !isTextWrapped,
      name: 'clipText'
    });
  }
  return wrapTextActions;
}

/**
 * If the action is an internal action and if the wrapText value for a column
 * needs to be changed in the state, change it to the new value and update
 * the check mark to represent the currently selected action
 *
 * @param {Object} state Datatable's state object
 * @param {String} action Action that was selected/triggered
 * @param {String} colKeyValue Column key value
 */
export function handleTriggeredAction(state, action, colKeyValue) {
  const actionName = action.name;
  if (actionName === 'wrapText' || actionName === 'clipText') {
    // If state should be changed
    if (state.wrapText[colKeyValue] !== (actionName === 'wrapText')) {
      state.shouldResetHeights = true;
      state.wrapText[colKeyValue] = actionName === 'wrapText';
      updateSelectedOptionInHeaderActions(state, colKeyValue);
    }
  }
}

/**
 * Update the 'checked' value of the each action to show which action is selected
 * and which action is not selected.
 *
 * @param {Object} state The datatable state.
 * @param {String} colKeyValue The column key.
 */
function updateSelectedOptionInHeaderActions(state, colKeyValue) {
  const columns = getColumns(state);
  const colIndex = getStateColumnIndex(state, colKeyValue);
  const colData = columns[colIndex];
  colData.actions.internalActions.forEach(action => {
    if (action.name === 'wrapText') {
      action.checked = state.wrapText[colKeyValue];
    }
    if (action.name === 'clipText') {
      action.checked = !state.wrapText[colKeyValue];
    }
  });
  updateWrapTextAndMaxLinesValuesInCells(state, colIndex, colKeyValue);

  // Force a refresh on this column, because the wrapText checked value changed.
  colData.actions = Object.assign({}, colData.actions);
}

/************************** HELPER FUNCTIONS **************************/

/**
 * Determines if a given column type is wrappable.
 *
 * @param {String} type The type to check.
 * @returns {Boolean} Whether the given type is wrappable.
 */
function isWrappableType(type) {
  return NON_WRAPPABLE_TYPES.indexOf(type) < 0;
}