import { isCustomerColumn, generateColKeyValue, getStateColumnIndex } from './columns';
import { hasTreeDataType, getStateTreeColumn, fireRowToggleEvent } from './tree';
import { isCellEditable, getRowByKey } from './rows';
import { isRTL, getShadowActiveElements } from 'lightning/utilsPrivate';
import { findFirstVisibleIndex } from './virtualization';
import { escapeDoubleQuotes } from './utils';

// Indicator/flag for a header row
const HEADER_ROW = 'HEADER';

// SLDS Class for Focus
export const FOCUS_CLASS = 'slds-has-focus';

// Keyboard Navigation Modes
const NAVIGATION_MODE = 'NAVIGATION';
const ACTION_MODE = 'ACTION';

// Pixel Values
const TOP_MARGIN = 80;
const BOTTOM_MARGIN = 80;
const SCROLL_OFFSET = 20;

// Key Code Values
const ARROW_RIGHT = 39;
const ARROW_LEFT = 37;
const ARROW_DOWN = 40;
const ARROW_UP = 38;
const ENTER = 13;
const ESCAPE = 27;
const TAB = 9;
const SPACE = 32;

// Navigation Direction
const NAVIGATION_DIR = (() => {
  if (isRTL()) {
    return {
      RIGHT: -1,
      LEFT: 1,
      USE_CURRENT: 0,
      RESET: 2,
      TAB_FORWARD: -1,
      TAB_BACKWARD: 1
    };
  }
  return {
    RIGHT: 1,
    LEFT: -1,
    USE_CURRENT: 0,
    RESET: 2,
    TAB_FORWARD: 1,
    TAB_BACKWARD: -1
  };
})();

// Selectors
const SELECTORS = {
  headerRow: {
    default: `thead > :nth-child(1)`,
    roleBased: `[role="grid"] > [role="rowgroup"]:nth-child(1) > [role="row"]`
  },
  dataRowRowGroup: {
    default: `tbody`,
    roleBased: `[role="grid"] > [role="rowgroup"]:nth-child(2)`
  },
  cell: {
    default: ['td', 'th'],
    roleBased: ['rowheader', 'gridcell', 'columnheader']
  }
};

/***************************** KEYDOWN HANDLERS *****************************/

/**
 * Handler for the `privatecellkeydown` event that is fired by
 * lightning-primitive-datatable-cell.
 * This component is extended by primitive-cell-factory, primitive-cell-checkbox
 * and primitive-header-factory.
 *
 * Typically this handler is invoked when the user is in ACTION mode and the
 * user keys down on a cell that contains actionable items (ex. edit button, links,
 * email, buttons).
 *
 * @param {Event} event Custom DOM event (privatecellkeydown) sent by the cell
 */
export function handleKeydownOnCell(event) {
  event.stopPropagation();
  reactToKeyboardInActionMode(this.template, this.state, event);
}

/**
 * Handler for keydown on the <table> element or the corresponding [role="grid"]
 * on the role-based table.
 *
 * This handler is invoked whenever a keydown occurs on the table. However, we
 * only react to the keyboard here if the user is in Navigation mode OR in Action
 * mode when the cell does not have actionable items (like buttons, links etc).
 *
 * The Action mode keydowns are filtered out here. If a keydown occurs on an actionable
 * element, the target element will not be the cell element (td/th, role=gridcell etc).
 * The target element in that case will likely be the components extending
 * primitiveDatatableCell (primitive-cell-factory/primitive-cell-checkbox/primitive-header-factory)
 * Those events are handled by `handleKeydownOnCell()` and the remaining are
 * handled by this function.
 *
 * @param {Event} event
 */
export function handleKeydownOnTable(event) {
  const targetTagName = event.target.tagName.toLowerCase();
  const targetRole = event.target.getAttribute('role');

  // Checks if the keydown happened on a cell element and not
  // on an actionable element when in Action Mode.
  if (isCellElement(targetTagName, targetRole)) {
    reactToKeyboardInNavMode(this.template, this.state, event);
  }
}

/**
 * Changes the datatable state based on the keyboard event sent from the cell component.
 * The result of those changes may trigger a re-render on the table
 *
 * @param {Node} template The custom element root `this.template`
 * @param {Object} state Datatable state
 * @param {Event} event Custom DOM event sent by the cell
 * @returns {Object} Mutated state
 */
function reactToKeyboardInActionMode(template, state, event) {
  switch (event.detail.keyCode) {
    case ARROW_LEFT:
      return reactToArrowLeft(template, state, event);
    case ARROW_RIGHT:
      return reactToArrowRight(template, state, event);
    case ARROW_UP:
      return reactToArrowUp(template, state, event);
    case ARROW_DOWN:
      return reactToArrowDown(template, state, event);
    case ENTER:
    case SPACE:
      return reactToEnter(template, state, event);
    case ESCAPE:
      return reactToEscape(template, state, event);
    case TAB:
      return reactToTab(template, state, event);
    default:
      return state;
  }
}
function reactToKeyboardInNavMode(element, state, event) {
  const syntheticEvent = {
    detail: {
      rowKeyValue: state.activeCell.rowKeyValue,
      colKeyValue: state.activeCell.colKeyValue,
      keyCode: event.keyCode,
      shiftKey: event.shiftKey
    },
    preventDefault: () => {},
    stopPropagation: () => {}
  };

  // We need event.preventDefault so that actions like arrow up or down
  // does not scroll the table but instead sets focus on the right cells
  switch (event.keyCode) {
    case ARROW_LEFT:
      event.preventDefault();
      return reactToArrowLeft(element, state, syntheticEvent);
    case ARROW_RIGHT:
      event.preventDefault();
      return reactToArrowRight(element, state, syntheticEvent);
    case ARROW_UP:
      event.preventDefault();
      return reactToArrowUp(element, state, syntheticEvent);
    case ARROW_DOWN:
      event.preventDefault();
      return reactToArrowDown(element, state, syntheticEvent);
    case ENTER:
    case SPACE:
      event.preventDefault();
      return reactToEnter(element, state, syntheticEvent);
    case ESCAPE:
      // td, th or div[role=gridcell/rowheader] is the active element in the
      // action mode if cell doesn't have action elements; hence this can be
      // reached and we should react to escape as exiting from action mode
      syntheticEvent.detail.keyEvent = event;
      return reactToEscape(element, state, syntheticEvent);
    case TAB:
      return reactToTab(element, state, syntheticEvent);
    default:
      return state;
  }
}
function moveFromCellToRow(element, state) {
  setBlurActiveCell(element, state);
  setRowNavigationMode(state);
  setFocusActiveRow(element, state);
}
function reactToArrowLeft(element, state, event) {
  const {
    rowKeyValue,
    colKeyValue
  } = event.detail;
  const {
    colIndex
  } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
  const {
    columns
  } = state;

  // Move from navigation mode to row mode when user
  // arrows left when in nav mode and on the first column
  if (colIndex === 0 && canBeRowNavigationMode(state)) {
    moveFromCellToRow(element, state);
  } else {
    const nextColIndex = getNextIndexLeft(state, colIndex);
    if (nextColIndex === undefined) {
      return;
    }
    setBlurActiveCell(element, state);

    // update activeCell
    state.activeCell = {
      rowKeyValue,
      colKeyValue: generateColKeyValue(columns[nextColIndex], nextColIndex)
    };
    setFocusActiveCell(element, state, NAVIGATION_DIR.LEFT);
  }
}
function reactToArrowRight(element, state, event) {
  const {
    rowKeyValue,
    colKeyValue
  } = event.detail;
  const {
    colIndex
  } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
  const nextColIndex = getNextIndexRight(state, colIndex);
  const {
    columns
  } = state;
  if (nextColIndex === undefined) {
    return;
  }
  setBlurActiveCell(element, state);

  // update activeCell
  state.activeCell = {
    rowKeyValue,
    colKeyValue: generateColKeyValue(columns[nextColIndex], nextColIndex)
  };
  setFocusActiveCell(element, state, NAVIGATION_DIR.RIGHT);
}
function reactToArrowUp(element, state, event) {
  const {
    rowKeyValue,
    colKeyValue,
    keyEvent
  } = event.detail;
  const {
    rowIndex
  } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
  const nextRowIndex = getNextIndexUp(state, rowIndex);
  const {
    rows
  } = state;
  if (nextRowIndex === undefined) {
    return;
  }
  if (state.hideTableHeader && nextRowIndex === -1) {
    return;
  }
  if (keyEvent) {
    keyEvent.stopPropagation();
  }
  setBlurActiveCell(element, state);

  // update activeCell
  state.activeCell = {
    rowKeyValue: nextRowIndex !== -1 ? rows[nextRowIndex].key : HEADER_ROW,
    colKeyValue
  };
  setFocusActiveCell(element, state, NAVIGATION_DIR.USE_CURRENT);
}
function reactToArrowDown(element, state, event) {
  const {
    rowKeyValue,
    colKeyValue,
    keyEvent
  } = event.detail;
  const {
    rowIndex
  } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
  const nextRowIndex = getNextIndexDown(state, rowIndex);
  const {
    rows
  } = state;
  if (nextRowIndex === undefined) {
    return;
  }
  if (state.hideTableHeader && nextRowIndex === -1) {
    return;
  }
  if (keyEvent) {
    keyEvent.stopPropagation();
  }
  setBlurActiveCell(element, state);

  // update activeCell
  state.activeCell = {
    rowKeyValue: nextRowIndex !== -1 ? rows[nextRowIndex].key : HEADER_ROW,
    colKeyValue
  };
  setFocusActiveCell(element, state, NAVIGATION_DIR.USE_CURRENT);
}
function reactToEnter(element, state, event) {
  if (state.keyboardMode === NAVIGATION_MODE) {
    state.keyboardMode = ACTION_MODE;
    const {
      rowIndex,
      colIndex
    } = getIndexesActiveCell(state);
    const actionsMap = {};
    actionsMap[SPACE] = 'space';
    actionsMap[ENTER] = 'enter';
    if (event.detail.keyEvent) {
      event.detail.keyEvent.preventDefault();
    }
    setModeActiveCell(element, state, {
      action: actionsMap[event.detail.keyCode]
    });
    updateTabIndex(state, rowIndex, colIndex, -1);
  }
}
function reactToEscape(element, state, event) {
  if (state.keyboardMode === ACTION_MODE) {
    // When the table is in action mode this event shouldn't bubble
    // because if the table in inside a modal it should prevent the modal closes
    event.detail.keyEvent.stopPropagation();
    state.keyboardMode = NAVIGATION_MODE;
    setModeActiveCell(element, state);
    setFocusActiveCell(element, state, NAVIGATION_DIR.RESET);
  }
}
function reactToTab(element, state, event) {
  event.preventDefault();
  event.stopPropagation();
  const {
    shiftKey
  } = event.detail;
  const direction = getTabDirection(shiftKey);
  const isExitCell = isActiveCellAnExitCell(state, direction);

  // if in ACTION mode
  if (state.keyboardMode === ACTION_MODE) {
    // if not on last or first cell, tab through each cell of the grid
    if (isExitCell === false) {
      // prevent default key event in action mode when actually moving within the grid
      if (event.detail.keyEvent) {
        event.detail.keyEvent.preventDefault();
      }
      // tab in proper direction based on shift key press
      if (direction === 'BACKWARD') {
        reactToTabBackward(element, state);
      } else {
        reactToTabForward(element, state);
      }
    } else {
      // exit ACTION mode
      state.keyboardMode = NAVIGATION_MODE;
      setModeActiveCell(element, state);
      state.isExitingActionMode = true;
    }
  } else {
    state.isExitingActionMode = true;
  }
}
export function reactToTabForward(element, state) {
  const {
    nextRowIndex,
    nextColIndex
  } = getNextIndexOnTab(state, 'FORWARD');
  const {
    columns,
    rows
  } = state;
  setBlurActiveCell(element, state);

  // update activeCell
  state.activeCell = {
    rowKeyValue: nextRowIndex !== -1 ? rows[nextRowIndex].key : HEADER_ROW,
    colKeyValue: generateColKeyValue(columns[nextColIndex], nextColIndex)
  };
  setFocusActiveCell(element, state, NAVIGATION_DIR.TAB_FORWARD, {
    action: 'tab'
  });
}
export function reactToTabBackward(element, state) {
  const {
    nextRowIndex,
    nextColIndex
  } = getNextIndexOnTab(state, 'BACKWARD');
  const {
    columns,
    rows
  } = state;
  setBlurActiveCell(element, state);

  // update activeCell
  state.activeCell = {
    rowKeyValue: nextRowIndex !== -1 ? rows[nextRowIndex].key : HEADER_ROW,
    colKeyValue: generateColKeyValue(columns[nextColIndex], nextColIndex)
  };
  setFocusActiveCell(element, state, NAVIGATION_DIR.TAB_BACKWARD, {
    action: 'tab'
  });
}
function getTabDirection(shiftKey) {
  return shiftKey ? 'BACKWARD' : 'FORWARD';
}

/**
 * Retrieve the next index values for row & column when tab is pressed
 * @param {object} state - datatable state
 * @param {string} direction - 'FORWARD' or 'BACKWARD'
 * @returns {object} - nextRowIndex, nextColIndex values, isExitCell boolean
 */
function getNextIndexOnTab(state, direction) {
  const {
    rowIndex,
    colIndex
  } = getIndexesActiveCell(state);

  // decide which function to use based on the value of direction
  const nextTabFunc = {
    FORWARD: getNextIndexOnTabForward,
    BACKWARD: getNextIndexOnTabBackward
  };
  return nextTabFunc[direction](state, rowIndex, colIndex);
}
function getNextIndexOnTabForward(state, rowIndex, colIndex) {
  const columnsCount = state.columns.length;
  if (columnsCount > colIndex + 1) {
    return {
      nextRowIndex: rowIndex,
      nextColIndex: colIndex + 1
    };
  }
  return {
    nextRowIndex: getNextIndexDownWrapped(state, rowIndex),
    nextColIndex: 0
  };
}
function getNextIndexOnTabBackward(state, rowIndex, colIndex) {
  const columnsCount = state.columns.length;
  if (colIndex > 0) {
    return {
      nextRowIndex: rowIndex,
      nextColIndex: colIndex - 1
    };
  }
  return {
    nextRowIndex: getNextIndexUpWrapped(state, rowIndex),
    nextColIndex: columnsCount - 1
  };
}

/**
 * This set of keyboard actions is specific to tree-grid.
 *
 * When the user first tabs into the tree-grid, the user is set in row mode
 * and the entire row is highlighted.
 *
 * Keyboard Interaction Model:
 *  Arrow Up: Moves focus to the row above
 *  Arrow Down: Moves focus to the row below
 *  Arrow Right: Expands the row to reveal nested items if any
 *               Pressing the right arrow again will set focus on a cell
 *               and will remove the user from row mode and place them in navigation mode
 *  Arrow Left: If cell is expanded, this will collapse the expanded row
 *
 * @param {*} datatable - The datatable component/instance
 * @param {*} state - The datatable state object
 * @param {*} event - The keydown event
 * @returns Mutated state
 */
export function reactToKeyboardOnRow(datatable, state, event) {
  // TODO: Adapt this selector to also work in a role-based table once tree-grid is also migrated
  if (isRowNavigationMode(state) && event.target.localName.indexOf('tr') !== -1) {
    const element = datatable.template;
    switch (event.detail.keyCode) {
      case ARROW_LEFT:
        return reactToArrowLeftOnRow.call(datatable, element, state, event);
      case ARROW_RIGHT:
        return reactToArrowRightOnRow.call(datatable, element, state, event);
      case ARROW_UP:
        return reactToArrowUpOnRow.call(datatable, element, state, event);
      case ARROW_DOWN:
        return reactToArrowDownOnRow.call(datatable, element, state, event);
      default:
        return state;
    }
  }
  return state;
}
function reactToArrowLeftOnRow(element, state, event) {
  const {
    rowKeyValue,
    rowHasChildren,
    rowExpanded,
    rowLevel
  } = event.detail;
  // check if row needs to be collapsed
  // if not go to parent and focus there
  if (rowHasChildren && rowExpanded) {
    fireRowToggleEvent.call(this, rowKeyValue, rowExpanded);
  } else if (rowLevel > 1) {
    const treeColumn = getStateTreeColumn(state);
    if (treeColumn) {
      const colKeyValue = treeColumn.colKeyValue;
      const {
        rowIndex
      } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
      const parentIndex = getRowParent(state, rowLevel, rowIndex);
      if (parentIndex !== -1) {
        const rows = state.rows;
        setBlurActiveRow(element, state);
        // update activeCell for the row
        state.activeCell = {
          rowKeyValue: rows[parentIndex].key,
          colKeyValue
        };
        setFocusActiveRow(element, state);
      }
    }
  }
}
function moveFromRowToCell(element, state) {
  setBlurActiveRow(element, state);
  unsetRowNavigationMode(state);
  setFocusActiveCell(element, state, NAVIGATION_DIR.USE_CURRENT);
}
function reactToArrowRightOnRow(element, state, event) {
  const {
    rowKeyValue,
    rowHasChildren,
    rowExpanded
  } = event.detail;
  // check if row needs to be expanded
  // expand row if has children and is collapsed
  // otherwise make this.state.rowMode = false
  // move tabindex 0 to first cell in the row and focus there
  if (rowHasChildren && !rowExpanded) {
    fireRowToggleEvent.call(this, rowKeyValue, rowExpanded);
  } else {
    moveFromRowToCell(element, state);
  }
}
function reactToArrowUpOnRow(element, state, event) {
  // move tabindex 0 one row down
  const {
    rowKeyValue,
    keyEvent
  } = event.detail;
  const treeColumn = getStateTreeColumn(state);
  keyEvent.stopPropagation();
  keyEvent.preventDefault();
  if (treeColumn) {
    const colKeyValue = treeColumn.colKeyValue;
    const {
      rowIndex
    } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
    const prevRowIndex = getNextIndexUpWrapped(state, rowIndex);
    const {
      rows
    } = state;
    if (prevRowIndex !== -1) {
      setBlurActiveRow(element, state);
      // update activeCell for the row
      state.activeCell = {
        rowKeyValue: rows[prevRowIndex].key,
        colKeyValue
      };
      setFocusActiveRow(element, state);
    }
  }
}
function reactToArrowDownOnRow(element, state, event) {
  // move tabindex 0 one row down
  const {
    rowKeyValue,
    keyEvent
  } = event.detail;
  const treeColumn = getStateTreeColumn(state);
  keyEvent.stopPropagation();
  keyEvent.preventDefault();
  if (treeColumn) {
    const colKeyValue = treeColumn.colKeyValue;
    const {
      rowIndex
    } = getIndexesByKeys(state, rowKeyValue, colKeyValue);
    const nextRowIndex = getNextIndexDownWrapped(state, rowIndex);
    const {
      rows
    } = state;
    if (nextRowIndex !== -1) {
      setBlurActiveRow(element, state);
      // update activeCell for the row
      state.activeCell = {
        rowKeyValue: rows[nextRowIndex].key,
        colKeyValue
      };
      setFocusActiveRow(element, state);
    }
  }
}

/***************************** ACTIVE CELL *****************************/

function getDefaultActiveCell(state) {
  const {
    columns,
    rows
  } = state;
  if (columns.length > 0) {
    let colIndex;
    const existCustomerColumn = columns.some((column, index) => {
      colIndex = index;
      return isCustomerColumn(column);
    });
    if (!existCustomerColumn) {
      colIndex = 0;
    }
    return {
      rowKeyValue: rows.length > 0 ? rows[0].key : HEADER_ROW,
      colKeyValue: generateColKeyValue(columns[colIndex], colIndex)
    };
  }
  return undefined;
}
function setDefaultActiveCell(state) {
  state.activeCell = getDefaultActiveCell(state);
}

/**
 * Given a datatable template and state, returns an LWC component reference that represents
 * the currently active cell in the table.
 *
 * @param {Object} template - A reference to the datatable's template
 * @param {Object} state - A reference to the datatable's state
 */
export function getActiveCellElement(template, state) {
  if (state.activeCell) {
    const {
      rowKeyValue,
      colKeyValue
    } = state.activeCell;
    return getCellElementByKeys(template, rowKeyValue, colKeyValue);
  }
  return null;
}

/**
 * Returns if the pair rowKeyValue, colKeyValue are the current activeCell values
 *
 * @param {object} state - datatable state
 * @param {string} rowKeyValue  - the unique row key value
 * @param {string} colKeyValue {string} - the unique col key value
 * @returns {boolean} - true if rowKeyValue, colKeyValue are the current activeCell values.
 */
export function isActiveCell(state, rowKeyValue, colKeyValue) {
  if (state.activeCell) {
    const {
      rowKeyValue: currentRowKeyValue,
      colKeyValue: currentColKeyValue
    } = state.activeCell;
    return currentRowKeyValue === rowKeyValue && currentColKeyValue === colKeyValue;
  }
  return false;
}

/**
 * Updates the current activeCell in the state with the new rowKeyValue, colKeyValue
 * @param {object} state - datatable state
 * @param {string} rowKeyValue  - the unique row key value
 * @param {string} colKeyValue {string} - the unique col key value
 * @returns {object} state - mutated datatable state
 */
export function updateActiveCell(state, rowKeyValue, colKeyValue) {
  state.activeCell = {
    rowKeyValue,
    colKeyValue
  };
  return state;
}

/**
 * It check if in the current (data, columns) the activeCell still valid.
 * When data changed the activeCell could be removed, then we check if there is cellToFocusNext
 * which is calculated from previously focused cell, if so we sync to that
 * If active cell is still valid we keep it the same
 *
 * @param {object} state - datatable state
 * @returns {object} state - mutated datatable state
 */
export function syncActiveCell(state) {
  if (!state.activeCell || !stillValidActiveCell(state)) {
    if (state.activeCell && state.cellToFocusNext) {
      // there is previously focused cell
      setNextActiveCellFromPrev(state);
    } else {
      // there is no active cell or there is no previously focused cell
      setDefaultActiveCell(state);
    }
  }
  return state;
}

/**
 * Sets the next active if there is a previously focused active cell
 * Logic is:
 * if the rowIndex is existing one - cell = (rowIndex, 0)
 * if the rowIndex is > the number of rows (focused was last row or more) = (lastRow, lastColumn)
 * for columns
 * same as above except if the colIndex is > the number of cols (means no data) = set it to null??
 * @param {object} state - datatable state
 */
function setNextActiveCellFromPrev(state) {
  const {
    rowIndex,
    colIndex
  } = state.cellToFocusNext;
  let nextRowIndex = rowIndex;
  let nextColIndex = colIndex;
  const rowsCount = state.rows ? state.rows.length : 0;
  const colsCount = state.columns.length ? state.columns.length : 0;
  if (nextRowIndex > rowsCount - 1) {
    // row index not existing after update to new 5 > 5-1, 6 > 5-1,
    nextRowIndex = rowsCount - 1;
  }
  if (nextColIndex > colsCount - 1) {
    // col index not existing after update to new
    nextColIndex = colsCount - 1;
  }
  const nextActiveCell = getCellFromIndexes(state, nextRowIndex, nextColIndex);
  if (nextActiveCell) {
    state.activeCell = nextActiveCell;
  } else {
    setDefaultActiveCell(state);
  }
  state.keyboardMode = NAVIGATION_MODE;
}

/**
 * Check if we're in an escape/exit cell (first or last of grid)
 * @param {object} state - datatable state
 * @param {string} direction - 'FORWARD' or 'BACKWARD'
 * @returns {boolean} - if the current cell is or isn't an exit cell
 */
export function isActiveCellAnExitCell(state, direction) {
  // get next tab index values
  const {
    rowIndex,
    colIndex
  } = getIndexesActiveCell(state);
  const {
    nextRowIndex,
    nextColIndex
  } = getNextIndexOnTab(state, direction);
  // is it an exit cell?
  if (
  // if first cell and moving backward
  rowIndex === -1 && colIndex === 0 && nextRowIndex !== -1 && nextColIndex !== 0 ||
  // or if last cell and moving forward
  rowIndex !== -1 && nextRowIndex === -1 && nextColIndex === 0) {
    return true;
  }
  return false;
}
export function getIndexesActiveCell(state) {
  const {
    activeCell: {
      rowKeyValue,
      colKeyValue
    }
  } = state;
  return getIndexesByKeys(state, rowKeyValue, colKeyValue);
}
function setModeActiveCell(element, state, info) {
  const cellElement = getActiveCellElement(element, state);
  if (cellElement) {
    cellElement.setMode(state.keyboardMode, info);
  }
}
function stillValidActiveCell(state) {
  const {
    activeCell: {
      rowKeyValue,
      colKeyValue
    }
  } = state;
  let sortableColumns = state.columns.filter(column => column.sortable);
  if (rowKeyValue === HEADER_ROW) {
    if (state.rows.length && sortableColumns.length === 0) {
      return false;
    }
    return state.headerIndexes[colKeyValue] !== undefined;
  }
  return !!(state.indexes[rowKeyValue] && state.indexes[rowKeyValue][colKeyValue]);
}

/***************************** FOCUS MANAGEMENT *****************************/

/**
 * It set the focus to the current activeCell, this operation imply multiple changes
 * - update the tabindex of the activeCell
 * - set the current keyboard mode
 * - set the focus to the cell
 * @param {node} template - the custom element template `this.template`
 * @param {object} state - datatable state
 * @param {int} direction - direction (-1 left, 1 right and 0 for no direction) its used to know which actionable element to activate.
 * @param {object} info - extra information when setting the cell mode; currently only set when pressing tab
 * @param {boolean} shouldScroll - true if scrollTop should be adjusted when setting focus
 */
export function setFocusActiveCell(template, state, direction, info, shouldScroll = true) {
  const {
    keyboardMode
  } = state;
  const {
    rowIndex,
    colIndex
  } = getIndexesActiveCell(state);
  state.activeCell.focused = !(info && isActiveCellValid(state));
  updateTabIndex(state, rowIndex, colIndex);
  let cellElement = getActiveCellElement(template, state);
  // if the cell wasn't found, but does exist in the table, scroll to where it should be
  if (!cellElement && isActiveCellValid(state) && shouldScroll) {
    scrollToCell(state, template, rowIndex);
  }
  return new Promise(resolve => {
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      // reset cell element if falsy or no longer valid
      if (!cellElement || !isValidCell(state, cellElement.rowKeyValue, cellElement.colKeyValue)) {
        cellElement = getActiveCellElement(template, state);
      }
      if (cellElement) {
        if (direction) {
          cellElement.resetCurrentInputIndex(direction, keyboardMode);
        }
        cellElement.addFocusStyles();
        cellElement.parentElement.classList.add(FOCUS_CLASS);
        cellElement.parentElement.focus({
          preventScroll: !shouldScroll
        });
        cellElement.setMode(keyboardMode, info);
        if (shouldScroll) {
          updateScrollTop(state, template, cellElement);
        }
      }
      resolve();
    }, 0);
  });
}

/**
 * It blur to the current activeCell, this operation imply multiple changes
 * - blur the activeCell
 * - update the tabindex to -1
 * @param {node} template - the custom element root `this.template`
 * @param {object} state - datatable state
 */
export function setBlurActiveCell(template, state) {
  if (state.activeCell) {
    const {
      rowIndex,
      colIndex
    } = getIndexesActiveCell(state);
    let cellElement = getActiveCellElement(template, state);
    state.activeCell.focused = false;
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      // check cellElement; value may have changed
      if (!cellElement || !isValidCell(state, cellElement.rowKeyValue, cellElement.colKeyValue)) {
        cellElement = getActiveCellElement(template, state);
      }
      if (cellElement) {
        if (document.activeElement === cellElement) {
          cellElement.blur();
        }
        cellElement.removeFocusStyles(true);
        cellElement.parentElement.classList.remove(FOCUS_CLASS);
      }
    }, 0);
    updateTabIndex(state, rowIndex, colIndex, -1);
  }
}

/**
 * Sets the row and col index of cell to focus next if
 * there is state.activecell
 * datatable has focus
 * there is state.indexes
 * there is no  previously set state.cellToFocusNext
 * Indexes are calculated as to what to focus on next
 * @param {object} state - datatable state
 * @param {object} template - datatable element
 */
export function setCellToFocusFromPrev(state, template) {
  if (state.activeCell && datatableHasFocus(state, template) && state.indexes && !state.cellToFocusNext) {
    let {
      rowIndex,
      colIndex
    } = getIndexesActiveCell(state);
    colIndex = 0; // default point to the first column
    if (state.rows && rowIndex === state.rows.length - 1) {
      // if it is last row, make it point to its previous row
      rowIndex = state.rows.length - 1;
      colIndex = state.columns ? state.columns.length - 1 : 0;
    }
    state.cellToFocusNext = {
      rowIndex,
      colIndex
    };
  }
}

/**
 * if the current new active still is valid (exists) then set the celltofocusnext to null
 * @param {object} state - datatable state
 */
export function updateCellToFocusFromPrev(state) {
  if (state.activeCell && state.cellToFocusNext && stillValidActiveCell(state)) {
    // if the previous focus is there and valid,  don't set the prevActiveFocusedCell
    state.cellToFocusNext = null;
  }
}

/**
 * reset celltofocusnext to null (used after render)
 * @param {object} state - datatable state
 */
export function resetCellToFocusFromPrev(state) {
  state.cellToFocusNext = null;
}

/**
 * It adds and the focus classes to the th/td or div[role=gridcell/rowheader].
 *
 * @param {node} template - the custom element template `this.template`
 * @param {object} state - datatable state
 */
export function addFocusStylesToActiveCell(template, state) {
  const cellElement = getActiveCellElement(template, state);
  state.activeCell.focused = true;
  if (cellElement) {
    cellElement.parentElement.classList.add(FOCUS_CLASS);
  }
}

/**
 * It set the focus to the row of current activeCell, this operation implies multiple changes
 * - update the tabindex of the activeCell
 * - set the current keyboard mode
 * - set the focus to the row
 * @param {node} template - the custom element root `this.template`
 * @param {object} state - datatable state
 */
function setFocusActiveRow(template, state) {
  const {
    rowIndex
  } = getIndexesActiveCell(state);
  const row = getActiveCellRow(template, state);
  updateTabIndexRow(state, rowIndex);
  // eslint-disable-next-line @lwc/lwc/no-async-operation
  setTimeout(() => {
    row.focus({
      preventScroll: true
    });
    updateScrollTop(state, template, row);
  }, 0);
}

/**
 * It blurs the active row, this operation implies multiple changes
 * - blur the active row
 * - update the tabindex to -1
 * @param {node} template - the custom element root `this.template`
 * @param {object} state - datatable state
 */
function setBlurActiveRow(template, state) {
  if (state.activeCell) {
    const {
      rowIndex
    } = getIndexesActiveCell(state);
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      const row = getActiveCellRow(template, state);
      if (document.activeElement === row) {
        row.blur();
      }
    }, 0);
    updateTabIndexRow(state, rowIndex, -1);
  }
}

/**
 * This method is needed in IE11 where clicking on the cell (factory) makes the div or the span active element
 * It refocuses on the cell element td or th or div[role=gridcell/rowheader]
 * @param {object} template - datatable element
 * @param {object} state - datatable state
 * @param {boolean} needsRefocusOnCellElement - flag indicating whether or not to refocus on the cell td/th or div[role=gridcell/rowheader]
 */
export function refocusCellElement(template, state, needsRefocusOnCellElement) {
  if (needsRefocusOnCellElement) {
    const cellElement = getActiveCellElement(template, state);
    if (cellElement) {
      cellElement.parentElement.focus();
    }

    // setTimeout so that focusin happens and then we set state.cellClicked to true
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      setCellClickedForFocus(state);
    }, 0);
  } else if (!datatableHasFocus(state, template)) {
    setCellClickedForFocus(state);
  }
}
export function datatableHasFocus(state, template) {
  return isFocusInside(template) || state.cellClicked;
}
function isFocusInside(currentTarget) {
  const activeElements = getShadowActiveElements();
  return activeElements.some(element => {
    return currentTarget.contains(element);
  });
}
export function handleDatatableFocusIn(event) {
  const {
    state
  } = this;
  state.isExitingActionMode = false;

  // workaround for delegatesFocus issue that focusin is called when not supposed to W-6220418
  if (isFocusInside(event.currentTarget)) {
    if (!state.rowMode && state.activeCell) {
      state.activeCell.focused = true;
      const cellElement = getActiveCellElement(this.template, state);
      // we need to check because of the tree,
      // at this point it may remove/change the rows/keys because opening or closing a row.
      if (cellElement) {
        cellElement.addFocusStyles();
        cellElement.parentElement.classList.add(FOCUS_CLASS);
        cellElement.tabindex = 0;
      }
    }
    resetCellClickedForFocus(state);
  }
}
export function handleDatatableFocusOut(event) {
  const {
    state
  } = this;
  // workarounds for delegatesFocus issues
  if (
  // needed for initial focus where relatedTarget is empty
  !event.relatedTarget ||
  // needed when clicked outside
  event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) ||
  // needed when datatable leaves focus and related target is still within datatable W-6185154
  event.relatedTarget && event.currentTarget.contains(event.relatedTarget) && state.isExitingActionMode) {
    if (state.activeCell && !state.rowMode) {
      const cellElement = getActiveCellElement(this.template, state);
      // we need to check because of the tree,
      // at this point it may remove/change the rows/keys because opening or closing a row.
      if (cellElement) {
        cellElement.removeFocusStyles();
        cellElement.parentElement.classList.remove(FOCUS_CLASS);
      }
    }
  }
}

/**
 * This is needed to check if datatable has lost focus but cell has been clicked recently
 * @param {object} state - datatable state
 */
export function setCellClickedForFocus(state) {
  state.cellClicked = true;
}

/**
 * Once the dt regains focus there is no need to set this
 *  @param {object} state - datatable state
 */
function resetCellClickedForFocus(state) {
  state.cellClicked = false;
}

/***************************** TABINDEX MANAGEMENT *****************************/

/**
 * It update the tabIndex value of a cell in the state for the rowIndex, colIndex passed
 * as consequence of this change
 * datatable is gonna re-render the cell affected with the new tabindex value
 *
 * @param {object} state - datatable state
 * @param {number} rowIndex - the row index
 * @param {number} colIndex - the column index
 * @param {number} [index = 0] - the value for the tabindex
 */
export function updateTabIndex(state, rowIndex, colIndex, index = 0) {
  if (isHeaderRow(rowIndex)) {
    const {
      columns
    } = state;
    columns[colIndex].tabIndex = index;
  } else {
    state.rows[rowIndex].cells[colIndex].tabIndex = index;
  }
}

/**
 * It updates the tabIndex value of a row in the state for the rowIndex passed
 * as consequence of this change
 * datatable is gonna re-render the row affected with the new tabindex value
 *
 * @param {object} state - datatable state
 * @param {number} rowIndex - the row index
 * @param {number} [index = 0] - the value for the tabindex
 */
export function updateTabIndexRow(state, rowIndex, index = 0) {
  if (!isHeaderRow(rowIndex)) {
    // TODO what to do when rowIndex is header row
    state.rows[rowIndex].tabIndex = index;
  }
}
/**
 * It update the tabindex for the current activeCell.
 * @param {object} state - datatable state
 * @param {number} [index = 0] - the value for the tabindex
 * @returns {object} state - mutated state
 */
export function updateTabIndexActiveCell(state, index = 0) {
  if (state.activeCell && !stillValidActiveCell(state)) {
    syncActiveCell(state);
  }

  // we need to check again because maybe there is no active cell after sync
  updateActiveCellTabIndexAfterSync(state, index);
  return state;
}

/**
 * It updates the tabindex for the row of the current activeCell.
 * This happens in rowMode of NAVIGATION_MODE
 * @param {object} state - datatable state
 * @param {number} [index = 0] - the value for the tabindex
 * @returns {object} state - mutated state
 */
export function updateTabIndexActiveRow(state, index = 0) {
  if (state.activeCell && !stillValidActiveCell(state)) {
    syncActiveCell(state);
  }

  // we need to check again because maybe there is no active cell after sync
  if (state.activeCell && isRowNavigationMode(state)) {
    const {
      rowIndex
    } = getIndexesActiveCell(state);
    updateTabIndexRow(state, rowIndex, index);
  }
  return state;
}

/***************************** INDEX COMPUTATIONS *****************************/

/**
 * It return the indexes { rowIndex, colIndex } of a cell based of the unique cell values
 * rowKeyValue, colKeyValue
 * @param {object} state - datatable state
 * @param {string} rowKeyValue - the row key value
 * @param {string} colKeyValue - the column key value
 * @returns {object} - {rowIndex, colIndex}
 */
export function getIndexesByKeys(state, rowKeyValue, colKeyValue) {
  if (rowKeyValue === HEADER_ROW) {
    return {
      rowIndex: -1,
      colIndex: state.headerIndexes[colKeyValue]
    };
  }
  return {
    rowIndex: state.indexes[rowKeyValue][colKeyValue][0],
    colIndex: state.indexes[rowKeyValue][colKeyValue][1]
  };
}
function getNextIndexUp(state, rowIndex) {
  return rowIndex === -1 ? undefined : rowIndex - 1;
}
function getNextIndexDown(state, rowIndex) {
  const rowsCount = state.rows.length;
  return rowIndex + 1 < rowsCount ? rowIndex + 1 : undefined;
}
function getNextColumnIndex(columnsCount, colIndex) {
  return columnsCount > colIndex + 1 ? colIndex + 1 : undefined;
}
function getPrevColumnIndex(colIndex) {
  return colIndex > 0 ? colIndex - 1 : undefined;
}
function getNextIndexRight(state, colIndex) {
  if (isRTL()) {
    return getPrevColumnIndex(colIndex);
  }
  return getNextColumnIndex(state.columns.length, colIndex);
}
function getNextIndexLeft(state, colIndex) {
  if (isRTL()) {
    return getNextColumnIndex(state.columns.length, colIndex);
  }
  return getPrevColumnIndex(colIndex);
}
function getNextIndexUpWrapped(state, rowIndex) {
  const rowsCount = state.rows.length;
  return rowIndex === 0 ? -1 : rowIndex === -1 ? rowsCount - 1 : rowIndex - 1;
}
function getNextIndexDownWrapped(state, rowIndex) {
  const rowsCount = state.rows.length;
  return rowIndex + 1 < rowsCount ? rowIndex + 1 : -1;
}

/***************************** ROW NAVIGATION MODE *****************************/

function canBeRowNavigationMode(state) {
  return state.keyboardMode === NAVIGATION_MODE && hasTreeDataType(state);
}
function isRowNavigationMode(state) {
  return state.keyboardMode === NAVIGATION_MODE && state.rowMode === true;
}
function setRowNavigationMode(state) {
  if (hasTreeDataType(state) && state.keyboardMode === NAVIGATION_MODE) {
    state.rowMode = true;
  }
}
export function unsetRowNavigationMode(state) {
  state.rowMode = false;
}

/**
 * If new set of columns doesnt have tree data, mark it to false, as it
 * could be true earlier
 * Else if it has tree data, check if rowMode is false
 * Earlier it didnt have tree data, set rowMode to true to start
 * if rowMode is false and earlier it has tree data, keep it false
 * if rowMode is true and it has tree data, keep it true
 * @param {boolean} hadTreeDataTypePreviously - state object
 * @param {object} state - state object
 * @returns {object} state - mutated state
 */
export function updateRowNavigationMode(hadTreeDataTypePreviously, state) {
  if (!hasTreeDataType(state)) {
    state.rowMode = false;
  } else if (state.rowMode === false && !hadTreeDataTypePreviously) {
    state.rowMode = true;
  }
  return state;
}

/***************************** HELPER FUNCTIONS *****************************/

export function isCellElement(tagName, role) {
  return SELECTORS.cell.default.includes(tagName) || SELECTORS.cell.roleBased.includes(role);
}
function isHeaderRow(rowIndex) {
  return rowIndex === -1;
}
export function getDataRow(rowKeyValue) {
  return `[data-row-key-value="${escapeDoubleQuotes(rowKeyValue)}"]`;
}
export function getCellElementByKeys(template, rowKeyValue, colKeyValue) {
  const selector = `${getDataRow(rowKeyValue)} [data-col-key-value="${escapeDoubleQuotes(colKeyValue)}"] > :first-child`;
  return template.querySelector(selector);
}
function getActiveCellRow(template, state) {
  if (state.activeCell) {
    const {
      rowKeyValue
    } = state.activeCell;
    const selector = getDataRow(rowKeyValue);
    return template.querySelector(selector);
  }
  return null;
}
export function getRowParent(state, rowLevel, rowIndex) {
  const parentIndex = rowIndex - 1;
  const rows = state.rows;
  for (let i = parentIndex; i >= 0; i--) {
    if (rows[i].level === rowLevel - 1) {
      return i;
    }
  }
  return -1;
}
function getCellFromIndexes(state, rowIndex, colIndex) {
  const {
    columns,
    rows
  } = state;
  if (columns.length > 0) {
    return {
      rowKeyValue: rowIndex === -1 ? HEADER_ROW : rows[rowIndex].key,
      colKeyValue: generateColKeyValue(columns[colIndex], colIndex)
    };
  }
  return undefined;
}
function updateScrollTop(state, template, element) {
  const scrollableY = template.querySelector('.slds-scrollable_y');
  const scrollingParent = scrollableY.parentElement;
  const parentRect = scrollingParent.getBoundingClientRect();
  const findMeRect = element.getBoundingClientRect();
  if (findMeRect.top < parentRect.top + TOP_MARGIN) {
    scrollableY.scrollTop -= SCROLL_OFFSET;
  } else if (findMeRect.bottom > parentRect.bottom - BOTTOM_MARGIN) {
    scrollableY.scrollTop += SCROLL_OFFSET;
  }
  findFirstVisibleIndex(state, scrollableY.scrollTop);
}
function scrollToCell(state, template, rowIndex) {
  const {
    firstVisibleIndex,
    bufferSize,
    renderedRowCount,
    rowHeight
  } = state;
  let scrollTop = rowIndex * rowHeight;
  if (firstVisibleIndex > rowIndex) {
    const rowsInViewport = renderedRowCount - 2 * bufferSize;
    scrollTop = Math.max(scrollTop - rowsInViewport * rowHeight, 0);
  }
  const scrollableY = template.querySelector('.slds-scrollable_y');
  scrollableY.scrollTop = scrollTop;
  findFirstVisibleIndex(state, scrollTop);
}
export function isActiveCellEditable(state) {
  const {
    activeCell,
    rows,
    columns
  } = state;
  if (activeCell) {
    const {
      rowIndex,
      colIndex
    } = getIndexesActiveCell(state);
    return isCellEditable(rows[rowIndex], columns[colIndex]);
  }
  return false;
}
export function isValidCell(state, rowKeyValue, colKeyValue) {
  if (rowKeyValue === HEADER_ROW) {
    return state.headerIndexes[colKeyValue] !== undefined;
  }
  const row = getRowByKey(state, rowKeyValue);
  const colIndex = getStateColumnIndex(state, colKeyValue);
  return row && row.cells[colIndex];
}
function isActiveCellValid(state) {
  if (state.activeCell) {
    const {
      rowKeyValue,
      colKeyValue
    } = state.activeCell;
    return isValidCell(state, rowKeyValue, colKeyValue);
  }
  return false;
}
export function updateActiveCellTabIndexAfterSync(state, index = 0) {
  if (state.activeCell && !isRowNavigationMode(state)) {
    const {
      rowIndex,
      colIndex
    } = getIndexesActiveCell(state);
    updateTabIndex(state, rowIndex, colIndex, index);
  }
}