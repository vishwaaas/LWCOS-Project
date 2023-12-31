import { normalizeBoolean, isRTL } from 'lightning/utilsPrivate';
import { isCustomerColumn } from './columns';
import { clamp, normalizeNumberAttribute } from './utils';
import { buildCSSWidthStyle } from './widthManagerShared';

/**
 * Returns the default state/values of the resizer metadata
 * @returns {Object} - resizer default state
 */
export function getResizerDefaultState() {
  return {
    resizeColumnDisabled: false,
    resizeStep: 10,
    columnWidths: [],
    tableWidth: 0,
    minColumnWidth: 50,
    maxColumnWidth: 1000,
    columnWidthsMode: 'fixed'
  };
}

/***************** GETTERS / SETTERS for Resizer Metadata (widthsData) *****************/

/************* resizeColumnDisabled *************/

export function isResizeColumnDisabled(widthsData) {
  return widthsData.resizeColumnDisabled;
}
export function setResizeColumnDisabled(widthsData, value) {
  widthsData.resizeColumnDisabled = normalizeBoolean(value);
}

/************* resizeStep *************/

export function getResizeStep(widthsData) {
  return widthsData.resizeStep;
}
export function setResizeStep(widthsData, value) {
  widthsData.resizeStep = normalizeNumberAttribute('resizeStep', value, 'non-negative', getResizerDefaultState().resizeStep);
}

/************* columnWidths *************/

/**
 * Returns the columnsWidths saved in the state
 * @param {object} widthsData - data regarding column and table widths
 * @returns {Array|*} - list of column widths
 */
export function getColumnsWidths(widthsData) {
  return widthsData.columnWidths;
}
/**
 * Sets columnWidths to empty array
 * @param {object} widthsData - data regarding column and table widths
 */
export function resetColumnWidths(widthsData) {
  widthsData.columnWidths = [];
}
/**
 * Returns true if there are widths stored in the state
 * @param {object} widthsData - data regarding column and table widths
 * @returns {boolean} - true if there are widths store in the state
 */
export function hasDefinedColumnsWidths(widthsData) {
  return widthsData.columnWidths.length > 0;
}

/************* tableWidth *************/

/**
 * Get the full width of table
 * @param {object} widthsData - data regarding column and table widths
 * @returns {number} - table's width
 */
function getTableWidth(widthsData) {
  return widthsData.tableWidth;
}
function setTableWidth(widthsData, tableWidth) {
  widthsData.tableWidth = tableWidth;
}

/************* minColumnWidth *************/

export function getMinColumnWidth(widthsData) {
  return widthsData.minColumnWidth;
}
export function setMinColumnWidth(columns, widthsData, value) {
  widthsData.minColumnWidth = normalizeNumberAttribute('minColumnWidth', value, 'non-negative', getResizerDefaultState().minColumnWidth);
  updateColumnWidthsMetadata(columns, widthsData);
}

/************* maxColumnWidth *************/

export function getMaxColumnWidth(widthsData) {
  return widthsData.maxColumnWidth;
}
export function setMaxColumnWidth(columns, widthsData, value) {
  widthsData.maxColumnWidth = normalizeNumberAttribute('maxColumnWidth', value, 'non-negative', getResizerDefaultState().maxColumnWidth);
  updateColumnWidthsMetadata(columns, widthsData);
}

/***************************** RESIZE LOGIC *****************************/

/**
 * Get the style to match the full width of table
 * @param {object} widthsData - data regarding column and table widths
 * @returns {string} - style string
 */
export function getCSSWidthStyleOfTable(widthsData) {
  return buildCSSWidthStyle(getTableWidth(widthsData));
}

/**
 * - It adjusts the columns widths from the state
 * - It is used when there are columnwidths in state but the table is hidden with offsetwidth 0
 * - In this case we reset the columns to the width in state
 *
 * @param {object} state - table state
 */
export function adjustColumnsSizeFromState(state) {
  const columnsWidths = getColumnsWidths(state);
  let columnsWidthSum = 0;
  getColumns(state).forEach((column, colIndex) => {
    const width = columnsWidths[colIndex];
    if (typeof columnsWidths[colIndex] !== 'undefined') {
      if (isRTL()) {
        column.offset = columnsWidthSum;
      }
      columnsWidthSum += width;
      column.columnWidth = columnsWidths[colIndex];
      column.style = buildCSSWidthStyle(columnsWidths[colIndex]);
    }
  });
  setTableWidth(state, columnsWidthSum);
}

/**
 * Resizes a column width
 * @param {object} columns - all columns on the table
 * @param {object} widthsData - object containing the resizer metadata
 * @param {number} colIndex - the index of the column based on state.columns
 * @param {number} width - the new width is gonna be applied
 */
export function resizeColumn(columns, widthsData, colIndex, width) {
  const columnToResize = columns[colIndex];
  const columnsWidths = getColumnsWidths(widthsData);
  const currentWidth = columnsWidths[colIndex];
  const {
    minWidth,
    maxWidth
  } = columnToResize;
  const newWidth = clamp(width, minWidth, maxWidth);
  if (currentWidth !== newWidth) {
    const newDelta = newWidth - currentWidth;
    setTableWidth(widthsData, getTableWidth(widthsData) + newDelta);
    updateColumnWidth(columns, widthsData, colIndex, newWidth);
    // Workaround for header positioning issues in RTL
    updateColumnOffsets(columns, colIndex + 1, newDelta);
    columnToResize.isResized = true;
  }
}

/**
 * Resize a column width with an additional delta
 * @param {object} columns - all columns of the table
 * @param {object} widthsData - data regarding column and table widths
 * @param {number} colIndex - the index of the column based on state.columns
 * @param {number} widthDelta - the delta that creates the new width
 */
export function resizeColumnWithDelta(columns, widthsData, colIndex, widthDelta) {
  const currentWidth = getColumnsWidths(widthsData)[colIndex];
  resizeColumn(columns, widthsData, colIndex, currentWidth + widthDelta);
}
function updateColumnWidth(columns, widthsData, colIndex, newWidth) {
  const columnsWidths = getColumnsWidths(widthsData);
  columnsWidths[colIndex] = newWidth;
  const column = columns[colIndex];
  column.columnWidth = newWidth;
  column.style = buildCSSWidthStyle(newWidth);
}
export function updateColumnWidthsMetadata(columns, widthsData) {
  columns.forEach(col => {
    if (!col.internal) {
      col.minWidth = getMinColumnWidth(widthsData);
      col.maxWidth = getMaxColumnWidth(widthsData);
    }
    if (col.initialWidth) {
      col.initialWidth = clamp(col.initialWidth, col.minWidth, col.maxWidth);
    }
  });
}

/**
 * Updates the column offsets based on the specified delta, starting from the specified index.
 * This is used to position the column headers properly in RTL.
 *
 * @param {object} columns - All columns of the table
 * @param {number} colIndex - The first index to start applying the change in column width
 * @param {number} newDelta - The change in column width to apply to
 */
function updateColumnOffsets(columns, colIndex, newDelta) {
  if (isRTL()) {
    const offsetColumns = columns.slice(colIndex);
    offsetColumns.forEach(column => {
      column.offset += newDelta;
    });
  }
}

/**
 * Returns the current widths for customer columns
 * @param {object} columns - all columns of the table
 * @param {object} widthsData - data regarding column and table widths
 * @returns {Array} - the widths collection, every element
 * belong to a column with the same index in column prop
 */
export function getCustomerColumnWidths(columns, widthsData) {
  return columns.reduce((prev, column, index) => {
    if (isCustomerColumn(column)) {
      prev.push(widthsData.columnWidths[index]);
    }
    return prev;
  }, []);
}

/**
 * It returns if table is rendered and not hidden
 * @param {node} root - table root element
 * @returns {boolean} - true or false if dt is rendered and not hidden on the page
 */
export function isTableRenderedVisible(root) {
  const CONTAINER_SEL = '.slds-scrollable_y';
  const elem = root.querySelector(CONTAINER_SEL);
  return elem && !!(elem.offsetParent || elem.offsetHeight || elem.offsetWidth);
}
function getColumns(state) {
  return state.columns;
}