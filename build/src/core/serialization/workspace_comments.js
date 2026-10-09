/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as eventUtils from '../events/utils.js';
import { Coordinate } from '../utils/coordinate.js';
import { Size } from '../utils/size.js';
import * as priorities from './priorities.js';
import * as serializationRegistry from './registry.js';
/** Serializes the state of the given comment to JSON. */
export function save(comment, { addCoordinates = false, saveIds = true, } = {}) {
    const workspace = comment.workspace;
    const state = Object.create(null);
    state.height = comment.getSize().height;
    state.width = comment.getSize().width;
    if (saveIds)
        state.id = comment.id;
    if (addCoordinates) {
        const loc = comment.getRelativeToSurfaceXY();
        state.x = workspace.RTL ? workspace.getWidth() - loc.x : loc.x;
        state.y = loc.y;
    }
    if (comment.getText())
        state.text = comment.getText();
    if (comment.isCollapsed())
        state.collapsed = true;
    if (!comment.isOwnEditable())
        state.editable = false;
    if (!comment.isOwnMovable())
        state.movable = false;
    if (!comment.isOwnDeletable())
        state.deletable = false;
    return state;
}
/** Appends the comment defined by the given state to the given workspace. */
export function append(state, workspace, { recordUndo = false } = {}) {
    const prevRecordUndo = eventUtils.getRecordUndo();
    eventUtils.setRecordUndo(recordUndo);
    const comment = workspace.newComment(state.id);
    if (state.text !== undefined)
        comment.setText(state.text);
    if (state.x !== undefined || state.y !== undefined) {
        const defaultLoc = comment.getRelativeToSurfaceXY();
        let x = state.x ?? defaultLoc.x;
        x = workspace.RTL ? workspace.getWidth() - x : x;
        const y = state.y ?? defaultLoc.y;
        comment.moveTo(new Coordinate(x, y));
    }
    if (state.width !== undefined || state.height) {
        const defaultSize = comment.getSize();
        comment.setSize(new Size(state.width ?? defaultSize.width, state.height ?? defaultSize.height));
    }
    if (state.collapsed !== undefined)
        comment.setCollapsed(state.collapsed);
    if (state.editable !== undefined)
        comment.setEditable(state.editable);
    if (state.movable !== undefined)
        comment.setMovable(state.movable);
    if (state.deletable !== undefined)
        comment.setDeletable(state.deletable);
    eventUtils.setRecordUndo(prevRecordUndo);
    return comment;
}
// Alias to disambiguate saving within the serializer.
const saveComment = save;
/** Serializer for saving and loading workspace comment state. */
export class WorkspaceCommentSerializer {
    constructor() {
        this.priority = priorities.WORKSPACE_COMMENTS;
    }
    /**
     * Returns the state of all workspace comments in the given workspace.
     */
    save(workspace) {
        const commentStates = [];
        for (const comment of workspace.getTopComments()) {
            const state = saveComment(comment, {
                addCoordinates: true,
                saveIds: true,
            });
            if (state)
                commentStates.push(state);
        }
        return commentStates.length ? commentStates : null;
    }
    /**
     * Deserializes the comments defined by the given state into the given
     * workspace.
     */
    load(state, workspace) {
        for (const commentState of state) {
            append(commentState, workspace, { recordUndo: eventUtils.getRecordUndo() });
        }
    }
    /** Disposes of any comments that exist on the given workspace. */
    clear(workspace) {
        for (const comment of workspace.getTopComments()) {
            comment.dispose();
        }
    }
}
serializationRegistry.register('workspaceComments', new WorkspaceCommentSerializer());
//# sourceMappingURL=workspace_comments.js.map