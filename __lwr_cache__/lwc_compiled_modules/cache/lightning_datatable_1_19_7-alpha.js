import { registerDecorators as _registerDecorators, registerComponent as _registerComponent, LightningElement, unwrap } from "lwc";
import _tmpl from "./datatable.html";
import tableTemplate from './templates/table/table.html';
import divTemplate from './templates/div/div.html';
import { classSet } from 'lightning/utils';
import { normalizeBoolean, normalizeString, isIE11, isSafari, synchronizeAttrs } from 'lightning/utilsPrivate';
import { LightningDatatableResizeObserver } from './resizeObserver';
import { ColumnWidthManager } from './columnWidthManager';
import { getDefaultState } from './state';
import { getColumns, normalizeColumns, generateHeaderIndexes } from './columns';
import { setData, getData, updateRowsAndCellIndexes, setKeyField, getKeyField, hasValidKeyField, updateCellClassForRoleBasedMode, recomputeCellStyles } from './rows';
import { isResizeColumnDisabled, setResizeColumnDisabled, getResizeStep, setResizeStep, getMinColumnWidth, setMinColumnWidth, getMaxColumnWidth, setMaxColumnWidth, getColumnsWidths, resizeColumnWithDelta, getCustomerColumnWidths, getCSSWidthStyleOfTable, updateColumnWidthsMetadata, getResizerDefaultState } from './columnResizer';
import { syncSelectedRowsKeys, handleRowSelectionChange, updateBulkSelectionState, getMaxRowSelection, setMaxRowSelection, getSelectedRowsKeys, setSelectedRowsKeys, handleSelectAllRows, handleDeselectAllRows, handleSelectRow, handleDeselectRow, getHideSelectAllCheckbox, getCurrentSelectionLength } from './rowSelection';
import { syncActiveCell, handleKeydownOnCell, updateActiveCell, setBlurActiveCell, setFocusActiveCell, isActiveCell, updateTabIndex, getIndexesByKeys, updateTabIndexActiveCell, updateTabIndexActiveRow, unsetRowNavigationMode, updateRowNavigationMode, handleDatatableFocusOut, handleDatatableFocusIn, updateTabIndexRow, getIndexesActiveCell, reactToKeyboardOnRow, setCellToFocusFromPrev, updateCellToFocusFromPrev, resetCellToFocusFromPrev, datatableHasFocus, setCellClickedForFocus, handleKeydownOnTable, addFocusStylesToActiveCell, refocusCellElement, isCellElement, getActiveCellElement, getDataRow, FOCUS_CLASS, updateActiveCellTabIndexAfterSync } from './keyboard';
import { getRowNumberOffset, setRowNumberOffset, hasRowNumberColumn, setShowRowNumberColumn } from './rowNumber';
import { handleLoadMoreCheck, isInfiniteLoadingEnabled, setInfiniteLoading, getLoadMoreOffset, setLoadMoreOffset, isLoading, setLoading, handlePrefetch } from './infiniteLoading';
import { handleRowActionTriggered, handleLoadDynamicActions, handleCellButtonClick } from './rowLevelActions';
import { getSortedBy, setSortedBy, getSortedDirection, setSortedDirection, getDefaultSortDirection, setDefaultSortDirection, updateSorting } from './sort';
import { updateHeaderActions, handleHeaderActionTriggered, handleHeaderActionMenuOpening, handleHeaderActionMenuClosed } from './headerActions';
import { setWrapTextMaxLines } from './wrapText';
import { isInlineEditTriggered, cancelInlineEdit, handleEditCell, handleInlineEditFinish, handleMassCheckboxChange, handleInlineEditPanelScroll, getDirtyValues, setDirtyValues, closeInlineEdit, openInlineEditOnActiveCell } from './inlineEdit';
import { isViewportRenderingEnabled, setViewportRendering, getDTWrapperHeight, setVirtualize, RenderManager } from './renderManager';
import { handleVariableRowHeights, resetRowHeights, resetTableHeight, findFirstVisibleIndex } from './virtualization';
import { EVENTS as FORMATTED_LOOKUP_EVENTS } from 'lightning/formattedLookup';
import { hasTreeDataType } from './tree';
import { setErrors, getTableError, getErrors } from './errors';
import { generateUniqueId } from 'lightning/inputUtils';
import DatatableTypes from './types';
import labelAriaLiveNavigationMode from '@salesforce/label/LightningDatatable.ariaLiveNavigationMode';
import labelAriaLiveActionMode from '@salesforce/label/LightningDatatable.ariaLiveActionMode';
import { styleToString } from './utils';
const i18n = {
  ariaLiveNavigationMode: labelAriaLiveNavigationMode,
  ariaLiveActionMode: labelAriaLiveActionMode
};

/**
 * A table that displays rows and columns of data.
 */
class LightningDatatable extends LightningElement {
  /**
   * Specifies how column widths are calculated. Set to 'fixed' for columns with equal widths.
   * Set to 'auto' for column widths that are based on the width of the column content and the table width. The default is 'fixed'.
   * @type {string}
   * @default fixed
   */
  get columnWidthsMode() {
    return this.widthsData.columnWidthsMode;
  }
  set columnWidthsMode(value) {
    const normalizedValue = normalizeString(value, {
      fallbackValue: 'fixed',
      validValues: ['fixed', 'auto']
    });
    this._columnWidthManager.columnWidthMode = normalizedValue;
    const {
      state,
      widthsData
    } = this;
    if (widthsData.columnWidthsMode !== normalizedValue) {
      this._columnWidthManager.handleWidthModeChange(getColumns(state));
    }
    widthsData.columnWidthsMode = normalizedValue;
  }

  /**
   * Array of the columns object that's used to define the data types.
   * Required properties include 'label', 'fieldName', and 'type'. The default type is 'text'.
   * See the Documentation tab for more information.
   * @type {array}
   */
  get columns() {
    return this._columns;
  }
  set columns(value) {
    this._columns = Array.isArray(value) ? value : [];
    this.updateColumns(this._columns);
    this._columnWidthManager.handleColumnsChange(getColumns(this.state));
  }

  /**
   * The array of data to be displayed.
   * @type {array}
   */
  get data() {
    return getData(this.state);
  }
  set data(value) {
    const data = Array.isArray(value) ? value : [];
    const previousData = getData(this.state);
    const columns = getColumns(this.state);
    this._columnWidthManager.handleDataChange(previousData, data, columns);

    // set data in state
    setData(this.state, value);

    // do necessary updates since rows have changed
    if (hasValidKeyField(this.state)) {
      this.updateRowsState();
      resetTableHeight(this.state);
    }
    if (this._customerSelectedRows) {
      this.setSelectedRows(this._customerSelectedRows);
    }
  }

  /**
   * Specifies the default sorting direction on an unsorted column.
   * Valid options include 'asc' and 'desc'.
   * The default is 'asc' for sorting in ascending order.
   * @type {string}
   * @default asc
   */
  get defaultSortDirection() {
    return getDefaultSortDirection(this.state);
  }
  set defaultSortDirection(value) {
    setDefaultSortDirection(this.state, value);
    updateSorting(this.state);
  }

  /**
   * The current values per row that are provided during inline edit.
   * @type {object}
   */
  get draftValues() {
    return getDirtyValues(this.state);
  }
  set draftValues(value) {
    this._draftValues = value;
    setDirtyValues(this.state, value);
    if (hasValidKeyField(this.state)) {
      this.updateRowsAndCellIndexes(this.state);
    }
    updateActiveCellTabIndexAfterSync(this.state);
  }

  /**
   * If present, you can load a subset of data and then display more
   * when users scroll to the end of the table.
   * Use with the onloadmore event handler to retrieve more data.
   * @type {boolean}
   * @default false
   */
  get enableInfiniteLoading() {
    return isInfiniteLoadingEnabled(this.state);
  }
  set enableInfiniteLoading(value) {
    setInfiniteLoading(this.state, value);
    handlePrefetch.call(this, this.template, this.state);
  }

  /**
   * Specifies an object containing information about cell level, row level, and table level errors.
   * When it's set, error messages are displayed on the table accordingly.
   * @type {object}
   */
  get errors() {
    return getErrors(this.state);
  }
  set errors(value) {
    setErrors(this.state, value);
    this.updateRowsState();
  }

  /**
   * If present, the checkbox column for row selection is hidden.
   * @type {boolean}
   * @default false
   */
  get hideCheckboxColumn() {
    return this.state.hideCheckboxColumn;
  }
  set hideCheckboxColumn(value) {
    const {
      state
    } = this;
    const normalizedValue = normalizeBoolean(value);
    this._columnWidthManager.handleCheckboxColumnChange(state.hideCheckboxColumn, normalizedValue, getColumns(state));
    this.state.hideCheckboxColumn = normalizedValue;
    // update the columns metadata again to update the status.
    this.updateColumns(this._columns);
  }

  /**
   * If present, the table header is hidden.
   * @type {boolean}
   * @default false
   */
  get hideTableHeader() {
    return this.state.hideTableHeader;
  }
  set hideTableHeader(value) {
    this.state.hideTableHeader = normalizeBoolean(value);
  }

  /**
   * If present, the table header is wrapped.
   * @type {boolean}
   * @default false
   */
  get wrapTableHeader() {
    return this.state.wrapTableHeader;
  }
  set wrapTableHeader(value) {
    this.state.wrapTableHeader = normalizeBoolean(value);
  }

  /**
   * If present, a spinner is shown to indicate that more data is loading.
   * @type {boolean}
   * @default false
   */
  get isLoading() {
    return isLoading(this.state);
  }
  set isLoading(value) {
    setLoading(this.state, value);
  }

  /**
   * Required for better performance. Associates each row with a unique ID.
   * key-field is case sensitive and must match the value you provide in the data array.
   * @type {string}
   * @required
   */
  get keyField() {
    return getKeyField(this.state);
  }
  set keyField(value) {
    setKeyField(this.state, value);
    setDirtyValues(this.state, this._draftValues);
    this.updateRowsState();
  }

  /**
   * Determines when to trigger infinite loading based on
   * how many pixels the table's scroll position is from the bottom of the table.
   * The default is 20.
   * @type {number}
   * @default 20
   */
  get loadMoreOffset() {
    return getLoadMoreOffset(this.state);
  }
  set loadMoreOffset(value) {
    setLoadMoreOffset(this.state, value);
  }

  /**
   * The maximum width for all columns.
   * The default is 1000px.
   * @type {number}
   * @default 1000px
   */
  get maxColumnWidth() {
    return getMaxColumnWidth(this.widthsData);
  }
  set maxColumnWidth(value) {
    const {
      state,
      widthsData
    } = this;
    setMaxColumnWidth(getColumns(state), widthsData, value);
    this._columnWidthManager.maxColumnWidth = this.maxColumnWidth;
  }

  /**
   * The maximum number of rows that can be selected. Value should be a positive integer
   * Checkboxes are used for selection by default,
   * and radio buttons are used when maxRowSelection is 1.
   * @type {number}
   */
  get maxRowSelection() {
    return getMaxRowSelection(this.state);
  }
  set maxRowSelection(value) {
    const previousSelectionLength = getCurrentSelectionLength(this.state);
    setMaxRowSelection(this.state, value);
    if (previousSelectionLength > 0) {
      this.fireSelectedRowsChange(this.getSelectedRows());
    }
  }

  /**
   * The minimum width for all columns.
   * The default is 50px.
   * @type {number}
   * @default 50px
   */
  get minColumnWidth() {
    return getMinColumnWidth(this.widthsData);
  }
  set minColumnWidth(value) {
    const {
      state,
      widthsData
    } = this;
    setMinColumnWidth(getColumns(state), widthsData, value);
    this._columnWidthManager.minColumnWidth = this.minColumnWidth;
  }

  /**
   * @typedef RenderManagerConfig
   * @type {object}
   * @property {boolean} viewportRendering - Specifies whether to defer rendering of rows outside the viewport until the user begins scrolling. To use this feature, create a fixed-height container element for lightning-datatable.
   * @property {number} rowHeight - Specifies the height of a row, in px
   * @property {string} virtualize - specifies whether to enable virtualization. This requires the "role-based" render mode and a fixed-height container for lightning-datatable
   */

  /**
   * Enables and configures advanced rendering modes.
   * It supports properties 'bufferSize', 'fixedHeight', and 'rowHeight'.
   *
   * @type {RenderManagerConfig} value - config object for datatable rendering
   */
  get renderConfig() {
    return this._renderConfig;
  }
  set renderConfig(value) {
    if (typeof value === 'object' && !isIE11) {
      setViewportRendering(this.state, value.viewportRendering);
      this._renderManager.configure(this.state, this.getWrapperHeight, value);
      // if renderConfig already exists, update rendering
      if (this._renderConfig) {
        this._renderManager.updateViewportRendering(this.state, this.gridContainer, true);
      }
      this._renderConfig = value;
    }
  }

  /**
   * Allows developer to opt-in to a role-based table.
   * Allowed options - "role-based" or "default"
   * `role-based` -> Renders <div>
   * `default`    -> Renders <table>
   */
  /**
   * Reserved for internal use.
   */
  get renderMode() {
    return this._renderMode;
  }
  set renderMode(value) {
    this._renderMode = normalizeString(value, {
      fallbackValue: 'default',
      validValues: ['default', 'role-based']
    });
    this.state.renderModeRoleBased = this._renderMode === 'role-based';
    this._columnWidthManager.setRenderMode(this.renderMode);
    if (this._renderConfig) {
      setVirtualize(this.state, this._renderConfig.virtualize);
    }
    updateCellClassForRoleBasedMode(this.state);
  }

  /**
   * If present, column resizing is disabled.
   * @type {boolean}
   * @default false
   */
  get resizeColumnDisabled() {
    return isResizeColumnDisabled(this.widthsData);
  }
  set resizeColumnDisabled(value) {
    setResizeColumnDisabled(this.widthsData, value);
  }

  /**
   * The width to resize the column when a user presses left or right arrow.
   * The default is 10px.
   * @type {number}
   * @default 10px
   */
  get resizeStep() {
    return getResizeStep(this.widthsData);
  }
  set resizeStep(value) {
    setResizeStep(this.widthsData, value);
  }

  /**
   * Determines where to start counting the row number.
   * The default is 0.
   * @type {number}
   * @default 0
   */
  get rowNumberOffset() {
    return getRowNumberOffset(this.state);
  }
  set rowNumberOffset(value) {
    const {
      state,
      widthsData
    } = this;
    setRowNumberOffset(state, value);
    this._columnWidthManager.handleRowNumberOffsetChange(state, widthsData);
  }

  /**
   * Enables programmatic row selection with a list of key-field values.
   * @type {list}
   */
  get selectedRows() {
    return getSelectedRowsKeys(this.state);
  }
  set selectedRows(value) {
    this._customerSelectedRows = value;
    this.setSelectedRows(value);
  }

  /**
   * If present, the row numbers are shown in the first column.
   * @type {boolean}
   * @default false
   */
  get showRowNumberColumn() {
    return hasRowNumberColumn(this.state);
  }
  set showRowNumberColumn(value) {
    const {
      state,
      _columns
    } = this;
    this._columnWidthManager.handleRowNumberColumnChange(getRowNumberOffset(state), value, getColumns(state));
    setShowRowNumberColumn(state, value);
    this.updateColumns(_columns);
  }

  /**
   * The column key or fieldName that controls the sorting order.
   * Sort the data using the onsort event handler.
   * @type {string}
   */
  get sortedBy() {
    return getSortedBy(this.state);
  }
  set sortedBy(value) {
    setSortedBy(this.state, value);
    updateSorting(this.state);
  }

  /**
   * Specifies the sorting direction.
   * Sort the data using the onsort event handler.
   * Valid options include 'asc' and 'desc'.
   * @type {string}
   */
  get sortedDirection() {
    return getSortedDirection(this.state);
  }
  set sortedDirection(value) {
    setSortedDirection(this.state, value);
    updateSorting(this.state);
  }

  /**
   * If present, the footer that displays the Save and Cancel buttons is hidden during inline editing.
   * @type {boolean}
   * @default false
   */
  get suppressBottomBar() {
    return this._suppressBottomBar;
  }
  set suppressBottomBar(value) {
    this._suppressBottomBar = normalizeBoolean(value);
  }

  /**
   * This value specifies the number of lines after which the
   * content will be cut off and hidden. It must be at least 1 or more.
   * The text in the last line is truncated and shown with an ellipsis.
   * @type {integer}
   */
  get wrapTextMaxLines() {
    return this.state.wrapTextMaxLines;
  }
  set wrapTextMaxLines(value) {
    const {
      state
    } = this;
    setWrapTextMaxLines(state, value);
    this._columnWidthManager.wrapTextMaxLines = state.wrapTextMaxLines;
    this.updateRowsAndCellIndexes(state);
  }

  /************************** PUBLIC METHODS ***************************/

  /**
   * Returns data in each selected row.
   * @returns {array} An array of data in each selected row.
   */
  getSelectedRows() {
    const data = unwrap(getData(this.state));
    return this.state.rows.reduce((prev, row, index) => {
      if (row.isSelected) {
        prev.push(data[index]);
      }
      return prev;
    }, []);
  }

  /**
   * Opens the inline edit panel for the datatable's currently active cell. If the active cell is not
   * editable, then the panel is instead opened for the first editable cell in the table. Given two
   * distinct cells, C_x and C_y, C_x is considered "first" in the cell ordering if the following condition
   * evaluates to true:
   *
   * (C_x.rowIndex < C_y.rowIndex) || (C_x.rowIndex === C_y.rowIndex && C_x.columnIndex < C_y.columnIndex)
   *
   * If there is no data in the table or there are no editable cells in the table then calling this function
   * results in a no-op.
   */
  openInlineEdit() {
    openInlineEditOnActiveCell(this);
  }

  /************************** PRIVATE GETTERS **************************/

  /**
   * Retrieves the grid container:
   * 1. For a table-based table, it will retrieve the <table role="grid"> element
   * 2. For a role-based table, it will retrieve the <div role="grid"> element
   * 3. If it is a tree grid, it will retrieve the <table role="treegrid"> element
   */
  get gridContainer() {
    return this.template.querySelector('[role="grid"]') || this.template.querySelector('[role="treegrid"]');
  }
  get computedTableContainerClass() {
    return classSet({
      'slds-table_header-fixed_container': !this.hideTableHeader,
      'slds-scrollable_x': !this._isResizing
    }).toString();
  }
  get computedTableClass() {
    const headerType = this.hideTableHeader ? 'hidden' : 'fixed';
    return classSet(`slds-table slds-table_header-${headerType} slds-table_bordered slds-table_edit`).add({
      'slds-table_resizable-cols': this.hasResizebleColumns,
      'slds-tree slds-table_tree': hasTreeDataType(this.state)
    }).toString();
  }
  get computedTableRole() {
    return hasTreeDataType(this.state) ? 'treegrid' : 'grid';
  }
  get computedTableStyle() {
    const tableLayout = this._columnWidthManager.isAutoResizingUpdateQueued() ? 'auto' : 'fixed';
    return styleToString([`table-layout:${tableLayout}`, getCSSWidthStyleOfTable(this.widthsData)]);
  }

  /**
   * Resets row-number counter to offset to show
   * correct value when row number column is present
   * and adds necessary position and height styles when
   * virtualization is enabled
   */
  get computedTbodyStyle() {
    const style = {};
    const {
      firstVisibleIndex,
      bufferSize,
      virtualize,
      tableHeight
    } = this.state;
    if (hasRowNumberColumn(this.state) && getRowNumberOffset(this.state) >= 0) {
      const firstRenderedRow = Math.max(firstVisibleIndex - bufferSize, 0);
      const rowNumber = firstRenderedRow + getRowNumberOffset(this.state);
      style['counter-reset'] = `row-number ${rowNumber}`;
    }
    if (virtualize) {
      style.position = 'relative';
      style.height = `${tableHeight}px`;
    }
    return styleToString(style);
  }

  /**
   * Sets the min height and the table width on the container
   * that wraps [role="grid"].
   * 1. Min Height is required for the case when the header actions
   *    dropdown is opened and there are no rows present. The dropdown
   *    would be cut off. To prevent that, we set a min height on the table.
   * 2. The table width is required for horizontal scroll. If the table
   *    is overflowing horizontally, we need to set the width in order
   *    to be able to view the remaining columns on scroll.
   */
  get computedScrollerStyle() {
    const minHeight = this._actionsMinHeightStyle ? `${this._actionsMinHeightStyle};` : '';
    if (this._columnWidthManager.isAutoResizingUpdateQueued()) {
      return `${minHeight}overflow-x:auto`;
    }
    return `${minHeight}${getCSSWidthStyleOfTable(this.widthsData)}`;
  }
  get scrollerXStyles() {
    const styles = {
      height: '100%'
    };
    if (this.showStatusBar) {
      styles['padding-bottom'] = '3rem';
    }
    if (this._columnWidthManager.isAutoResizingUpdateQueued()) {
      styles['overflow-x'] = 'auto';
    }
    if (this.wrapTableHeader) {
      // increase padding from 2rem to 3rem on the top when header wraps
      styles['padding-top'] = '3rem';
    }
    return styleToString(styles);
  }

  /**
   * Private method to get computedCheckboxColumnHeaderId
   * from checkboxColumnHeaderElement for
   * aria-labelledby in checkbox column
   */
  get computedCheckboxColumnHeaderId() {
    return this._checkboxColumnHeaderId;
  }
  get computedAriaLiveClassForNavMode() {
    const keyboardMode = this.state.keyboardMode;
    return classSet().add({
      'slds-hide': keyboardMode !== 'NAVIGATION',
      'slds-assistive-text': keyboardMode === 'NAVIGATION'
    }).toString();
  }
  get computedAriaLiveClassForActionMode() {
    const keyboardMode = this.state.keyboardMode;
    return classSet().add({
      'slds-hide': keyboardMode !== 'ACTION',
      'slds-assistive-text': keyboardMode === 'ACTION'
    }).toString();
  }

  /**
   * aria-rowcount is the count of TRs in the table
   * It includes the # of rows of data + column header row (since this is also a TR)
   * A table with no rows of data still has an aria-rowcount of 1
   */
  get ariaRowCount() {
    return this.state.rows.length + 1;
  }
  get hasValidKeyField() {
    if (hasValidKeyField(this.state)) {
      return true;
    }
    // eslint-disable-next-line no-console
    console.error(`The "keyField" is a required attribute of lightning:datatable.`);
    return false;
  }
  get numberOfColumns() {
    return getColumns(this.state).length;
  }
  get hasResizebleColumns() {
    return !isResizeColumnDisabled(this.widthsData);
  }
  get privateTypes() {
    return this._privateTypes;
  }
  get viewportRendering() {
    return isViewportRenderingEnabled(this.state);
  }
  get renderedRows() {
    const {
      virtualize,
      rows,
      renderedRowCount
    } = this.state;
    if (virtualize) {
      const {
        firstIndex,
        lastIndex
      } = this._renderManager.getRenderedRange(this.state);
      this._lastRenderedRow = lastIndex + 1; // UTAM rows are 1-indexed
      // we shouldn't lose focus from re-renders caused by a change in renderedRows
      this._shouldResetFocus = true;
      return rows.slice(firstIndex, lastIndex);
    }
    if (this.viewportRendering && !isIE11) {
      this._lastRenderedRow = renderedRowCount;
      return rows.slice(0, renderedRowCount);
    }
    this._lastRenderedRow = rows.length;
    return rows;
  }
  get showSelectAllCheckbox() {
    return !getHideSelectAllCheckbox(this.state);
  }
  get showStatusBar() {
    return isInlineEditTriggered(this.state) && !this.suppressBottomBar;
  }
  get tableError() {
    return getTableError(this.state);
  }
  get i18n() {
    return i18n;
  }

  /************************** LIFECYCLE HOOKS **************************/

  /**
   * Initialize the following:
   * 1. DatatableTypes
   * 2. ColumnWidthManager
   * 3. RenderManager
   */
  constructor() {
    super();
    /**
     * Usage of State Object vs Private Variable:
     * This is by no means a definitive set of rules and we should add/modify these
     * guidelines with time as we work on the datatable and find specific reasons.
     *
     * In general, the main reason for using the `state` object is to take advantage
     * of LWC's reactivity. In the `state` object we store properties that are required
     * to trigger an update/re-render of the datatable.
     *
     * There are no observable perf implications of using the state object vs
     * private variables. See W-10006095 for details.
     *
     * Guidelines:
     *     1. If possible, avoid adding properties to the state object if it does not
     *        trigger an update or re-render of the datatable.
     *     2. You may look to add properties to the state object if that property is
     *        required in different areas of the datatable and/or if not adding to the
     *        state will significantly add to the complexity of the component.
     *     3. Goal: Breakdown the 'state' object - Right now the state object contains a
     *        lot of metadata and we pass around the monolith everywhere even when most
     *        of the information is not required. If you have the opportunity, look to
     *        separate or break down the state object even if that means adding a new
     *        tracked object. This will help us logically separate various modules over
     *        time and pass around only necessary information leading to cleaner,
     *        more readable and organized code.
     */
    // Tracked Objects
    this.state = getDefaultState();
    this.widthsData = getResizerDefaultState();
    // Private Variables
    this._actionsMinHeightStyle = '';
    // Min height required while actions menu is opened
    this._columns = [];
    this._columnWidthsMode = 'fixed';
    this._customerSelectedRows = null;
    this._datatableId = generateUniqueId('lgt-datatable');
    this._draftValues = [];
    this._isResizing = false;
    // Whether resizing is in progress
    this._lastRenderedRow = null;
    // last rendered row, used for UTAM
    this._privateTypes = {};
    this._privateWidthObserver = null;
    // Instance of LightningDatatableResizeObserver
    this._renderMode = 'table';
    this._shouldResetFocus = false;
    // used to ensure focus isn't lost from changes in renderedRows
    this._suppressBottomBar = false;
    this._checkboxColumnHeaderId = void 0;
    /************************* PUBLIC PROPERTIES *************************/
    /**
     * Public property for passing `aria-label` down to the child table element.
     */
    this.ariaLabel = null;
    /**
     * Public property for passing `aria-labelledby` down to the child table element.
     */
    this.ariaLabelledBy = null;
    this._privateTypes = new DatatableTypes(this.constructor.customTypes);
    this._columnWidthManager = new ColumnWidthManager(this.widthsData);
    this.updateRowsAndCellIndexes = updateRowsAndCellIndexes.bind(this);
    this._renderManager = new RenderManager();
    this.getWrapperHeight = getDTWrapperHeight.bind(this);
  }

  /**
   * Attach event handlers for various events on `lightning-datatable`
   */
  connectedCallback() {
    const {
      handleResizeColumn,
      handleUpdateColumnSort,
      handleCellFocusByClick,
      handleFalseCellBlur,
      handleSelectionCellClick
    } = this;

    // Row Selection and De-selection
    this.template.addEventListener('selectallrows', handleSelectionCellClick.bind(this));
    this.template.addEventListener('deselectallrows', handleSelectionCellClick.bind(this));
    this.template.addEventListener('selectrow', handleSelectionCellClick.bind(this));
    this.template.addEventListener('deselectrow', handleSelectionCellClick.bind(this));
    this.addEventListener('rowselection', handleRowSelectionChange.bind(this));

    // Column Resizing
    this.template.addEventListener('resizecol', handleResizeColumn.bind(this));

    // Column Sorting
    this.template.addEventListener('privateupdatecolsort', handleUpdateColumnSort.bind(this));

    // Cell Interaction
    this.template.addEventListener('privatecellkeydown', handleKeydownOnCell.bind(this));
    this.template.addEventListener('privatecellfocusedbyclick', handleCellFocusByClick.bind(this));
    this.template.addEventListener('privatecellfalseblurred', handleFalseCellBlur.bind(this));

    // Row Level Actions
    this.template.addEventListener('privatecellactiontriggered', handleRowActionTriggered.bind(this));
    this.template.addEventListener('privatecellactionmenuopening', handleLoadDynamicActions.bind(this));
    this.template.addEventListener('privatecellbuttonclicked', handleCellButtonClick.bind(this));

    // Header Actions
    this.template.addEventListener('privatecellheaderactionmenuopening', handleHeaderActionMenuOpening.bind(this));
    this.template.addEventListener('privatecellheaderactionmenuclosed', handleHeaderActionMenuClosed.bind(this));
    this.template.addEventListener('privatecellheaderactiontriggered', handleHeaderActionTriggered.bind(this));

    // Inline Edit
    this.template.addEventListener('privateeditcell', handleEditCell.bind(this));
  }

  /**
   * Renders the appropriate template - div.html or table.html,
   * based on the `render-mode` value passed in.
   * By default, table.html is rendered
   */
  render() {
    return this.state.renderModeRoleBased ? divTemplate : tableTemplate;
  }
  renderedCallback() {
    const {
      state,
      template,
      widthsData
    } = this;

    // This keeps underlying table element up to date if the aria-* properties on this element is dynamically changed.
    // It does the work of removing and adding the attribute if the value is empty(ish) or a normal string.
    synchronizeAttrs(this.gridContainer, {
      'aria-label': this.ariaLabel,
      'aria-labelledby': this.ariaLabelledBy
    });
    if (!this._privateWidthObserver) {
      this._privateWidthObserver = new LightningDatatableResizeObserver(template, state, widthsData, this._columnWidthManager);
    } else if (!this._privateWidthObserver.isConnected()) {
      this._privateWidthObserver.observe(template);
    }
    if (this._columnWidthManager.isResizingUpdateQueued()) {
      const fireResizeEvent = this._columnWidthManager.shouldFireResizeEvent(widthsData, getColumns(state));
      this._columnWidthManager.adjustColumnsSize(template, getColumns(state), widthsData);
      if (fireResizeEvent) {
        this.fireOnResize(false);
      }
      this.updateTableAndScrollerStyleOnRender();
    }

    // Managing the cell widths is only required for the role-based table
    if (state.renderModeRoleBased) {
      // TODO: Look to further optimize - Do this only when required
      recomputeCellStyles(this.privateTypes, state);
    }
    handlePrefetch.call(this, template, state);
    // customerSelectedRows is only valid till render, after it, the one used should be the one from the state.
    this._customerSelectedRows = null;
    // set the previous focused cell to null after render is done
    resetCellToFocusFromPrev(state);
    // reset focus styles on re-render
    if (this._shouldResetFocus) {
      // since focus is now getting reset, can change this back to false
      this._shouldResetFocus = false;
      // don't return focus to active cell when inline edit panel is open
      if (state.activeCell && state.activeCell.focused && !state.inlineEdit.isPanelVisible) {
        const cellElement = getActiveCellElement(template, state);
        if (cellElement && cellElement.parentElement && !cellElement.parentElement.classList.contains(FOCUS_CLASS)) {
          setFocusActiveCell(template, state, null, null, false);
        }
      }
    }
    this.updateVirtualizedRowHeights();
    if (this.viewportRendering || state.virtualize) {
      const resizeTarget = this.template.querySelector('div.dt-outer-container');
      this._renderManager.connectResizeObserver(resizeTarget);
      if (!this._renderManager.hasWrapperHeight()) {
        this._renderManager.updateWrapperHeight(this.getWrapperHeight);

        // Reset the row count if we already had one before updating the wrapper height.
        // This can happen if the number of rows was calculated before the datatable
        // was rendered.
        if (this.state.renderedRowCount) {
          this._renderManager.updateViewportRendering(this.state, this.gridContainer, true);
        }
      }
    }
  }
  updateTableAndScrollerStyleOnRender() {
    const role = '[role="' + this.computedTableRole + '"]';
    const tableElement = this.template.querySelector(role);
    const scrollYEle = this.template.querySelector('.slds-scrollable_y');
    if (tableElement) {
      tableElement.style = this.computedTableStyle;
    }
    if (scrollYEle) {
      scrollYEle.style = this.computedScrollerStyle;
    }
  }
  disconnectedCallback() {
    if (this._privateWidthObserver) {
      this._privateWidthObserver.disconnect();
    }
    this._renderManager.disconnectResizeObserver();
  }

  /************************** EVENT HANDLERS ***************************/

  /**
   * Handles the `keydown` event on <table> and the
   * corresponding <div> on the role-based table
   *
   * @param {KeyboardEvent} event - `keydown`
   */
  handleTableKeydown(event) {
    handleKeydownOnTable.call(this, event);
  }

  /**
   * Handles the `keydown` event on data row <tr> (table-based) and div[role="row"] (role-based)
   *
   * @param {KeyboardEvent} event - `keydown`
   */
  handleKeydownOnDataRow(event) {
    // we probably should not be doing this unless we actually are interested in it
    if (this.state.keyboardMode === 'NAVIGATION' && this.state.rowMode === true) {
      event.stopPropagation();
      const tr = event.currentTarget;
      const rowKeyValue = tr.getAttribute('data-row-key-value');
      const keyCode = event.keyCode;
      const rowHasChildren = !!tr.getAttribute('aria-expanded');
      const rowExpanded = tr.getAttribute('aria-expanded') === 'true';
      const rowLevel = tr.getAttribute('aria-level');
      const evt = {
        target: tr,
        detail: {
          rowKeyValue,
          keyCode,
          rowHasChildren,
          rowExpanded,
          rowLevel,
          keyEvent: event
        }
      };
      reactToKeyboardOnRow(this, this.state, evt);
    }
  }

  /**
   * Handles the `scroll` event on the table container
   *
   * @param {Event} event - `scroll`
   */
  handleHorizontalScroll(event) {
    handleInlineEditPanelScroll.call(this, event);
  }

  /**
   * Handles the `scroll` event on the child of the
   * table container at div.slds-scrollable_y
   *
   * @param {Event} event - `scroll`
   */
  handleVerticalScroll(event) {
    if (this.enableInfiniteLoading) {
      handleLoadMoreCheck.call(this, event);
    }
    handleInlineEditPanelScroll.call(this, event);
    if (this.state.virtualize) {
      this.state.firstVisibleIndex = findFirstVisibleIndex(this.state, event.target.scrollTop);
    } else if (this.viewportRendering) {
      this._renderManager.handleScroll(this.state, event);
    }
  }

  /**
   * Handles the `click` event on the <table> element and
   * the corresponding <div> in the role-based table
   *
   * @param {MouseEvent} event - `click`
   */
  handleCellClick(event) {
    // handles the case when clicking on the margin/pading of the td/th
    const targetTagName = event.target.tagName.toLowerCase();
    const targetRole = event.target.getAttribute('role');
    if (isCellElement(targetTagName, targetRole)) {
      // get the row/col key value from the primitive cell.
      const {
        rowKeyValue,
        colKeyValue
      } = event.target.querySelector(':first-child');
      const {
        state,
        template
      } = this;
      if (state.rowMode || !isActiveCell(state, rowKeyValue, colKeyValue)) {
        if (state.rowMode && state.activeCell) {
          unsetRowNavigationMode(state);
          const {
            rowIndex
          } = getIndexesActiveCell(state);
          updateTabIndexRow(state, rowIndex, -1);
        }
        this.setActiveCell(rowKeyValue, colKeyValue);
      }
      if (!datatableHasFocus(state, template)) {
        setCellClickedForFocus(state);
      }
    }
  }

  /**
   * Handles the `privateupdatecolsort` event on lightning-datatable
   *
   * @param {CustomEvent} event - `privateupdatecolsort`
   */
  handleUpdateColumnSort(event) {
    event.stopPropagation();
    const {
      fieldName,
      columnKey,
      sortDirection
    } = event.detail;
    this.fireSortedColumnChange(fieldName, columnKey, sortDirection);
  }
  handleCheckboxHeaderId(event) {
    this._checkboxColumnHeaderId = event.detail;
  }

  /**
   * Handles the `resizecol` event on lightning-datatable
   *
   * @param {CustomEvent} event - `resizecol`
   */
  handleResizeColumn(event) {
    event.stopPropagation();
    const {
      state,
      widthsData
    } = this;
    const {
      colIndex,
      widthDelta
    } = event.detail;
    if (widthDelta !== 0) {
      resizeColumnWithDelta(getColumns(state), widthsData, colIndex, widthDelta);
      this.fireOnResize(true);
      this.safariHeaderFix();
    }
  }

  /**
   * Handles the `privateresizestart` event on the <tr> and the corresponding
   * <div> in the role-based table on the column header row
   *
   * @param {CustomEvent} event - `privateresizestart`
   */
  handleResizeStart(event) {
    event.stopPropagation();
    this._isResizing = true;
  }

  /**
   * Handles the `privateresizeend` event on the <tr> and the corresponding
   * <div> in the role-based table on the column header row
   *
   * @param {CustomEvent} event - `privateresizeend`
   */
  handleResizeEnd(event) {
    event.stopPropagation();
    this._isResizing = false;
    this.state.shouldResetHeights = true;
  }

  /**
   * Handles the `selectallrows`, `deselectallrows`, `selectrow`, `deselectrow`
   * events on lightning-datatable
   *
   * @param {CustomEvent} event - `selectallrows`, `deselectallrows`, `selectrow`, `deselectrow`
   */
  handleSelectionCellClick(event) {
    this.handleCellFocusByClick(event);
    if (event.type === 'selectrow') {
      handleSelectRow.call(this, event);
    } else if (event.type === 'deselectrow') {
      handleDeselectRow.call(this, event);
    } else if (event.type === 'selectallrows') {
      handleSelectAllRows.call(this, event);
    } else if (event.type === 'deselectallrows') {
      handleDeselectAllRows.call(this, event);
    }
  }

  /**
   * Handles the `privatecellfocusedbyclick` event on lightning-datatable
   *
   * @param {CustomEvent} event - `privatecellfocusedbyclick`
   */
  handleCellFocusByClick(event) {
    event.stopPropagation();
    const {
      rowKeyValue,
      colKeyValue,
      needsRefocusOnCellElement
    } = event.detail;
    const {
      state
    } = this;
    if (!isActiveCell(state, rowKeyValue, colKeyValue)) {
      if (state.rowMode && state.activeCell) {
        unsetRowNavigationMode(state);
        const {
          rowIndex
        } = getIndexesActiveCell(state);
        updateTabIndexRow(state, rowIndex, -1);
      }
      this.setActiveCell(rowKeyValue, colKeyValue);
      refocusCellElement(this.template, state, needsRefocusOnCellElement);
    }
  }

  /**
   * Handles the `privatecellfalseblurred` event on lightning-datatable
   *
   * @param {CustomEvent} event - `privatecellfalseblurred`
   */
  handleFalseCellBlur(event) {
    event.stopPropagation();
    const {
      template,
      state
    } = this;
    const {
      rowKeyValue,
      colKeyValue
    } = event.detail;
    if (!isActiveCell(state, rowKeyValue, colKeyValue)) {
      this.setActiveCell(rowKeyValue, colKeyValue);
    }
    setFocusActiveCell(template, state);
  }

  /**
   * Handles the `focusin` event on <table> and the corresponding
   * <div> on the role-based table
   *
   * @param {FocusEvent} event - `focusin`
   */
  handleTableFocusIn(event) {
    handleDatatableFocusIn.call(this, event);
  }

  /**
   * Handles the `focusout` event on <table> and the corresponding
   * <div> on the role-based table
   *
   * This gets called both when we expect the table to lose focus
   * and when the active cell loses focus after renderedRows changes
   * on a virtualized table, in which case we don't want to lose focus.
   *
   * We account for this by setting activeCell.focused to the value of
   * _shouldResetFocus, which will be true if and only if focus was
   * lost due to a renderedRows change for a virtualized table.
   *
   * @param {FocusEvent} event - `focusout`
   */
  handleTableFocusOut(event) {
    handleDatatableFocusOut.call(this, event);
    if (this.state.activeCell) {
      this.state.activeCell.focused = this._shouldResetFocus;
    }
  }

  /**
   * Handles the `ieditfinished` event on the inline edit panel -
   * `lightning-primitive-datatable-iedit-panel`
   *
   * @param {CustomEvent} event - `ieditfinished`
   */
  handleInlineEditFinish(event) {
    handleInlineEditFinish.call(this, event);
  }

  /**
   * Handles the `masscheckboxchange` event on the inline edit panel -
   * `lightning-primitive-datatable-iedit-panel`
   *
   * @param {CustomEvent} event - `masscheckboxchange`
   */
  handleMassCheckboxChange(event) {
    handleMassCheckboxChange.call(this, event);
  }

  /**
   * Handles the `privatesave` event on the status bar -
   * `lightning-primitive-datatable-status-bar` and
   * fires the `save` custom event
   *
   * @param {CustomEvent} event - `privatesave`
   */
  handleInlineEditSave(event) {
    event.stopPropagation();
    event.preventDefault();
    closeInlineEdit(this);
    const draftValues = this.draftValues;
    this.dispatchEvent(new CustomEvent('save', {
      detail: {
        draftValues
      }
    }));
  }

  /**
   * Handles the `privatecancel` event on the status bar -
   * `lightning-primitive-datatable-status-bar` and
   * fires the `cancel` custom event
   *
   * @param {CustomEvent} event - `privatecancel`
   */
  handleInlineEditCancel(event) {
    event.stopPropagation();
    event.preventDefault();
    closeInlineEdit(this);
    const customerEvent = new CustomEvent('cancel', {
      cancelable: true
    });
    this.dispatchEvent(customerEvent);
    if (!customerEvent.defaultPrevented) {
      cancelInlineEdit(this);
    }
    updateActiveCellTabIndexAfterSync(this.state);
  }

  /**
   * @event LightningDatatable#onprivatelookupitempicked We need to augment the original event LightningFormattedLookup#onprivatelookupitempicked
   * @type {object}
   * @property {string} recordId
   * @property {number} rowIndex
   * @property {string} rowKeyValue
   */

  /**
   * Handles the `privatelookupitempicked` event from the lightning-formatted-lookup or force-lookup
   * `lightning-primitive-datatable-status-bar` and fires the augmented `privatelookupitempicked` custom event
   *
   * @param {CustomEvent} event - `privatelookupitempicked`
   * @fires LightningDatatable#onprivatelookupitempicked
   */
  handlePrivateLookupItemPicked(event) {
    event.stopPropagation();
    event.preventDefault();
    const {
      currentTarget
    } = event;
    const {
      recordId
    } = event.detail;
    const {
      rowIndex,
      rowKeyValue
    } = this.computeRowLookupItemPickedInformation(currentTarget);
    this.dispatchEvent(
    // We will the below Eslint rule as we use a constant to apply the name of the event
    // eslint-disable-next-line lightning-global/no-custom-event-identifier-arguments
    new CustomEvent(FORMATTED_LOOKUP_EVENTS.PrivateLookupItemPickedEvent.NAME,
    // Reuse the same event's name for homogenous usage
    {
      composed: true,
      cancelable: true,
      bubbles: true,
      detail: {
        recordId,
        rowIndex,
        rowKeyValue
      }
    }));
  }

  /************************ EVENT DISPATCHERS **************************/

  fireSelectedRowsChange(selectedRows, config) {
    const event = new CustomEvent('rowselection', {
      detail: {
        selectedRows,
        config: config || {}
      }
    });
    this.dispatchEvent(event);
  }
  fireSortedColumnChange(fieldName, columnKey, sortDirection) {
    const event = new CustomEvent('sort', {
      detail: {
        fieldName,
        columnKey,
        sortDirection
      }
    });
    this.dispatchEvent(event);
  }
  fireOnResize(isUserTriggered) {
    const {
      state,
      widthsData
    } = this;
    const event = new CustomEvent('resize', {
      detail: {
        columnWidths: getCustomerColumnWidths(getColumns(state), widthsData),
        isUserTriggered: !!isUserTriggered
      }
    });
    this.dispatchEvent(event);
  }

  /************************* HELPER FUNCTIONS **************************/

  updateRowsState() {
    const {
      state,
      widthsData,
      template
    } = this;
    // calculate cell to focus next before indexes are updated
    setCellToFocusFromPrev(state, template);
    this.updateRowsAndCellIndexes(state);
    if (this.viewportRendering || state.virtualize) {
      this._renderManager.updateViewportRendering(this.state, this.gridContainer, !!state.virtualize);
    }
    this._columnWidthManager.handleRowNumberOffsetChange(state, widthsData);
    // update celltofocus next to null if the row still exists after indexes calculation
    updateCellToFocusFromPrev(state);
    syncSelectedRowsKeys(state, this.getSelectedRows()).ifChanged(() => {
      // Only trigger row selection event once after all the setters have executed
      // Otherwise, event can be fired with stale data if not all setters have been triggered
      if (!this._rowSelectionEventPending) {
        this._rowSelectionEventPending = true;
        Promise.resolve().then(() => {
          if (this._rowSelectionEventPending) {
            this.fireSelectedRowsChange(this.getSelectedRows());
            this._rowSelectionEventPending = false;
          }
        });
      }
    });
    syncActiveCell(state);
    if (state.keyboardMode === 'NAVIGATION') {
      updateTabIndexActiveCell(state);
      updateTabIndexActiveRow(state);
    }
    // if there is previously focused cell which was deleted set focus from celltofocus next
    if (state.cellToFocusNext && state.activeCell) {
      setFocusActiveCell(this.template, this.state);
    }
  }
  updateColumns(columns) {
    const {
      state,
      widthsData,
      template
    } = this;
    const hadTreeDataTypePreviously = hasTreeDataType(state);
    // calculate cell to focus next before indexes are updated
    setCellToFocusFromPrev(state, template);
    normalizeColumns(state, columns, this.privateTypes);
    setDirtyValues(state, this._draftValues);
    updateRowNavigationMode(hadTreeDataTypePreviously, state);
    state.headerIndexes = generateHeaderIndexes(getColumns(state));
    // Updates state.wrapText and when isWrappableType, sets internal header actions
    updateHeaderActions(state);
    this.updateRowsAndCellIndexes(state);
    updateBulkSelectionState(state);
    this._columnWidthManager.handleRowNumberOffsetChange(state, widthsData);
    updateColumnWidthsMetadata(getColumns(state), widthsData);
    // set the celltofocus next to null if the column still exists after indexes calculation
    updateCellToFocusFromPrev(state);
    if (getColumns(state).length !== getColumnsWidths(widthsData).length) {
      if (getData(state).length > 0) {
        // when there are column changes, update the active cell
        syncActiveCell(state);
      }
    }
    if (state.keyboardMode === 'NAVIGATION') {
      updateTabIndexActiveCell(state);
      updateTabIndexActiveRow(state);
    }
    // if there is previously focused cell which was deleted set focus from celltofocus next
    if (state.cellToFocusNext && state.activeCell) {
      setFocusActiveCell(this.template, this.state);
    }
  }
  updateVirtualizedRowHeights() {
    const state = this.state;
    const virtualizedRows = state.virtualize && this.renderedRows.length;

    // no need to handle other virtualization/row height logic
    // if heights need to be reset
    if (this.state.shouldResetHeights) {
      resetRowHeights(state);
      this.state.shouldResetHeights = false;
    } else if (virtualizedRows && !state.fixedHeight) {
      // if row heights aren't fixed, we need to update items
      // in state to know where rows should be positioned
      handleVariableRowHeights(this.template, state, this.renderedRows);
    } else if (virtualizedRows && state.fixedHeight) {
      // if heights are fixed, we only need to check height of first row
      const rowElement = this.template.querySelector(getDataRow(this.renderedRows[0].key));
      // increase height by 1 since first rendered row is missing an extra 1px border
      if (rowElement) {
        const height = rowElement.getBoundingClientRect().height + 1;
        if (state.rowHeight !== height) {
          state.rowHeight = height;
          resetTableHeight(state);
          state.rows.forEach(row => {
            row.style = styleToString({
              position: 'absolute',
              top: `${row.rowIndex * height}px`
            });
          });
        }
      }
    }
  }
  setSelectedRows(value) {
    setSelectedRowsKeys(this.state, value);
    handleRowSelectionChange.call(this);
  }
  setActiveCell(rowKeyValue, colKeyValue) {
    const {
      template,
      state
    } = this;
    const {
      rowIndex,
      colIndex
    } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
    setBlurActiveCell(template, state);
    updateActiveCell(state, rowKeyValue, colKeyValue);
    addFocusStylesToActiveCell(template, state);
    updateTabIndex(state, rowIndex, colIndex, 0);
  }

  /**
   * @returns {Object} containing the visible dimensions of the table { left, right, top, bottom, }
   */
  getViewableRect() {
    const scrollerX = this.template.querySelector('.slds-scrollable_x').getBoundingClientRect();
    const scrollerY = this.template.querySelector('.slds-scrollable_y').getBoundingClientRect();
    return {
      left: scrollerX.left,
      right: scrollerX.right,
      top: scrollerY.top,
      bottom: scrollerY.bottom
    };
  }

  // W-6363867, W-7143375 Safari Refresh Bug
  safariHeaderFix() {
    if (isSafari) {
      const thead = this.template.querySelector('thead');
      if (thead) {
        /* Safari hack: hide and show the table head to force a browser repaint */
        thead.style.display = 'none';

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        requestAnimationFrame(() => {
          thead.style.display = '';
        });
      }
    }
  }

  /**
   * @returns { rowIndex: number, rowKeyValue: string } Compute the information to use to generate the lookupItemPicked event based on the row where the event comes from
   */
  computeRowLookupItemPickedInformation(currentTarget) {
    const rowIndex = Number.parseInt(currentTarget.dataset.rowNumber, 10) - 1; // Row number always start to 1, so we convert it to be able to use it for an array
    const rowKeyValue = currentTarget.dataset.rowKeyValue;
    return {
      rowIndex,
      rowKeyValue
    };
  }
  /*LWC compiler v3.0.0*/
}
_registerDecorators(LightningDatatable, {
  publicProps: {
    columnWidthsMode: {
      config: 3
    },
    columns: {
      config: 3
    },
    data: {
      config: 3
    },
    defaultSortDirection: {
      config: 3
    },
    draftValues: {
      config: 3
    },
    enableInfiniteLoading: {
      config: 3
    },
    errors: {
      config: 3
    },
    hideCheckboxColumn: {
      config: 3
    },
    hideTableHeader: {
      config: 3
    },
    wrapTableHeader: {
      config: 3
    },
    isLoading: {
      config: 3
    },
    keyField: {
      config: 3
    },
    loadMoreOffset: {
      config: 3
    },
    maxColumnWidth: {
      config: 3
    },
    maxRowSelection: {
      config: 3
    },
    minColumnWidth: {
      config: 3
    },
    renderConfig: {
      config: 3
    },
    renderMode: {
      config: 3
    },
    resizeColumnDisabled: {
      config: 3
    },
    resizeStep: {
      config: 3
    },
    rowNumberOffset: {
      config: 3
    },
    selectedRows: {
      config: 3
    },
    showRowNumberColumn: {
      config: 3
    },
    sortedBy: {
      config: 3
    },
    sortedDirection: {
      config: 3
    },
    suppressBottomBar: {
      config: 3
    },
    wrapTextMaxLines: {
      config: 3
    }
  },
  publicMethods: ["getSelectedRows", "openInlineEdit"],
  track: {
    state: 1,
    widthsData: 1
  },
  fields: ["_actionsMinHeightStyle", "_columns", "_columnWidthsMode", "_customerSelectedRows", "_datatableId", "_draftValues", "_isResizing", "_lastRenderedRow", "_privateTypes", "_privateWidthObserver", "_renderMode", "_shouldResetFocus", "_suppressBottomBar", "_checkboxColumnHeaderId", "ariaLabel", "ariaLabelledBy"]
});
export default _registerComponent(LightningDatatable, {
  tmpl: _tmpl,
  sel: "lightning-datatable",
  apiVersion: 59
});