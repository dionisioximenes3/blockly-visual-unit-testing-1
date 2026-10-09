/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Field.  Used for editable titles, variables, etc.
 * This is an abstract class that defines the UI on the block.  Actual
 * instances would be FieldTextInput, FieldDropdown, etc.
 *
 * @class
 */
// Former goog.module ID: Blockly.Field
// Unused import preserved for side-effects. Remove if unneeded.
import './events/events_block_change.js';
import * as browserEvents from './browser_events.js';
import * as dropDownDiv from './dropdowndiv.js';
import { EventType } from './events/type.js';
import * as eventUtils from './events/utils.js';
import * as Tooltip from './tooltip.js';
import * as dom from './utils/dom.js';
import * as idGenerator from './utils/idgenerator.js';
import * as parsing from './utils/parsing.js';
import { Rect } from './utils/rect.js';
import { Size } from './utils/size.js';
import * as style from './utils/style.js';
import { Svg } from './utils/svg.js';
import * as userAgent from './utils/useragent.js';
import * as utilsXml from './utils/xml.js';
import * as WidgetDiv from './widgetdiv.js';
/**
 * Abstract class for an editable field.
 *
 * @typeParam T - The value stored on the field.
 */
export class Field {
    /**
     * Gets the size of this field. Because getSize() and updateSize() have side
     * effects, this acts as a shim for subclasses which wish to adjust field
     * bounds when setting/getting the size without triggering unwanted rendering
     * or other side effects. Note that subclasses must override *both* get and
     * set if either is overridden; the implementation may just call directly
     * through to super, but it must exist per the JS spec.
     */
    get size_() {
        return this.size;
    }
    set size_(newValue) {
        this.size = newValue;
    }
    /**
     * @param value The initial value of the field.
     *     Also accepts Field.SKIP_SETUP if you wish to skip setup (only used by
     * subclasses that want to handle configuration and setting the field value
     * after their own constructors have run).
     * @param validator  A function that is called to validate changes to the
     *     field's value. Takes in a value & returns a validated value, or null to
     *     abort the change.
     * @param config A map of options used to configure the field.
     *    Refer to the individual field's documentation for a list of properties
     * this parameter supports.
     */
    constructor(value, validator, config) {
        /**
         * To overwrite the default value which is set in **Field**, directly update
         * the prototype.
         *
         * Example:
         * `FieldImage.prototype.DEFAULT_VALUE = null;`
         */
        this.DEFAULT_VALUE = null;
        /**
         * Name of field.  Unique within each block.
         * Static labels are usually unnamed.
         */
        this.name = undefined;
        /** Validation function called when user edits an editable field. */
        this.validator_ = null;
        /**
         * Used to cache the field's tooltip value if setTooltip is called when the
         * field is not yet initialized. Is *not* guaranteed to be accurate.
         */
        this.tooltip = null;
        /** This field's dimensions. */
        this.size = new Size(0, 0);
        /** The rendered field's SVG group element. */
        this.fieldGroup_ = null;
        /** The rendered field's SVG border element. */
        this.borderRect_ = null;
        /** The rendered field's SVG text element. */
        this.textElement_ = null;
        /** The rendered field's text content element. */
        this.textContent_ = null;
        /** Mouse down event listener data. */
        this.mouseDownWrapper = null;
        /** Constants associated with the source block's renderer. */
        this.constants_ = null;
        /**
         * Has this field been disposed of?
         *
         * @internal
         */
        this.disposed = false;
        /** Maximum characters of text to display before adding an ellipsis. */
        this.maxDisplayLength = 50;
        /** Block this field is attached to.  Starts as null, then set in init. */
        this.sourceBlock_ = null;
        /** Does this block need to be re-rendered? */
        this.isDirty_ = true;
        /** Is the field visible, or hidden due to the block being collapsed? */
        this.visible_ = true;
        /**
         * Can the field value be changed using the editor on an editable block?
         */
        this.enabled_ = true;
        /** The element the click handler is bound to. */
        this.clickTarget_ = null;
        /**
         * The prefix field.
         *
         * @internal
         */
        this.prefixField = null;
        /**
         * The suffix field.
         *
         * @internal
         */
        this.suffixField = null;
        /**
         * Editable fields usually show some sort of UI indicating they are
         * editable. They will also be saved by the serializer.
         */
        this.EDITABLE = true;
        /**
         * Serializable fields are saved by the serializer, non-serializable fields
         * are not. Editable fields should also be serializable. This is not the
         * case by default so that SERIALIZABLE is backwards compatible.
         */
        this.SERIALIZABLE = false;
        /** The unique ID of this field. */
        this.id_ = null;
        /**
         * A generic value possessed by the field.
         * Should generally be non-null, only null when the field is created.
         */
        this.value_ =
            'DEFAULT_VALUE' in new.target.prototype
                ? new.target.prototype.DEFAULT_VALUE
                : this.DEFAULT_VALUE;
        /** The size of the area rendered by the field. */
        this.size_ = new Size(0, 0);
        if (value === Field.SKIP_SETUP)
            return;
        if (config) {
            this.configure_(config);
        }
        this.setValue(value);
        if (validator) {
            this.setValidator(validator);
        }
    }
    /**
     * Process the configuration map passed to the field.
     *
     * @param config A map of options used to configure the field. See the
     *     individual field's documentation for a list of properties this
     *     parameter supports.
     */
    configure_(config) {
        // TODO (#2884): Possibly add CSS class config option.
        // TODO (#2885): Possibly add cursor config option.
        if (config.tooltip) {
            this.setTooltip(parsing.replaceMessageReferences(config.tooltip));
        }
    }
    /**
     * Attach this field to a block.
     *
     * @param block The block containing this field.
     */
    setSourceBlock(block) {
        if (this.sourceBlock_) {
            throw Error('Field already bound to a block');
        }
        this.sourceBlock_ = block;
        if (block.id.includes('_field')) {
            throw new Error(`Field ID indicator is contained in block ID. This may cause ` +
                `problems with focus: ${block.id}.`);
        }
        this.id_ = `${block.id}_field_${idGenerator.getNextUniqueId()}`;
    }
    /**
     * Get the renderer constant provider.
     *
     * @returns The renderer constant provider.
     */
    getConstants() {
        if (!this.constants_ &&
            this.sourceBlock_ &&
            !this.sourceBlock_.isDeadOrDying() &&
            this.sourceBlock_.workspace.rendered) {
            this.constants_ = this.sourceBlock_.workspace
                .getRenderer()
                .getConstants();
        }
        return this.constants_;
    }
    /**
     * Get the block this field is attached to.
     *
     * @returns The block containing this field.
     * @throws An error if the source block is not defined.
     */
    getSourceBlock() {
        return this.sourceBlock_;
    }
    /**
     * Initialize everything to render this field. Override
     * methods initModel and initView rather than this method.
     *
     * @sealed
     * @internal
     */
    init() {
        if (this.fieldGroup_) {
            // Field has already been initialized once.
            return;
        }
        const id = this.id_;
        if (!id)
            throw new Error('Expected ID to be defined prior to init.');
        this.fieldGroup_ = dom.createSvgElement(Svg.G, {
            'id': id,
        });
        if (!this.isVisible()) {
            this.fieldGroup_.style.display = 'none';
        }
        const sourceBlockSvg = this.sourceBlock_;
        sourceBlockSvg.getSvgRoot().appendChild(this.fieldGroup_);
        this.initView();
        this.updateEditable();
        this.setTooltip(this.tooltip);
        this.bindEvents_();
        this.initModel();
        this.applyColour();
    }
    /**
     * Create the block UI for this field.
     */
    initView() {
        this.createBorderRect_();
        this.createTextElement_();
        if (this.fieldGroup_) {
            dom.addClass(this.fieldGroup_, 'blocklyField');
        }
    }
    /**
     * Initializes the model of the field after it has been installed on a block.
     * No-op by default.
     */
    initModel() { }
    /**
     * Defines whether this field should take up the full block or not.
     *
     * Be cautious when overriding this function. It may not work as you expect /
     * intend because the behavior was kind of hacked in. If you are thinking
     * about overriding this function, post on the forum with your intended
     * behavior to see if there's another approach.
     *
     * @internal
     */
    isFullBlockField() {
        return !this.borderRect_;
    }
    /**
     * Create a field border rect element. Not to be overridden by subclasses.
     * Instead modify the result of the function inside initView, or create a
     * separate function to call.
     */
    createBorderRect_() {
        this.borderRect_ = dom.createSvgElement(Svg.RECT, {
            'rx': this.getConstants().FIELD_BORDER_RECT_RADIUS,
            'ry': this.getConstants().FIELD_BORDER_RECT_RADIUS,
            'x': 0,
            'y': 0,
            'height': this.size_.height,
            'width': this.size_.width,
            'class': 'blocklyFieldRect',
        }, this.fieldGroup_);
    }
    /**
     * Create a field text element. Not to be overridden by subclasses. Instead
     * modify the result of the function inside initView, or create a separate
     * function to call.
     */
    createTextElement_() {
        this.textElement_ = dom.createSvgElement(Svg.TEXT, {
            'class': 'blocklyText blocklyFieldText',
        }, this.fieldGroup_);
        if (this.getConstants().FIELD_TEXT_BASELINE_CENTER) {
            this.textElement_.setAttribute('dominant-baseline', 'central');
        }
        this.textContent_ = document.createTextNode('');
        this.textElement_.appendChild(this.textContent_);
    }
    /**
     * Bind events to the field. Can be overridden by subclasses if they need to
     * do custom input handling.
     */
    bindEvents_() {
        const clickTarget = this.getClickTarget_();
        if (!clickTarget)
            throw new Error('A click target has not been set.');
        Tooltip.bindMouseEvents(clickTarget);
        this.mouseDownWrapper = browserEvents.conditionalBind(clickTarget, 'pointerdown', this, this.onMouseDown_);
    }
    /**
     * Sets the field's value based on the given XML element. Should only be
     * called by Blockly.Xml.
     *
     * @param fieldElement The element containing info about the field's state.
     */
    fromXml(fieldElement) {
        // Any because gremlins live here. No touchie!
        this.setValue(fieldElement.textContent);
    }
    /**
     * Serializes this field's value to XML. Should only be called by Blockly.Xml.
     *
     * @param fieldElement The element to populate with info about the field's
     *     state.
     * @returns The element containing info about the field's state.
     */
    toXml(fieldElement) {
        // Any because gremlins live here. No touchie!
        fieldElement.textContent = this.getValue();
        return fieldElement;
    }
    /**
     * Saves this fields value as something which can be serialized to JSON.
     * Should only be called by the serialization system.
     *
     * @param _doFullSerialization If true, this signals to the field that if it
     *     normally just saves a reference to some state (eg variable fields) it
     *     should instead serialize the full state of the thing being referenced.
     *     See the
     *     {@link https://developers.devsite.google.com/blockly/guides/create-custom-blocks/fields/customizing-fields/creating#full_serialization_and_backing_data | field serialization docs}
     *     for more information.
     * @returns JSON serializable state.
     */
    saveState(_doFullSerialization) {
        const legacyState = this.saveLegacyState(Field);
        if (legacyState !== null) {
            return legacyState;
        }
        return this.getValue();
    }
    /**
     * Sets the field's state based on the given state value. Should only be
     * called by the serialization system.
     *
     * @param state The state we want to apply to the field.
     */
    loadState(state) {
        if (this.loadLegacyState(Field, state)) {
            return;
        }
        this.setValue(state);
    }
    /**
     * Returns a stringified version of the XML state, if it should be used.
     * Otherwise this returns null, to signal the field should use its own
     * serialization.
     *
     * @param callingClass The class calling this method.
     *     Used to see if `this` has overridden any relevant hooks.
     * @returns The stringified version of the XML state, or null.
     */
    saveLegacyState(callingClass) {
        if (callingClass.prototype.saveState === this.saveState &&
            callingClass.prototype.toXml !== this.toXml) {
            const elem = utilsXml.createElement('field');
            elem.setAttribute('name', this.name || '');
            const text = utilsXml.domToText(this.toXml(elem));
            return text.replace(' xmlns="https://developers.google.com/blockly/xml"', '');
        }
        // Either they called this on purpose from their saveState, or they have
        // no implementations of either hook. Just do our thing.
        return null;
    }
    /**
     * Loads the given state using either the old XML hooks, if they should be
     * used. Returns true to indicate loading has been handled, false otherwise.
     *
     * @param callingClass The class calling this method.
     *     Used to see if `this` has overridden any relevant hooks.
     * @param state The state to apply to the field.
     * @returns Whether the state was applied or not.
     */
    loadLegacyState(callingClass, state) {
        if (callingClass.prototype.loadState === this.loadState &&
            callingClass.prototype.fromXml !== this.fromXml) {
            this.fromXml(utilsXml.textToDom(state));
            return true;
        }
        // Either they called this on purpose from their loadState, or they have
        // no implementations of either hook. Just do our thing.
        return false;
    }
    /**
     * Dispose of all DOM objects and events belonging to this editable field.
     */
    dispose() {
        dropDownDiv.hideIfOwner(this);
        WidgetDiv.hideIfOwner(this);
        if (!this.getSourceBlock()?.isDeadOrDying()) {
            dom.removeNode(this.fieldGroup_);
        }
        this.disposed = true;
    }
    /** Add or remove the UI indicating if this field is editable or not. */
    updateEditable() {
        const group = this.fieldGroup_;
        const block = this.getSourceBlock();
        if (!this.EDITABLE || !group || !block) {
            return;
        }
        if (this.enabled_ && block.isEditable()) {
            dom.addClass(group, 'blocklyEditableField');
            dom.removeClass(group, 'blocklyNonEditableField');
        }
        else {
            dom.addClass(group, 'blocklyNonEditableField');
            dom.removeClass(group, 'blocklyEditableField');
        }
    }
    /**
     * Set whether this field's value can be changed using the editor when the
     *     source block is editable.
     *
     * @param enabled True if enabled.
     */
    setEnabled(enabled) {
        this.enabled_ = enabled;
        this.updateEditable();
    }
    /**
     * Check whether this field's value can be changed using the editor when the
     *     source block is editable.
     *
     * @returns Whether this field is enabled.
     */
    isEnabled() {
        return this.enabled_;
    }
    /**
     * Check whether this field defines the showEditor_ function.
     *
     * @returns Whether this field is clickable.
     */
    isClickable() {
        return (this.enabled_ &&
            !!this.sourceBlock_ &&
            this.sourceBlock_.isEditable() &&
            this.showEditor_ !== Field.prototype.showEditor_);
    }
    /**
     * Check whether the field should be clickable while the block is in a flyout.
     * The default is that fields are clickable in always-open flyouts such as the
     * simple toolbox, but not in autoclosing flyouts such as the category toolbox.
     * Subclasses may override this function to change this behavior. Note that
     * `isClickable` must also return true for this to have any effect.
     *
     * @param autoClosingFlyout true if the containing flyout is an auto-closing one.
     * @returns Whether the field should be clickable while the block is in a flyout.
     */
    isClickableInFlyout(autoClosingFlyout) {
        return !autoClosingFlyout;
    }
    /**
     * Check whether this field is currently editable.  Some fields are never
     * EDITABLE (e.g. text labels). Other fields may be EDITABLE but may exist on
     * non-editable blocks or be currently disabled.
     *
     * @returns Whether this field is currently enabled, editable and on an
     *     editable block.
     */
    isCurrentlyEditable() {
        return (this.enabled_ &&
            this.EDITABLE &&
            !!this.sourceBlock_ &&
            this.sourceBlock_.isEditable());
    }
    /**
     * Check whether this field should be serialized by the XML renderer.
     * Handles the logic for backwards compatibility and incongruous states.
     *
     * @returns Whether this field should be serialized or not.
     */
    isSerializable() {
        let isSerializable = false;
        if (this.name) {
            if (this.SERIALIZABLE) {
                isSerializable = true;
            }
            else if (this.EDITABLE) {
                console.warn('Detected an editable field that was not serializable.' +
                    ' Please define SERIALIZABLE property as true on all editable custom' +
                    ' fields. Proceeding with serialization.');
                isSerializable = true;
            }
        }
        return isSerializable;
    }
    /**
     * Gets whether this editable field is visible or not.
     *
     * @returns True if visible.
     */
    isVisible() {
        return this.visible_;
    }
    /**
     * Sets whether this editable field is visible or not. Should only be called
     * by input.setVisible.
     *
     * @param visible True if visible.
     * @internal
     */
    setVisible(visible) {
        if (this.visible_ === visible) {
            return;
        }
        this.visible_ = visible;
        const root = this.fieldGroup_;
        if (root) {
            root.style.display = visible ? 'block' : 'none';
        }
    }
    /**
     * Sets a new validation function for editable fields, or clears a previously
     * set validator.
     *
     * The validator function takes in the new field value, and returns
     * validated value. The validated value could be the input value, a modified
     * version of the input value, or null to abort the change.
     *
     * If the function does not return anything (or returns undefined) the new
     * value is accepted as valid. This is to allow for fields using the
     * validated function as a field-level change event notification.
     *
     * @param handler The validator function or null to clear a previous
     *     validator.
     */
    setValidator(handler) {
        this.validator_ = handler;
    }
    /**
     * Gets the validation function for editable fields, or null if not set.
     *
     * @returns Validation function, or null.
     */
    getValidator() {
        return this.validator_;
    }
    /**
     * Gets the group element for this editable field.
     * Used for measuring the size and for positioning.
     *
     * @returns The group element.
     */
    getSvgRoot() {
        return this.fieldGroup_;
    }
    /**
     * Gets the border rectangle element.
     *
     * @returns The border rectangle element.
     * @throws An error if the border rectangle element is not defined.
     */
    getBorderRect() {
        if (!this.borderRect_) {
            throw new Error(`The border rectangle is ${this.borderRect_}.`);
        }
        return this.borderRect_;
    }
    /**
     * Gets the text element.
     *
     * @returns The text element.
     * @throws An error if the text element is not defined.
     */
    getTextElement() {
        if (!this.textElement_) {
            throw new Error(`The text element is ${this.textElement_}.`);
        }
        return this.textElement_;
    }
    /**
     * Gets the text content.
     *
     * @returns The text content.
     * @throws An error if the text content is not defined.
     */
    getTextContent() {
        if (!this.textContent_) {
            throw new Error(`The text content is ${this.textContent_}.`);
        }
        return this.textContent_;
    }
    /**
     * Updates the field to match the colour/style of the block.
     *
     * Non-abstract sub-classes may wish to implement this if the colour of the
     * field depends on the colour of the block. It will automatically be called
     * at relevant times, such as when the parent block or renderer changes.
     *
     * See {@link
     * https://developers.google.com/blockly/guides/create-custom-blocks/fields/customizing-fields/creating#matching_block_colours
     * | the field documentation} for more information, or FieldDropdown for an
     * example.
     */
    applyColour() { }
    /**
     * Used by getSize() to move/resize any DOM elements, and get the new size.
     *
     * All rendering that has an effect on the size/shape of the block should be
     * done here, and should be triggered by getSize().
     */
    render_() {
        if (this.textContent_) {
            this.textContent_.nodeValue = this.getDisplayText_();
        }
        this.updateSize_();
    }
    /**
     * Calls showEditor_ when the field is clicked if the field is clickable.
     * Do not override.
     *
     * @param e Optional mouse event that triggered the field to open, or
     *     undefined if triggered programmatically.
     * @sealed
     * @internal
     */
    showEditor(e) {
        if (this.isClickable()) {
            this.showEditor_(e);
        }
    }
    /**
     * A developer hook to create an editor for the field. This is no-op by
     * default, and must be overriden to create an editor.
     *
     * @param _e Optional mouse event that triggered the field to open, or
     *     undefined if triggered programmatically.
     */
    showEditor_(_e) { }
    // NOP
    /**
     * A developer hook to reposition the WidgetDiv during a window resize. You
     * need to define this hook if your field has a WidgetDiv that needs to
     * reposition itself when the window is resized. For example, text input
     * fields define this hook so that the input WidgetDiv can reposition itself
     * on a window resize event. This is especially important when modal inputs
     * have been disabled, as Android devices will fire a window resize event when
     * the soft keyboard opens.
     *
     * If you want the WidgetDiv to hide itself instead of repositioning, return
     * false. This is the default behavior.
     *
     * DropdownDivs already handle their own positioning logic, so you do not need
     * to override this function if your field only has a DropdownDiv.
     *
     * @returns True if the field should be repositioned,
     *    false if the WidgetDiv should hide itself instead.
     */
    repositionForWindowResize() {
        return false;
    }
    /**
     * Updates the size of the field based on the text.
     *
     * @param margin margin to use when positioning the text element.
     */
    updateSize_(margin) {
        const constants = this.getConstants();
        const xOffset = margin !== undefined
            ? margin
            : !this.isFullBlockField()
                ? this.getConstants().FIELD_BORDER_RECT_X_PADDING
                : 0;
        let totalWidth = xOffset * 2;
        let totalHeight = constants.FIELD_TEXT_HEIGHT;
        let contentWidth = 0;
        if (this.textElement_) {
            contentWidth = dom.getTextWidth(this.textElement_);
            totalWidth += contentWidth;
        }
        if (!this.isFullBlockField()) {
            totalHeight = Math.max(totalHeight, constants.FIELD_BORDER_RECT_HEIGHT);
        }
        this.size_ = new Size(totalWidth, totalHeight);
        this.positionTextElement_(xOffset, contentWidth);
        this.positionBorderRect_();
    }
    /**
     * Position a field's text element after a size change.  This handles both LTR
     * and RTL positioning.
     *
     * @param xOffset x offset to use when positioning the text element.
     * @param contentWidth The content width.
     */
    positionTextElement_(xOffset, contentWidth) {
        if (!this.textElement_) {
            return;
        }
        const constants = this.getConstants();
        const halfHeight = this.size_.height / 2;
        this.textElement_.setAttribute('x', String(this.getSourceBlock()?.RTL
            ? this.size_.width - contentWidth - xOffset
            : xOffset));
        this.textElement_.setAttribute('y', String(constants.FIELD_TEXT_BASELINE_CENTER
            ? halfHeight
            : halfHeight -
                constants.FIELD_TEXT_HEIGHT / 2 +
                constants.FIELD_TEXT_BASELINE));
    }
    /** Position a field's border rect after a size change. */
    positionBorderRect_() {
        if (!this.borderRect_) {
            return;
        }
        this.borderRect_.setAttribute('width', String(this.size_.width));
        this.borderRect_.setAttribute('height', String(this.size_.height));
        this.borderRect_.setAttribute('rx', String(this.getConstants().FIELD_BORDER_RECT_RADIUS));
        this.borderRect_.setAttribute('ry', String(this.getConstants().FIELD_BORDER_RECT_RADIUS));
    }
    /**
     * Returns the height and width of the field.
     *
     * This should *in general* be the only place render_ gets called from.
     *
     * @returns Height and width.
     */
    getSize() {
        if (!this.isVisible()) {
            return new Size(0, 0);
        }
        if (this.isDirty_) {
            this.render_();
            this.isDirty_ = false;
        }
        return this.size_;
    }
    /**
     * Returns the bounding box of the rendered field, accounting for workspace
     * scaling.
     *
     * @returns An object with top, bottom, left, and right in pixels relative to
     *     the top left corner of the page (window coordinates).
     * @internal
     */
    getScaledBBox() {
        let scaledWidth;
        let scaledHeight;
        let xy;
        const block = this.getSourceBlock();
        if (!block) {
            throw new UnattachedFieldError();
        }
        if (this.isFullBlockField()) {
            // Browsers are inconsistent in what they return for a bounding box.
            // - Webkit / Blink: fill-box / object bounding box
            // - Gecko: stroke-box
            const bBox = this.sourceBlock_.getHeightWidth();
            const scale = block.workspace.scale;
            xy = this.getAbsoluteXY_();
            scaledWidth = (bBox.width + 1) * scale;
            scaledHeight = (bBox.height + 1) * scale;
            if (userAgent.GECKO) {
                xy.x += 1.5 * scale;
                xy.y += 1.5 * scale;
            }
            else {
                xy.x -= 0.5 * scale;
                xy.y -= 0.5 * scale;
            }
        }
        else {
            const bBox = this.borderRect_.getBoundingClientRect();
            xy = style.getPageOffset(this.borderRect_);
            scaledWidth = bBox.width;
            scaledHeight = bBox.height;
        }
        return new Rect(xy.y, xy.y + scaledHeight, xy.x, xy.x + scaledWidth);
    }
    /**
     * Notifies the field that it has changed locations.
     *
     * @param _ The location of this field's block's top-start corner
     *     in workspace coordinates.
     */
    onLocationChange(_) { }
    /**
     * Get the text from this field to display on the block. May differ from
     * `getText` due to ellipsis, and other formatting.
     *
     * @returns Text to display.
     */
    getDisplayText_() {
        let text = this.getText();
        if (text.length > this.maxDisplayLength) {
            // Truncate displayed string and add an ellipsis ('...').
            text = text.substring(0, this.maxDisplayLength - 2) + '…';
        }
        // Replace whitespace with non-breaking spaces so the text doesn't collapse.
        text = text.replace(/\s/g, Field.NBSP);
        if (this.sourceBlock_ && this.sourceBlock_.RTL) {
            // The SVG is LTR, force text to be RTL by adding an RLM.
            text += '\u200F';
        }
        return text;
    }
    /**
     * Get the text from this field.
     * Override getText_ to provide a different behavior than simply casting the
     * value to a string.
     *
     * @returns Current text.
     * @sealed
     */
    getText() {
        // this.getText_ was intended so that devs don't have to remember to call
        // super when overriding how the text of the field is generated. (#2910)
        const text = this.getText_();
        if (text !== null) {
            return String(text);
        }
        return String(this.getValue());
    }
    /**
     * A developer hook to override the returned text of this field.
     * Override if the text representation of the value of this field
     * is not just a string cast of its value.
     * Return null to resort to a string cast.
     *
     * @returns Current text or null.
     */
    getText_() {
        return null;
    }
    /**
     * Force a rerender of the block that this field is installed on, which will
     * rerender this field and adjust for any sizing changes.
     * Other fields on the same block will not rerender, because their sizes have
     * already been recorded.
     *
     * @internal
     */
    markDirty() {
        this.isDirty_ = true;
        this.constants_ = null;
    }
    /**
     * Force a rerender of the block that this field is installed on, which will
     * rerender this field and adjust for any sizing changes.
     * Other fields on the same block will not rerender, because their sizes have
     * already been recorded.
     */
    forceRerender() {
        this.isDirty_ = true;
        if (this.sourceBlock_ && this.sourceBlock_.rendered) {
            this.sourceBlock_.queueRender();
        }
    }
    /**
     * Used to change the value of the field. Handles validation and events.
     * Subclasses should override doClassValidation_ and doValueUpdate_ rather
     * than this method.
     *
     * @param newValue New value.
     * @param fireChangeEvent Whether to fire a change event. Defaults to true.
     *     Should usually be true unless the change will be reported some other
     *     way, e.g. an intermediate field change event.
     * @sealed
     */
    setValue(newValue, fireChangeEvent = true) {
        const doLogging = false;
        if (newValue === null) {
            if (doLogging)
                console.log('null, return');
            // Not a valid value to check.
            return;
        }
        // Field validators are allowed to make changes to the workspace, which
        // should get grouped with the field value change event.
        const existingGroup = eventUtils.getGroup();
        if (!existingGroup) {
            eventUtils.setGroup(true);
        }
        try {
            const classValidation = this.doClassValidation_(newValue);
            const classValue = this.processValidation(newValue, classValidation, fireChangeEvent);
            if (classValue instanceof Error) {
                if (doLogging)
                    console.log('invalid class validation, return');
                return;
            }
            const localValidation = this.getValidator()?.call(this, classValue);
            const localValue = this.processValidation(classValue, localValidation, fireChangeEvent);
            if (localValue instanceof Error) {
                if (doLogging)
                    console.log('invalid local validation, return');
                return;
            }
            const source = this.sourceBlock_;
            if (source && source.disposed) {
                if (doLogging)
                    console.log('source disposed, return');
                return;
            }
            const oldValue = this.getValue();
            if (oldValue === localValue) {
                if (doLogging)
                    console.log('same, doValueUpdate_, return');
                this.doValueUpdate_(localValue);
                return;
            }
            this.doValueUpdate_(localValue);
            if (fireChangeEvent && source && eventUtils.isEnabled()) {
                eventUtils.fire(new (eventUtils.get(EventType.BLOCK_CHANGE))(source, 'field', this.name || null, oldValue, localValue));
            }
            if (this.isDirty_) {
                this.forceRerender();
            }
            if (doLogging)
                console.log(this.value_);
        }
        finally {
            eventUtils.setGroup(existingGroup);
        }
    }
    /**
     * Process the result of validation.
     *
     * @param newValue New value.
     * @param validatedValue Validated value.
     * @param fireChangeEvent Whether to fire a change event if the value changes.
     * @returns New value, or an Error object.
     */
    processValidation(newValue, validatedValue, fireChangeEvent) {
        if (validatedValue === null) {
            this.doValueInvalid_(newValue, fireChangeEvent);
            if (this.isDirty_) {
                this.forceRerender();
            }
            return Error();
        }
        return validatedValue === undefined ? newValue : validatedValue;
    }
    /**
     * Get the current value of the field.
     *
     * @returns Current value.
     */
    getValue() {
        return this.value_;
    }
    doClassValidation_(newValue) {
        if (newValue === null || newValue === undefined) {
            return null;
        }
        return newValue;
    }
    /**
     * Used to update the value of a field. Can be overridden by subclasses to do
     * custom storage of values/updating of external things.
     *
     * @param newValue The value to be saved.
     */
    doValueUpdate_(newValue) {
        this.value_ = newValue;
        this.isDirty_ = true;
    }
    /**
     * Used to notify the field an invalid value was input. Can be overridden by
     * subclasses, see FieldTextInput.
     * No-op by default.
     *
     * @param _invalidValue The input value that was determined to be invalid.
     * @param _fireChangeEvent Whether to fire a change event if the value changes.
     */
    doValueInvalid_(_invalidValue, _fireChangeEvent = true) { }
    // NOP
    /**
     * Handle a pointerdown event on a field.
     *
     * @param e Pointer down event.
     */
    onMouseDown_(e) {
        if (!this.sourceBlock_ || this.sourceBlock_.isDeadOrDying()) {
            return;
        }
        const gesture = this.sourceBlock_.workspace.getGesture(e);
        if (gesture) {
            gesture.setStartField(this);
        }
    }
    /**
     * Sets the tooltip for this field.
     *
     * @param newTip The text for the tooltip, a function that returns the text
     *     for the tooltip, a parent object whose tooltip will be used, or null to
     *     display the tooltip of the parent block. To not display a tooltip pass
     *     the empty string.
     */
    setTooltip(newTip) {
        if (!newTip && newTip !== '') {
            // If null or undefined.
            newTip = this.sourceBlock_;
        }
        const clickTarget = this.getClickTarget_();
        if (clickTarget) {
            clickTarget.tooltip = newTip;
        }
        else {
            // Field has not been initialized yet.
            this.tooltip = newTip;
        }
    }
    /**
     * Returns the tooltip text for this field.
     *
     * @returns The tooltip text for this field.
     */
    getTooltip() {
        const clickTarget = this.getClickTarget_();
        if (clickTarget) {
            return Tooltip.getTooltipOfObject(clickTarget);
        }
        // Field has not been initialized yet. Return stashed this.tooltip value.
        return Tooltip.getTooltipOfObject({ tooltip: this.tooltip });
    }
    /**
     * The element to bind the click handler to. If not set explicitly, defaults
     * to the SVG root of the field. When this element is
     * clicked on an editable field, the editor will open.
     *
     * @returns Element to bind click handler to.
     */
    getClickTarget_() {
        return this.clickTarget_ || this.getSvgRoot();
    }
    /**
     * Return the absolute coordinates of the top-left corner of this field.
     * The origin (0,0) is the top-left corner of the page body.
     *
     * @returns Object with .x and .y properties.
     */
    getAbsoluteXY_() {
        return style.getPageOffset(this.getClickTarget_());
    }
    /**
     * Whether this field references any Blockly variables.  If true it may need
     * to be handled differently during serialization and deserialization.
     * Subclasses may override this.
     *
     * @returns True if this field has any variable references.
     */
    referencesVariables() {
        return false;
    }
    /**
     * Refresh the variable name referenced by this field if this field references
     * variables.
     */
    refreshVariableName() { }
    // NOP
    /**
     * Search through the list of inputs and their fields in order to find the
     * parent input of a field.
     *
     * @returns The input that the field belongs to.
     * @internal
     */
    getParentInput() {
        let parentInput = null;
        const block = this.getSourceBlock();
        if (!block) {
            throw new UnattachedFieldError();
        }
        const inputs = block.inputList;
        for (let idx = 0; idx < block.inputList.length; idx++) {
            const input = inputs[idx];
            const fieldRows = input.fieldRow;
            for (let j = 0; j < fieldRows.length; j++) {
                if (fieldRows[j] === this) {
                    parentInput = input;
                    break;
                }
            }
        }
        return parentInput;
    }
    /**
     * Returns whether or not we should flip the field in RTL.
     *
     * @returns True if we should flip in RTL.
     */
    getFlipRtl() {
        return false;
    }
    /**
     * Handles the given keyboard shortcut.
     *
     * @param _shortcut The shortcut to be handled.
     * @returns True if the shortcut has been handled, false otherwise.
     */
    onShortcut(_shortcut) {
        return false;
    }
    /** See IFocusableNode.getFocusableElement. */
    getFocusableElement() {
        if (!this.fieldGroup_) {
            throw Error('This field currently has no representative DOM element.');
        }
        return this.fieldGroup_;
    }
    /** See IFocusableNode.getFocusableTree. */
    getFocusableTree() {
        const block = this.getSourceBlock();
        if (!block) {
            throw new UnattachedFieldError();
        }
        return block.workspace;
    }
    /** See IFocusableNode.onNodeFocus. */
    onNodeFocus() {
        const block = this.getSourceBlock();
        block.workspace.scrollBoundsIntoView(block.getBoundingRectangleWithoutChildren());
    }
    /** See IFocusableNode.onNodeBlur. */
    onNodeBlur() { }
    /** See IFocusableNode.canBeFocused. */
    canBeFocused() {
        return true;
    }
    /**
     * Subclasses should reimplement this method to construct their Field
     * subclass from a JSON arg object.
     *
     * It is an error to attempt to register a field subclass in the
     * FieldRegistry if that subclass has not overridden this method.
     *
     * @param _options JSON configuration object with properties needed
     *    to configure a specific field.
     */
    static fromJson(_options) {
        throw new Error(`Attempted to instantiate a field from the registry that hasn't defined a 'fromJson' method.`);
    }
}
/** Non-breaking space. */
Field.NBSP = '\u00A0';
/**
 * A value used to signal when a field's constructor should *not* set the
 * field's value or run configure_, and should allow a subclass to do that
 * instead.
 */
Field.SKIP_SETUP = Symbol('SKIP_SETUP');
/**
 * Represents an error where the field is trying to access its block or
 * information about its block before it has actually been attached to said
 * block.
 */
export class UnattachedFieldError extends Error {
    /** @internal */
    constructor() {
        super('The field has not yet been attached to its input. ' +
            'Call appendField to attach it.');
    }
}
//# sourceMappingURL=field.js.map