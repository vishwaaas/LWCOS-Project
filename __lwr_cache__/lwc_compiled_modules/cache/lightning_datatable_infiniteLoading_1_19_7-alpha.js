import { normalizeBoolean } from 'lightning/utilsPrivate';
import { getScrollOffsetFromTableEnd, isNonNegativeInteger } from './utils';
const SCROLL_ALLOWANCE = 2;
export const DEFAULT_LOAD_MORE_OFFSET = 20;

/*********************** STATE MANAGEMENT ************************/

/**
 * Returns whether the datatable is in a loading state
 *
 * @param {Object} state The datatable state object
 * @returns {Boolean} The loading state
 */
export function isLoading(state) {
  return state.isLoading;
}

/**
 * Sets the loading state of the datatable
 *
 * @param {Object} state The datatable state object
 * @param {Boolean} value The loading state to set
 */
export function setLoading(state, value) {
  state.isLoading = normalizeBoolean(value);
}

/**
 * Returns whether infinite loading is enabled on the datatable
 *
 * @param {Object} state The datatable state object
 * @returns {Boolean} The infinite loading state
 */
export function isInfiniteLoadingEnabled(state) {
  return state.enableInfiniteLoading;
}

/**
 * Sets the infinite loading option on the datatable
 *
 * @param {Object} state The datatable state object
 * @param {Boolean} value The infinite loading state to set
 */
export function setInfiniteLoading(state, value) {
  state.enableInfiniteLoading = normalizeBoolean(value);
}

/**
 * Returns the load more offset
 *
 * @param {Object} state The datatable state object
 * @returns {Number} The currently configured load more offset value
 */
export function getLoadMoreOffset(state) {
  return state.loadMoreOffset;
}

/**
 * Sets the load more offset value. Must be a number >= 0.
 *
 * @param {Object} state The datatable state object
 * @param {Boolean} value The load more offset value to set
 */
export function setLoadMoreOffset(state, value) {
  if (!isNonNegativeInteger(value)) {
    // eslint-disable-next-line no-console
    console.warn(`The "loadMoreOffset" value passed into lightning:datatable is incorrect. "loadMoreOffset" value should be an integer >= 0.`);
  }
  state.loadMoreOffset = isNonNegativeInteger(value) ? parseInt(value, 10) : DEFAULT_LOAD_MORE_OFFSET;
}

/************************** PUBLIC METHODS ***************************/

/**
 * Checks whether the datatable should begin loading more content
 * and then dispatches the `loadmore` event indicating that directive.
 *
 * @param {Event} event
 */
export function handleLoadMoreCheck(event) {
  if (isLoading(this.state)) {
    return;
  }
  const contentContainer = event.target.firstChild;
  if (!contentContainer) {
    return;
  }
  const offset = getScrollOffsetFromTableEnd(contentContainer);
  const threshold = getLoadMoreOffset(this.state);
  if (offset < threshold) {
    this.dispatchEvent(new CustomEvent('loadmore'));
  }
}

/**
 * Determines whether or not to prefetch data. If so,
 * dispatches the `loadmore` event.
 *
 * @param {Object} root  The datatable
 * @param {Object} state The datatable state object
 */
export function handlePrefetch(root, state) {
  if (!isInfiniteLoadingEnabled(state) || isLoading(state) || !hasData(root) || this.viewportRendering && this._renderManager && !this._renderManager.hasWrapperHeight()) {
    // dont prefetch if already loading or data is not set yet
    return;
  }
  const elem = root.querySelector('.slds-scrollable_y');
  if (isScrollerVisible(elem) && !isScrollable(elem)) {
    this.dispatchEvent(new CustomEvent('loadmore'));
  }
}

/************************** PRIVATE METHODS ***************************/

/**
 * Determines if a DOM element is scrollable
 *
 * @param {Element} element The DOM element to check
 * @returns {Boolean} Whether or not the element is scrollable
 */
function isScrollable(element) {
  // scrollHeight should be greater than clientHeight by some allowance
  return element && element.scrollHeight > element.clientHeight + SCROLL_ALLOWANCE;
}

/**
 * Determines if a DOM element's scroll bars are visible
 *
 * @param {Element} element The DOM element to check
 * @returns {Boolean} Whether or not the element's scroll bars are visible
 */
function isScrollerVisible(element) {
  return element && !!(element.offsetParent || element.offsetHeight || element.offsetWidth);
}

/**
 * Determines if a root element has data
 *
 * @param {Element} root The parent element to check
 * @returns {Boolean} Whether or not the element contains any data
 */
function hasData(root) {
  return root.querySelectorAll('tbody > tr, [role="rowgroup"] > [role="row"]').length > 0;
}