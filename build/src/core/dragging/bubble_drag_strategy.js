/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as layers from '../layers.js';
export class BubbleDragStrategy {
    constructor(bubble, workspace) {
        this.bubble = bubble;
        this.workspace = workspace;
        this.startLoc = null;
    }
    isMovable() {
        return true;
    }
    startDrag() {
        this.startLoc = this.bubble.getRelativeToSurfaceXY();
        this.workspace.setResizesEnabled(false);
        this.workspace.getLayerManager()?.moveToDragLayer(this.bubble);
        if (this.bubble.setDragging) {
            this.bubble.setDragging(true);
        }
    }
    drag(newLoc) {
        this.bubble.moveDuringDrag(newLoc);
    }
    endDrag() {
        this.workspace.setResizesEnabled(true);
        this.workspace
            .getLayerManager()
            ?.moveOffDragLayer(this.bubble, layers.BUBBLE);
        this.bubble.setDragging(false);
    }
    revertDrag() {
        if (this.startLoc)
            this.bubble.moveDuringDrag(this.startLoc);
    }
}
//# sourceMappingURL=bubble_drag_strategy.js.map