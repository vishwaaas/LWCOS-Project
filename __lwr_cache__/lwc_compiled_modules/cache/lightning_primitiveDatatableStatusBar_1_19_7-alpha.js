import { registerDecorators as _registerDecorators, registerComponent as _registerComponent, LightningElement } from "lwc";
import _tmpl from "./primitiveDatatableStatusBar.html";
import labelSave from '@salesforce/label/LightningDatatable.save';
import labelCancel from '@salesforce/label/LightningDatatable.cancel';
import labelError from '@salesforce/label/LightningDatatable.error';
const i18n = {
  save: labelSave,
  cancel: labelCancel,
  error: labelError
};
class LightningPrimitiveDatatableStatusBar extends LightningElement {
  constructor(...args) {
    super(...args);
    this.privateError = {};
  }
  get error() {
    return this.privateError;
  }
  set error(value) {
    this.privateError = value;
    if (this.showError && this.isSaveBtnFocused()) {
      this.handleShowError();
    }
  }
  get i18n() {
    return i18n;
  }
  get showError() {
    const {
      error
    } = this;
    return error && (error.title || error.messages);
  }
  get showErrorBubble() {
    const {
      error
    } = this;
    return error && error.showBubble;
  }
  get bubbleOffset() {
    // move bubble above the docked bar since docked bar has higher z-index
    // and can block the nubbin of the bubble
    return {
      vertical: -10
    };
  }
  isSaveBtnFocused() {
    return this.template.querySelector('button.save-btn:focus') !== null;
  }
  handleCancelButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dispatchEvent(new CustomEvent('privatecancel', {
      bubbles: true,
      composed: true,
      cancelable: true
    }));
  }
  handleSaveButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    // safari and firefox does not focus on click.
    if (document.activeElement !== event.target) {
      event.target.focus();
    }
    this.dispatchEvent(new CustomEvent('privatesave', {
      bubbles: true,
      composed: true,
      cancelable: true
    }));
  }

  /**
   * Handling between displaying/focusing tooltip icon and/or error bubble
   * If showBubble property is set within error object, display/focus the error bubble.
   * Otherwise, display/focus the tooltip icon only.
   */
  handleShowError() {
    Promise.resolve().then(() => {
      const trigger = this.template.querySelector('lightning-primitive-datatable-tooltip');
      if (trigger) {
        if (this.showErrorBubble) {
          trigger.showBubble();
        } else {
          trigger.focus();
        }
      }
    });
  }
  /*LWC compiler v3.0.0*/
}
_registerDecorators(LightningPrimitiveDatatableStatusBar, {
  publicProps: {
    error: {
      config: 3
    }
  },
  track: {
    privateError: 1
  }
});
export default _registerComponent(LightningPrimitiveDatatableStatusBar, {
  tmpl: _tmpl,
  sel: "lightning-primitive-datatable-status-bar",
  apiVersion: 59
});