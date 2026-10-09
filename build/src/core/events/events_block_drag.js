/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as registry from '../registry.js';
import { UiBase } from './events_ui_base.js';
import { EventType } from './type.js';
/**
 * Notifies listeners when a block is being manually dragged/dropped.
 */
export class BlockDrag extends UiBase {
    /**
     * @param opt_block The top block in the stack that is being dragged.
     *     Undefined for a blank event.
     * @param opt_isStart Whether this is the start of a block drag.
     *    Undefined for a blank event.
     * @param opt_blocks The blocks affected by this drag. Undefined for a blank
     *     event.
     */
    constructor(opt_block, opt_isStart, opt_blocks) {
        const workspaceId = opt_block ? opt_block.workspace.id : undefined;
        super(workspaceId);
        this.type = EventType.BLOCK_DRAG;
        if (!opt_block)
            return;
        this.blockId = opt_block.id;
        this.isStart = opt_isStart;
        this.blocks = opt_blocks;
    }
    /**
     * Encode the event as JSON.
     *
     * @returns JSON representation.
     */
    toJson() {
        const json = super.toJson();
        if (this.isStart === undefined) {
            throw new Error('Whether this event is the start of a drag is undefined. ' +
                'Either pass the value to the constructor, or call fromJson');
        }
        if (this.blockId === undefined) {
            throw new Error('The block ID is undefined. Either pass a block to ' +
                'the constructor, or call fromJson');
        }
        json['isStart'] = this.isStart;
        json['blockId'] = this.blockId;
        // TODO: I don't think we should actually apply the blocks array to the JSON
        //   object b/c they have functions and aren't actually serializable.
        json['blocks'] = this.blocks;
        return json;
    }
    /**
     * Deserializes the JSON event.
     *
     * @param event The event to append new properties to. Should be a subclass
     *     of BlockDrag, but we can't specify that due to the fact that parameters
     *     to static methods in subclasses must be supertypes of parameters to
     *     static methods in superclasses..
     * @internal
     */
    static fromJson(json, workspace, event) {
        const newEvent = super.fromJson(json, workspace, event ?? new BlockDrag());
        newEvent.isStart = json['isStart'];
        newEvent.blockId = json['blockId'];
        newEvent.blocks = json['blocks'];
        return newEvent;
    }
}
registry.register(registry.Type.EVENT, EventType.BLOCK_DRAG, BlockDrag);
//# sourceMappingURL=events_block_drag.js.map