/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Abstract as AbstractEvent, } from './events_abstract.js';
/**
 * Abstract class for any event related to blocks.
 */
export class BlockBase extends AbstractEvent {
    /**
     * @param opt_block The block this event corresponds to.
     *     Undefined for a blank event.
     */
    constructor(opt_block) {
        super();
        this.isBlank = true;
        this.isBlank = !opt_block;
        if (!opt_block)
            return;
        this.blockId = opt_block.id;
        this.workspaceId = opt_block.workspace.id;
    }
    /**
     * Encode the event as JSON.
     *
     * @returns JSON representation.
     */
    toJson() {
        const json = super.toJson();
        if (!this.blockId) {
            throw new Error('The block ID is undefined. Either pass a block to ' +
                'the constructor, or call fromJson');
        }
        json['blockId'] = this.blockId;
        return json;
    }
    /**
     * Deserializes the JSON event.
     *
     * @param event The event to append new properties to. Should be a subclass
     *     of BlockBase, but we can't specify that due to the fact that parameters
     *     to static methods in subclasses must be supertypes of parameters to
     *     static methods in superclasses.
     * @internal
     */
    static fromJson(json, workspace, event) {
        const newEvent = super.fromJson(json, workspace, event ?? new BlockBase());
        newEvent.blockId = json['blockId'];
        return newEvent;
    }
}
//# sourceMappingURL=events_block_base.js.map