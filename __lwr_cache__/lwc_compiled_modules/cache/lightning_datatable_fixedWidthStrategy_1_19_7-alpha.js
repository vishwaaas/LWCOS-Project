import { registerDecorators as _registerDecorators } from "lwc";
import { getTotalWidthsMetadata, getColumnWidthFromDef } from './widthManagerShared';

/**
 * Determines the expected table width
 *
 * @param {Number} availableWidth The available width for the entire table
 * @param {Object} widthsMetadata The widths metadata object
 * @returns {Number} The expected width of the table
 */
function getExpectedTableWidth(availableWidth, widthsMetadata) {
  const minExpectedTableWidth = getMinExpectedTableWidth(widthsMetadata);
  return widthsMetadata.totalFlexibleColumns === 0 ? minExpectedTableWidth : Math.max(minExpectedTableWidth, availableWidth);
}

/**
 * Determines the minimum expected table width
 *
 * @param {Object} widthsMetadata The widths metadata object
 * @returns {Number} The minimum expected table width
 */
function getMinExpectedTableWidth(widthsMetadata) {
  const {
    totalFixedWidth,
    totalResizedWidth,
    totalFlexibleColumns,
    minColumnWidth
  } = widthsMetadata;
  const minTotalFlexibleWidth = totalFlexibleColumns * minColumnWidth;
  return minTotalFlexibleWidth + totalFixedWidth + totalResizedWidth;
}

/**
 * Strategy for columns with defined fixed widths.
 */
export class FixedWidthStrategy {
  /************************** LIFECYCLE HOOKS **************************/

  constructor(minColumnWidth, maxColumnWidth) {
    // Private variables
    this._columnWidthMetaData = {};
    this._columnWidthMetaData = {
      minColumnWidth,
      maxColumnWidth
    };
  }

  /************************** PRIVATE SETTERS **************************/

  /**
   * Sets the minimum column width
   *
   * @param {Number} value The minimum width
   */
  set minColumnWidth(value) {
    this._columnWidthMetaData.minColumnWidth = value;
  }

  /**
   * Sets the maximum column width
   *
   * @param {Number} value The maximum width
   */
  set maxColumnWidth(value) {
    this._columnWidthMetaData.maxColumnWidth = value;
  }

  /**
   * Get adjusted column widths either from defined widths in columnDefs or by dividing total width
   * equally amongst the possible columns
   *
   * @param {Object} datatableInterface Interface to datatable with callbacks giving width information
   * @param {Array} columnDefs Ccolumn definitions array with defined widths and other attributes
   * @returns {Object} columnWidths: [], expectedTableWidth: (number)
   */
  getAdjustedColumnWidths(datatableInterface, columnDefs) {
    const widthsMetadata = getTotalWidthsMetadata(this._columnWidthMetaData, columnDefs);
    const availableWidth = datatableInterface.getAvailableWidthFromDom();
    const expectedTableWidth = getExpectedTableWidth(availableWidth, widthsMetadata);
    const expectedFlexibleColumnWidth = this._getFlexibleColumnWidth(widthsMetadata, expectedTableWidth);
    const columnWidths = [];
    columnDefs.forEach((column, colIndex) => {
      const width = getColumnWidthFromDef(column) || expectedFlexibleColumnWidth;
      columnWidths[colIndex] = width;
    });
    return {
      columnWidths,
      expectedTableWidth
    };
  }

  /**
   * Determines the expected flexible column width
   *
   * @param {Object} widthsMetadata The widths metadata object
   * @param {Number} totalTableWidth The total available width for the table
   * @returns {Number} The column width
   */
  _getFlexibleColumnWidth(widthsMetadata, totalTableWidth) {
    const {
      totalFixedWidth,
      totalResizedWidth,
      totalFlexibleColumns,
      minColumnWidth,
      maxColumnWidth
    } = widthsMetadata;
    const totalFlexibleWidth = totalTableWidth - totalFixedWidth - totalResizedWidth;
    const avgFlexibleColumnWidth = Math.floor(totalFlexibleWidth / totalFlexibleColumns);
    const allowedSpace = Math.max(avgFlexibleColumnWidth, minColumnWidth);
    return Math.min(maxColumnWidth, allowedSpace);
  }
}
_registerDecorators(FixedWidthStrategy, {
  fields: ["_columnWidthMetaData"]
});