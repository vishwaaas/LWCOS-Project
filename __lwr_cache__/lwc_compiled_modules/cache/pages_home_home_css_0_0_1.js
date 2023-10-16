function stylesheet(token, useActualHostSelector, useNativeDirPseudoclass) {
  var shadowSelector = token ? ("[" + token + "]") : "";
  var hostSelector = token ? ("[" + token + "-host]") : "";
  var suffixToken = token ? ("-" + token) : "";
  return ".wrapper" + shadowSelector + "{background-color: #002249;min-height: 100vh;}";
  /*LWC compiler v3.0.0*/
}
export default [stylesheet];