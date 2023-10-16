import { freezeTemplate } from "lwc";

import _implicitStylesheets from "./home.css";

import _implicitScopedStylesheets from "./home.scoped.css?scoped=true";

import _componentsNavbar from "components/navbar";
import _componentsDatatable from "components/datatable";
import _lightningCard from "lightning/card";
import {registerTemplate} from "lwc";
const stc0 = {
  key: 0
};
const stc1 = {
  classMap: {
    "slds-p-around_large": true,
    "wrapper": true
  },
  key: 1
};
const stc2 = {
  props: {
    "title": "Expenses Details"
  },
  key: 2
};
function tmpl($api, $cmp, $slotset, $ctx) {
  const {c: api_custom_element, b: api_bind, h: api_element} = $api;
  const {_m0, _m1} = $ctx;
  return [api_custom_element("components-navbar", _componentsNavbar, stc0), api_element("div", stc1, [api_custom_element("lightning-card", _lightningCard, stc2, [api_custom_element("components-datatable", _componentsDatatable, {
    props: {
      "records": $cmp.expenseRecords
    },
    key: 3,
    on: {
      "edit": _m0 || ($ctx._m0 = api_bind($cmp.editHandler)),
      "delete": _m1 || ($ctx._m1 = api_bind($cmp.deleteHandler))
    }
  })])])];
  /*LWC compiler v3.0.0*/
}
export default registerTemplate(tmpl);
tmpl.stylesheets = [];


if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}
if (_implicitScopedStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitScopedStylesheets);
}
tmpl.stylesheetToken = "lwc-6le4c39rot8";
freezeTemplate(tmpl);
