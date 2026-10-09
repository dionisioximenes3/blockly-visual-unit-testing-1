/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Blockly menu item similar to Closure's goog.ui.MenuItem
 *
 * @class
 */
// Former goog.module ID: Blockly.MenuItem
import * as aria from './utils/aria.js';
import * as dom from './utils/dom.js';
import * as idGenerator from './utils/idgenerator.js';
/**
 * Class representing an item in a menu.
 */
export class MenuItem {
    /**
     * @param content Text caption to display as the content of the item, or a
     *     HTML element to display.
     * @param opt_value Data/model associated with the menu item.
     */
    constructor(content, opt_value) {
        this.content = content;
        this.opt_value = opt_value;
        /** Is the menu item clickable, as opposed to greyed-out. */
        this.enabled = true;
        /** The DOM element for the menu item. */
        this.element = null;
        /** Whether the menu item is rendered right-to-left. */
        this.rightToLeft = false;
        /** ARIA name for this menu. */
        this.roleName = null;
        /** Is this menu item checkable. */
        this.checkable = false;
        /** Is this menu item currently checked. */
        this.checked = false;
        /** Is this menu item currently highlighted. */
        this.highlight = false;
        /** Bound function to call when this menu item is clicked. */
        this.actionHandler = null;
    }
    /**
     * Creates the menuitem's DOM.
     *
     * @returns Completed DOM.
     */
    createDom() {
        const element = document.createElement('div');
        element.id = idGenerator.getNextUniqueId();
        this.element = element;
        // Set class and style
        element.className =
            'blocklyMenuItem ' +
                (this.enabled ? '' : 'blocklyMenuItemDisabled ') +
                (this.checked ? 'blocklyMenuItemSelected ' : '') +
                (this.highlight ? 'blocklyMenuItemHighlight ' : '') +
                (this.rightToLeft ? 'blocklyMenuItemRtl ' : '');
        const content = document.createElement('div');
        content.className = 'blocklyMenuItemContent';
        // Add a checkbox for checkable menu items.
        if (this.checkable) {
            const checkbox = document.createElement('div');
            checkbox.className = 'blocklyMenuItemCheckbox ';
            content.appendChild(checkbox);
        }
        let contentDom = this.content;
        if (typeof this.content === 'string') {
            contentDom = document.createTextNode(this.content);
        }
        content.appendChild(contentDom);
        element.appendChild(content);
        // Initialize ARIA role and state.
        if (this.roleName) {
            aria.setRole(element, this.roleName);
        }
        aria.setState(element, aria.State.SELECTED, (this.checkable && this.checked) || false);
        aria.setState(element, aria.State.DISABLED, !this.enabled);
        return element;
    }
    /** Dispose of this menu item. */
    dispose() {
        this.element = null;
    }
    /**
     * Gets the menu item's element.
     *
     * @returns The DOM element.
     * @internal
     */
    getElement() {
        return this.element;
    }
    /**
     * Gets the unique ID for this menu item.
     *
     * @returns Unique component ID.
     * @internal
     */
    getId() {
        return this.element.id;
    }
    /**
     * Gets the value associated with the menu item.
     *
     * @returns value Value associated with the menu item.
     * @internal
     */
    getValue() {
        return this.opt_value ?? null;
    }
    /**
     * Set menu item's rendering direction.
     *
     * @param rtl True if RTL, false if LTR.
     * @internal
     */
    setRightToLeft(rtl) {
        this.rightToLeft = rtl;
    }
    /**
     * Set the menu item's accessibility role.
     *
     * @param roleName Role name.
     * @internal
     */
    setRole(roleName) {
        this.roleName = roleName;
    }
    /**
     * Sets the menu item to be checkable or not. Set to true for menu items
     * that represent checkable options.
     *
     * @param checkable Whether the menu item is checkable.
     * @internal
     */
    setCheckable(checkable) {
        this.checkable = checkable;
    }
    /**
     * Checks or unchecks the component.
     *
     * @param checked Whether to check or uncheck the component.
     * @internal
     */
    setChecked(checked) {
        this.checked = checked;
    }
    /**
     * Highlights or unhighlights the component.
     *
     * @param highlight Whether to highlight or unhighlight the component.
     * @internal
     */
    setHighlighted(highlight) {
        this.highlight = highlight;
        const el = this.getElement();
        if (el && this.isEnabled()) {
            const name = 'blocklyMenuItemHighlight';
            if (highlight) {
                dom.addClass(el, name);
            }
            else {
                dom.removeClass(el, name);
            }
        }
    }
    /**
     * Returns true if the menu item is enabled, false otherwise.
     *
     * @returns Whether the menu item is enabled.
     * @internal
     */
    isEnabled() {
        return this.enabled;
    }
    /**
     * Enables or disables the menu item.
     *
     * @param enabled Whether to enable or disable the menu item.
     * @internal
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Performs the appropriate action when the menu item is activated
     * by the user.
     *
     * @param menuSelectEvent the event that triggered the selection
     * of the menu item.
     *
     * @internal
     */
    performAction(menuSelectEvent) {
        if (this.isEnabled() && this.actionHandler) {
            this.actionHandler(this, menuSelectEvent);
        }
    }
    /**
     * Set the handler that's called when the menu item is activated by the user.
     * `obj` will be used as the 'this' object in the function when called.
     *
     * @param fn The handler.
     * @param obj Used as the 'this' object in fn when called.
     * @internal
     */
    onAction(fn, obj) {
        this.actionHandler = fn.bind(obj);
    }
}
//# sourceMappingURL=menuitem.js.map