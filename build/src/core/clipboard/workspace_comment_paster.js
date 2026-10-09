/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventType } from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import { getFocusManager } from '../focus_manager.js';
import * as commentSerialiation from '../serialization/workspace_comments.js';
import { Coordinate } from '../utils/coordinate.js';
import * as registry from './registry.js';
export class WorkspaceCommentPaster {
    paste(copyData, workspace, coordinate) {
        const state = copyData.commentState;
        if (coordinate) {
            state['x'] = coordinate.x;
            state['y'] = coordinate.y;
        }
        eventUtils.disable();
        let comment;
        try {
            comment = commentSerialiation.append(state, workspace);
            moveCommentToNotConflict(comment);
        }
        finally {
            eventUtils.enable();
        }
        if (!comment)
            return null;
        if (eventUtils.isEnabled()) {
            eventUtils.fire(new (eventUtils.get(EventType.COMMENT_CREATE))(comment));
        }
        getFocusManager().focusNode(comment);
        return comment;
    }
}
WorkspaceCommentPaster.TYPE = 'workspace-comment';
function moveCommentToNotConflict(comment) {
    const workspace = comment.workspace;
    const translateDistance = 30;
    const coord = comment.getRelativeToSurfaceXY();
    const offset = new Coordinate(0, 0);
    // getRelativeToSurfaceXY is really expensive, so we want to cache this.
    const otherCoords = workspace
        .getTopComments(false)
        .filter((otherComment) => otherComment.id !== comment.id)
        .map((c) => c.getRelativeToSurfaceXY());
    while (commentOverlapsOtherExactly(Coordinate.sum(coord, offset), otherCoords)) {
        offset.translate(workspace.RTL ? -translateDistance : translateDistance, translateDistance);
    }
    comment.moveTo(Coordinate.sum(coord, offset));
}
function commentOverlapsOtherExactly(coord, otherCoords) {
    return otherCoords.some((otherCoord) => Math.abs(otherCoord.x - coord.x) <= 1 &&
        Math.abs(otherCoord.y - coord.y) <= 1);
}
registry.register(WorkspaceCommentPaster.TYPE, new WorkspaceCommentPaster());
//# sourceMappingURL=workspace_comment_paster.js.map