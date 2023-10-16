import { freezeTemplate } from "lwc";

import _implicitStylesheets from "./datatable.css";

import _implicitScopedStylesheets from "./datatable.scoped.css?scoped=true";

import _lightningDatatable from "lightning/datatable";
import {parseFragment, registerTemplate} from "lwc";
const $fragment1 = parseFragment`<h1${3}>I am Datatable</h1>`;
function tmpl($api, $cmp, $slotset, $ctx) {
  const {b: api_bind, c: api_custom_element, st: api_static_fragment} = $api;
  const {_m0} = $ctx;
  return [api_custom_element("lightning-datatable", _lightningDatatable, {
    props: {
      "keyField": $cmp.keyField,
      "data": $cmp.records,
      "columns": $cmp.columns,
      "hideCheckboxColumn": true,
      "showRowNumberColumn": true,
      "minColoumnWidth": "200"
    },
    key: 0,
    on: {
      "rowaction": _m0 || ($ctx._m0 = api_bind($cmp.handleRowAction))
    }
  }), api_static_fragment($fragment1(), 2)];
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
tmpl.stylesheetToken = "lwc-3m05f0smqns";
freezeTemplate(tmpl);
