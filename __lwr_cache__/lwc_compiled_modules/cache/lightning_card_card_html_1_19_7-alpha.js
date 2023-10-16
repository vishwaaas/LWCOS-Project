import { freezeTemplate } from "lwc";

import _implicitStylesheets from "./card.css";

import _implicitScopedStylesheets from "./card.scoped.css?scoped=true";

import _lightningIcon from "lightning/icon";
import {registerTemplate} from "lwc";
const stc0 = {
  classMap: {
    "slds-card__header": true,
    "slds-grid": true
  },
  key: 1
};
const stc1 = {
  classMap: {
    "slds-media": true,
    "slds-media_center": true,
    "slds-has-flexi-truncate": true
  },
  attrs: {
    "part": "header"
  },
  key: 2
};
const stc2 = {
  classMap: {
    "slds-media__figure": true
  },
  attrs: {
    "part": "icon"
  },
  key: 3
};
const stc3 = {
  classMap: {
    "slds-media__body": true
  },
  attrs: {
    "part": "title"
  },
  key: 5
};
const stc4 = {
  "slds-card__header-title": true
};
const stc5 = {
  classMap: {
    "slds-text-heading_small": true,
    "slds-truncate": true
  },
  key: 7
};
const stc6 = {
  attrs: {
    "name": "title"
  },
  key: 8
};
const stc7 = [];
const stc8 = {
  classMap: {
    "slds-hide": true
  },
  attrs: {
    "name": "title"
  },
  key: 9
};
const stc9 = {
  classMap: {
    "slds-no-flex": true
  },
  attrs: {
    "part": "actions"
  },
  key: 10
};
const stc10 = {
  attrs: {
    "name": "actions"
  },
  key: 11
};
const stc11 = {
  classMap: {
    "slds-card__body": true
  },
  attrs: {
    "part": "body"
  },
  key: 12
};
const stc12 = {
  key: 13
};
const stc13 = {
  classMap: {
    "slds-card__footer": true
  },
  attrs: {
    "part": "footer"
  },
  key: 14
};
const stc14 = {
  attrs: {
    "name": "footer"
  },
  key: 15
};
const stc15 = {
  classMap: {
    "slds-hide": true
  },
  attrs: {
    "name": "footer"
  },
  key: 16
};
function tmpl($api, $cmp, $slotset, $ctx) {
  const {c: api_custom_element, h: api_element, d: api_dynamic_text, t: api_text, s: api_slot} = $api;
  return [api_element("article", {
    className: $cmp.computedWrapperClassNames,
    attrs: {
      "aria-label": $cmp.label,
      "part": "card"
    },
    key: 0
  }, [$cmp.computedHidden ? api_element("div", stc0, [api_element("header", stc1, [$cmp.hasIcon ? api_element("div", stc2, [api_custom_element("lightning-icon", _lightningIcon, {
    props: {
      "iconName": $cmp.iconName,
      "size": "small"
    },
    key: 4
  })]) : null, api_element("div", stc3, [$cmp._hasTitle ? api_element("h2", {
    classMap: stc4,
    attrs: {
      "aria-level": $cmp._privateHeadingAriaLevel
    },
    key: 6
  }, [api_element("span", stc5, [$cmp.hasStringTitle ? api_text(api_dynamic_text($cmp.title)) : null, !$cmp.hasStringTitle ? api_slot("title", stc6, stc7, $slotset) : null])]) : null, !$cmp._hasTitle ? api_slot("title", stc8, stc7, $slotset) : null]), api_element("div", stc9, [api_slot("actions", stc10, stc7, $slotset)])])]) : null, api_element("div", stc11, [api_slot("", stc12, stc7, $slotset)]), $cmp._showFooter ? api_element("div", stc13, [api_slot("footer", stc14, stc7, $slotset)]) : null, !$cmp._showFooter ? api_slot("footer", stc15, stc7, $slotset) : null])];
  /*LWC compiler v3.0.0*/
}
export default registerTemplate(tmpl);
tmpl.slots = ["", "actions", "footer", "title"];
tmpl.stylesheets = [];


if (_implicitStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitStylesheets);
}
if (_implicitScopedStylesheets) {
  tmpl.stylesheets.push.apply(tmpl.stylesheets, _implicitScopedStylesheets);
}
tmpl.stylesheetToken = "lwc-5506cksk72s";
freezeTemplate(tmpl);
