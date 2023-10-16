import { normalizeNumberAttribute } from './utils';
import labelRowLevelErrorAssistiveText from '@salesforce/label/LightningDatatable.rowLevelErrorAssistiveText';
import labelRowNumber from '@salesforce/label/LightningDatatable.rowNumber';
import { formatLabel } from 'lightning/utils';
import { normalizeBoolean } from 'lightning/utilsPrivate';
export const TOOLTIP_ALLOWANCE = 20;
const CHAR_WIDTH = 10;
const ROWNUMBER_PADDING = 12;
const ROW_NUMBER_COLUMN_TYPE = 'rowNumber';
const i18n = {
  rowLevelErrorAssistiveText: labelRowLevelErrorAssistiveText,
  rowNumber: labelRowNumber
};

/**
 * Returns the initial default column definition
 * for the row number column
 */
export function getRowNumberColumnDef() {
  return {
    type: ROW_NUMBER_COLUMN_TYPE,
    ariaLabel: i18n.rowNumber,
    sortable: false,
    initialWidth: 52,
    minWidth: 52,
    maxWidth: 1000,
    tabIndex: -1,
    internal: true,
    resizable: false
  };
}

/**
 * Retrieves showRowNumberColumn from the state
 * Can be used to determine if the datatable should
 * show the row number column or not
 */
export function hasRowNumberColumn(state) {
  return state.showRowNumberColumn;
}

/**
 * Normalizes the passed in `value` to a boolean and
 * sets it to showRowNumberColumn in the state
 */
export function setShowRowNumberColumn(state, value) {
  state.showRowNumberColumn = normalizeBoolean(value);
}

/**
 * Retrieves rowNumberOffset from the state
 */
export function getRowNumberOffset(state) {
  return state.rowNumberOffset;
}

/**
 * Normalizes the passed in value to a non-negative number
 * and sets it to the rowNumberOffset in the state.
 * If the value is invalid, it falls back to 0.
 */
export function setRowNumberOffset(state, value) {
  state.rowNumberOffset = normalizeNumberAttribute('rowNumberOffset', value, 'non-negative', 0 // default rowNumberOffset value
  );
}

export function isRowNumberColumn(column) {
  return column.type === ROW_NUMBER_COLUMN_TYPE;
}

/**
 * Calculates the width of the row number column
 * This takes into account the number of digits in the row number
 * (ex. 3 for 100 rows), padding in the cell and
 * space allowance for the error tooltip which is rendered in this cell
 *
 * @param {Object} state - datatable's state object
 * @returns
 */
export function getAdjustedRowNumberColumnWidth(state) {
  const numOfRows = state.rows.length;
  const offset = state.rowNumberOffset;
  const numberOfChars = String(numOfRows + offset).length;
  return Math.max(CHAR_WIDTH * numberOfChars + ROWNUMBER_PADDING /* padding */ + TOOLTIP_ALLOWANCE /* primitive-tootlip */, getRowNumberColumnDef().initialWidth);
}

/**
 * Retrieves the column index of the row number column
 * Returns -1 if the row number column is not present
 *
 * @param {Object} state - datatable's state object
 * @returns {Number} index of row number column. Returns -1 if not present
 */
export function getRowNumberColumnIndex(state) {
  if (hasRowNumberColumn(state) && state.columns.length > 0) {
    const columns = state.columns;
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      if (column.type === ROW_NUMBER_COLUMN_TYPE) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Constructs and returns the column definition for the row number column
 * Column definition contains the row number column's row type and
 * the error object containing the title, error messages and alt text
 *
 * @param {Object} rowErrors - object containing metadata of errors in the row
 * @param {String} rowTitle - value of the cell which has the scope of the row/rowheader
 * @returns
 */
export function getRowNumberErrorColumnDef(rowErrors, rowTitle) {
  const {
    title,
    messages
  } = rowErrors;
  const numberOfErrors = rowErrors.cells ? Object.keys(rowErrors.cells).length : rowErrors.fieldNames ? rowErrors.fieldNames.length : 0;
  const alternativeText = formatLabel(i18n.rowLevelErrorAssistiveText, rowTitle || '', numberOfErrors);
  return {
    type: ROW_NUMBER_COLUMN_TYPE,
    typeAttributes: {
      error: {
        title,
        messages,
        alternativeText
      }
    }
  };
}