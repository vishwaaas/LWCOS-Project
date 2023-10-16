function stylesheet(token, useActualHostSelector, useNativeDirPseudoclass) {
  var shadowSelector = token ? ("[" + token + "]") : "";
  var hostSelector = token ? ("[" + token + "-host]") : "";
  var suffixToken = token ? ("-" + token) : "";
  return ".slds-table_header-fixed_container" + shadowSelector + "::before {width: 0;}.slds-table_header-fixed_container" + shadowSelector + " > .slds-scrollable_y" + shadowSelector + "::before {width: 100%;border-bottom: 1px solid var(--lwc-colorGray5, #dddbda);content: \"\";display: block;}";
  /*LWC compiler v3.0.0*/
}
export default [stylesheet];