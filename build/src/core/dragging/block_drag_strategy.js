/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as blockAnimation from '../block_animations.js';
import * as bumpObjects from '../bump_objects.js';
import { config } from '../config.js';
import { Connection } from '../connection.js';
import { ConnectionType } from '../connection_type.js';
import { EventType } from '../events/type.js';
import * as eventUtils from '../events/utils.js';
import * as layers from '../layers.js';
import * as registry from '../registry.js';
import { finishQueuedRenders } from '../render_management.js';
import { Coordinate } from '../utils.js';
import * as dom from '../utils/dom.js';
export class BlockDragStrategy {
    constructor(block) {
        this.block = block;
        /** The parent block at the start of the drag. */
        this.startParentConn = null;
        /**
         * The child block at the start of the drag. Only gets set if
         * `healStack` is true.
         */
        this.startChildConn = null;
        this.startLoc = null;
        this.connectionCandidate = null;
        this.connectionPreviewer = null;
        this.dragging = false;
        /**
         * If this is a shadow block, the offset between this block and the parent
         * block, to add to the drag location. In workspace units.
         */
        this.dragOffset = new Coordinate(0, 0);
        /** Used to persist an event group when snapping is done async. */
        this.originalEventGroup = '';
        this.workspace = block.workspace;
    }
    /** Returns true if the block is currently movable. False otherwise. */
    isMovable() {
        if (this.block.isShadow()) {
            return this.block.getParent()?.isMovable() ?? false;
        }
        return (this.block.isOwnMovable() &&
            !this.block.isDeadOrDying() &&
            !this.workspace.isReadOnly() &&
            // We never drag blocks in the flyout, only create new blocks that are
            // dragged.
            !this.block.isInFlyout);
    }
    /**
     * Handles any setup for starting the drag, including disconnecting the block
     * from any parent blocks.
     */
    startDrag(e) {
        if (this.block.isShadow()) {
            this.startDraggingShadow(e);
            return;
        }
        this.dragging = true;
        this.fireDragStartEvent();
        this.startLoc = this.block.getRelativeToSurfaceXY();
        this.connectionCandidate = null;
        const previewerConstructor = registry.getClassFromOptions(registry.Type.CONNECTION_PREVIEWER, this.workspace.options);
        this.connectionPreviewer = new previewerConstructor(this.block);
        // During a drag there may be a lot of rerenders, but not field changes.
        // Turn the cache on so we don't do spurious remeasures during the drag.
        dom.startTextWidthCache();
        this.workspace.setResizesEnabled(false);
        blockAnimation.disconnectUiStop();
        const healStack = this.shouldHealStack(e);
        if (this.shouldDisconnect(healStack)) {
            this.disconnectBlock(healStack);
        }
        this.block.setDragging(true);
        this.workspace.getLayerManager()?.moveToDragLayer(this.block);
    }
    /**
     * Get whether the drag should act on a single block or a block stack.
     *
     * @param e The instigating pointer event, if any.
     * @returns True if just the initial block should be dragged out, false
     *     if all following blocks should also be dragged.
     */
    shouldHealStack(e) {
        return !!e && (e.altKey || e.ctrlKey || e.metaKey);
    }
    /** Starts a drag on a shadow, recording the drag offset. */
    startDraggingShadow(e) {
        const parent = this.block.getParent();
        if (!parent) {
            throw new Error('Tried to drag a shadow block with no parent. ' +
                'Shadow blocks should always have parents.');
        }
        this.dragOffset = Coordinate.difference(parent.getRelativeToSurfaceXY(), this.block.getRelativeToSurfaceXY());
        parent.startDrag(e);
    }
    /**
     * Whether or not we should disconnect the block when a drag is started.
     *
     * @param healStack Whether or not to heal the stack after disconnecting.
     * @returns True to disconnect the block, false otherwise.
     */
    shouldDisconnect(healStack) {
        return !!(this.block.getParent() ||
            (healStack &&
                this.block.nextConnection &&
                this.block.nextConnection.targetBlock()));
    }
    /**
     * Disconnects the block from any parents. If `healStack` is true and this is
     * a stack block, we also disconnect from any next blocks and attempt to
     * attach them to any parent.
     *
     * @param healStack Whether or not to heal the stack after disconnecting.
     */
    disconnectBlock(healStack) {
        this.startParentConn =
            this.block.outputConnection?.targetConnection ??
                this.block.previousConnection?.targetConnection;
        if (healStack) {
            this.startChildConn = this.block.nextConnection?.targetConnection;
        }
        this.block.unplug(healStack);
        blockAnimation.disconnectUiEffect(this.block);
    }
    /** Fire a UI event at the start of a block drag. */
    fireDragStartEvent() {
        const event = new (eventUtils.get(EventType.BLOCK_DRAG))(this.block, true, this.block.getDescendants(false));
        eventUtils.fire(event);
    }
    /** Fire a UI event at the end of a block drag. */
    fireDragEndEvent() {
        const event = new (eventUtils.get(EventType.BLOCK_DRAG))(this.block, false, this.block.getDescendants(false));
        eventUtils.fire(event);
    }
    /** Fire a move event at the end of a block drag. */
    fireMoveEvent() {
        if (this.block.isDeadOrDying())
            return;
        const event = new (eventUtils.get(EventType.BLOCK_MOVE))(this.block);
        event.setReason(['drag']);
        event.oldCoordinate = this.startLoc;
        event.recordNew();
        eventUtils.fire(event);
    }
    /** Moves the block and updates any connection previews. */
    drag(newLoc) {
        if (this.block.isShadow()) {
            this.block.getParent()?.drag(Coordinate.sum(newLoc, this.dragOffset));
            return;
        }
        this.block.moveDuringDrag(newLoc);
        this.updateConnectionPreview(this.block, Coordinate.difference(newLoc, this.startLoc));
    }
    /**
     * @param draggingBlock The block being dragged.
     * @param delta How far the pointer has moved from the position
     *     at the start of the drag, in workspace units.
     */
    updateConnectionPreview(draggingBlock, delta) {
        const currCandidate = this.connectionCandidate;
        const newCandidate = this.getConnectionCandidate(draggingBlock, delta);
        if (!newCandidate) {
            this.connectionPreviewer?.hidePreview();
            this.connectionCandidate = null;
            return;
        }
        const candidate = currCandidate &&
            this.currCandidateIsBetter(currCandidate, delta, newCandidate)
            ? currCandidate
            : newCandidate;
        this.connectionCandidate = candidate;
        const { local, neighbour } = candidate;
        const localIsOutputOrPrevious = local.type === ConnectionType.OUTPUT_VALUE ||
            local.type === ConnectionType.PREVIOUS_STATEMENT;
        const neighbourIsConnectedToRealBlock = neighbour.isConnected() && !neighbour.targetBlock()?.isInsertionMarker();
        if (localIsOutputOrPrevious &&
            neighbourIsConnectedToRealBlock &&
            !this.orphanCanConnectAtEnd(draggingBlock, neighbour.targetBlock(), local.type)) {
            this.connectionPreviewer?.previewReplacement(local, neighbour, neighbour.targetBlock());
            return;
        }
        this.connectionPreviewer?.previewConnection(local, neighbour);
    }
    /**
     * Returns true if the given orphan block can connect at the end of the
     * top block's stack or row, false otherwise.
     */
    orphanCanConnectAtEnd(topBlock, orphanBlock, localType) {
        const orphanConnection = localType === ConnectionType.OUTPUT_VALUE
            ? orphanBlock.outputConnection
            : orphanBlock.previousConnection;
        return !!Connection.getConnectionForOrphanedConnection(topBlock, orphanConnection);
    }
    /**
     * Returns true if the current candidate is better than the new candidate.
     *
     * We slightly prefer the current candidate even if it is farther away.
     */
    currCandidateIsBetter(currCandiate, delta, newCandidate) {
        const { local: currLocal, neighbour: currNeighbour } = currCandiate;
        const localPos = new Coordinate(currLocal.x, currLocal.y);
        const neighbourPos = new Coordinate(currNeighbour.x, currNeighbour.y);
        const currDistance = Coordinate.distance(Coordinate.sum(localPos, delta), neighbourPos);
        return (newCandidate.distance > currDistance - config.currentConnectionPreference);
    }
    /**
     * Returns the closest valid candidate connection, if one can be found.
     *
     * Valid neighbour connections are within the configured start radius, with a
     * compatible type (input, output, etc) and connection check.
     */
    getConnectionCandidate(draggingBlock, delta) {
        const localConns = this.getLocalConnections(draggingBlock);
        let radius = this.getSearchRadius();
        let candidate = null;
        for (const conn of localConns) {
            const { connection: neighbour, radius: rad } = conn.closest(radius, delta);
            if (neighbour) {
                candidate = {
                    local: conn,
                    neighbour: neighbour,
                    distance: rad,
                };
                radius = rad;
            }
        }
        return candidate;
    }
    /**
     * Get the radius to use when searching for a nearby valid connection.
     */
    getSearchRadius() {
        return this.connectionCandidate
            ? config.connectingSnapRadius
            : config.snapRadius;
    }
    /**
     * Returns all of the connections we might connect to blocks on the workspace.
     *
     * Includes any connections on the dragging block, and any last next
     * connection on the stack (if one exists).
     */
    getLocalConnections(draggingBlock) {
        const available = draggingBlock.getConnections_(false);
        const lastOnStack = draggingBlock.lastConnectionInStack(true);
        if (lastOnStack && lastOnStack !== draggingBlock.nextConnection) {
            available.push(lastOnStack);
        }
        return available;
    }
    /**
     * Cleans up any state at the end of the drag. Applies any pending
     * connections.
     */
    endDrag(e) {
        if (this.block.isShadow()) {
            this.block.getParent()?.endDrag(e);
            return;
        }
        this.originalEventGroup = eventUtils.getGroup();
        this.fireDragEndEvent();
        this.fireMoveEvent();
        dom.stopTextWidthCache();
        blockAnimation.disconnectUiStop();
        this.connectionPreviewer?.hidePreview();
        if (!this.block.isDeadOrDying() && this.dragging) {
            // These are expensive and don't need to be done if we're deleting, or
            // if we've already stopped dragging because we moved back to the start.
            this.workspace
                .getLayerManager()
                ?.moveOffDragLayer(this.block, layers.BLOCK);
            this.block.setDragging(false);
        }
        if (this.connectionCandidate) {
            // Applying connections also rerenders the relevant blocks.
            this.applyConnections(this.connectionCandidate);
            this.disposeStep();
        }
        else {
            this.block.queueRender().then(() => this.disposeStep());
        }
    }
    /** Disposes of any state at the end of the drag. */
    disposeStep() {
        const newGroup = eventUtils.getGroup();
        eventUtils.setGroup(this.originalEventGroup);
        this.block.snapToGrid();
        // Must dispose after connections are applied to not break the dynamic
        // connections plugin. See #7859
        this.connectionPreviewer?.dispose();
        this.workspace.setResizesEnabled(true);
        eventUtils.setGroup(newGroup);
    }
    /** Connects the given candidate connections. */
    applyConnections(candidate) {
        const { local, neighbour } = candidate;
        local.connect(neighbour);
        const inferiorConnection = local.isSuperior() ? neighbour : local;
        const rootBlock = this.block.getRootBlock();
        finishQueuedRenders().then(() => {
            blockAnimation.connectionUiEffect(inferiorConnection.getSourceBlock());
            // bringToFront is incredibly expensive. Delay until the next frame.
            setTimeout(() => {
                rootBlock.bringToFront();
            }, 0);
        });
    }
    /**
     * Moves the block back to where it was at the beginning of the drag,
     * including reconnecting connections.
     */
    revertDrag() {
        if (this.block.isShadow()) {
            this.block.getParent()?.revertDrag();
            return;
        }
        this.connectionPreviewer?.hidePreview();
        this.connectionCandidate = null;
        this.startChildConn?.connect(this.block.nextConnection);
        if (this.startParentConn) {
            switch (this.startParentConn.type) {
                case ConnectionType.INPUT_VALUE:
                    this.startParentConn.connect(this.block.outputConnection);
                    break;
                case ConnectionType.NEXT_STATEMENT:
                    this.startParentConn.connect(this.block.previousConnection);
            }
        }
        else {
            this.block.moveTo(this.startLoc, ['drag']);
            this.workspace
                .getLayerManager()
                ?.moveOffDragLayer(this.block, layers.BLOCK);
            // Blocks dragged directly from a flyout may need to be bumped into
            // bounds.
            bumpObjects.bumpIntoBounds(this.workspace, this.workspace.getMetricsManager().getScrollMetrics(true), this.block);
        }
        this.startChildConn = null;
        this.startParentConn = null;
        this.block.setDragging(false);
        this.dragging = false;
    }
}
//# sourceMappingURL=block_drag_strategy.js.map