import { registerDecorators as _registerDecorators } from "lwc";
import { getTotalWidthsMetadata, getColumnWidthFromDef } from './widthManagerShared';
import { clamp } from './utils';
const MIN_MAX_THRESHOLD = 0.5;
const TRUNCATION_ALLOWANCE = 20;

/**
 * Determines if a column exists at a specified index
 *
 * @param {Array} columns An array of columns
 * @param {Integer} colIndex The column index to locate
 * @returns {Boolean} Whether the column exists at the specified index
 */
function hasColumn(columns, colIndex) {
  return columns.some(current => current === colIndex);
}

/**
 * Calculates the total width of all columns
 *
 * @param {Array} columnWidths An array of column widths
 * @returns {Number} The total width of all columns
 */
function getTotalColumnWidth(columnWidths) {
  return columnWidths.reduce((acc, value) => acc + value, 0);
}

/**
 * Determines whether or not a specified width can be removed from a column
 *
 * @param {Number} currentWidth The current width of the column in pixels
 * @param {Number} widthToRemove The proposed amount of width to remove in pixels
 * @param {Number} minColumnWidth The minimum width the column can be in pixels
 * @returns {Boolean} Whether or not the specified width can be removed
 */
function canRemoveWidth(currentWidth, widthToRemove, minColumnWidth) {
  return currentWidth - widthToRemove >= minColumnWidth;
}

/**
 * Determines whether or not a specified width can be added to a column
 *
 * @param {Number} currentWidth The current width of the column in pixels
 * @param {Number} widthToAdd The proposed amount of width to add in pixels
 * @param {Number} maxColumnWidth The maximum width the column can be in pixels
 * @returns {Boolean} Whether or not the specified width can be added
 */
function canAddWidth(currentWidth, widthToAdd, maxColumnWidth) {
  return currentWidth + widthToAdd <= maxColumnWidth;
}

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
 * Strategy for columns that automatically determine their widths.
 */
export class AutoWidthStrategy {
  /************************** LIFECYCLE HOOKS **************************/

  constructor(minColumnWidth, maxColumnWidth, wrapTextMaxLines = 3) {
    // Private variables
    // Instance array to hold column width ratios either calculated from visual distribution of column labels
    // or from distribution of data amongst the columns. These ratios are reused except when datatable reacts
    // to changes in data or columns and other variablesat which point they are recalculated.
    this._columnWidthRatios = [];
    // Object used to store `minColumnWidth`, `maxColumnWidth`, along with other metadata like `totalFixedColumns`
    // Refer: widthManagerShared.js getTotalWidthsMetadata
    this._columnWidthMetaData = {};
    // Object which holds columns with min width (+ threshold) and columns with max width (-threshold)
    // It is used in redistribution of extra space that is left or taken up while calculating auto widths
    this._columnWidthsDistribution = {};
    this._columnWidthMetaData = {
      minColumnWidth,
      maxColumnWidth,
      wrapTextMaxLines
    };
    this.columnWidthsDistribution.colsWithMinWidth = [];
    this.columnWidthsDistribution.colsWithMaxWidth = [];
  }

  /************************** PRIVATE SETTERS **************************/

  /**
   * Sets the minimum column width
   *
   * @param {Number} value The minimum column width in pixels
   */
  set minColumnWidth(value) {
    this._columnWidthMetaData.minColumnWidth = value;
  }

  /**
   * Sets the maximum column width
   *
   * @param {Number} value The maximum column width in pixels
   */
  set maxColumnWidth(value) {
    this._columnWidthMetaData.maxColumnWidth = value;
  }

  /**
   * Sets the maximum number of lines text can wrap on to
   *
   * @param {Number} value The maximum number of lines
   */
  set wrapTextMaxLines(value) {
    this._columnWidthMetaData.wrapTextMaxLines = value;
  }

  /************************** PRIVATE GETTERS **************************/

  /**
   * Gets the column width ratios
   * See `_columnWidthRatios` in Private Variables for more information.
   *
   * @returns {Array} An array of column width ratios
   */
  get columnWidthRatios() {
    return this._columnWidthRatios;
  }

  /**
   * Gets the column width distribution.
   * See `_columnWidthsDistribution` in Private Variables for more information.
   *
   * @returns {Object} An object of column width distributions
   */
  get columnWidthsDistribution() {
    return this._columnWidthsDistribution;
  }

  /************************* HELPER FUNCTIONS **************************/

  /**
   * Get adjusted column widths from existing ratios which are based on data cells room taken
   * or based on column labels space in headers. If `recomputeAutoWidthRatios` is true or ratios
   * are empty, new ratios are calculated. Widths are distributed as per defined widths or as per
   * ratio. Any remaining space or extra space taken is then redistributed in second pass.
   *
   * @param {Object} datatableInterface Interface to datatable with callbacks giving width information
   * @param {Object} columnDefs Column definitions array with defined widths and other attributes
   * @param {Boolean} recomputeAutoWidthRatios Whether ratios should be recalculated
   * @returns {Object} columnWidths: [], expectedTableWidth: (number)
   */
  getAdjustedColumnWidths(datatableInterface, columnDefs, recomputeAutoWidthRatios) {
    const widthsMetadata = getTotalWidthsMetadata(this._columnWidthMetaData, columnDefs);
    const availableWidth = datatableInterface.getAvailableWidthFromDom();
    let expectedTableWidth = getExpectedTableWidth(availableWidth, widthsMetadata, columnDefs);
    this._resetColumnWidthsDistribution();
    if (recomputeAutoWidthRatios || this.columnWidthRatios.length === 0) {
      this._calculateColumnWidthRatios(datatableInterface, columnDefs, widthsMetadata);
    }
    let columnWidths = [];
    // If the lengths don't match, return
    if (recomputeAutoWidthRatios && this.columnWidthRatios.length !== columnDefs.length) {
      return {
        expectedTableWidth,
        columnWidths
      };
    }

    // First pass - Distribute widths as per ratios or defined widths if there are any
    columnWidths = this._distributeWidthFromRatios(expectedTableWidth, columnDefs, widthsMetadata);
    let columnWidthsSum = getTotalColumnWidth(columnWidths);

    // Second pass - There could be excess width remaining due to clamping to `maxWidth`
    // or we might have used more space due to clamping to `minWidth `in certain cases.
    // This could be more prominent in `autoWidthStrategy` than in `fixedWidthStrategy`
    // that columns get extreme widths (i.e `min` or `max`).
    // We need to redistribute this space using below methods.
    if (expectedTableWidth > columnWidthsSum) {
      // We have more space, let's redistribute space
      this._redistributeExtraWidth(expectedTableWidth, columnWidths, columnDefs);
    } else if (expectedTableWidth < columnWidthsSum) {
      // We have to take away used space
      this._redistributeDeficitWidth(expectedTableWidth, columnWidths, columnDefs);
    }
    return {
      columnWidths,
      expectedTableWidth
    };
  }

  /**
   * @private
   * Calculates the ratios for each cell based on available space for a given row.
   *
   * @param {Array} cellWidths An array of the cell widths
   * @param {Number} totalWidth The total available width
   * @returns {Array} An array of cell width ratios
   */
  _getRatios(cellWidths, totalWidth) {
    return cellWidths.map(cellWidth => {
      return 100 * cellWidth / totalWidth;
    });
  }

  /**
   * @private
   * Calculates and sets the column width ratios object.
   *
   * @param {Object} datatableInterface The datatable
   * @param {Array} columnDefs The column definitions
   * @param {Object} widthsMetadata The widths metadata object
   */
  _calculateColumnWidthRatios(datatableInterface, columnDefs, widthsMetadata) {
    // Take into account columns with text wrapping
    const dataCellWidths = datatableInterface.getDataCellWidths().map((width, index) => {
      const columnDefinition = columnDefs[index];
      if (columnDefinition && columnDefinition.wrapText) {
        return width / widthsMetadata.wrapTextMaxLines;
      }
      if (columnDefinition.fixedWidth) {
        return columnDefinition.fixedWidth;
      }
      return width;
    });
    const headerCellWidths = datatableInterface.getHeaderCellWidths();
    const tableScrollWidth = datatableInterface.getTableElementWidth();
    this._setColumnWidthRatios(tableScrollWidth, dataCellWidths, headerCellWidths, widthsMetadata);
  }

  /**
   * @private
   * Calculates and creates the column width ratios array.
   *
   * @param {Number} tableScrollWidth The width of the table that is hidden behind a hotizontal scroll
   * @param {Array} dataCellWidths An array of the widths of the data cells
   * @param {Array} headerCellWidths An array of the widths of the header cells
   * @param {Object} widthsMetadata The raw widths metadata object
   */
  _setColumnWidthRatios(tableScrollWidth, dataCellWidths, headerCellWidths, widthsMetadata) {
    // Reset ratios
    this._columnWidthRatios = [];
    if (tableScrollWidth > 0) {
      const {
        totalFixedWidth,
        totalResizedWidth
      } = widthsMetadata;
      if (dataCellWidths.length === 0) {
        if (headerCellWidths.length > 0) {
          const totalHeaderWidth = headerCellWidths.reduce((total, width) => {
            total += width;
            return total;
          }, 0);
          const totalFlexibleWidth = totalHeaderWidth - totalFixedWidth - totalResizedWidth;
          // Calculate ratio from header cells
          this._columnWidthRatios = this._getRatios(headerCellWidths, totalFlexibleWidth);
        }
      } else {
        const totalCellWidth = dataCellWidths.reduce((total, width) => {
          total += width;
          return total;
        }, 0);
        const totalFlexibleWidth = Math.min(tableScrollWidth, totalCellWidth) - totalFixedWidth - totalResizedWidth;

        // Calculate ratio from data cells
        this._columnWidthRatios = this._getRatios(dataCellWidths, totalFlexibleWidth);
      }
    }
  }

  /**
   * @private
   * Resets the column width distribution.
   */
  _resetColumnWidthsDistribution() {
    this.columnWidthsDistribution.colsWithMinWidth = [];
    this.columnWidthsDistribution.colsWithMaxWidth = [];
  }

  /**
   * @private
   * Allocates width to a column as per defined width or as per ratio.
   *
   * @param {Number} availableWidth Available width for the table
   * @param {Object} columnDefs Column definitions in state
   * @param {Object} widthsMetadata Metadata regarding widths includes `max`, `min`, `flexiblewidth`, `fixedwidth`
   */
  _distributeWidthFromRatios(availableWidth, columnDefs, widthsMetadata) {
    const columnWidths = [];
    columnDefs.forEach((column, colIndex) => {
      const width = getColumnWidthFromDef(column) || this._getColumnWidthFromRatio(availableWidth, widthsMetadata, colIndex);
      columnWidths[colIndex] = width;
    });
    return columnWidths;
  }

  /**
   * @private
   * Calculates column width of a given column from the ratio.
   * Clamps to `minColWidth` and `maxColWidth`.
   * Also sets housekeeping data for `colsWithMaxWidth` threshold and `colsWithMinWidth` threshold.
   *
   * @param {Number} availableWidth Available width for the table
   * @param {Object} widthsMetadata Metadata regarding widths includes max, min, flexiblewidth, fixedwidth
   * @param {Number} colIndex Column number
   */
  _getColumnWidthFromRatio(availableWidth, widthsMetadata, colIndex) {
    const ratios = this.columnWidthRatios;
    const {
      colsWithMinWidth,
      colsWithMaxWidth
    } = this.columnWidthsDistribution;
    const {
      totalFixedWidth,
      totalResizedWidth,
      minColumnWidth,
      maxColumnWidth
    } = widthsMetadata;
    const totalFlexibleWidth = availableWidth - totalFixedWidth - totalResizedWidth;
    let calculatedWidth = Math.floor(totalFlexibleWidth * ratios[colIndex] / 100);
    calculatedWidth = calculatedWidth + TRUNCATION_ALLOWANCE;
    const minWidthThreshold = minColumnWidth + Math.ceil(MIN_MAX_THRESHOLD * minColumnWidth);
    const maxWidthThreshold = maxColumnWidth - Math.ceil(MIN_MAX_THRESHOLD * maxColumnWidth);
    if (calculatedWidth < minWidthThreshold) {
      colsWithMinWidth.push(colIndex);
    }
    if (calculatedWidth > maxWidthThreshold) {
      colsWithMaxWidth.push(colIndex);
    }
    return clamp(calculatedWidth, minColumnWidth, maxColumnWidth);
  }

  /**
   * @private
   * This method gives extra width that was remaining by first giving width to columns with
   * max width or within threshold of max width then by giving from all columns possible,
   * excluding fixed width columns, columns that can become max width after redistribution.
   *
   * @param {Number} expectedTableWidth Width taken by the table in the DOM
   * @param {Array} columnWidths Column widths array
   * @param {Object} columnDefs Column definitions from state
   */
  _redistributeExtraWidth(expectedTableWidth, columnWidths, columnDefs) {
    const {
      colsWithMinWidth
    } = this.columnWidthsDistribution;
    const widthsMetadata = getTotalWidthsMetadata(this._columnWidthMetaData, columnDefs);
    const {
      maxColumnWidth,
      totalResizedColumns,
      totalFixedColumns
    } = widthsMetadata;
    let columnWidthsSum = getTotalColumnWidth(columnWidths);
    let extraSpace = expectedTableWidth - columnWidthsSum;
    let totalColsToDistribute = 0;
    let extraWidthPerColumn = 0;

    // First distribute space to columns with min width or threshold of min width
    if (colsWithMinWidth.length > 0) {
      totalColsToDistribute = colsWithMinWidth.length;
      extraWidthPerColumn = Math.floor(extraSpace / totalColsToDistribute);
      colsWithMinWidth.forEach(colIndex => {
        const currentWidth = columnWidths[colIndex];
        if (canAddWidth(currentWidth, extraWidthPerColumn, maxColumnWidth)) {
          const newWidth = currentWidth + extraWidthPerColumn;
          columnWidthsSum += extraWidthPerColumn;
          columnWidths[colIndex] = newWidth;
        }
      });
    }
    extraSpace = expectedTableWidth - columnWidthsSum;
    const totalFixedWidthColumns = totalResizedColumns + totalFixedColumns;

    // Now distribute to every column possible excluding columns with defined widths
    // after this distribution its still possible we might have more space remaining
    // since we couldn't add widths to majority of columns.
    if (extraSpace > 0) {
      totalColsToDistribute = columnDefs.length - totalFixedWidthColumns;
      extraWidthPerColumn = Math.floor(extraSpace / totalColsToDistribute);
      columnDefs.forEach((column, colIndex) => {
        const currentWidth = columnWidths[colIndex];
        if (!getColumnWidthFromDef(column) && canAddWidth(currentWidth, extraWidthPerColumn, maxColumnWidth)) {
          const newWidth = currentWidth + extraWidthPerColumn;
          columnWidthsSum += extraWidthPerColumn;
          columnWidths[colIndex] = newWidth;
        }
      });
    }
  }

  /**
   * @private
   * This method removes extra space that was taken by first taking away width from columns with
   * max width or within threshold of max width then by taking away from all columns possible,
   * excluding fixed width columns, column with min width or can become min width after taking away.
   *
   * @param {Number} expectedTableWidth Width taken by the table in the DOM
   * @param {Array} columnWidths Column widths array
   * @param {Object} columnDefs Column definitions from state
   */
  _redistributeDeficitWidth(expectedTableWidth, columnWidths, columnDefs) {
    const {
      colsWithMinWidth,
      colsWithMaxWidth
    } = this.columnWidthsDistribution;
    const widthsMetadata = getTotalWidthsMetadata(this._columnWidthMetaData, columnDefs);
    const {
      minColumnWidth,
      totalResizedColumns,
      totalFixedColumns
    } = widthsMetadata;
    let columnWidthsSum = getTotalColumnWidth(columnWidths);
    let extraSpace = expectedTableWidth - columnWidthsSum;
    let totalColsToDistribute = 0;
    let extraWidthPerColumn = 0;

    // First take away width from columns with max width or threshold of max width
    if (colsWithMaxWidth.length > 0) {
      totalColsToDistribute = colsWithMaxWidth.length;
      extraWidthPerColumn = Math.floor(Math.abs(extraSpace) / totalColsToDistribute);
      colsWithMaxWidth.forEach(colIndex => {
        const currentWidth = columnWidths[colIndex];
        if (canRemoveWidth(currentWidth, extraWidthPerColumn, minColumnWidth)) {
          const newWidth = currentWidth - extraWidthPerColumn;
          columnWidthsSum -= extraWidthPerColumn;
          columnWidths[colIndex] = newWidth;
        }
      });
    }
    extraSpace = expectedTableWidth - columnWidthsSum;
    const totalFixedWidthColumns = totalResizedColumns + totalFixedColumns;

    // Now from every column possible excluding columns with defined widths
    // and excluding columns within minWidthThreshold
    // after this distribution its still possible we might have used more space
    // since we couldnt take away widths from majority of columns
    if (extraSpace < 0) {
      totalColsToDistribute = columnDefs.length - (totalFixedWidthColumns + colsWithMinWidth.length);
      extraWidthPerColumn = Math.floor(Math.abs(extraSpace) / totalColsToDistribute);
      columnDefs.forEach((column, colIndex) => {
        const currentWidth = columnWidths[colIndex];
        if (!getColumnWidthFromDef(column) && !hasColumn(colsWithMinWidth, colIndex) && canRemoveWidth(currentWidth, extraWidthPerColumn, minColumnWidth)) {
          const newWidth = currentWidth - extraWidthPerColumn;
          columnWidthsSum -= extraWidthPerColumn;
          columnWidths[colIndex] = newWidth;
        }
      });
    }
  }
}
_registerDecorators(AutoWidthStrategy, {
  fields: ["_columnWidthRatios", "_columnWidthMetaData", "_columnWidthsDistribution"]
});