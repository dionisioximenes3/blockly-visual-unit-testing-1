/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Object representing an input (value, statement, or dummy).
 *
 * @class
 */
// Former goog.module ID: Blockly.Input
// Unused import preserved for side-effects. Remove if unneeded.
import '../field_label.js';
import * as fieldRegistry from '../field_registry.js';
import { RenderedConnection } from '../rendered_connection.js';
import { Align } from './align.js';
import { inputTypes } from './input_types.js';
/** Class for an input with optional fields. */
export class Input {
    /**
     * @param name Language-neutral identifier which may used to find this input
     *     again.
     * @param sourceBlock The block containing this input.
     */
    constructor(name, sourceBlock) {
        this.name = name;
        this.sourceBlock = sourceBlock;
        this.fieldRow = [];
        /** Alignment of input's fields (left, right or centre). */
        this.align = Align.LEFT;
        /** Is the input visible? */
        this.visible = true;
        this.type = inputTypes.CUSTOM;
        this.connection = null;
    }
    /**
     * Get the source block for this input.
     *
     * @returns The block this input is part of.
     */
    getSourceBlock() {
        return this.sourceBlock;
    }
    /**
     * Add a field (or label from string), and all prefix and suffix fields, to
     * the end of the input's field row.
     *
     * @param field Something to add as a field.
     * @param opt_name Language-neutral identifier which may used to find this
     *     field again.  Should be unique to the host block.
     * @returns The input being append to (to allow chaining).
     */
    appendField(field, opt_name) {
        this.insertFieldAt(this.fieldRow.length, field, opt_name);
        return this;
    }
    /**
     * Inserts a field (or label from string), and all prefix and suffix fields,
     * at the location of the input's field row.
     *
     * @param index The index at which to insert field.
     * @param field Something to add as a field.
     * @param opt_name Language-neutral identifier which may used to find this
     *     field again.  Should be unique to the host block.
     * @returns The index following the last inserted field.
     */
    insertFieldAt(index, field, opt_name) {
        if (index < 0 || index > this.fieldRow.length) {
            throw Error('index ' + index + ' out of bounds.');
        }
        // Falsy field values don't generate a field, unless the field is an empty
        // string and named.
        if (!field && !(field === '' && opt_name)) {
            return index;
        }
        // Generate a FieldLabel when given a plain text field.
        if (typeof field === 'string') {
            field = fieldRegistry.fromJson({
                type: 'field_label',
                text: field,
            });
        }
        field.setSourceBlock(this.sourceBlock);
        if (this.sourceBlock.initialized)
            this.initField(field);
        field.name = opt_name;
        field.setVisible(this.isVisible());
        if (field.prefixField) {
            // Add any prefix.
            index = this.insertFieldAt(index, field.prefixField);
        }
        // Add the field to the field row.
        this.fieldRow.splice(index, 0, field);
        index++;
        if (field.suffixField) {
            // Add any suffix.
            index = this.insertFieldAt(index, field.suffixField);
        }
        if (this.sourceBlock.rendered) {
            this.sourceBlock.queueRender();
        }
        return index;
    }
    /**
     * Remove a field from this input.
     *
     * @param name The name of the field.
     * @param opt_quiet True to prevent an error if field is not present.
     * @returns True if operation succeeds, false if field is not present and
     *     opt_quiet is true.
     * @throws {Error} if the field is not present and opt_quiet is false.
     */
    removeField(name, opt_quiet) {
        for (let i = 0, field; (field = this.fieldRow[i]); i++) {
            if (field.name === name) {
                field.dispose();
                this.fieldRow.splice(i, 1);
                if (this.sourceBlock.rendered) {
                    this.sourceBlock.queueRender();
                }
                return true;
            }
        }
        if (opt_quiet) {
            return false;
        }
        throw Error('Field "' + name + '" not found.');
    }
    /**
     * Gets whether this input is visible or not.
     *
     * @returns True if visible.
     */
    isVisible() {
        return this.visible;
    }
    /**
     * Sets whether this input is visible or not.
     * Should only be used to collapse/uncollapse a block.
     *
     * @param visible True if visible.
     * @returns List of blocks to render.
     * @internal
     */
    setVisible(visible) {
        // Note: Currently there are only unit tests for block.setCollapsed()
        // because this function is package. If this function goes back to being a
        // public API tests (lots of tests) should be added.
        let renderList = [];
        if (this.visible === visible) {
            return renderList;
        }
        this.visible = visible;
        for (let y = 0, field; (field = this.fieldRow[y]); y++) {
            field.setVisible(visible);
        }
        if (this.connection && this.connection instanceof RenderedConnection) {
            // Has a connection.
            if (visible) {
                renderList = this.connection.startTrackingAll();
            }
            else {
                this.connection.stopTrackingAll();
            }
            const child = this.connection.targetBlock();
            if (child) {
                child.getSvgRoot().style.display = visible ? 'block' : 'none';
            }
        }
        return renderList;
    }
    /**
     * Mark all fields on this input as dirty.
     *
     * @internal
     */
    markDirty() {
        for (let y = 0, field; (field = this.fieldRow[y]); y++) {
            field.markDirty();
        }
    }
    /**
     * Change a connection's compatibility.
     *
     * @param check Compatible value type or list of value types.  Null if all
     *     types are compatible.
     * @returns The input being modified (to allow chaining).
     */
    setCheck(check) {
        if (!this.connection) {
            throw Error('This input does not have a connection.');
        }
        this.connection.setCheck(check);
        return this;
    }
    /**
     * Change the alignment of the connection's field(s).
     *
     * @param align One of the values of Align.  In RTL mode directions
     *     are reversed, and Align.RIGHT aligns to the left.
     * @returns The input being modified (to allow chaining).
     */
    setAlign(align) {
        this.align = align;
        if (this.sourceBlock.rendered) {
            const sourceBlock = this.sourceBlock;
            sourceBlock.queueRender();
        }
        return this;
    }
    /**
     * Changes the connection's shadow block.
     *
     * @param shadow DOM representation of a block or null.
     * @returns The input being modified (to allow chaining).
     */
    setShadowDom(shadow) {
        if (!this.connection) {
            throw Error('This input does not have a connection.');
        }
        this.connection.setShadowDom(shadow);
        return this;
    }
    /**
     * Returns the XML representation of the connection's shadow block.
     *
     * @returns Shadow DOM representation of a block or null.
     */
    getShadowDom() {
        if (!this.connection) {
            throw Error('This input does not have a connection.');
        }
        return this.connection.getShadowDom();
    }
    /** Initialize the fields on this input. */
    init() {
        for (const field of this.fieldRow) {
            field.init();
        }
    }
    /**
     * Initializes the fields on this input for a headless block.
     *
     * @internal
     */
    initModel() {
        for (const field of this.fieldRow) {
            field.initModel();
        }
    }
    /** Initializes the given field. */
    initField(field) {
        if (this.sourceBlock.rendered) {
            field.init();
        }
        else {
            field.initModel();
        }
    }
    /**
     * Sever all links to this input.
     */
    dispose() {
        for (let i = 0, field; (field = this.fieldRow[i]); i++) {
            field.dispose();
        }
        if (this.connection) {
            this.connection.dispose();
        }
    }
    /**
     * Constructs a connection based on the type of this input's source block.
     * Properly handles constructing headless connections for headless blocks
     * and rendered connections for rendered blocks.
     *
     * @returns a connection of the given type, which is either a headless
     *     or rendered connection, based on the type of this input's source block.
     */
    makeConnection(type) {
        return this.sourceBlock.makeConnection_(type);
    }
}
//# sourceMappingURL=input.js.map