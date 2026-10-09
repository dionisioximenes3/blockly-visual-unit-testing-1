/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * The class representing a marker.
 * Used primarily for keyboard navigation to show a marked location.
 *
 * @class
 */
// Former goog.module ID: Blockly.Marker
import { BlockSvg } from '../block_svg.js';
import { Field } from '../field.js';
import { RenderedConnection } from '../rendered_connection.js';
/**
 * Class for a marker.
 * This is used in keyboard navigation to save a location in the Blockly AST.
 */
export class Marker {
    constructor() {
        /** The colour of the marker. */
        this.colour = null;
        /** The current location of the marker. */
        this.curNode = null;
        /** The type of the marker. */
        this.type = 'marker';
    }
    /**
     * Gets the current location of the marker.
     *
     * @returns The current field, connection, or block the marker is on.
     */
    getCurNode() {
        return this.curNode;
    }
    /**
     * Set the location of the marker and call the update method.
     *
     * @param newNode The new location of the marker, or null to remove it.
     */
    setCurNode(newNode) {
        this.curNode = newNode;
    }
    /** Dispose of this marker. */
    dispose() {
        this.curNode = null;
    }
    /**
     * Returns the block that the given node is a child of.
     *
     * @returns The parent block of the node if any, otherwise null.
     */
    getSourceBlockFromNode(node) {
        if (node instanceof BlockSvg) {
            return node;
        }
        else if (node instanceof Field) {
            return node.getSourceBlock();
        }
        else if (node instanceof RenderedConnection) {
            return node.getSourceBlock();
        }
        return null;
    }
    /**
     * Returns the block that this marker's current node is a child of.
     *
     * @returns The parent block of the marker's current node if any, otherwise
     *     null.
     */
    getSourceBlock() {
        return this.getSourceBlockFromNode(this.getCurNode());
    }
}
//# sourceMappingURL=marker.js.map