/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as registry from '../registry.js';
import * as comments from '../serialization/workspace_comments.js';
import * as utilsXml from '../utils/xml.js';
import * as Xml from '../xml.js';
import { CommentBase } from './events_comment_base.js';
import { EventType } from './type.js';
/**
 * Notifies listeners that a workspace comment has been deleted.
 */
export class CommentDelete extends CommentBase {
    /**
     * @param opt_comment The deleted comment.
     *     Undefined for a blank event.
     */
    constructor(opt_comment) {
        super(opt_comment);
        this.type = EventType.COMMENT_DELETE;
        if (!opt_comment) {
            return; // Blank event to be populated by fromJson.
        }
        this.xml = Xml.saveWorkspaceComment(opt_comment);
        this.json = comments.save(opt_comment, { addCoordinates: true });
    }
    /**
     * Run a creation event.
     *
     * @param forward True if run forward, false if run backward (undo).
     */
    run(forward) {
        CommentBase.CommentCreateDeleteHelper(this, !forward);
    }
    /**
     * Encode the event as JSON.
     *
     * @returns JSON representation.
     */
    toJson() {
        const json = super.toJson();
        if (!this.xml) {
            throw new Error('The comment XML is undefined. Either pass a comment to ' +
                'the constructor, or call fromJson');
        }
        if (!this.json) {
            throw new Error('The comment JSON is undefined. Either pass a block to ' +
                'the constructor, or call fromJson');
        }
        json['xml'] = Xml.domToText(this.xml);
        json['json'] = this.json;
        return json;
    }
    /**
     * Deserializes the JSON event.
     *
     * @param event The event to append new properties to. Should be a subclass
     *     of CommentDelete, but we can't specify that due to the fact that
     *     parameters to static methods in subclasses must be supertypes of
     *     parameters to static methods in superclasses.
     * @internal
     */
    static fromJson(json, workspace, event) {
        const newEvent = super.fromJson(json, workspace, event ?? new CommentDelete());
        newEvent.xml = utilsXml.textToDom(json['xml']);
        newEvent.json = json['json'];
        return newEvent;
    }
}
registry.register(registry.Type.EVENT, EventType.COMMENT_DELETE, CommentDelete);
//# sourceMappingURL=events_comment_delete.js.map