import { registerDecorators as _registerDecorators, registerComponent as _registerComponent, LightningElement } from "lwc";
import _tmpl from "./formattedLookup.html";
import { normalizeBoolean } from 'lightning/utilsPrivate';
import { getLinkInfo } from 'lightning/routingService';
import { PrivateLookupItemPickedEvent } from './events';
export const EVENTS = {
  PrivateLookupItemPickedEvent
};
class LightningFormattedLookup extends LightningElement {
  /**
   * @param {string} value - The record id to point to.
   */
  set recordId(value) {
    // hanging value on state makes sure changes
    // trigger a re-render
    this.state.recordId = value;
    // re-fetch url info
    this.updateLinkData();
  }
  get recordId() {
    return this.state.recordId;
  }

  /**
   * {boolean} Determines if the output is navigable or not along
   * with the url and dispatcher returned from routing-service
   */
  get disabled() {
    return this.state.disabled;
  }
  set disabled(value) {
    this.state.disabled = normalizeBoolean(value);
    this.isNavigable = !this.disabled && !!this.dispatcher && !!this.state.url;
  }
  constructor() {
    super();
    /**
     * {string} The related name/record name to display
     */
    this.displayValue = void 0;
    /**
     * Reserved for internal use. Use tabindex instead to indicate if an element should be focusable.
     * A value of 0 means that the element is focusable and
     * participates in sequential keyboard navigation. A value of -1 means
     * that the element is focusable but does not participate in keyboard navigation.
     * @type {number}
     *
     */
    this.tabIndex = void 0;
    this._connected = void 0;
    // Specifies whether we need to dynamically manage the data-navigation attribute
    // to reflect whether we are focusable or not. "data-navigation" is used by datatable
    // to determine whether a custom element is focusable
    this._dataNavigation = void 0;
    this.dispatcher = void 0;
    this.state = {
      disabled: false,
      recordId: null,
      url: null,
      isNavigable: false
    };
    this._connected = false;
    this.dispatcher = null;
  }

  /**
   * Lifecycle callback for connected.
   * @returns {undefined}
   */
  connectedCallback() {
    // this is to guard getLinkInfo, which will
    // not work if called before the component is connected
    this._connected = true;
    this.updateLinkData();

    // "data-navigation" is part of the public API for building an accessible cell component
    // for use inside lightning-datatable and lightning-tree-grid. Because this component is
    // only conditionally focusable, we need to check for its existence to determine whether
    // we need to manage it dynamically.
    if (this.getAttribute('data-navigation') === 'enable') {
      this._dataNavigation = true;
      this.removeAttribute('data-navigation');
    }
  }

  /**
   * Lifecycle callback for disconnected
   * @returns {undefined}
   */
  disconnectedCallback() {
    this._connected = false;
  }

  /**
   * Sets focus on the element.
   */
  focus() {
    if (this.anchor) {
      this.anchor.focus();
    }
  }

  /**
   * Removes keyboard focus from the element.
   */
  blur() {
    if (this.anchor) {
      this.anchor.blur();
    }
  }

  /**
   * Simulates a mouse click on the url and navigates to it using the specified target.
   */
  click() {
    if (this.anchor) {
      this.anchor.click();
    }
  }
  get anchor() {
    if (this._connected && this.isNavigable) {
      return this.template.querySelector('a');
    }
    return undefined;
  }
  get isNavigable() {
    return this.state.isNavigable;
  }
  set isNavigable(value) {
    const normalizedValue = normalizeBoolean(value);
    this.state.isNavigable = normalizedValue;
    if (this._connected && this._dataNavigation) {
      if (normalizedValue) {
        this.setAttribute('data-navigation', 'enable');
      } else {
        this.removeAttribute('data-navigation');
      }
    }
  }

  /**
   * Fetch info for the link url
   * async, updates this.state
   * @returns {undefined}
   */
  updateLinkData() {
    if (this._connected && this.state.recordId) {
      getLinkInfo(this, {
        stateType: 'standard__recordPage',
        attributes: {
          recordId: this.state.recordId,
          actionName: 'view'
        }
      }).then(linkInfo => {
        this.state.url = linkInfo.url;
        this.dispatcher = linkInfo.dispatcher;
        this.isNavigable = !this.disabled && !!this.dispatcher && !!this.state.url;
      });
    }
  }

  /**
   * Handles the click event on the link.
   * @param {Event} event The event that triggered this handler.
   * @returns {undefined}
   */
  handleClick(event) {
    this.dispatchEvent(new PrivateLookupItemPickedEvent({
      recordId: this.recordId
    }));
    this.dispatcher(event);
  }
  /*LWC compiler v3.0.0*/
}
_registerDecorators(LightningFormattedLookup, {
  publicProps: {
    displayValue: {
      config: 0
    },
    tabIndex: {
      config: 0
    },
    recordId: {
      config: 3
    },
    disabled: {
      config: 3
    }
  },
  publicMethods: ["focus", "blur", "click"],
  track: {
    state: 1
  },
  fields: ["_connected", "_dataNavigation", "dispatcher"]
});
export default _registerComponent(LightningFormattedLookup, {
  tmpl: _tmpl,
  sel: "lightning-formatted-lookup",
  apiVersion: 59
});