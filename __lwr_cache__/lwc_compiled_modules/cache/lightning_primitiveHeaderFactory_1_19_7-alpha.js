import { registerDecorators as _registerDecorators, registerComponent as _registerComponent } from "lwc";
import _tmpl from "./primitiveHeaderFactory.html";
import labelChooseARow from '@salesforce/label/LightningDatatable.chooseARow';
import labelChooseARowSelectAll from '@salesforce/label/LightningDatatable.chooseARowSelectAll';
import labelSelectAll from '@salesforce/label/LightningDatatable.selectAll';
import labelSort from '@salesforce/label/LightningDatatable.sort';
import labelSortAsc from '@salesforce/label/LightningDatatable.sortAsc';
import labelSortDesc from '@salesforce/label/LightningDatatable.sortDesc';
import labelSortNone from '@salesforce/label/LightningDatatable.sortNone';
import PrimitiveDatatableCell from 'lightning/primitiveDatatableCell';
import { classSet } from 'lightning/utils';
import { classListMutation, isRTL, getRealDOMId } from 'lightning/utilsPrivate';
import selectable from './selectableHeader.html';
import sortable from './sortableHeader.html';
import nonsortable from './nonsortableHeader.html';
const i18n = {
  chooseARow: labelChooseARow,
  chooseARowSelectAll: labelChooseARowSelectAll,
  selectAll: labelSelectAll,
  sort: labelSort,
  sortAsc: labelSortAsc,
  sortDesc: labelSortDesc,
  sortNone: labelSortNone
};

/**
 * A table column header.
 */
class PrimitiveHeaderFactory extends PrimitiveDatatableCell {
  constructor(...args) {
    super(...args);
    // Tracked objects
    this._def = {};
    // Private variables
    this._resizable = void 0;
    this._sortable = false;
    this._hideHeader = false;
    this._wrapTableHeader = false;
    /************************** PUBLIC ATTRIBUTES ***************************/
    this.actions = void 0;
    this.colIndex = void 0;
    this.columnWidth = void 0;
    this.dtContextId = void 0;
    this.resizestep = void 0;
    this.showCheckbox = false;
    this.sorted = void 0;
    this.sortedDirection = void 0;
  }
  /**
   * Retrieves the computed header DOM `id`
   *
   * @return {string} The DOM `id`
   */
  get computedColumnHeaderId() {
    const el = this.template.querySelector('[data-column-header]');
    return getRealDOMId(el);
  }

  /**
   * Defines the data type for the column
   *
   * @type {string}
   */
  get def() {
    return this._def;
  }
  set def(value) {
    this._def = value;
    this.updateElementClasses();
  }

  /**
   * Defines whether the table header is hidden
   *
   * @type {boolean}
   */
  get hideHeader() {
    return this._hideHeader;
  }
  set hideHeader(value) {
    this._hideHeader = value;
    this.updateElementClasses();
  }

  /**
   * Defines whether the table header is wrapped
   *
   * @type {boolean}
   */
  get wrapTableHeader() {
    return this._wrapTableHeader;
  }
  set wrapTableHeader(value) {
    this._wrapTableHeader = value;
    this.updateElementClasses();
  }

  /**
   * Defines whether the column is resizable
   *
   * @type {boolean}
   */
  get resizable() {
    return this._resizable;
  }
  set resizable(value) {
    this._resizable = value;
    this.updateElementClasses();
  }

  /**
   * Defines whether the column is sortable
   *
   * @type {boolean}
   */
  get sortable() {
    return this._sortable;
  }
  set sortable(value) {
    this._sortable = value;
    this.updateElementClasses();
  }

  /************************** PUBLIC METHODS ***************************/

  /**
   * Retrieves the header cell's width
   *
   * @return {string} The width of the cell
   */
  getDomWidth() {
    const child = this.template.querySelector('.slds-cell-fixed');
    if (child) {
      return child.offsetWidth;
    }
    return '';
  }

  /************************** PRIVATE GETTERS **************************/

  /**
   * Computes the styles for the column
   *
   * @return {string} The computed inline styles
   */
  get columnStyles() {
    const outlineStyle = this.isSortable ? '' : 'outline:none;';

    // In RTL, we need to explicitly position the column headers.
    // We do this by setting the offset (in pixels) from the start of the table.
    const offsetStyle = isRTL() ? `right: ${this.def.offset}px;` : '';
    const widthStyle = this.columnWidth ? `width: ${this.columnWidth}px;` : '';
    const heightStyle = this._wrapTableHeader ? 'min-height: 3rem' : '';
    return `
            ${widthStyle}
            ${outlineStyle}
            ${offsetStyle}
            ${heightStyle}
        `;
  }

  /**
   * Get th Action styles
   *
   * @return {string} The computed classes
   */
  get thActionStyles() {
    const heightStyle = this._wrapTableHeader ? 'min-height: 3rem' : '';
    return `
            ${heightStyle}
        `;
  }

  /**
   * Computes the classes for the column
   *
   * @return {string} The computed classes
   */
  get computedClass() {
    return classSet('slds-cell-fixed').add({
      'slds-has-button-menu': this.hasActions
    }).toString();
  }

  /**
   * Computes the sort classes for the column
   *
   * @return {string} The computed sort classes
   */
  get computedSortClass() {
    return classSet('slds-th__action slds-text-link_reset').add({
      'slds-is-sorted': this.sorted
    }).add({
      'slds-is-sorted_asc': this.isAscSorted
    }).add({
      'slds-is-sorted_desc': this.isDescSorted
    }).toString();
  }

  /**
   * Computes styling for header label
   */
  get getHeaderLabelStyle() {
    return this._wrapTableHeader ? 'slds-line-clamp_small ' : 'slds-truncate';
  }

  /**
   * Computes an option name
   *
   * @return {string} The computed option name
   */
  get computedOptionName() {
    return `${this.dtContextId}-options`;
  }

  /**
   * Determines if the header has actions available
   *
   * @return {boolean} Whether the header has available actions
   */
  get hasActions() {
    return this.actions.customerActions.length > 0 || this.actions.internalActions.length > 0;
  }

  /**
   * Computes column header label
   *
   * @return {string} The computed column header label
   */
  get computedColumnHeaderLabel() {
    return this.showCheckbox ? this.i18n.chooseARowSelectAll : this.i18n.chooseARow;
  }

  /**
   * Returns the header's aria role
   *
   * @return {string|boolean} The aria role for the header
   */
  get headerRole() {
    return this.isResizable || this.sortable ? 'button' : false;
  }

  /**
   * Determines if sort direction is set to ascending
   *
   * @return {boolean} Whether the sort direction is ascending
   */
  get isAscSorted() {
    return this.sortedDirection === 'asc';
  }

  /**
   * Determines if sort direction is set to descending
   *
   * @return {boolean} Whether the sort direction is descending
   */
  get isDescSorted() {
    return this.sortedDirection === 'desc';
  }

  /**
   * Determines if the header is regular (unselectable)
   *
   * @return {boolean} Whether the header is regular
   */
  get isRegularHeader() {
    return this.def.type !== 'SELECTABLE_CHECKBOX';
  }

  /**
   * Determines if the header is resizable
   *
   * @return {boolean} Whether the header is resizable
   */
  get isResizable() {
    return this.resizable && this.def.resizable !== false;
  }

  /**
   * Determines if the header is selectable
   *
   * @return {boolean} Whether the header is selectable
   */
  get isSelectableHeader() {
    return this.def.type === 'SELECTABLE_CHECKBOX';
  }

  /**
   * Determines if the header is sortable
   *
   * @return {boolean} Whether the header is sortable
   */
  get isSortable() {
    return this.sortable;
  }

  /**
   * Returns the internationalization language mapping
   *
   * @return {Object} The i18n mapping
   */
  get i18n() {
    return i18n;
  }

  /**
   * Returns the header's resize step
   *
   * @return {number} The resize step for the header
   */
  get resizeStep() {
    return this.resizestep;
  }

  /**
   * Returns the sort order label in the appropriate language
   *
   * @return {string} Language-specific sort order label
   */
  get sortedOrderLabel() {
    if (this.sorted) {
      return this.sortedDirection === 'desc' ? i18n.sortDesc : i18n.sortAsc;
    }
    return i18n.sortNone;
  }

  /************************** LIFECYCLE HOOKS **************************/

  /**
   * Renders the appropriate template: selectableHeader.html,
   * sortableHeader.html, or nonsortableHeader.html.
   * By default, nonsortableHeader.html is rendered
   */
  render() {
    if (this.isSelectableHeader) {
      return selectable;
    } else if (this.sortable) {
      return sortable;
    }
    return nonsortable;
  }
  renderedCallback() {
    if (this.isSelectableHeader && this.showCheckbox) {
      this.updateBulkSelectionCheckbox();
    }
    if (this.isSelectableHeader) {
      const columnHeaderId = this.computedColumnHeaderId;
      const columnHeaderEvent = new CustomEvent('privatecolumnheaderid', {
        detail: columnHeaderId
      });
      this.dispatchEvent(columnHeaderEvent);
    }
  }
  disconnectedCallback() {
    if (this.isSelectableHeader) {
      const columnHeaderEvent = new CustomEvent('privatecolumnheaderid', {
        detail: null
      });
      this.dispatchEvent(columnHeaderEvent);
    }
  }

  /************************** EVENT HANDLERS ***************************/

  /**
   * Handles a sorting click on a header
   *
   * @param {Event} event
   */
  handleSortingClick(event) {
    event.preventDefault();
    if (this.isSortable) {
      event.stopPropagation();
      this.fireSortedColumn();
      this.fireCellFocusByClickEvent();
    }
  }

  /************************ EVENT DISPATCHERS **************************/

  /**
   * Handles selecting all rows
   */
  handleSelectAllRows() {
    const {
      rowKeyValue,
      colKeyValue
    } = this;
    const actionName = this.def.bulkSelection === 'none' ? 'selectallrows' : 'deselectallrows';
    // eslint-disable-next-line lightning-global/no-custom-event-identifier-arguments
    const actionEvent = new CustomEvent(actionName, {
      bubbles: true,
      composed: true,
      detail: {
        rowKeyValue,
        colKeyValue
      }
    });
    this.dispatchEvent(actionEvent);
  }

  /**
   * Notifies the parent datatable component by firing a private event with
   * the details of the sort action
   */
  fireSortedColumn() {
    const event = new CustomEvent('privateupdatecolsort', {
      bubbles: true,
      composed: true,
      detail: {
        fieldName: this.def.fieldName,
        columnKey: this.def.columnKey,
        sortDirection: this.getTargetSortDirection()
      }
    });
    this.dispatchEvent(event);
  }

  /************************* HELPER FUNCTIONS **************************/

  /**
   * Updates classes based on sort, resize and header eligibility
   */
  updateElementClasses() {
    classListMutation(this.classList, {
      'slds-is-sortable': this.isSortable,
      'slds-is-resizable': this.isResizable,
      'slds-assistive-text': this.hideHeader
    });
  }

  /**
   * Determines the opposite direction to sort on based on the current direction
   *
   * @return {string} The new sort direction
   */
  getTargetSortDirection() {
    if (this.sorted) {
      return this.sortedDirection === 'desc' ? 'asc' : 'desc';
    }
    return this.sortedDirection;
  }

  /**
   * Determines the state of the header "all" checkbox based on current selections
   */
  updateBulkSelectionCheckbox() {
    const allCheckbox = this.template.querySelector('.datatable-select-all');
    allCheckbox.indeterminate = this.def.bulkSelection === 'some';

    // Note: since we have to handle the indeterminate state,
    //       this is to remove a raptor warning `Unneccessary update of property "checked"`
    allCheckbox.checked = !(this.def.bulkSelection === 'none');
  }
  /*LWC compiler v3.0.0*/
}
_registerDecorators(PrimitiveHeaderFactory, {
  publicProps: {
    actions: {
      config: 0
    },
    colIndex: {
      config: 0
    },
    columnWidth: {
      config: 0
    },
    dtContextId: {
      config: 0
    },
    resizestep: {
      config: 0
    },
    showCheckbox: {
      config: 0
    },
    sorted: {
      config: 0
    },
    sortedDirection: {
      config: 0
    },
    computedColumnHeaderId: {
      config: 1
    },
    def: {
      config: 3
    },
    hideHeader: {
      config: 3
    },
    wrapTableHeader: {
      config: 3
    },
    resizable: {
      config: 3
    },
    sortable: {
      config: 3
    }
  },
  publicMethods: ["getDomWidth"],
  track: {
    _def: 1
  },
  fields: ["_resizable", "_sortable", "_hideHeader", "_wrapTableHeader"]
});
export default _registerComponent(PrimitiveHeaderFactory, {
  tmpl: _tmpl,
  sel: "lightning-primitive-header-factory",
  apiVersion: 59
});