/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventType } from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import { Coordinate } from '../utils/coordinate.js';
import * as idGenerator from '../utils/idgenerator.js';
import { CommentView } from './comment_view.js';
export class WorkspaceComment {
    /**
     * Constructs the comment.
     *
     * @param workspace The workspace to construct the comment in.
     * @param id An optional ID to give to the comment. If not provided, one will
     *     be generated.
     */
    constructor(workspace, id) {
        this.workspace = workspace;
        /** The text of the comment. */
        this.text = '';
        /** Whether the comment is collapsed or not. */
        this.collapsed = false;
        /** Whether the comment is editable or not. */
        this.editable = true;
        /** Whether the comment is movable or not. */
        this.movable = true;
        /** Whether the comment is deletable or not. */
        this.deletable = true;
        /** The location of the comment in workspace coordinates. */
        this.location = new Coordinate(0, 0);
        /** Whether this comment has been disposed or not. */
        this.disposed = false;
        /** Whether this comment is being disposed or not. */
        this.disposing = false;
        this.id = id && !workspace.getCommentById(id) ? id : idGenerator.genUid();
        this.size = CommentView.defaultCommentSize;
        workspace.addTopComment(this);
        this.fireCreateEvent();
    }
    fireCreateEvent() {
        if (eventUtils.isEnabled()) {
            eventUtils.fire(new (eventUtils.get(EventType.COMMENT_CREATE))(this));
        }
    }
    fireDeleteEvent() {
        if (eventUtils.isEnabled()) {
            eventUtils.fire(new (eventUtils.get(EventType.COMMENT_DELETE))(this));
        }
    }
    /** Fires a comment change event. */
    fireChangeEvent(oldText, newText) {
        if (eventUtils.isEnabled()) {
            eventUtils.fire(new (eventUtils.get(EventType.COMMENT_CHANGE))(this, oldText, newText));
        }
    }
    /** Fires a comment collapse event. */
    fireCollapseEvent(newCollapsed) {
        if (eventUtils.isEnabled()) {
            eventUtils.fire(new (eventUtils.get(EventType.COMMENT_COLLAPSE))(this, newCollapsed));
        }
    }
    /** Sets the text of the comment. */
    setText(text) {
        const oldText = this.text;
        this.text = text;
        this.fireChangeEvent(oldText, text);
    }
    /** Returns the text of the comment. */
    getText() {
        return this.text;
    }
    /** Sets the comment's size in workspace units. */
    setSize(size) {
        const event = new (eventUtils.get(EventType.COMMENT_RESIZE))(this);
        this.size = size;
        event.recordCurrentSizeAsNewSize();
        eventUtils.fire(event);
    }
    /** Returns the comment's size in workspace units. */
    getSize() {
        return this.size;
    }
    /** Sets whether the comment is collapsed or not. */
    setCollapsed(collapsed) {
        this.collapsed = collapsed;
        this.fireCollapseEvent(collapsed);
    }
    /** Returns whether the comment is collapsed or not. */
    isCollapsed() {
        return this.collapsed;
    }
    /** Sets whether the comment is editable or not. */
    setEditable(editable) {
        this.editable = editable;
    }
    /**
     * Returns whether the comment is editable or not, respecting whether the
     * workspace is read-only.
     */
    isEditable() {
        return this.isOwnEditable() && !this.workspace.isReadOnly();
    }
    /**
     * Returns whether the comment is editable or not, only examining its own
     * state and ignoring the state of the workspace.
     */
    isOwnEditable() {
        return this.editable;
    }
    /** Sets whether the comment is movable or not. */
    setMovable(movable) {
        this.movable = movable;
    }
    /**
     * Returns whether the comment is movable or not, respecting whether the
     * workspace is read-only.
     */
    isMovable() {
        return (this.isOwnMovable() &&
            !this.workspace.isReadOnly() &&
            !this.workspace.isFlyout);
    }
    /**
     * Returns whether the comment is movable or not, only examining its own
     * state and ignoring the state of the workspace.
     */
    isOwnMovable() {
        return this.movable;
    }
    /** Sets whether the comment is deletable or not. */
    setDeletable(deletable) {
        this.deletable = deletable;
    }
    /**
     * Returns whether the comment is deletable or not, respecting whether the
     * workspace is read-only.
     */
    isDeletable() {
        return (this.isOwnDeletable() &&
            !this.isDeadOrDying() &&
            !this.workspace.isReadOnly() &&
            !this.workspace.isFlyout);
    }
    /**
     * Returns whether the comment is deletable or not, only examining its own
     * state and ignoring the state of the workspace.
     */
    isOwnDeletable() {
        return this.deletable;
    }
    /** Moves the comment to the given location in workspace coordinates. */
    moveTo(location, reason) {
        const event = new (eventUtils.get(EventType.COMMENT_MOVE))(this);
        if (reason)
            event.setReason(reason);
        this.location = location;
        event.recordNew();
        eventUtils.fire(event);
    }
    /** Returns the position of the comment in workspace coordinates. */
    getRelativeToSurfaceXY() {
        return this.location;
    }
    /** Disposes of this comment. */
    dispose() {
        this.disposing = true;
        this.fireDeleteEvent();
        this.workspace.removeTopComment(this);
        this.disposed = true;
    }
    /** Returns whether the comment has been disposed or not. */
    isDisposed() {
        return this.disposed;
    }
    /**
     * Returns true if this comment view is currently being disposed or has
     * already been disposed.
     */
    isDeadOrDying() {
        return this.disposing || this.disposed;
    }
}
//# sourceMappingURL=workspace_comment.js.map