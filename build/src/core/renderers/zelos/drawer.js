/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ConnectionType } from '../../connection_type.js';
import * as svgPaths from '../../utils/svg_paths.js';
import { Drawer as BaseDrawer } from '../common/drawer.js';
import { Types } from '../measurables/types.js';
/**
 * An object that draws a block based on the given rendering information.
 */
export class Drawer extends BaseDrawer {
    /**
     * @param block The block to render.
     * @param info An object containing all information needed to render this
     *     block.
     */
    constructor(block, info) {
        super(block, info);
    }
    draw() {
        const pathObject = this.block_.pathObject;
        pathObject.beginDrawing();
        this.drawOutline_();
        this.drawInternals_();
        this.updateConnectionHighlights();
        pathObject.setPath(this.outlinePath_ + '\n' + this.inlinePath_);
        if (this.info_.RTL) {
            pathObject.flipRTL();
        }
        this.recordSizeOnBlock_();
        if (this.info_.outputConnection) {
            // Store the output connection shape type for parent blocks to use during
            // rendering.
            pathObject.outputShapeType = this.info_.outputConnection.shape.type;
        }
        pathObject.endDrawing();
    }
    drawOutline_() {
        if (this.info_.outputConnection &&
            this.info_.outputConnection.isDynamicShape &&
            !this.info_.hasStatementInput &&
            !this.info_.bottomRow.hasNextConnection) {
            this.drawFlatTop_();
            this.drawRightDynamicConnection_();
            this.drawFlatBottom_();
            this.drawLeftDynamicConnection_();
        }
        else {
            super.drawOutline_();
        }
    }
    drawLeft_() {
        if (this.info_.outputConnection &&
            this.info_.outputConnection.isDynamicShape) {
            this.drawLeftDynamicConnection_();
        }
        else {
            super.drawLeft_();
        }
    }
    /**
     * Add steps for the right side of a row that does not have value or
     * statement input connections.
     *
     * @param row The row to draw the side of.
     */
    drawRightSideRow_(row) {
        if (row.height <= 0) {
            return;
        }
        if (Types.isSpacer(row)) {
            const precedesStatement = row.precedesStatement;
            const followsStatement = row.followsStatement;
            if (precedesStatement || followsStatement) {
                const insideCorners = this.constants_.INSIDE_CORNERS;
                const cornerHeight = insideCorners.rightHeight;
                const remainingHeight = row.height - (precedesStatement ? cornerHeight : 0);
                const bottomRightPath = followsStatement
                    ? insideCorners.pathBottomRight
                    : '';
                const verticalPath = remainingHeight > 0
                    ? svgPaths.lineOnAxis('V', row.yPos + remainingHeight)
                    : '';
                const topRightPath = precedesStatement
                    ? insideCorners.pathTopRight
                    : '';
                // Put all of the partial paths together.
                this.outlinePath_ += bottomRightPath + verticalPath + topRightPath;
                return;
            }
        }
        this.outlinePath_ += svgPaths.lineOnAxis('V', row.yPos + row.height);
    }
    /**
     * Add steps to draw the right side of an output with a dynamic connection.
     */
    drawRightDynamicConnection_() {
        if (!this.info_.outputConnection) {
            throw new Error(`Cannot draw the output connection of a block that doesn't have one`);
        }
        this.outlinePath_ += this.info_.outputConnection.shape.pathRightDown(this.info_.outputConnection.height);
    }
    /**
     * Add steps to draw the left side of an output with a dynamic connection.
     */
    drawLeftDynamicConnection_() {
        if (!this.info_.outputConnection) {
            throw new Error(`Cannot draw the output connection of a block that doesn't have one`);
        }
        this.positionOutputConnection_();
        this.outlinePath_ += this.info_.outputConnection.shape.pathUp(this.info_.outputConnection.height);
        // Close off the path.  This draws a vertical line up to the start of the
        // block's path, which may be either a rounded or a sharp corner.
        this.outlinePath_ += 'z';
    }
    /** Add steps to draw a flat top row. */
    drawFlatTop_() {
        const topRow = this.info_.topRow;
        this.positionPreviousConnection_();
        this.outlinePath_ += svgPaths.moveBy(topRow.xPos, this.info_.startY);
        this.outlinePath_ += svgPaths.lineOnAxis('h', topRow.width);
    }
    /** Add steps to draw a flat bottom row. */
    drawFlatBottom_() {
        const bottomRow = this.info_.bottomRow;
        this.positionNextConnection_();
        this.outlinePath_ += svgPaths.lineOnAxis('V', bottomRow.baseline);
        this.outlinePath_ += svgPaths.lineOnAxis('h', -bottomRow.width);
    }
    drawInlineInput_(input) {
        this.positionInlineInputConnection_(input);
        const inputName = input.input.name;
        if (input.connectedBlock || this.info_.isInsertionMarker) {
            return;
        }
        const yPos = input.centerline - input.height / 2;
        const connectionRight = input.xPos + input.connectionWidth;
        const path = svgPaths.moveTo(connectionRight, yPos) + this.getInlineInputPath(input);
        const pathObject = this.block_.pathObject;
        pathObject.setOutlinePath(inputName, path);
    }
    getInlineInputPath(input) {
        const width = input.width - input.connectionWidth * 2;
        const height = input.height;
        return (svgPaths.lineOnAxis('h', width) +
            input.shape.pathRightDown(height) +
            svgPaths.lineOnAxis('h', -width) +
            input.shape.pathUp(height) +
            'z');
    }
    drawStatementInput_(row) {
        const input = row.getLastInput();
        // Where to start drawing the notch, which is on the right side in LTR.
        const x = input.xPos + input.notchOffset + input.shape.width;
        const insideCorners = this.constants_.INSIDE_CORNERS;
        const innerTopLeftCorner = input.shape.pathRight +
            svgPaths.lineOnAxis('h', -(input.notchOffset - insideCorners.width)) +
            insideCorners.pathTop;
        const innerHeight = row.height - 2 * insideCorners.height;
        const innerBottomLeftCorner = insideCorners.pathBottom +
            svgPaths.lineOnAxis('h', input.notchOffset - insideCorners.width) +
            (input.connectedBottomNextConnection
                ? ''
                : input.shape.pathLeft);
        this.outlinePath_ +=
            svgPaths.lineOnAxis('H', x) +
                innerTopLeftCorner +
                svgPaths.lineOnAxis('v', innerHeight) +
                innerBottomLeftCorner +
                svgPaths.lineOnAxis('H', row.xPos + row.width);
        this.positionStatementInputConnection_(row);
    }
    /** Returns a path to highlight the given connection. */
    drawConnectionHighlightPath(measurable) {
        const conn = measurable.connectionModel;
        if (conn.type === ConnectionType.NEXT_STATEMENT ||
            conn.type === ConnectionType.PREVIOUS_STATEMENT ||
            (conn.type === ConnectionType.OUTPUT_VALUE && !measurable.isDynamicShape)) {
            return super.drawConnectionHighlightPath(measurable);
        }
        let path = '';
        if (conn.type === ConnectionType.INPUT_VALUE) {
            const input = measurable;
            const xPos = input.connectionWidth;
            const yPos = -input.height / 2;
            path = svgPaths.moveTo(xPos, yPos) + this.getInlineInputPath(input);
        }
        else {
            // Dynamic output.
            const output = measurable;
            const xPos = output.width;
            const yPos = -output.height / 2;
            path =
                svgPaths.moveTo(xPos, yPos) +
                    output.shape.pathDown(output.height);
        }
        const block = conn.getSourceBlock();
        return block.pathObject.addConnectionHighlight?.(conn, path, conn.getOffsetInBlock(), block.RTL);
    }
}
//# sourceMappingURL=drawer.js.map