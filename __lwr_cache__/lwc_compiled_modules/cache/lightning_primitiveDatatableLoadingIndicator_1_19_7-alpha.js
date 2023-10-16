import _tmpl from "./primitiveDatatableLoadingIndicator.html";
import { registerComponent as _registerComponent, LightningElement } from "lwc";
import labelLoading from '@salesforce/label/LightningDatatable.loading';
const i18n = {
  loading: labelLoading
};
class LightningPrimitiveDatatableLoadingIndicator extends LightningElement {
  get i18n() {
    return i18n;
  }
  /*LWC compiler v3.0.0*/
}
export default _registerComponent(LightningPrimitiveDatatableLoadingIndicator, {
  tmpl: _tmpl,
  sel: "lightning-primitive-datatable-loading-indicator",
  apiVersion: 59
});