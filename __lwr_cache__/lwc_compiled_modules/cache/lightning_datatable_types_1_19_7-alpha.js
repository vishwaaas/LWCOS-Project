import { registerDecorators as _registerDecorators, registerComponent as _registerComponent } from "lwc";
import _tmpl from "./types.html";
import { assert } from 'lightning/utilsPrivate';
const STANDARD_TYPES = {
  text: ['linkify'],
  boolean: true,
  number: ['minimumIntegerDigits', 'minimumFractionDigits', 'maximumFractionDigits', 'minimumSignificantDigits', 'maximumSignificantDigits'],
  currency: ['currencyCode', 'currencyDisplayAs', 'minimumIntegerDigits', 'minimumFractionDigits', 'maximumFractionDigits', 'minimumSignificantDigits', 'maximumSignificantDigits'],
  percent: ['minimumIntegerDigits', 'minimumFractionDigits', 'maximumFractionDigits', 'minimumSignificantDigits', 'maximumSignificantDigits'],
  email: true,
  date: ['day', 'era', 'hour', 'hour12', 'minute', 'month', 'second', 'timeZone', 'timeZoneName', 'weekday', 'year'],
  'date-local': ['day', 'month', 'year'],
  phone: true,
  url: ['label', 'target', 'tooltip'],
  location: true,
  reference: ['displayValue'],
  rowNumber: ['error'],
  action: ['menuAlignment', 'rowActions'],
  button: ['variant', 'label', 'iconName', 'iconPosition', 'disabled', 'name', 'class', 'title'],
  'button-icon': ['variant', 'alternativeText', 'iconName', 'iconClass', 'disabled', 'name', 'class', 'title'],
  tree: ['hasChildren', 'isExpanded', 'level', 'setSize', 'posInSet', 'subType']
};
const TREE_SUPPORTED_TYPES = {
  text: true,
  url: true,
  date: true,
  number: true,
  currency: true,
  percent: true,
  button: true,
  'button-icon': true,
  reference: true
};
const EDITABLE_STANDARD_TYPES = {
  text: true,
  percent: true,
  phone: true,
  email: true,
  url: true,
  currency: true,
  number: true,
  boolean: true,
  'date-local': true,
  date: true
};

/**
 * Determines if a supplied type is a valid datatable type.
 *
 * @param {String} typeName The type to validate
 * @returns {Boolean} Whether the supplied type is valid
 */
export function isValidType(typeName) {
  return !!STANDARD_TYPES[typeName];
}

/**
 * Determines if a supplied type is a tree type.
 *
 * @param {String} typeName The type to validate
 * @returns {Boolean} Whether the supplied type is a tree type
 */
export function isTreeType(typeName) {
  return typeName === 'tree';
}

/**
 * Determines if a supplied type is valid for a tree type datatable.
 *
 * @param {String} typeName The type to validate
 * @returns {Boolean} Whether the supplied type is valid for a tree
 */
export function isValidTypeForTree(typeName) {
  return !!TREE_SUPPORTED_TYPES[typeName];
}

/**
 * Retrieves the attributes for a given type. Additionally, verifies
 * the supplied type is valid.
 *
 * @param {String} typeName The type to get the attributes for
 * @returns {Array} An array of attributes for the supplied type
 */
export function getAttributesNames(typeName) {
  assert(isValidType(typeName), `You are trying to access an invalid type (${typeName})`);
  return getStandardTypeAttributesNames(typeName);
}

/**
 * Retrieves the attributes for a given type.
 *
 * @param {String} typeName The type to get the attributes for
 * @returns {Array} An array of attributes for the supplied type
 */
function getStandardTypeAttributesNames(typeName) {
  return Array.isArray(STANDARD_TYPES[typeName]) ? STANDARD_TYPES[typeName] : [];
}

/**
 * A class for handling valid datatable types.
 */
class DatatableTypes {
  constructor(types) {
    this.privateCustomTypes = {};
    this.isValidTypeForTree = isValidTypeForTree;
    if (typeof types === 'object' && types !== null) {
      Object.keys(types).reduce((seed, key) => {
        const {
          template,
          editTemplate,
          typeAttributes = [],
          standardCellLayout = false
        } = types[key];
        seed[key] = {
          template,
          editTemplate,
          typeAttributes,
          standardCellLayout: standardCellLayout === true,
          type: 'custom'
        };
        return seed;
      }, this.privateCustomTypes);
    }
  }

  /**
   * Retrieves a type. If the specified type is not a custom type,
   * lookup the type in our standard types. Otherwise, return undefined.
   *
   * @param {String} typeName The type to retrieve
   * @returns {Object | Undefined} The type metadata
   */
  getType(typeName) {
    if (this.privateCustomTypes[typeName]) {
      return this.privateCustomTypes[typeName];
    }
    if (STANDARD_TYPES[typeName]) {
      return {
        typeAttributes: getStandardTypeAttributesNames(typeName),
        type: 'standard'
      };
    }
    return undefined;
  }

  /**
   * Retrieves a custom type's edit template if it exists.
   *
   * @param {String} typeName The custom type to retrieve
   * @returns {Object | Undefined} The custom type's edit template
   */
  getCustomTypeEditTemplate(typeName) {
    if (this.privateCustomTypes[typeName]) {
      return this.privateCustomTypes[typeName].editTemplate;
    }
    return undefined;
  }

  /**
   * Determines if a type is a valid custom or standard type.
   *
   * @param {String} typeName The type to validate
   * @returns {Boolean} Whether the type is valid
   */
  isValidType(typeName) {
    return !!this.getType(typeName);
  }

  /**
   * Determines if a given type is editable.
   *
   * @param {String} typeName The type to test
   * @returns {Boolean} Whether the type is editable
   */
  isEditableType(typeName) {
    return !!EDITABLE_STANDARD_TYPES[typeName] || this.isStandardCellLayoutForCustomType(typeName);
  }

  /**
   * Determines if a given type is a non-standard type.
   *
   * @param {String} typeName The type to test
   * @returns {Boolean} Whether the type is a non-standard type
   */
  isCustomType(typeName) {
    return this.getType(typeName) && this.getType(typeName).type === 'custom';
  }

  /**
   * Determines whether or not a given custom type is using a standard cell layout.
   *
   * @param {String} typeName The custom type to test
   * @returns {Boolean} Whether the custom type is using a standard cell layout
   */
  isStandardCellLayoutForCustomType(typeName) {
    return this.isCustomType(typeName) && this.getType(typeName).standardCellLayout;
  }
}
_registerDecorators(DatatableTypes, {
  fields: ["privateCustomTypes", "isValidTypeForTree"]
});
export default _registerComponent(DatatableTypes, {
  tmpl: _tmpl,
  sel: "lightning-datatable",
  apiVersion: 59
});