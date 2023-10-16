function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var Phase = /*#__PURE__*/function (Phase) {
  Phase[Phase["Start"] = 0] = "Start";
  Phase[Phase["End"] = 1] = "End";
  return Phase;
}(Phase || {});
// Attach a custom dispatcher
let customDispatcher;
export function attachDispatcher(dispatcher) {
  customDispatcher = dispatcher;
}

// Check if the Performance API is available
// e.g. JSDom (used in Jest) doesn't implement these
const perf = globalThis.performance;
const isPerfSupported = typeof perf !== 'undefined' && typeof perf.mark === 'function' && typeof perf.clearMarks === 'function' && typeof perf.measure === 'function' && typeof perf.clearMeasures === 'function';
function getMeasureName(id, specifier) {
  return specifier ? `${id}-${specifier}` : id;
}
function getMarkName(id, specifier, specifierIndex) {
  const measureName = getMeasureName(id, specifier);
  return specifier && specifierIndex ? `${measureName}_${specifierIndex}` : measureName;
}
function getDetail(specifier, metadata) {
  const detail = specifier || metadata ? _objectSpread({}, metadata) : null;
  if (detail && specifier) {
    detail['specifier'] = specifier;
  }
  return detail;
}

// For marking request metrics
// Fallback to the Performance API if there is no custom dispatcher
export function logOperationStart({
  id,
  specifier,
  specifierIndex,
  metadata
}) {
  if (customDispatcher) {
    customDispatcher({
      id,
      phase: Phase.Start,
      specifier,
      metadata
    });
    return;
  }
  if (isPerfSupported) {
    const markName = getMarkName(id, specifier, specifierIndex);
    const detail = getDetail(specifier, metadata);
    perf.mark(markName, {
      detail
    });
  }
}

// For measuring duration metrics
// Fallback to the Performance API if there is no custom dispatcher
/* istanbul ignore next */
export function logOperationEnd({
  id,
  specifier,
  specifierIndex,
  metadata
}) {
  if (customDispatcher) {
    customDispatcher({
      id,
      phase: Phase.End,
      specifier,
      metadata
    });
  } else if (isPerfSupported) {
    const markName = getMarkName(id, specifier, specifierIndex);
    const measureName = getMeasureName(id, specifier);
    const detail = getDetail(specifier, metadata);
    perf.measure(measureName, {
      start: markName,
      detail
    });

    // Clear the created mark and measure to avoid filling the performance entry buffer
    // Even if they get deleted, existing PerformanceObservers preserve copies of the entries
    perf.clearMarks(markName);
    perf.clearMeasures(measureName);
  }
}