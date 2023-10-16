import { freezeTemplate } from "lwc";

import _implicitStylesheets from "./div.css";

import _implicitScopedStylesheets from "./div.scoped.css?scoped=true";

import _lightningPrimitiveDatatableIeditPanel from "lightning/primitiveDatatableIeditPanel";
import _lightningPrimitiveHeaderFactory from "lightning/primitiveHeaderFactory";
import _lightningPrimitiveCellCheckbox from "lightning/primitiveCellCheckbox";
import _lightningPrimitiveCellFactory from "lightning/primitiveCellFactory";
import _lightningPrimitiveDatatableLoadingIndicator from "lightning/primitiveDatatableLoadingIndicator";
import _lightningPrimitiveDatatableStatusBar from "lightning/primitiveDatatableStatusBar";
import {registerTemplate} from "lwc";
const stc0 = {
  attrs: {
    "aria-live": "polite"
  },
  key: 0
};
const stc1 = {
  "data-keyboard-mode": "navigation"
};
const stc2 = {
  "data-keyboard-mode": "action"
};
const stc3 = {
  classMap: {
    "dt-width-observer": true
  },
  styleDecls: [["width", "100%", false], ["height", "0px", false]],
  context: {
    lwc: {
      dom: "manual"
    }
  },
  key: 3
};
const stc4 = {
  classMap: {
    "dt-outer-container": true
  },
  styleDecls: [["height", "100%", false], ["position", "relative", false]],
  key: 4
};
const stc5 = {
  "data-iedit-panel": "true"
};
const stc6 = {
  "slds-scrollable_y": true
};
const stc7 = {
  attrs: {
    "data-rowgroup-header": "",
    "role": "rowgroup"
  },
  key: 9
};
const stc8 = {
  "slds-line-height_reset": true,
  "table-header": true
};
const stc9 = {
  "role": "row",
  "aria-rowindex": "1",
  "data-row-key-value": "HEADER"
};
const stc10 = {
  "column-header": true,
  "cell": true
};
const stc11 = {
  "data-rowgroup-body": "",
  "role": "rowgroup"
};
const stc12 = {
  key: 22
};
const stc13 = {
  "slds-is-relative": true
};
const stc14 = {
  key: 24
};
function tmpl($api, $cmp, $slotset, $ctx) {
  const {d: api_dynamic_text, t: api_text, h: api_element, b: api_bind, c: api_custom_element, gid: api_scoped_id, ti: api_tab_index, k: api_key, i: api_iterator, f: api_flatten} = $api;
  const {_m0, _m1, _m2, _m3, _m4, _m5, _m6, _m7, _m8, _m9, _m10, _m11, _m12, _m13, _m14, _m15} = $ctx;
  return [api_element("span", stc0, [api_element("span", {
    className: $cmp.computedAriaLiveClassForNavMode,
    attrs: stc1,
    key: 1
  }, [api_text(api_dynamic_text($cmp.i18n.ariaLiveNavigationMode))]), api_element("span", {
    className: $cmp.computedAriaLiveClassForActionMode,
    attrs: stc2,
    key: 2
  }, [api_text(api_dynamic_text($cmp.i18n.ariaLiveActionMode))])]), api_element("div", stc3), api_element("div", stc4, [api_custom_element("lightning-primitive-datatable-iedit-panel", _lightningPrimitiveDatatableIeditPanel, {
    attrs: stc5,
    props: {
      "visible": $cmp.state.inlineEdit.isPanelVisible,
      "rowKeyValue": $cmp.state.inlineEdit.rowKeyValue,
      "colKeyValue": $cmp.state.inlineEdit.colKeyValue,
      "editedValue": $cmp.state.inlineEdit.editedValue,
      "columnDef": $cmp.state.inlineEdit.columnDef,
      "isMassEditEnabled": $cmp.state.inlineEdit.massEditEnabled,
      "numberOfSelectedRows": $cmp.state.inlineEdit.massEditSelectedRows,
      "resolvedTypeAttributes": $cmp.state.inlineEdit.resolvedTypeAttributes
    },
    key: 5,
    on: {
      "ieditfinished": _m0 || ($ctx._m0 = api_bind($cmp.handleInlineEditFinish)),
      "masscheckboxchange": _m1 || ($ctx._m1 = api_bind($cmp.handleMassCheckboxChange))
    }
  }), api_element("div", {
    className: $cmp.computedTableContainerClass,
    style: $cmp.scrollerXStyles,
    key: 6,
    on: {
      "scroll": _m2 || ($ctx._m2 = api_bind($cmp.handleHorizontalScroll))
    }
  }, [api_element("div", {
    classMap: stc6,
    style: $cmp.computedScrollerStyle,
    key: 7,
    on: {
      "scroll": _m3 || ($ctx._m3 = api_bind($cmp.handleVerticalScroll))
    }
  }, [api_element("div", {
    className: $cmp.computedTableClass,
    style: $cmp.computedTableStyle,
    attrs: {
      "role": $cmp.computedTableRole,
      "aria-label": $cmp.ariaLabel,
      "aria-labelledby": api_scoped_id($cmp.ariaLabelledBy),
      "aria-rowcount": $cmp.ariaRowCount,
      "aria-colcount": $cmp.ariaColCount,
      "data-num-rows": $cmp.data.length,
      "data-num-selected-rows": $cmp.selectedRows.length,
      "data-last-rendered-row": $cmp._lastRenderedRow
    },
    key: 8,
    on: {
      "keydown": _m4 || ($ctx._m4 = api_bind($cmp.handleTableKeydown)),
      "click": _m5 || ($ctx._m5 = api_bind($cmp.handleCellClick)),
      "focusin": _m6 || ($ctx._m6 = api_bind($cmp.handleTableFocusIn)),
      "focusout": _m7 || ($ctx._m7 = api_bind($cmp.handleTableFocusOut))
    }
  }, [$cmp.hasValidKeyField ? api_element("div", stc7, [api_element("div", {
    classMap: stc8,
    attrs: stc9,
    key: 10,
    on: {
      "privateresizestart": _m8 || ($ctx._m8 = api_bind($cmp.handleResizeStart)),
      "privateresizeend": _m9 || ($ctx._m9 = api_bind($cmp.handleResizeEnd))
    }
  }, api_iterator($cmp.state.columns, function (def, colIndex) {
    return api_element("div", {
      classMap: stc10,
      style: def.style,
      attrs: {
        "role": "columnheader",
        "tabindex": api_tab_index(def.tabIndex),
        "aria-label": def.ariaLabel,
        "aria-sort": def.sortAriaLabel,
        "data-col-key-value": def.colKeyValue
      },
      key: api_key(11, def.colKeyValue)
    }, [def.fixedWidth ? api_custom_element("lightning-primitive-header-factory", _lightningPrimitiveHeaderFactory, {
      style: def.style,
      props: {
        "def": def,
        "dtContextId": $cmp._datatableId,
        "rowKeyValue": "HEADER",
        "colKeyValue": def.colKeyValue,
        "colIndex": colIndex,
        "hasFocus": def.hasFocus,
        "actions": def.actions,
        "sortable": def.sortable,
        "sorted": def.sorted,
        "sortedDirection": def.sortedDirection,
        "columnWidth": def.columnWidth,
        "showCheckbox": $cmp.showSelectAllCheckbox,
        "hideHeader": $cmp.hideTableHeader,
        "wrapTableHeader": $cmp.wrapTableHeader
      },
      key: 12,
      on: {
        "privatecolumnheaderid": _m10 || ($ctx._m10 = api_bind($cmp.handleCheckboxHeaderId))
      }
    }) : null, !def.fixedWidth ? api_custom_element("lightning-primitive-header-factory", _lightningPrimitiveHeaderFactory, {
      style: def.style,
      props: {
        "def": def,
        "dtContextId": $cmp._datatableId,
        "rowKeyValue": "HEADER",
        "colKeyValue": def.colKeyValue,
        "colIndex": colIndex,
        "hasFocus": def.hasFocus,
        "actions": def.actions,
        "sortable": def.sortable,
        "sorted": def.sorted,
        "sortedDirection": def.sortedDirection,
        "columnWidth": def.columnWidth,
        "resizable": $cmp.hasResizebleColumns,
        "resizestep": $cmp.widthsData.resizeStep,
        "hideHeader": $cmp.hideTableHeader,
        "wrapTableHeader": $cmp.wrapTableHeader
      },
      key: 13,
      on: {
        "privatecolumnheaderid": _m11 || ($ctx._m11 = api_bind($cmp.handleCheckboxHeaderId))
      }
    }) : null]);
  }))]) : null, $cmp.hasValidKeyField ? api_element("div", {
    style: $cmp.computedTbodyStyle,
    attrs: stc11,
    key: 14
  }, api_flatten([api_iterator($cmp.renderedRows, function (row) {
    return api_element("div", {
      className: row.classnames,
      style: row.style,
      attrs: {
        "role": "row",
        "data-row-key-value": row.key,
        "aria-selected": row.ariaSelected,
        "aria-level": row.level,
        "aria-expanded": row.isExpanded,
        "aria-setsize": row.setSize,
        "aria-posinset": row.posInSet,
        "aria-rowindex": row.ariaRowIndex,
        "tabindex": api_tab_index(row.tabIndex),
        "data-row-number": row.rowNumber
      },
      key: api_key(15, row.key),
      on: {
        "keydown": _m12 || ($ctx._m12 = api_bind($cmp.handleKeydownOnDataRow)),
        "privatelookupitempicked": _m13 || ($ctx._m13 = api_bind($cmp.handlePrivateLookupItemPicked))
      }
    }, api_iterator(row.cells, function (cell) {
      return [cell.isCheckbox ? api_element("div", {
        className: cell.class,
        style: cell.style,
        attrs: {
          "role": "gridcell",
          "tabindex": api_tab_index(cell.tabIndex),
          "data-label": cell.dataLabel,
          "data-col-key-value": cell.colKeyValue
        },
        key: api_key(16, cell.colKeyValue)
      }, [api_custom_element("lightning-primitive-cell-checkbox", _lightningPrimitiveCellCheckbox, {
        attrs: {
          "data-label": cell.dataLabel
        },
        props: {
          "dtContextId": $cmp._datatableId,
          "hasFocus": cell.hasFocus,
          "rowKeyValue": row.key,
          "colKeyValue": cell.colKeyValue,
          "rowIndex": row.rowIndex,
          "type": row.inputType,
          "isSelected": row.isSelected,
          "isDisabled": row.isDisabled,
          "columnHeaderId": $cmp.computedCheckboxColumnHeaderId
        },
        key: 17
      })]) : null, cell.isDataTypeScope ? api_element("div", {
        className: cell.class,
        style: cell.style,
        attrs: {
          "role": "rowheader",
          "aria-selected": cell.ariaSelected,
          "aria-readonly": cell.ariaReadOnly,
          "tabindex": api_tab_index(cell.tabIndex),
          "data-label": cell.dataLabel,
          "data-col-key-value": cell.colKeyValue
        },
        key: api_key(18, cell.colKeyValue)
      }, [api_custom_element("lightning-primitive-cell-factory", _lightningPrimitiveCellFactory, {
        attrs: {
          "data-label": cell.dataLabel
        },
        props: {
          "types": $cmp.privateTypes,
          "ariaSelected": cell.ariaSelected,
          "alignment": cell.alignment,
          "hasError": cell.hasError,
          "hasFocus": cell.hasFocus,
          "columnLabel": cell.dataLabel,
          "columnType": cell.columnType,
          "columnSubType": cell.columnSubType,
          "wrapText": cell.wrapText,
          "wrapTextMaxLines": cell.wrapTextMaxLines,
          "rowKeyValue": row.key,
          "colKeyValue": cell.colKeyValue,
          "value": cell.value,
          "iconName": cell.iconName,
          "iconLabel": cell.iconLabel,
          "iconPosition": cell.iconPosition,
          "iconAlternativeText": cell.iconAlternativeText,
          "editable": cell.editable,
          "displayReadOnlyIcon": cell.displayReadOnlyIcon,
          "typeAttribute0": cell.typeAttribute0,
          "typeAttribute1": cell.typeAttribute1,
          "typeAttribute2": cell.typeAttribute2,
          "typeAttribute3": cell.typeAttribute3,
          "typeAttribute4": cell.typeAttribute4,
          "typeAttribute5": cell.typeAttribute5,
          "typeAttribute6": cell.typeAttribute6,
          "typeAttribute7": cell.typeAttribute7,
          "typeAttribute8": cell.typeAttribute8,
          "typeAttribute9": cell.typeAttribute9,
          "typeAttribute10": cell.typeAttribute10,
          "typeAttribute21": cell.typeAttribute21,
          "typeAttribute22": cell.typeAttribute22
        },
        key: 19
      })]) : null, cell.isDataType ? api_element("div", {
        className: cell.class,
        style: cell.style,
        attrs: {
          "role": "gridcell",
          "aria-selected": cell.ariaSelected,
          "aria-readonly": cell.ariaReadOnly,
          "tabindex": api_tab_index(cell.tabIndex),
          "data-label": cell.dataLabel,
          "data-col-key-value": cell.colKeyValue
        },
        key: api_key(20, cell.colKeyValue)
      }, [api_custom_element("lightning-primitive-cell-factory", _lightningPrimitiveCellFactory, {
        attrs: {
          "data-label": cell.dataLabel
        },
        props: {
          "types": $cmp.privateTypes,
          "ariaSelected": cell.ariaSelected,
          "alignment": cell.alignment,
          "hasFocus": cell.hasFocus,
          "hasError": cell.hasError,
          "columnLabel": cell.dataLabel,
          "columnType": cell.columnType,
          "columnSubType": cell.columnSubType,
          "wrapText": cell.wrapText,
          "wrapTextMaxLines": cell.wrapTextMaxLines,
          "rowKeyValue": row.key,
          "colKeyValue": cell.colKeyValue,
          "value": cell.value,
          "iconName": cell.iconName,
          "iconLabel": cell.iconLabel,
          "iconPosition": cell.iconPosition,
          "iconAlternativeText": cell.iconAlternativeText,
          "editable": cell.editable,
          "displayReadOnlyIcon": cell.displayReadOnlyIcon,
          "typeAttribute0": cell.typeAttribute0,
          "typeAttribute1": cell.typeAttribute1,
          "typeAttribute2": cell.typeAttribute2,
          "typeAttribute3": cell.typeAttribute3,
          "typeAttribute4": cell.typeAttribute4,
          "typeAttribute5": cell.typeAttribute5,
          "typeAttribute6": cell.typeAttribute6,
          "typeAttribute7": cell.typeAttribute7,
          "typeAttribute8": cell.typeAttribute8,
          "typeAttribute9": cell.typeAttribute9,
          "typeAttribute10": cell.typeAttribute10,
          "typeAttribute21": cell.typeAttribute21,
          "typeAttribute22": cell.typeAttribute22
        },
        key: 21
      })]) : null];
    }));
  }), $cmp.isLoading ? api_element("div", stc12, [api_element("div", {
    classMap: stc13,
    attrs: {
      "colspan": $cmp.numberOfColumns
    },
    key: 23
  }, [api_custom_element("lightning-primitive-datatable-loading-indicator", _lightningPrimitiveDatatableLoadingIndicator, stc14)])]) : null])) : null])])]), $cmp.showStatusBar ? api_custom_element("lightning-primitive-datatable-status-bar", _lightningPrimitiveDatatableStatusBar, {
    props: {
      "error": $cmp.tableError
    },
    key: 25,
    on: {
      "privatesave": _m14 || ($ctx._m14 = api_bind($cmp.handleInlineEditSave)),
      "privatecancel": _m15 || ($ctx._m15 = api_bind($cmp.handleInlineEditCancel))
    }
  }) : null])];
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
tmpl.stylesheetToken = "lwc-4ilbkg7853v";
freezeTemplate(tmpl);
