/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as registry from '../registry.js';
import { UiBase } from './events_ui_base.js';
import { EventType } from './type.js';
/**
 * Class for a bubble open event.
 */
export class BubbleOpen extends UiBase {
    /**
     * @param opt_block The associated block. Undefined for a blank event.
     * @param opt_isOpen Whether the bubble is opening (false if closing).
     *     Undefined for a blank event.
     * @param opt_bubbleType The type of bubble. One of 'mutator', 'comment' or
     *     'warning'. Undefined for a blank event.
     */
    constructor(opt_block, opt_isOpen, opt_bubbleType) {
        const workspaceId = opt_block ? opt_block.workspace.id : undefined;
        super(workspaceId);
        this.type = EventType.BUBBLE_OPEN;
        if (!opt_block)
            return;
        this.blockId = opt_block.id;
        this.isOpen = opt_isOpen;
        this.bubbleType = opt_bubbleType;
    }
    /**
     * Encode the event as JSON.
     *
     * @returns JSON representation.
     */
    toJson() {
        const json = super.toJson();
        if (this.isOpen === undefined) {
            throw new Error('Whether this event is for opening the bubble is undefined. ' +
                'Either pass the value to the constructor, or call fromJson');
        }
        if (!this.bubbleType) {
            throw new Error('The type of bubble is undefined. Either pass the ' +
                'value to the constructor, or call fromJson');
        }
        json['isOpen'] = this.isOpen;
        json['bubbleType'] = this.bubbleType;
        json['blockId'] = this.blockId || '';
        return json;
    }
    /**
     * Deserializes the JSON event.
     *
     * @param event The event to append new properties to. Should be a subclass
     *     of BubbleOpen, but we can't specify that due to the fact that
     *     parameters to static methods in subclasses must be supertypes of
     *     parameters to static methods in superclasses.
     * @internal
     */
    static fromJson(json, workspace, event) {
        const newEvent = super.fromJson(json, workspace, event ?? new BubbleOpen());
        newEvent.isOpen = json['isOpen'];
        newEvent.bubbleType = json['bubbleType'];
        newEvent.blockId = json['blockId'];
        return newEvent;
    }
}
export var BubbleType;
(function (BubbleType) {
    BubbleType["MUTATOR"] = "mutator";
    BubbleType["COMMENT"] = "comment";
    BubbleType["WARNING"] = "warning";
})(BubbleType || (BubbleType = {}));
registry.register(registry.Type.EVENT, EventType.BUBBLE_OPEN, BubbleOpen);
//# sourceMappingURL=events_bubble_open.js.map