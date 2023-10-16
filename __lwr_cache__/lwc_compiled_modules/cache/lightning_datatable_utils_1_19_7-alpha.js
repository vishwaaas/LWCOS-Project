const CLASSSET_PROTOTYPE = {
  add(className) {
    if (typeof className === 'string') {
      this[className] = true;
    } else {
      Object.assign(this, className);
    }
    return this;
  },
  invert() {
    Object.keys(this).forEach(key => {
      this[key] = !this[key];
    });
    return this;
  },
  toString() {
    return Object.keys(this).filter(key => this[key]).join(' ');
  }
};

/**
 * function for escaping double quotes, later can be
 * extended in future for any other usecase
 */
export function escapeDoubleQuotes(value) {
  if (typeof value == 'string') {
    return value.replace(/"/g, '\\"');
  }
  return value;
}

/**
 * Determines if a given value is object-like.
 *
 * @param {*} value Any value to check for object-like status
 * @returns {Boolean} Whether the value is object-like
 */
export const isObjectLike = function (value) {
  return typeof value === 'object' && value !== null;
};

/**
 * Creates an object of CSS class names based on a given config.
 * Then, attaches an interface for managing the classes.
 *
 * @param {String | Object} config The initial class configuration
 * @returns An interface, as defined in the `proto` method.
 */
export const classSet = function (config) {
  if (typeof config === 'string') {
    const key = config;
    config = {};
    config[key] = true;
  }
  return Object.assign(Object.create(CLASSSET_PROTOTYPE), config);
};

/**
 * Clamps a value between a minimum and maximum value
 *
 * @param {Number} num The input number
 * @param {Number} min The minimum value the number can be
 * @param {Number} max The maximum value the number can be
 * @returns The clamped number
 */
export const clamp = function (num, min, max) {
  return num <= min ? min : num >= max ? max : num;
};

/**
 * Tests if the value passed in is a value greater than 0.
 *
 * @param {Integer} value Value to test
 * @returns {Boolean} Whether the value is greater than 0
 */
export const isPositiveInteger = function (value) {
  return /^[0-9]*[1-9][0-9]*$/.test(value);
};

/**
 * Tests if the value passed in is 0 or a number greater than 0.
 *
 * @param {Integer} value Value to test
 * @returns {Boolean} Whether the value is greater than or equal to 0
 */
export const isNonNegativeInteger = function (value) {
  return /^\d+$/.test(value);
};

/**
 * Accepts a value which may be an Integer or String and tests that value
 * with respect to the numberType:
 *     a. numberType - positive: if value > 0
 *     b. numberType - non-negative: if value >= 0
 * If the value fails the test, the fallback value is returned
 *
 * @param {String} attrName Name of attribute to normalize
 * @param {Integer | String} value Value to normalize
 * @param {String} numberType Number type to validate against: positive / non-negative
 * @param {Integer} fallback Value to return if validation fails
 * @returns {Integer} Returns normalized value if validation passes; else returns fallback
 */
export function normalizeNumberAttribute(attrName, value, numberType, fallback) {
  let warningMessage;
  if (numberType === 'positive') {
    if (isPositiveInteger(value)) {
      return parseInt(value, 10);
    }
    warningMessage = `The attribute "${attrName}" value passed in is incorrect. "${attrName}" value should be an integer > 0.`;
  } else if (numberType === 'non-negative') {
    if (isNonNegativeInteger(value)) {
      return parseInt(value, 10);
    }
    warningMessage = `The attribute "${attrName}" value passed in is incorrect. "${attrName}" value should be an integer >= 0.`;
  } else {
    warningMessage = 'Invalid number type during normalization of number attribute';
  }
  // eslint-disable-next-line no-console
  console.warn(warningMessage);
  return fallback;
}

/**
 * Utility for calculating the scroll offset.
 *
 * TODO: move into scroller-specific utility when more scroll-related functionality
 * needs to be shared between libraries.
 *
 * @param {HTMLElement} el Target element of the scroll
 * @returns {Number} The scroll offset from the table's end
 */
export function getScrollOffsetFromTableEnd(el) {
  return el.scrollHeight - el.parentNode.scrollTop - el.parentNode.clientHeight;
}

/**
 * Utility for converting arrays and plain objects to style strings.
 *
 * @param {Array | Object} style The CSS style array/object
 * @returns {String} Representing array/object as a string
 */
export function styleToString(style) {
  if (!Array.isArray(style)) {
    return Object.entries(style).map(([key, value]) => `${key}:${value}`).join(';');
  }
  return style.join(';');
}