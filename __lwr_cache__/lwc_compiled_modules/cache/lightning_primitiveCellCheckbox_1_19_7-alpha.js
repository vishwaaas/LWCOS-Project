import { registerDecorators as _registerDecorators, registerComponent as _registerComponent } from "lwc";
import _tmpl from "./primitiveCellCheckbox.html";
import labelSelectItem from '@salesforce/label/LightningDatatable.selectItem';
import PrimitiveDatatableCell from 'lightning/primitiveDatatableCell';
import { keyCodes, getRealDOMId, synchronizeAttrs } from 'lightning/utilsPrivate';
import checkbox from './checkbox.html';
import radio from './radio.html';
const i18n = {
  selectItem: labelSelectItem
};
class PrimitiveCellCheckbox extends PrimitiveDatatableCell {
  constructor(...args) {
    super(...args);
    this._columnHeaderId = '';
    this.rowIndex = 0;
    this.isSelected = false;
    this.isDisabled = false;
    this.type = 'checkbox';
    this.dtContextId = void 0;
  }
  get columnHeaderId() {
    return this._columnHeaderId;
  }
  set columnHeaderId(id) {
    this._columnHeaderId = id || '';
    const labelId = this.computedLabelId;
    if (labelId) {
      synchronizeAttrs(this.template.querySelector('input'), {
        'aria-labelledby': `${labelId} ${this._columnHeaderId}`
      });
    }
  }
  render() {
    if (this.type === 'radio') {
      return radio;
    }
    return checkbox;
  }
  renderedCallback() {
    //give input the correct aria-labelledby value
    synchronizeAttrs(this.template.querySelector('input'), {
      'aria-labelledby': `${this.computedLabelId} ${this.columnHeaderId}`
    });
  }
  get computedLabelId() {
    return getRealDOMId(this.template.querySelector('label'));
  }
  get selectItemAssistiveText() {
    return `${i18n.selectItem} ${this.rowIndex + 1}`;
  }
  get labelId() {
    //give different ids for radio vs checkbox inputs
    const labelType = this.type === 'radio' ? 'radio' : 'check';
    return `${labelType}-button-label-${this.rowIndex + 1}`;
  }
  get computedOptionName() {
    return `${this.dtContextId}-options`;
  }
  handleRadioClick(event) {
    event.stopPropagation();
    if (!this.isSelected) {
      this.dispatchSelection(false);
    }
  }

  /**
   * We control the checkbox behaviour with the state and we handle it in the container,
   * but we need to prevent default in order to avoid the checkbox to change state
   * with the click and the generated click in the input from the label
   *
   * @param {Object} event - click event of the checkbox
   */
  handleCheckboxClick(event) {
    // click was catch on the input, stop propagation to avoid to be handled in container.
    // ideally you can let it bubble and be handled in there, but there is a raptor issue:
    // https://git.soma.salesforce.com/raptor/raptor/issues/838
    event.stopPropagation();
    this.dispatchSelection(event.shiftKey);
  }
  handleCheckboxContainerClick(event) {
    if (!this.isDisabled) {
      // click was catch in the label, the default its to activate the checkbox,
      // lets prevent it to avoid to send a double event.
      event.preventDefault();
      this.dispatchSelection(event.shiftKey);
    }
  }
  handleCheckboxContainerMouseDown(event) {
    // Prevent selecting text by Shift+click
    if (event.shiftKey) {
      event.preventDefault();
    }
  }
  handleRadioKeyDown(event) {
    const keyCode = event.keyCode;
    if (keyCode === keyCodes.left || keyCode === keyCodes.right) {
      // default behavior for radios is to select the prev/next radio with the same name
      event.preventDefault();
    }
  }
  dispatchSelection(isMultipleSelection) {
    const {
      rowKeyValue,
      colKeyValue
    } = this;
    const actionName = !this.isSelected ? 'selectrow' : 'deselectrow';
    // eslint-disable-next-line lightning-global/no-custom-event-identifier-arguments
    const actionEvent = new CustomEvent(actionName, {
      bubbles: true,
      composed: true,
      detail: {
        rowKeyValue,
        colKeyValue,
        isMultiple: isMultipleSelection
      }
    });
    this.dispatchEvent(actionEvent);
  }
  /*LWC compiler v3.0.0*/
}
_registerDecorators(PrimitiveCellCheckbox, {
  publicProps: {
    rowIndex: {
      config: 0
    },
    isSelected: {
      config: 0
    },
    isDisabled: {
      config: 0
    },
    type: {
      config: 0
    },
    dtContextId: {
      config: 0
    },
    columnHeaderId: {
      config: 3
    }
  },
  fields: ["_columnHeaderId"]
});
export default _registerComponent(PrimitiveCellCheckbox, {
  tmpl: _tmpl,
  sel: "lightning-primitive-cell-checkbox",
  apiVersion: 59
});