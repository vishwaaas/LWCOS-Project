import { registerDecorators as _registerDecorators, registerComponent as _registerComponent, LightningElement } from "lwc";
import _tmpl from "./datatable.html";
const ACTIONS = [{
  label: 'Edit',
  name: 'edit'
}, {
  label: 'Delete',
  name: 'delete'
}];
const COLUMNS = [{
  label: "Name",
  type: 'text',
  fieldName: 'Expense_Name__c',
  hideDefaultActions: true
}, {
  label: "Amount",
  type: 'currency',
  fieldName: 'Amount__c',
  hideDefaultActions: true,
  cellAttributes: {
    alignment: 'left'
  },
  typeAttributes: {
    currencyCode: 'USD',
    step: '0.001'
  }
}, {
  label: "Expense Date",
  type: 'date',
  fieldName: 'Date__c',
  hideDefaultActions: true
}, {
  label: "Category",
  type: 'text',
  fieldName: 'Category__c',
  hideDefaultActions: true
}, {
  label: "Notes",
  type: 'text',
  fieldName: 'Notes__c',
  hideDefaultActions: true
}, {
  type: 'action',
  typeAttributes: {
    rowActions: ACTIONS
  }
}];
class Datatable extends LightningElement {
  constructor(...args) {
    super(...args);
    this._data = [];
    this.keyField = 'Id';
    this.columns = COLUMNS;
  }
  set records(result) {
    this._data = [...result];
  }
  get records() {
    return this._data;
  }
  handleRowAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;
    if (actionName === "edit") {
      const newEvent = new CustomEvent('edit', {
        detail: row
      });
      this.dispatchEvent(newEvent);
    } else if (actionName === "delete") {
      const newEvent = new CustomEvent('delete', {
        detail: row
      });
      this.dispatchEvent(newEvent);
    } else {}
  }
  /*LWC compiler v3.0.0*/
}
_registerDecorators(Datatable, {
  publicProps: {
    records: {
      config: 3
    }
  },
  fields: ["_data", "keyField", "columns"]
});
export default _registerComponent(Datatable, {
  tmpl: _tmpl,
  sel: "components-datatable",
  apiVersion: 59
});