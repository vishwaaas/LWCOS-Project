import { registerDecorators as _registerDecorators, registerComponent as _registerComponent, LightningElement } from "lwc";
import _tmpl from "./primitiveIcon.html";
import { classSet } from 'lightning/utils';
import { normalizeString as normalize, isCSR } from 'lightning/utilsPrivate';
import standardTemplate from './primitiveIcon.html';
import iconStylesheets from './primitiveIcon.css';
import { getName, isValidName } from 'lightning/iconUtils';
import dir from '@salesforce/i18n/dir';
import { fetchIconLibrary, hasIconLibrary, getIconLibrary } from './fetch';
class LightningPrimitiveIcon extends LightningElement {
  constructor(...args) {
    super(...args);
    this.src = void 0;
    this.svgClass = void 0;
    this._size = 'medium';
    this._variant = '';
    this._iconLibrary = null;
    this._iconName = null;
  }
  get size() {
    return this._size;
  }
  set size(val) {
    this._size = val;
    this.setAttribute('size', this.normalizeSize(this._size));
  }
  get variant() {
    return this._variant;
  }
  set variant(val) {
    this._variant = val;
    this.setAttribute('variant', this.normalizeVariant(this._variant));
  }
  get iconName() {
    return this._iconName;
  }
  set iconName(value) {
    if (value !== this._iconName) {
      this._iconName = value;
      this.requestIconTemplates();
    }
  }
  get category() {
    if (isValidName(this._iconName)) {
      const [spriteName] = this._iconName.split(':');
      return spriteName;
    }
    return null;
  }
  get isReady() {
    return !!this._iconLibrary;
  }

  // eslint-disable-next-line @lwc/lwc/no-async-await
  async requestIconTemplates() {
    if (hasIconLibrary(dir, this.category)) {
      this._iconLibrary = getIconLibrary(dir, this.category);
      return;
    }
    if (this.category) {
      try {
        this._iconLibrary = null;
        if (isCSR) {
          this._iconLibrary = await fetchIconLibrary(dir, this.category);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`<lightning-primitive-icon> failed to dynamically import icon templates for ${this.category}: ${e.message}`);
      }
    }
  }
  renderedCallback() {
    if (this.isReady || this.iconName !== this.prevIconName) {
      this.prevIconName = this.iconName;
    }
  }
  render() {
    if (this.isReady) {
      // If src is present, should use default template reply on given svg src
      if (!this.src) {
        const name = this.iconName;
        if (isValidName(name)) {
          const [spriteName, iconName] = name.split(':');
          const template = this._iconLibrary[`${spriteName}_${iconName}`];
          if (template) {
            // manually attach the stylesheets in native shadow mode
            if (!this.template.synthetic) {
              template.stylesheets = iconStylesheets;
            }
            return template;
          }
        }
      }
    }
    return standardTemplate;
  }
  get href() {
    return this.src || '';
  }
  get name() {
    return getName(this.iconName);
  }
  normalizeSize(val) {
    return normalize(val, {
      fallbackValue: 'medium',
      validValues: ['xx-small', 'x-small', 'small', 'medium', 'large']
    });
  }
  normalizeVariant(val) {
    // NOTE: Leaving a note here because I just wasted a bunch of time
    // investigating why both 'bare' and 'inverse' are supported in
    // lightning-primitive-icon. lightning-icon also has a deprecated
    // 'bare', but that one is synonymous to 'inverse'. This 'bare' means
    // that no classes should be applied. So this component needs to
    // support both 'bare' and 'inverse' while lightning-icon only needs to
    // support 'inverse'.
    return normalize(val, {
      fallbackValue: '',
      validValues: ['bare', 'error', 'inverse', 'warning', 'success']
    });
  }
  get computedClass() {
    const classes = classSet(this.svgClass);
    if (this._variant !== 'bare') {
      classes.add('slds-icon');
    }
    switch (this._variant) {
      case 'error':
        classes.add('slds-icon-text-error');
        break;
      case 'warning':
        classes.add('slds-icon-text-warning');
        break;
      case 'success':
        classes.add('slds-icon-text-success');
        break;
      case 'inverse':
      case 'bare':
        break;
      default:
        // if custom icon is set, we don't want to set
        // the text-default class
        if (!this.src) {
          classes.add('slds-icon-text-default');
        }
    }
    if (this._size !== 'medium') {
      classes.add(`slds-icon_${this._size}`);
    }
    return classes.toString();
  }
  /*LWC compiler v3.0.0*/
}
_registerDecorators(LightningPrimitiveIcon, {
  publicProps: {
    src: {
      config: 0
    },
    svgClass: {
      config: 0
    },
    size: {
      config: 3
    },
    variant: {
      config: 3
    },
    iconName: {
      config: 3
    }
  },
  fields: ["_size", "_variant", "_iconLibrary", "_iconName"]
});
export default _registerComponent(LightningPrimitiveIcon, {
  tmpl: _tmpl,
  sel: "lightning-primitive-icon",
  apiVersion: 59
});