/**
 * Creates and returns a metadata object the contains information about the
 * number of fixed, flexible, and resized columns in the table
 *
 * @param {Object} columnWidthMetaData The initial column widths metadata
 * @param {Object} columnDefs The column definition object
 * @returns {Object} The computed metadata
 */
export function getTotalWidthsMetadata(columnWidthMetaData, columnDefs) {
  const initial = {
    totalFixedWidth: 0,
    totalFixedColumns: 0,
    totalResizedWidth: 0,
    totalResizedColumns: 0,
    totalFlexibleColumns: 0,
    minColumnWidth: columnWidthMetaData.minColumnWidth,
    maxColumnWidth: columnWidthMetaData.maxColumnWidth,
    wrapTextMaxLines: columnWidthMetaData.wrapTextMaxLines
  };
  return columnDefs.reduce((prev, col) => {
    if (col.fixedWidth) {
      prev.totalFixedWidth += col.fixedWidth;
      prev.totalFixedColumns += 1;
    } else if (col.isResized) {
      prev.totalResizedWidth += col.columnWidth;
      prev.totalResizedColumns += 1;
    } else if (col.initialWidth) {
      prev.totalResizedWidth += col.initialWidth;
      prev.totalResizedColumns += 1;
    } else {
      prev.totalFlexibleColumns += 1;
    }
    return prev;
  }, initial);
}

/**
 * Gets the width of a DOM element.
 *
 * @param {Node} element Target DOM element
 * @returns {Number} The width of the DOM element
 */
export function getDomWidth(element) {
  return element.offsetWidth;
}

/**
 * Gets the width of a column. If the column has a fixed width,
 * it will always return that value. If the column does not have a fixed
 * width, it will return the resized value (if applicable), otherwise
 * the initial width.
 *
 * @param {Object} column The column object
 * @returns {Number} The fixed width, resized width, or initial width of the column (in that priority order)
 */
export function getColumnWidthFromDef(column) {
  let resizedWidth;
  if (column.isResized) {
    resizedWidth = column.columnWidth;
  }
  return column.fixedWidth || resizedWidth || column.initialWidth;
}

/**
 * Creates a width CSS style string from a numeric value
 *
 * @param {Number} pixels Number of pixels
 * @returns {String} The CSS width definition
 */
export function buildCSSWidthStyle(pixels) {
  return pixels > 0 ? `width:${pixels}px` : '';
}