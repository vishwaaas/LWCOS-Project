import { freezeTemplate } from "lwc";

import _implicitStylesheets from "./formattedLookup.css";

import _implicitScopedStylesheets from "./formattedLookup.scoped.css?scoped=true";

import {registerTemplate} from "lwc";
function tmpl($api, $cmp, $slotset, $ctx) {
  const {ti: api_tab_index, b: api_bind, d: api_dynamic_text, t: api_text, h: api_element} = $api;
  const {_m0} = $ctx;
  return [$cmp.isNavigable ? api_element("a", {
    attrs: {
      "href": $cmp.state.url,
      "tabindex": api_tab_index($cmp.tabIndex)
    },
    key: 0,
    on: {
      "click": _m0 || ($ctx._m0 = api_bind($cmp.handleClick))
    }
  }, [api_text(api_dynamic_text($cmp.displayValue))]) : null, !$cmp.isNavigable ? api_text(api_dynamic_text($cmp.displayValue)) : null];
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
tmpl.stylesheetToken = "lwc-pcg5tcntte";
freezeTemplate(tmpl);
