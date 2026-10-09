/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as registry from '../registry.js';
import { UiBase } from './events_ui_base.js';
import { EventType } from './type.js';
/**
 * Notifies listeners when a comment is being manually dragged/dropped.
 */
export class CommentDrag extends UiBase {
    /**
     * @param opt_comment The comment that is being dragged.
     *     Undefined for a blank event.
     * @param opt_isStart Whether this is the start of a comment drag.
     *    Undefined for a blank event.
     */
    constructor(opt_comment, opt_isStart) {
        const workspaceId = opt_comment ? opt_comment.workspace.id : undefined;
        super(workspaceId);
        this.type = EventType.COMMENT_DRAG;
        if (!opt_comment)
            return;
        this.commentId = opt_comment.id;
        this.isStart = opt_isStart;
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
        if (this.commentId === undefined) {
            throw new Error('The comment ID is undefined. Either pass a comment to ' +
                'the constructor, or call fromJson');
        }
        json['isStart'] = this.isStart;
        json['commentId'] = this.commentId;
        return json;
    }
    /**
     * Deserializes the JSON event.
     *
     * @param event The event to append new properties to. Should be a subclass
     *     of CommentDrag, but we can't specify that due to the fact that parameters
     *     to static methods in subclasses must be supertypes of parameters to
     *     static methods in superclasses.
     * @internal
     */
    static fromJson(json, workspace, event) {
        const newEvent = super.fromJson(json, workspace, event ?? new CommentDrag());
        newEvent.isStart = json['isStart'];
        newEvent.commentId = json['commentId'];
        return newEvent;
    }
}
registry.register(registry.Type.EVENT, EventType.COMMENT_DRAG, CommentDrag);
//# sourceMappingURL=events_comment_drag.js.map