function stylesheet(token, useActualHostSelector, useNativeDirPseudoclass) {
  var shadowSelector = token ? ("[" + token + "]") : "";
  var hostSelector = token ? ("[" + token + "-host]") : "";
  var suffixToken = token ? ("-" + token) : "";
  return "nav" + shadowSelector + "{background-color: #01a479;color: #fff;display: flex;padding: 16px;justify-content: space-between;}.logout-icon" + shadowSelector + "{--slds-c-icon-color-foreground-default:#fff;}";
  /*LWC compiler v3.0.0*/
}
export default [stylesheet];