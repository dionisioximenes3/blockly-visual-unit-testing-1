/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as registry from '../registry.js';
import { BlockBase } from './events_block_base.js';
import { EventType } from './type.js';
/**
 * Notifies listeners when the value of a block's field has changed but the
 * change is not yet complete, and is expected to be followed by a block change
 * event.
 */
export class BlockFieldIntermediateChange extends BlockBase {
    /**
     * @param opt_block The changed block. Undefined for a blank event.
     * @param opt_name Name of the field affected.
     * @param opt_oldValue Previous value of element.
     * @param opt_newValue New value of element.
     */
    constructor(opt_block, opt_name, opt_oldValue, opt_newValue) {
        super(opt_block);
        this.type = EventType.BLOCK_FIELD_INTERMEDIATE_CHANGE;
        // Intermediate events do not undo or redo. They may be fired frequently while
        // the field editor widget is open. A separate BLOCK_CHANGE event is fired
        // when the editor is closed, which combines all of the field value changes
        // into a single change that is recorded in the undo history instead. The
        // intermediate changes are important for reacting to immediate changes, but
        // some event handlers would prefer to handle the less frequent final events,
        // like when triggering workspace serialization. Technically, this method of
        // grouping changes can result in undo perfoming actions out of order if some
        // other event occurs between opening and closing the field editor, but such
        // events are unlikely to cause a broken state.
        this.recordUndo = false;
        if (!opt_block) {
            return; // Blank event to be populated by fromJson.
        }
        this.name = opt_name;
        this.oldValue = opt_oldValue;
        this.newValue = opt_newValue;
    }
    /**
     * Encode the event as JSON.
     *
     * @returns JSON representation.
     */
    toJson() {
        const json = super.toJson();
        if (!this.name) {
            throw new Error('The changed field name is undefined. Either pass a ' +
                'name to the constructor, or call fromJson.');
        }
        json['name'] = this.name;
        json['oldValue'] = this.oldValue;
        json['newValue'] = this.newValue;
        return json;
    }
    /**
     * Deserializes the JSON event.
     *
     * @param event The event to append new properties to. Should be a subclass
     *     of BlockFieldIntermediateChange, but we can't specify that due to the
     *     fact that parameters to static methods in subclasses must be supertypes
     *     of parameters to static methods in superclasses.
     * @internal
     */
    static fromJson(json, workspace, event) {
        const newEvent = super.fromJson(json, workspace, event ?? new BlockFieldIntermediateChange());
        newEvent.name = json['name'];
        newEvent.oldValue = json['oldValue'];
        newEvent.newValue = json['newValue'];
        return newEvent;
    }
    /**
     * Does this event record any change of state?
     *
     * @returns False if something changed.
     */
    isNull() {
        return this.oldValue === this.newValue;
    }
    /**
     * Run a change event.
     *
     * @param forward True if run forward, false if run backward (undo).
     */
    run(forward) {
        const workspace = this.getEventWorkspace_();
        if (!this.blockId) {
            throw new Error('The block ID is undefined. Either pass a block to ' +
                'the constructor, or call fromJson');
        }
        const block = workspace.getBlockById(this.blockId);
        if (!block) {
            throw new Error('The associated block is undefined. Either pass a ' +
                'block to the constructor, or call fromJson');
        }
        const value = forward ? this.newValue : this.oldValue;
        const field = block.getField(this.name);
        if (field) {
            field.setValue(value);
        }
        else {
            console.warn("Can't set non-existent field: " + this.name);
        }
    }
}
registry.register(registry.Type.EVENT, EventType.BLOCK_FIELD_INTERMEDIATE_CHANGE, BlockFieldIntermediateChange);
//# sourceMappingURL=events_block_field_intermediate_change.js.map