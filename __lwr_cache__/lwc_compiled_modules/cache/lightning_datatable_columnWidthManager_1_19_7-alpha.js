import { registerDecorators as _registerDecorators } from "lwc";
import { getColumnsWidths, getResizerDefaultState, hasDefinedColumnsWidths, isTableRenderedVisible } from './columnResizer';
import { AutoWidthStrategy } from './autoWidthStrategy';
import { FixedWidthStrategy } from './fixedWidthStrategy';
import { getRowNumberColumnIndex, getAdjustedRowNumberColumnWidth } from './rowNumber';
import { getColumnWidthFromDef, getDomWidth, buildCSSWidthStyle } from './widthManagerShared';
import { isRTL } from 'lightning/utilsPrivate';
const AUTO_WIDTH_MODE = 'auto';
const FIXED_WIDTH_MODE = 'fixed';
const tableTypes = {
  default: {
    BASE: '.slds-table',
    CONTAINER: '.slds-scrollable_x',
    DATA_CELL: 'tbody tr:first-child td,tbody tr:first-child th',
    HEADER_CELL: 'thead tr th lightning-primitive-header-factory'
  },
  roleBased: {
    BASE: '.slds-table',
    CONTAINER: '.slds-scrollable_x',
    DATA_CELL: 'div[data-rowgroup-body] div[role="row"]:first-child div',
    HEADER_CELL: 'div.table-header lightning-primitive-header-factory'
  }
};

/**
 * Computes and updates the `widthsData` for a datatable.
 *
 * @param {Object} adjustedWidths The adjusted widths object
 * @param {Array} columnDefs The column definitions array
 * @param {Object} widthsData The source widths data to update
 */
export function computeColumnWidths(adjustedWidths, columnDefs, widthsData) {
  const {
    columnWidths
  } = adjustedWidths;
  if (columnWidths.length !== columnDefs.length) {
    return;
  }
  let columnWidthsSum = 0;
  columnDefs.forEach((columnDef, index) => {
    const newWidth = columnWidths[index];
    widthsData.columnWidths[index] = newWidth;
    columnDef.columnWidth = newWidth;
    columnDef.style = buildCSSWidthStyle(newWidth);

    // In RTL, we need to explicitly position the column headers.
    // We do this by providing the offset (in pixels) from the start of the table.
    if (isRTL()) {
      columnDef.offset = columnWidthsSum;
    }
    columnWidthsSum += newWidth;
  });

  // TODO: W-7679487 - `tableWidth` should match `columnWidthsSum`
  widthsData.tableWidth = columnWidthsSum;
}

/**
 * Column width manager.
 * Invokes one of the two width managing strategies based
 * on `column-widths-mode`: "auto" or "fixed"
 */
export class ColumnWidthManager {
  /************************** LIFECYCLE HOOKS **************************/

  constructor(widthsData) {
    // Private variables
    this._columnWidthMode = FIXED_WIDTH_MODE;
    this._resizeObserverAvailable = typeof ResizeObserver === 'function';
    // Flag to indicate resetting column widths is needed.
    // Could be with or without `autoResizingUpdate`.
    this._queueResizingUpdate = false;
    // Flag to indicate whether auto resizing computation update is needed,
    // in which case table styles need to auto flow.
    this._queueAutoResizingUpdate = false;
    const minColumnWidth = widthsData.minColumnWidth || getResizerDefaultState().minColumnWidth;
    const maxColumnWidth = widthsData.maxColumnWidth || getResizerDefaultState().maxColumnWidth;
    const fixedWidthStrategy = new FixedWidthStrategy(minColumnWidth, maxColumnWidth);
    const autoWidthStrategy = new AutoWidthStrategy(minColumnWidth, maxColumnWidth);
    this._widthStrategies = {};
    this._widthStrategies[FIXED_WIDTH_MODE] = fixedWidthStrategy;
    this._widthStrategies[AUTO_WIDTH_MODE] = autoWidthStrategy;
  }

  /************************** PRIVATE GETTERS **************************/

  /**
   * Gets the configured column width strategy.
   *
   * @returns {Object} The column width strategy
   */
  get columnWidthStrategy() {
    return this._widthStrategies[this.columnWidthMode];
  }

  /**
   * Gets the configured column width mode.
   *
   * @returns {String} The column width mode
   */
  get columnWidthMode() {
    return this._columnWidthMode;
  }

  /************************** PRIVATE SETTERS **************************/

  /**
   * Sets the column width mode.
   *
   * @param {String} value The new column width mode
   */
  set columnWidthMode(value) {
    this._columnWidthMode = value;
  }

  /**
   * Sets the minimum column width (in pixels).
   *
   * @param {Number} value The minimum column width
   */
  set minColumnWidth(value) {
    Object.keys(this._widthStrategies).forEach(strategy => {
      this._widthStrategies[strategy].minColumnWidth = value;
    });
  }

  /**
   * Sets the maximum column width (in pixels).
   *
   * @param {Number} value The maximum column width
   */
  set maxColumnWidth(value) {
    Object.keys(this._widthStrategies).forEach(strategy => {
      this._widthStrategies[strategy].maxColumnWidth = value;
    });
  }

  /**
   * Sets the maximum number of text wrap lines
   *
   * @param {Number} value The maximum number of lines text can be wrapped on
   */
  set wrapTextMaxLines(value) {
    this._widthStrategies[AUTO_WIDTH_MODE].wrapTextMaxLines = value;
  }

  /************************* HELPER FUNCTIONS **************************/

  /**
   * Sets the datatable's configured render mode.
   *
   * @param {String} mode Either "table" or "role-based"
   */
  setRenderMode(mode) {
    this._renderMode = mode;
  }

  /**
   * Returns whether a resizing update is queued.
   *
   * @returns {Boolean} Whether there is a resizing update queued
   */
  isResizingUpdateQueued() {
    return this._queueResizingUpdate;
  }

  /**
   * Returns whether an auto-resizing update is queued.
   *
   * @returns {Boolean} Whether there is an auto-resizing update queued
   */
  isAutoResizingUpdateQueued() {
    return this._queueAutoResizingUpdate;
  }

  /**
   * Determines if we should fire the resize event based on the previous
   * widths data and the column definition. The event is only fired when
   * the number of columns change in fixed width mode. In auto width mode,
   * nothing happens.
   *
   * @param {Object} previousWidthsData The previous widths data to evaluate
   * @param {Array} columnDefs The column definitions array
   * @returns {Boolean} Whether or not the resize event should be fired
   */
  shouldFireResizeEvent(previousWidthsData, columnDefs) {
    if (this._columnWidthMode === FIXED_WIDTH_MODE) {
      return getColumnsWidths(previousWidthsData).length !== columnDefs.length;
    }
    return false;
  }

  /**
   * Adjusts all the column sizes based on the supplied widths data.
   *
   * @param {Node} root The root column node
   * @param {Array} columnDefs The column definitions array
   * @param {Object} widthsData The widths data object
   */
  adjustColumnsSize(root, columnDefs, widthsData) {
    const {
      _queueResizingUpdate,
      _queueAutoResizingUpdate,
      columnWidthStrategy
    } = this;
    let adjustedWidths = [];
    if (_queueResizingUpdate) {
      // If table is hidden when updating and `ResizeObserver` is not available,
      // then updating sizes causes min widths to be set.
      // Hence, the check if ok update from DOM.
      if (this._shouldResizeWithUpdate(root, widthsData)) {
        adjustedWidths = columnWidthStrategy.getAdjustedColumnWidths(this._getDatatableInterface(root), columnDefs, _queueAutoResizingUpdate);
      } else {
        // Otherwise update from previous widths
        adjustedWidths = {
          columnWidths: widthsData.columnWidths,
          expectedTableWidth: widthsData.tableWidth
        };
      }
      computeColumnWidths(adjustedWidths, columnDefs, widthsData);
    }
    this._resetAutoResizingUpdate();
    this._queueResizingUpdate = false;
  }

  /**
   * Adjusts all the column widths after a resize happens.
   *
   * @param {Node} root The root column node
   * @param {Array} columnDefs The column definitions array
   * @param {Object} widthsData The widths data object
   */
  adjustColumnsSizeAfterResize(root, columnDefs, widthsData) {
    const adjustedWidths = this.columnWidthStrategy.getAdjustedColumnWidths(this._getDatatableInterface(root), columnDefs);
    computeColumnWidths(adjustedWidths, columnDefs, widthsData);
  }

  /**
   * React to a change in data.
   *
   * @param {Object} previousData The previous data
   * @param {Object} newData The new data
   * @param {Array} columnDefs The column definitions array
   */
  handleDataChange(previousData, newData, columnDefs) {
    if (columnDefs.length > 0) {
      // Resize columns with auto-resizing update only if...
      // The mode is auto and new data length is equal to previous data
      // length (change in data) or previously there was no data at all.
      if (this.columnWidthMode === AUTO_WIDTH_MODE) {
        if (this._hasDataChanged(previousData, newData)) {
          this._queueResizingUpdate = true;
          this._setAutoResizingUpdate(columnDefs);
        }
      }
    }
  }

  /**
   * React to change in column definitions
   *
   * @param {Array} columnDefs The column definitions array
   */
  handleColumnsChange(columnDefs) {
    if (columnDefs.length > 0) {
      this._queueResizingUpdate = true;
      this._setAutoResizingUpdate(columnDefs);
    }
  }

  /**
   * React to change in column widths mode
   *
   * @param {Array} columnDefs The column definitions array
   */
  handleWidthModeChange(columnDefs) {
    if (columnDefs.length > 0) {
      this._queueResizingUpdate = true;
      this._setAutoResizingUpdate(columnDefs);
    }
  }

  /**
   * React to change in row number offset
   *
   * @param {Object} state The datatable state
   * @param {Object} widthsData The source widths data to updated
   */
  handleRowNumberOffsetChange(state, widthsData) {
    const colIndex = getRowNumberColumnIndex(state);
    if (colIndex > -1) {
      const rowNumberCol = state.columns[colIndex];
      const newWidth = getAdjustedRowNumberColumnWidth(state);
      if (rowNumberCol.initialWidth !== newWidth) {
        rowNumberCol.initialWidth = Math.max(newWidth, rowNumberCol.minWidth);
        if (hasDefinedColumnsWidths(widthsData)) {
          // When columns are resized with the resizer, a horizontal scroller appears.
          // Adjusting the columns size will respect widths already set and try to fit this column.
          this._queueResizingUpdate = true;
          this._setAutoResizingUpdate(state.columns);
        }
      }
    }
  }

  /**
   * React to change in hide-checkbox-column
   *
   * @param {Any} previousValue The previous column value
   * @param {Any} newValue The new column value
   * @param {Array} columnDefs The column definitions array
   */
  handleCheckboxColumnChange(previousValue, newValue, columnDefs) {
    if (columnDefs.length > 0 && previousValue !== newValue) {
      this._queueResizingUpdate = true;
    }
  }

  /**
   * React to change in show-row-number-column
   *
   * @param {Any} previousValue The previous column value
   * @param {Any} newValue The new column value
   * @param {Array} columnDefs The column definitions array
   */
  handleRowNumberColumnChange(previousValue, newValue, columnDefs) {
    if (columnDefs.length > 0 && previousValue !== newValue) {
      this._queueResizingUpdate = true;
      this._setAutoResizingUpdate(columnDefs);
    }
  }

  /**
   * @private
   * Queues up an auto resizing update. If a column width isn't defined,
   * reset the width so it can be recalculated.
   *
   * @param {Array} columnDefs The column definitions array
   */
  _setAutoResizingUpdate(columnDefs) {
    if (this.columnWidthMode === AUTO_WIDTH_MODE) {
      this._queueAutoResizingUpdate = true;
    }
    if (columnDefs.length > 0) {
      columnDefs.forEach(column => {
        if (!getColumnWidthFromDef(column)) {
          column.columnWidth = null;
          column.style = '';
        }
      });
    }
  }

  /**
   * @private
   * Resets the auto resizing update queue.
   */
  _resetAutoResizingUpdate() {
    this._queueAutoResizingUpdate = false;
  }

  /**
   * @private
   * Evalutes if there is a change between two sets of data.
   *
   * @param {Array} previousData An array of previous data
   * @param {Array} newData An array of new data
   * @returns {Boolean} Whether or not the is a difference between the two data sets
   */
  _hasDataChanged(previousData, newData) {
    return newData.length > 0 && (previousData.length === 0 || previousData.length !== newData.length);
  }

  /**
   * @private
   * Determines if a column should resize with an update.
   *
   * @param {Node} root The root column node
   * @param {Object} widthsData The source widths data
   * @returns {Boolean} Whether the column should resize with an update
   */
  _shouldResizeWithUpdate(root, widthsData) {
    if (hasDefinedColumnsWidths(widthsData)) {
      // Can resize from DOM when table is visible.
      // Otherwise, only when `ResizeObserver` is available in browser.
      return this._resizeObserverAvailable || isTableRenderedVisible(root);
    }
    return true;
  }

  /**
   * @private
   * Determines the appropriate selectors to use based on the datatable render mode.
   *
   * @returns {Object} Selectors based on datatable render mode
   */
  _getTableSelectors() {
    if (this._renderMode === 'role-based') {
      return tableTypes.roleBased;
    }
    return tableTypes.default;
  }

  /**
   * @private
   * Retrieves the datatable interface from the DOM
   *
   * @param {Node} root The root datatable node
   * @returns {Object} The datatable interface
   */
  _getDatatableInterface(root) {
    const datatableSelectors = this._getTableSelectors();
    return {
      getAvailableWidthFromDom() {
        const container = root.querySelector(datatableSelectors.CONTAINER);
        return getDomWidth(container);
      },
      getDataCellWidths() {
        const cells = root.querySelectorAll(datatableSelectors.DATA_CELL);
        if (cells.length > 0) {
          return Array.prototype.slice.call(cells).reduce((result, cell) => {
            result.push(cell.offsetWidth);
            return result;
          }, []);
        }
        return [];
      },
      getHeaderCellWidths() {
        const headerCells = root.querySelectorAll(datatableSelectors.HEADER_CELL);
        if (headerCells.length > 0) {
          return Array.prototype.slice.call(headerCells).reduce((result, primitiveCell) => {
            const headerDomWidth = primitiveCell.getDomWidth();
            if (headerDomWidth) {
              result.push(headerDomWidth);
            }
            return result;
          }, []);
        }
        return [];
      },
      getTableElementWidth() {
        const tableElement = root.querySelector(datatableSelectors.BASE) || root.querySelector('[role="grid"]') || root.querySelector('[role="treegrid"]');
        return getDomWidth(tableElement);
      }
    };
  }
}
_registerDecorators(ColumnWidthManager, {
  fields: ["_columnWidthMode", "_resizeObserverAvailable", "_queueResizingUpdate", "_queueAutoResizingUpdate"]
});