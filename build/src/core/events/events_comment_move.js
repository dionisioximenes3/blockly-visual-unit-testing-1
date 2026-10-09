/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as registry from '../registry.js';
import { Coordinate } from '../utils/coordinate.js';
import { CommentBase } from './events_comment_base.js';
import { EventType } from './type.js';
/**
 * Notifies listeners that a workspace comment has moved.
 */
export class CommentMove extends CommentBase {
    /**
     * @param opt_comment The comment that is being moved.  Undefined for a blank
     *     event.
     */
    constructor(opt_comment) {
        super(opt_comment);
        this.type = EventType.COMMENT_MOVE;
        if (!opt_comment) {
            return; // Blank event to be populated by fromJson.
        }
        this.comment_ = opt_comment;
        this.oldCoordinate_ = opt_comment.getRelativeToSurfaceXY();
    }
    /**
     * Record the comment's new location.  Called after the move.  Can only be
     * called once.
     */
    recordNew() {
        if (this.newCoordinate_) {
            throw Error('Tried to record the new position of a comment on the ' +
                'same event twice.');
        }
        if (!this.comment_) {
            throw new Error('The comment is undefined. Pass a comment to ' +
                'the constructor if you want to use the record functionality');
        }
        this.newCoordinate_ = this.comment_.getRelativeToSurfaceXY();
    }
    /**
     * Sets the reason for a move event.
     *
     * @param reason Why is this move happening?  'drag', 'bump', 'snap', ...
     */
    setReason(reason) {
        this.reason = reason;
    }
    /**
     * Override the location before the move.  Use this if you don't create the
     * event until the end of the move, but you know the original location.
     *
     * @param xy The location before the move, in workspace coordinates.
     */
    setOldCoordinate(xy) {
        this.oldCoordinate_ = xy;
    }
    // TODO (#1266): "Full" and "minimal" serialization.
    /**
     * Encode the event as JSON.
     *
     * @returns JSON representation.
     */
    toJson() {
        const json = super.toJson();
        if (!this.oldCoordinate_) {
            throw new Error('The old comment position is undefined. Either pass a comment to ' +
                'the constructor, or call fromJson');
        }
        if (!this.newCoordinate_) {
            throw new Error('The new comment position is undefined. Either call recordNew, or ' +
                'call fromJson');
        }
        json['oldCoordinate'] =
            `${Math.round(this.oldCoordinate_.x)}, ` +
                `${Math.round(this.oldCoordinate_.y)}`;
        json['newCoordinate'] =
            Math.round(this.newCoordinate_.x) +
                ',' +
                Math.round(this.newCoordinate_.y);
        return json;
    }
    /**
     * Deserializes the JSON event.
     *
     * @param event The event to append new properties to. Should be a subclass
     *     of CommentMove, but we can't specify that due to the fact that
     *     parameters to static methods in subclasses must be supertypes of
     *     parameters to static methods in superclasses.
     * @internal
     */
    static fromJson(json, workspace, event) {
        const newEvent = super.fromJson(json, workspace, event ?? new CommentMove());
        let xy = json['oldCoordinate'].split(',');
        newEvent.oldCoordinate_ = new Coordinate(Number(xy[0]), Number(xy[1]));
        xy = json['newCoordinate'].split(',');
        newEvent.newCoordinate_ = new Coordinate(Number(xy[0]), Number(xy[1]));
        return newEvent;
    }
    /**
     * Does this event record any change of state?
     *
     * @returns False if something changed.
     */
    isNull() {
        return Coordinate.equals(this.oldCoordinate_, this.newCoordinate_);
    }
    /**
     * Run a move event.
     *
     * @param forward True if run forward, false if run backward (undo).
     */
    run(forward) {
        const workspace = this.getEventWorkspace_();
        if (!this.commentId) {
            throw new Error('The comment ID is undefined. Either pass a comment to ' +
                'the constructor, or call fromJson');
        }
        // TODO: Remove cast when we update getCommentById.
        const comment = workspace.getCommentById(this.commentId);
        if (!comment) {
            console.warn("Can't move non-existent comment: " + this.commentId);
            return;
        }
        const target = forward ? this.newCoordinate_ : this.oldCoordinate_;
        if (!target) {
            throw new Error('Either oldCoordinate_ or newCoordinate_ is undefined. ' +
                'Either pass a comment to the constructor and call recordNew, ' +
                'or call fromJson');
        }
        comment.moveTo(target);
    }
}
registry.register(registry.Type.EVENT, EventType.COMMENT_MOVE, CommentMove);
//# sourceMappingURL=events_comment_move.js.map