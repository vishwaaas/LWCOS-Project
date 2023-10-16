import { registerDecorators as _registerDecorators } from "lwc";
import { LightningResizeObserver } from 'lightning/resizeObserver';
import { isTableRenderedVisible } from './columnResizer';
import { ResizeSensor } from './resizeSensor';
import { debounce } from 'lightning/inputUtils';
import { getColumns } from './columns';
const WIDTH_OBSERVER_SELECTOR = '.dt-width-observer';
export class LightningDatatableResizeObserver {
  /**
   * Depending on the browser/availability, this will create either a (standard)
   * ResizeObserver via LightningResizeObserver or fallback to the ResizeSensor
   */
  constructor(template, state, widthsData, columnWidthManager) {
    this._connected = false;
    this._resizeObserverAvailable = typeof ResizeObserver === 'function';
    const resizeTarget = template.querySelector(WIDTH_OBSERVER_SELECTOR);

    // If ResizeObserver is available on the browser, create one and begin observing for changes
    // Calculate and modify the column widths when there are changes to the dimensions
    // and when the table is rendered and visible on screen
    if (this._resizeObserverAvailable) {
      this._resizeObserver = new LightningResizeObserver(() => {
        if (this._connected && isTableRenderedVisible(template)) {
          columnWidthManager.adjustColumnsSizeAfterResize(template, getColumns(state), widthsData);
        }
      });
      this._resizeObserver.observe(resizeTarget);
    } else {
      // fallback behavior for IE11 using existing resize sensor functionality (less performant)
      this._resizeSensor = createResizeSensorForIE11(this, columnWidthManager, template, state, widthsData, resizeTarget);
    }
    this._connected = true;
  }

  // Begins observing the specified element for changes in dimension
  observe(template) {
    const targetElement = template.querySelector(WIDTH_OBSERVER_SELECTOR);
    if (this._resizeObserver) {
      this._resizeObserver.observe(targetElement);
    } else if (this._resizeSensor) {
      this._resizeSensor.reattach(targetElement);
    }
    this._connected = true;
  }

  // Stops observing any/all observed elements for changes in dimension
  disconnect() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    } else if (this._resizeSensor) {
      this._resizeSensor.detach();
      this._resizeSensor = undefined;
    }
    this._connected = false;
  }
  isConnected() {
    return this._connected;
  }
}

/**
 * Creates a ResizeSensor which is used to observe the dimensions of an element.
 *
 * This ResizeSensor is only used in the event that the standard ResizeObserver
 * is NOT available on the browser.
 * Currently only IE11 does not support the ResizeObserver. We should be able to
 * remove this once we fully drop support of IE11.
 */
_registerDecorators(LightningDatatableResizeObserver, {
  fields: ["_connected", "_resizeObserverAvailable"]
});
function createResizeSensorForIE11(dtObserver, columnWidthManager, template, state, widthsData, resizeTarget) {
  return new ResizeSensor(resizeTarget, debounce(() => {
    // since this event handler is debounced, it might be the case that at the time the handler is called,
    // the element is disconnected (this.hasDetachedListeners)
    // the scroll event which the ResizeSensor uses can happen when table is hidden (as in console when switching tabs)
    // and hence the need for isTableRenderedVisible check
    if (dtObserver.isConnected() && isTableRenderedVisible(template)) {
      columnWidthManager.adjustColumnsSizeAfterResize(template, getColumns(state), widthsData);
    }
  }, 200));
}