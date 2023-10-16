import { registerDecorators as _registerDecorators, registerComponent as _registerComponent, LightningElement } from "lwc";
import _tmpl from "./primitiveDatatableIeditPanel.html";
import labelEdit from '@salesforce/label/LightningDatatable.edit';
import labelUpdateSelectedItems from '@salesforce/label/LightningDatatable.updateSelectedItems';
import labelCancel from '@salesforce/label/LightningDatatable.cancel';
import labelApply from '@salesforce/label/LightningDatatable.apply';
import { InteractingState } from 'lightning/inputUtils';
import { formatLabel } from 'lightning/utils';
const i18n = {
  edit: labelEdit,
  updateSelectedItems: labelUpdateSelectedItems,
  cancel: labelCancel,
  apply: labelApply
};
class PrimitiveDatatableIeditPanel extends LightningElement {
  constructor(...args) {
    super(...args);
    this._forceRerenderHackKey = [''];
    /************************* PUBLIC PROPERTIES *************************/
    this.visible = void 0;
    this.rowKeyValue = void 0;
    this.colKeyValue = void 0;
    this.editedValue = void 0;
    this.columnDef = void 0;
    this.isMassEditEnabled = false;
    this.numberOfSelectedRows = void 0;
    this.resolvedTypeAttributes = void 0;
  }
  /**
   * Checked when opening an edit panel to see if it's valid
   * Logs an error if type is custom but does not have the
   * required editTemplate with [data-inputable="true"] element
   */
  get isEditableValid() {
    if (!this.columnDef.editableCustomType || this.inputableElement.isEditableCustomValid) {
      return true;
    } else if (this.columnDef.editableCustomType) {
      console.error('Editable custom types must define an editTemplate that includes an element with attribute data-inputable set to "true"');
    }
    return false;
  }

  /**
   * Returns whether or not the mass edit update checkbox is selected
   */
  get isMassEditChecked() {
    return this.isMassEditEnabled && this.template.querySelector('[data-mass-selection="true"]').checked;
  }

  /**
   * Returns the value of the input in the inline edit panel
   * This is retrieved typically when processing inline edit completion
   */
  get value() {
    return this.inputableElement ? this.inputableElement.value : null;
  }

  /**
   * Returns the validity state object of the input in the inline edit panel
   */
  get validity() {
    return this.inputableElement.validity;
  }

  /************************* PUBLIC METHODS *************************/

  /**
   * Focuses on the input element in the inline edit panel
   */
  focus() {
    const elem = this.inputableElement;
    this.interactingState.enter();
    if (elem) {
      elem.focus();
    }
  }

  /**
   * Returns the <section> element which is the container of the
   * positioned inline edit panel
   */
  getPositionedElement() {
    return this.template.querySelector('section');
  }

  /************************* PRIVATE GETTERS *************************/

  get computedStyle() {
    const styleHash = {
      'z-index': 1000,
      'background-color': 'white',
      'margin-top': '1px'
    };
    styleHash.display = this.visible ? 'block' : 'none';
    return Object.keys(styleHash).map(styleProp => `${styleProp}:${styleHash[styleProp]}`).join(';');
  }
  get inputableElement() {
    return this.template.querySelector('.dt-type-edit-factory');
  }
  get inputKey() {
    return this.rowKeyValue + this.colKeyValue;
  }
  get required() {
    return this.columnDef.typeAttributes && this.columnDef.typeAttributes.required;
  }
  get massEditCheckboxLabel() {
    return formatLabel(i18n.updateSelectedItems, this.numberOfSelectedRows);
  }
  get dialogAriaLabel() {
    const columnName = this.columnDef.label;
    return `${i18n.edit} ${columnName}`;
  }
  get i18n() {
    return i18n;
  }

  /************************* EVENT HANDLERS *************************/

  /**
   * Handles tabbing backwards out of the inline edit panel from the first form element.
   * If mass edit is enabled, this will set the focus on the last element in the panel - traps focus.
   * If mass edit is not enabled, it will process completion of inline edit
   */
  handleFormStartFocus() {
    this.interactingState.enter();
    if (this.isMassEditEnabled) {
      // on mass edit the panel dont loses the focus with the keyboard.
      this.focusLastElement();
    } else {
      this.triggerEditFinished({
        reason: 'tab-pressed-prev'
      });
    }
  }

  /**
   * Handles tabbing forwards out of the inline edit panel from the last form element.
   * If mass edit is enabled, this will set focus on the first element in the panel - traps focus.
   * If mass edit is not enabled, it will process the completion of inline edit
   */
  handleFormEndsFocus() {
    this.interactingState.enter();
    if (this.isMassEditEnabled) {
      // on mass edit the panel dont loses the focus with the keyboard.
      this.focus();
    } else {
      this.triggerEditFinished({
        reason: 'tab-pressed-next'
      });
    }
  }

  /**
   * This is executed when interactingState.leave is triggered
   * which happens when the inline edit panel loses focus
   */
  handlePanelLostFocus() {
    if (this.visible) {
      this.triggerEditFinished({
        reason: 'lost-focus'
      });
    }
  }
  handleTypeElemFocus() {
    this.interactingState.enter();
  }
  handleTypeElemBlur() {
    if (this.visible && !this.template.activeElement) {
      this.interactingState.leave();
    }
  }
  handleEditFormSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.isMassEditEnabled) {
      this.processSubmission();
    }
    return false;
  }

  /**
   * If the Escape key is pressed on the inline edit panel,
   * we prevent default action, stop propagation of the event
   * and close the inline edit panel
   *
   * @param {KeyboardEvent} event - keydown
   */
  handleCellKeydown(event) {
    const {
      keyCode
    } = event;
    if (keyCode === 27) {
      // Esc key
      event.preventDefault();
      event.stopPropagation();
      this.cancelEditing();
    }
  }

  /************************* EVENT DISPATCHERS *************************/

  /**
   * Change handler for the mass edit checkbox.
   * Dispatches the `masscheckboxchange` event along with the new checked value
   *
   * @param {CustomEvent} event - `change` event from lightning-input
   */
  handleMassCheckboxChange(event) {
    const customEvent = new CustomEvent('masscheckboxchange', {
      detail: {
        checked: event.detail.checked
      }
    });
    this.dispatchEvent(customEvent);
  }

  /**
   * Dispatches the `ieditfinished` event with the detail object containing
   * the reason for inline edit finishing and the rowKeyValue and colKeyValue
   * with which the particular cell which was edited can be identified.
   *
   * @param {Object} detail - typically contains the reason for inline edit finishing
   */
  triggerEditFinished(detail) {
    detail.rowKeyValue = detail.rowKeyValue || this.rowKeyValue;
    detail.colKeyValue = detail.colKeyValue || this.colKeyValue;
    const event = new CustomEvent('ieditfinished', {
      detail
    });
    this.dispatchEvent(event);
  }

  /************************* LIFECYCLE HOOKS *************************/

  connectedCallback() {
    this.interactingState = new InteractingState({
      duration: 10,
      debounceInteraction: true
    });
    this.interactingState.onleave(() => this.handlePanelLostFocus());
  }

  /************************* HELPER FUNCTIONS *************************/

  focusLastElement() {
    this.template.querySelector('[data-form-last-element="true"]').focus();
  }
  processSubmission() {
    if (this.validity.valid) {
      this.triggerEditFinished({
        reason: 'submit-action'
      });
    } else {
      this.inputableElement.showHelpMessageIfInvalid();
    }
  }
  cancelEditing() {
    this.triggerEditFinished({
      reason: 'edit-canceled'
    });
  }
  /*LWC compiler v3.0.0*/
}
_registerDecorators(PrimitiveDatatableIeditPanel, {
  publicProps: {
    visible: {
      config: 0
    },
    rowKeyValue: {
      config: 0
    },
    colKeyValue: {
      config: 0
    },
    editedValue: {
      config: 0
    },
    columnDef: {
      config: 0
    },
    isMassEditEnabled: {
      config: 0
    },
    numberOfSelectedRows: {
      config: 0
    },
    resolvedTypeAttributes: {
      config: 0
    },
    isEditableValid: {
      config: 1
    },
    isMassEditChecked: {
      config: 1
    },
    value: {
      config: 1
    },
    validity: {
      config: 1
    }
  },
  publicMethods: ["focus", "getPositionedElement"],
  fields: ["_forceRerenderHackKey"]
});
export default _registerComponent(PrimitiveDatatableIeditPanel, {
  tmpl: _tmpl,
  sel: "lightning-primitive-datatable-iedit-panel",
  apiVersion: 59
});