/**
 * This function returns the initial state of the datatable.
 * The state object is further manipulated while it is passed around by datatable
 *
 * TODO: Check to see if there are other items that need to be added to the default state
 *
 * @returns {Object} Intial state of the datatable
 */
export const getDefaultState = function () {
  return {
    // columns
    columns: [],
    hideCheckboxColumn: false,
    // rows
    data: [],
    keyField: undefined,
    rows: [],
    indexes: {},
    // row selection
    selectedRowsKeys: {},
    lastSelectedRowKey: undefined,
    maxRowSelection: undefined,
    headerIndexes: {},
    hideTableHeader: false,
    wrapTableHeader: false,
    // keyboard
    keyboardMode: 'NAVIGATION',
    rowMode: false,
    activeCell: undefined,
    tabindex: 0,
    cellToFocusNext: null,
    cellClicked: false,
    normalized: false,
    // header actions
    wrapText: {},
    wrapTextMaxLines: undefined,
    // sort
    sortedBy: undefined,
    sortedDirection: undefined,
    defaultSortDirection: 'asc',
    // row number
    showRowNumberColumn: false,
    rowNumberOffset: 0,
    // infinite loading
    enableInfiniteLoading: false,
    loadMoreOffset: 20,
    isLoading: false,
    // table render mode
    renderModeRoleBased: false,
    // viewport rendering and virtualization
    enableViewportRendering: undefined,
    virtualize: '',
    bufferSize: 5,
    // number of extra rows rendered on each side outside of viewport
    rowHeight: 30.5,
    renderedRowCount: 0,
    firstVisibleIndex: 0,
    // first row that should be visible in viewport
    fixedHeight: false,
    // by default, assume that not all rows are same height
    heightCache: {},
    // cache of row heights
    offsets: [0],
    offsetRanges: [],
    firstRowOffset: 0,
    // how many pixels scrollTop is from top of first visible row
    tableHeight: 0,
    shouldResetHeights: false,
    // inline edit
    inlineEdit: {
      rowKeyValue: undefined,
      colKeyValue: undefined,
      columnDef: {},
      dirtyValues: {},
      editedValue: undefined,
      isPanelVisible: false,
      massEditEnabled: false,
      massEditSelectedRows: undefined,
      resolvedAttributeTypes: {}
    },
    // errors
    errors: {
      rows: {},
      table: {}
    }
  };
};