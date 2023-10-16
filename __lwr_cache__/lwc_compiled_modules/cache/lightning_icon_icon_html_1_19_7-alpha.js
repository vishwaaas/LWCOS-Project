import { freezeTemplate } from "lwc";

import _implicitStylesheets from "./icon.css";

import _implicitScopedStylesheets from "./icon.scoped.css?scoped=true";

import _lightningPrimitiveIcon from "lightning/primitiveIcon";
import {registerTemplate} from "lwc";
const stc0 = {
  "part": "boundary"
};
const stc1 = {
  classMap: {
    "slds-assistive-text": true
  },
  key: 2
};
function tmpl($api, $cmp, $slotset, $ctx) {
  const {c: api_custom_element, d: api_dynamic_text, t: api_text, h: api_element} = $api;
  return [api_element("span", {
    style: $cmp.iconBgColorStyle,
    attrs: stc0,
    key: 0
  }, [api_custom_element("lightning-primitive-icon", _lightningPrimitiveIcon, {
    props: {
      "iconName": $cmp._iconName,
      "size": $cmp.size,
      "variant": $cmp.variant,
      "src": $cmp._src
    },
    key: 1
  }), $cmp.alternativeText ? api_element("span", stc1, [api_text(api_dynamic_text($cmp.alternativeText))]) : null])];
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
tmpl.stylesheetToken = "lwc-4897l11qtae";
freezeTemplate(tmpl);
