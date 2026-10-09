/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventType } from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import * as layers from '../layers.js';
export class CommentDragStrategy {
    constructor(comment) {
        this.comment = comment;
        this.startLoc = null;
        this.workspace = comment.workspace;
    }
    isMovable() {
        return (this.comment.isOwnMovable() &&
            !this.comment.isDeadOrDying() &&
            !this.workspace.isReadOnly());
    }
    startDrag() {
        this.fireDragStartEvent();
        this.startLoc = this.comment.getRelativeToSurfaceXY();
        this.workspace.setResizesEnabled(false);
        this.workspace.getLayerManager()?.moveToDragLayer(this.comment);
        this.comment.setDragging(true);
    }
    drag(newLoc) {
        this.comment.moveDuringDrag(newLoc);
    }
    endDrag() {
        this.fireDragEndEvent();
        this.fireMoveEvent();
        this.workspace
            .getLayerManager()
            ?.moveOffDragLayer(this.comment, layers.BLOCK);
        this.comment.setDragging(false);
        this.comment.snapToGrid();
        this.workspace.setResizesEnabled(true);
    }
    /** Fire a UI event at the start of a comment drag. */
    fireDragStartEvent() {
        const event = new (eventUtils.get(EventType.COMMENT_DRAG))(this.comment, true);
        eventUtils.fire(event);
    }
    /** Fire a UI event at the end of a comment drag. */
    fireDragEndEvent() {
        const event = new (eventUtils.get(EventType.COMMENT_DRAG))(this.comment, false);
        eventUtils.fire(event);
    }
    /** Fire a move event at the end of a comment drag. */
    fireMoveEvent() {
        if (this.comment.isDeadOrDying())
            return;
        const event = new (eventUtils.get(EventType.COMMENT_MOVE))(this.comment);
        event.setReason(['drag']);
        event.oldCoordinate_ = this.startLoc;
        event.recordNew();
        eventUtils.fire(event);
    }
    revertDrag() {
        if (this.startLoc)
            this.comment.moveDuringDrag(this.startLoc);
    }
}
//# sourceMappingURL=comment_drag_strategy.js.map