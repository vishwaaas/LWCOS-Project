import { freezeTemplate } from "lwc";

import _implicitStylesheets from "./navbar.css";

import _implicitScopedStylesheets from "./navbar.scoped.css?scoped=true";

import {parseFragment, registerTemplate} from "lwc";
const $fragment1 = parseFragment`<nav${3}><h2${3}>Expense Manager</h2><div${3}><span class="slds-m-right_small slds-truncate${0}"${2}>Vishwas Srivastav</span><a href="/login"${3}><img src="/public/assets/image/logout.svg" alt="logout" height="24" width="24"${3}></a></div></nav>`;
function tmpl($api, $cmp, $slotset, $ctx) {
  const {st: api_static_fragment} = $api;
  return [api_static_fragment($fragment1(), 1)];
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
tmpl.stylesheetToken = "lwc-38n2s6kncb0";
freezeTemplate(tmpl);
