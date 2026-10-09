/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as blockAnimations from '../block_animations.js';
import { BlockSvg } from '../block_svg.js';
import { ComponentManager } from '../component_manager.js';
import * as eventUtils from '../events/utils.js';
import { getFocusManager } from '../focus_manager.js';
import { isDeletable } from '../interfaces/i_deletable.js';
import { isFocusableNode } from '../interfaces/i_focusable_node.js';
import * as registry from '../registry.js';
import { Coordinate } from '../utils/coordinate.js';
export class Dragger {
    constructor(draggable, workspace) {
        this.draggable = draggable;
        this.workspace = workspace;
        this.dragTarget = null;
        this.startLoc = draggable.getRelativeToSurfaceXY();
    }
    /** Handles any drag startup. */
    onDragStart(e) {
        if (!eventUtils.getGroup()) {
            eventUtils.setGroup(true);
        }
        this.draggable.startDrag(e);
    }
    /**
     * Handles calculating where the element should actually be moved to.
     *
     * @param totalDelta The total amount in pixel coordinates the mouse has moved
     *     since the start of the drag.
     */
    onDrag(e, totalDelta) {
        this.moveDraggable(e, totalDelta);
        const root = this.getRoot(this.draggable);
        // Must check `wouldDelete` before calling other hooks on drag targets
        // since we have documented that we would do so.
        if (isDeletable(root)) {
            root.setDeleteStyle(this.wouldDeleteDraggable(e, root));
        }
        this.updateDragTarget(e);
    }
    /** Updates the drag target under the pointer (if there is one). */
    updateDragTarget(e) {
        const newDragTarget = this.workspace.getDragTarget(e);
        const root = this.getRoot(this.draggable);
        if (this.dragTarget !== newDragTarget) {
            this.dragTarget?.onDragExit(root);
            newDragTarget?.onDragEnter(root);
        }
        newDragTarget?.onDragOver(root);
        this.dragTarget = newDragTarget;
    }
    /**
     * Calculates the correct workspace coordinate for the movable and tells
     * the draggable to go to that location.
     */
    moveDraggable(e, totalDelta) {
        const delta = this.pixelsToWorkspaceUnits(totalDelta);
        const newLoc = Coordinate.sum(this.startLoc, delta);
        this.draggable.drag(newLoc, e);
    }
    /**
     * Returns true if we would delete the draggable if it was dropped
     * at the current location.
     */
    wouldDeleteDraggable(e, rootDraggable) {
        const dragTarget = this.workspace.getDragTarget(e);
        if (!dragTarget)
            return false;
        const componentManager = this.workspace.getComponentManager();
        const isDeleteArea = componentManager.hasCapability(dragTarget.id, ComponentManager.Capability.DELETE_AREA);
        if (!isDeleteArea)
            return false;
        return dragTarget.wouldDelete(rootDraggable);
    }
    /** Handles any drag cleanup. */
    onDragEnd(e) {
        const origGroup = eventUtils.getGroup();
        const dragTarget = this.workspace.getDragTarget(e);
        const root = this.getRoot(this.draggable);
        if (dragTarget) {
            this.dragTarget?.onDrop(root);
        }
        if (this.shouldReturnToStart(e, root)) {
            this.draggable.revertDrag();
        }
        const wouldDelete = isDeletable(root) && this.wouldDeleteDraggable(e, root);
        // TODO(#8148): use a generalized API instead of an instanceof check.
        if (wouldDelete && this.draggable instanceof BlockSvg) {
            blockAnimations.disposeUiEffect(this.draggable.getRootBlock());
        }
        this.draggable.endDrag(e);
        if (wouldDelete && isDeletable(root)) {
            // We want to make sure the delete gets grouped with any possible move
            // event. In core Blockly this shouldn't happen, but due to a change
            // in behavior older custom draggables might still clear the group.
            eventUtils.setGroup(origGroup);
            root.dispose();
        }
        eventUtils.setGroup(false);
        if (!wouldDelete && isFocusableNode(this.draggable)) {
            // Ensure focusable nodes that have finished dragging (but aren't being
            // deleted) end with focus and selection.
            getFocusManager().focusNode(this.draggable);
        }
    }
    // We need to special case blocks for now so that we look at the root block
    // instead of the one actually being dragged in most cases.
    getRoot(draggable) {
        return draggable instanceof BlockSvg ? draggable.getRootBlock() : draggable;
    }
    /**
     * Returns true if we should return the draggable to its original location
     * at the end of the drag.
     */
    shouldReturnToStart(e, rootDraggable) {
        const dragTarget = this.workspace.getDragTarget(e);
        if (!dragTarget)
            return false;
        return dragTarget.shouldPreventMove(rootDraggable);
    }
    pixelsToWorkspaceUnits(pixelCoord) {
        const result = new Coordinate(pixelCoord.x / this.workspace.scale, pixelCoord.y / this.workspace.scale);
        if (this.workspace.isMutator) {
            // If we're in a mutator, its scale is always 1, purely because of some
            // oddities in our rendering optimizations.  The actual scale is the same
            // as the scale on the parent workspace. Fix that for dragging.
            const mainScale = this.workspace.options.parentWorkspace.scale;
            result.scale(1 / mainScale);
        }
        return result;
    }
}
registry.register(registry.Type.BLOCK_DRAGGER, registry.DEFAULT, Dragger);
//# sourceMappingURL=dragger.js.map