import { registerDecorators as _registerDecorators, registerComponent as _registerComponent, LightningElement } from "lwc";
import _tmpl from "./card.html";
import { classSet } from 'lightning/utils';
import { isNarrow, isBase } from './utils';
import { isHeadingLevelValid } from 'lightning/utilsPrivate';

/**
 * Cards apply a container around a related grouping of information.
 * @slot title Placeholder for the card title, which can be represented by a header or h1 element.
 * The title is displayed at the top of the card, after the icon.
 * Alternatively, use the title attribute if you don't need to pass in extra markup in your title.
 * @slot actions Placeholder for actionable components, such as lightning-button or lightning-button-menu.
 * Actions are displayed on the top corner of the card after the title.
 * @slot footer Placeholder for the card footer, which is displayed at the bottom of the card and is usually optional.
 * For example, the footer can display a "View All" link to navigate to a list view.
 * @slot default Placeholder for your content in the card body.
 */
class LightningCard extends LightningElement {
  constructor(...args) {
    super(...args);
    /**
     * The title can include text, and is displayed in the header.
     * To include additional markup or another component, use the title slot.
     *
     * @type {string}
     */
    this.title = void 0;
    /**
     * The Lightning Design System name of the icon.
     * Specify the name in the format 'utility:down' where 'utility' is the category,
     * and 'down' is the specific icon to be displayed.
     * The icon is displayed in the header before the title.
     *
     * @type {string}
     */
    this.iconName = void 0;
    this._privateVariant = 'base';
    /**
     * The property 'hasTitle' will be 'true' if
     * either a string title or a slot title is present
     */
    this._hasTitle = true;
    this._showFooter = true;
    this._privateHeadingAriaLevel = void 0;
    this.privateHeaderLabel = void 0;
    this.hiddenHeader = false;
  }
  set variant(value) {
    if (isNarrow(value) || isBase(value)) {
      this._privateVariant = value;
    } else {
      this._privateVariant = 'base';
    }
  }

  /**
   * The variant changes the appearance of the card.
   * Accepted variants include base or narrow.
   * This value defaults to base.
   *
   * @type {string}
   * @default base
   */
  get variant() {
    return this._privateVariant;
  }
  renderedCallback() {
    // initial check for no items
    if (this.footerSlot) {
      this._showFooter = this.footerSlot.assignedElements().length !== 0;
    }

    // real title slot will be null if a string title is present
    if (this.titleSlot) {
      const hasSlotTitle = this.titleSlot.assignedElements().length !== 0;
      this._hasTitle = hasSlotTitle || this.hasStringTitle;
    }
  }
  /**
   * The headingLevel changes the 'aria-level' attribute value of
   * <h2> tag in the markup for the card's title element. It can take
   * values of (1, 2, 3, 4, 5, 6)
   *
   * @type {string | number}
   * @default 2
   */
  get headingLevel() {
    return this._privateHeadingAriaLevel;
  }
  set headingLevel(value) {
    if (isHeadingLevelValid(value)) {
      this._privateHeadingAriaLevel = value;
    }
  }
  get titleSlot() {
    return this.template.querySelector('slot[name=title]');
  }
  get footerSlot() {
    return this.template.querySelector('slot[name=footer]');
  }
  get computedWrapperClassNames() {
    return classSet('slds-card').add({
      'slds-card_narrow': isNarrow(this._privateVariant)
    });
  }
  get hasIcon() {
    return !!this.iconName;
  }
  get hasStringTitle() {
    return !!this.title;
  }
  /**
   * Assistive label for the card header. Only shown if `hideHeader` attribute is set to `true`.
   * @type {string}
   */
  get label() {
    if (!this._hasTitle || this.hideHeader) {
      return this.privateHeaderLabel;
    }
    return null;
  }
  set label(value) {
    this.privateHeaderLabel = value;
  }
  get computedHidden() {
    if (!this.label && this.hideHeader) {
      console.warn('A `lightning-card` with `hide-header` requires `label` to be set.');
    }
    return !this.hideHeader;
  }
  /**
   * Hides the header chunk of the card when set to `true`.
   * Requires you to set the `label` attribute to supplement a non-rendered header. If `label` isn't set, you get a `console.warn` error.
   * @type {boolean}
   * @default {false}
   */
  get hideHeader() {
    return this.hiddenHeader;
  }
  set hideHeader(value) {
    this.hiddenHeader = value;
  }
  /*LWC compiler v3.0.0*/
}
_registerDecorators(LightningCard, {
  publicProps: {
    title: {
      config: 0
    },
    iconName: {
      config: 0
    },
    variant: {
      config: 3
    },
    headingLevel: {
      config: 3
    },
    label: {
      config: 3
    },
    hideHeader: {
      config: 3
    }
  },
  fields: ["_privateVariant", "_hasTitle", "_showFooter", "_privateHeadingAriaLevel", "privateHeaderLabel", "hiddenHeader"]
});
export default _registerComponent(LightningCard, {
  tmpl: _tmpl,
  sel: "lightning-card",
  apiVersion: 59
});