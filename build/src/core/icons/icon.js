/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as browserEvents from '../browser_events.js';
import { hasBubble } from '../interfaces/i_has_bubble.js';
import * as tooltip from '../tooltip.js';
import { Coordinate } from '../utils/coordinate.js';
import * as dom from '../utils/dom.js';
import * as idGenerator from '../utils/idgenerator.js';
import { Rect } from '../utils/rect.js';
import { Size } from '../utils/size.js';
import { Svg } from '../utils/svg.js';
/**
 * The abstract icon class. Icons are visual elements that live in the top-start
 * corner of the block. Usually they provide more "meta" information about a
 * block (such as warnings or comments) as opposed to fields, which provide
 * "actual" information, related to how a block functions.
 */
export class Icon {
    constructor(sourceBlock) {
        this.sourceBlock = sourceBlock;
        /**
         * The position of this icon relative to its blocks top-start,
         * in workspace units.
         */
        this.offsetInBlock = new Coordinate(0, 0);
        /** The position of this icon in workspace coordinates. */
        this.workspaceLocation = new Coordinate(0, 0);
        /** The root svg element visually representing this icon. */
        this.svgRoot = null;
        this.tooltip = sourceBlock;
        this.id = idGenerator.getNextUniqueId();
    }
    getType() {
        throw new Error('Icons must implement getType');
    }
    initView(pointerdownListener) {
        if (this.svgRoot)
            return; // The icon has already been initialized.
        const svgBlock = this.sourceBlock;
        this.svgRoot = dom.createSvgElement(Svg.G, {
            'class': 'blocklyIconGroup',
            'id': this.id,
        });
        svgBlock.getSvgRoot().appendChild(this.svgRoot);
        this.updateSvgRootOffset();
        browserEvents.conditionalBind(this.svgRoot, 'pointerdown', this, pointerdownListener);
        this.svgRoot.tooltip = this;
        tooltip.bindMouseEvents(this.svgRoot);
    }
    dispose() {
        tooltip.unbindMouseEvents(this.svgRoot);
        dom.removeNode(this.svgRoot);
    }
    getWeight() {
        return -1;
    }
    getSize() {
        return new Size(0, 0);
    }
    /**
     * Sets the tooltip for this icon to the given value. Null to show the
     * tooltip of the block.
     */
    setTooltip(tip) {
        this.tooltip = tip ?? this.sourceBlock;
    }
    /** Returns the tooltip for this icon. */
    getTooltip() {
        return this.tooltip;
    }
    applyColour() { }
    updateEditable() { }
    updateCollapsed() {
        if (!this.svgRoot)
            return;
        if (this.sourceBlock.isCollapsed()) {
            this.svgRoot.style.display = 'none';
        }
        else {
            this.svgRoot.style.display = 'block';
        }
        if (hasBubble(this)) {
            this.setBubbleVisible(false);
        }
    }
    hideForInsertionMarker() {
        if (!this.svgRoot)
            return;
        this.svgRoot.style.display = 'none';
    }
    isShownWhenCollapsed() {
        return false;
    }
    setOffsetInBlock(offset) {
        this.offsetInBlock = offset;
        this.updateSvgRootOffset();
    }
    updateSvgRootOffset() {
        this.svgRoot?.setAttribute('transform', `translate(${this.offsetInBlock.x}, ${this.offsetInBlock.y})`);
    }
    onLocationChange(blockOrigin) {
        this.workspaceLocation = Coordinate.sum(blockOrigin, this.offsetInBlock);
    }
    onClick() { }
    /**
     * Check whether the icon should be clickable while the block is in a flyout.
     * The default is that icons are clickable in all flyouts (auto-closing or not).
     * Subclasses may override this function to change this behavior.
     *
     * @param autoClosingFlyout true if the containing flyout is an auto-closing one.
     * @returns Whether the icon should be clickable while the block is in a flyout.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isClickableInFlyout(autoClosingFlyout) {
        return true;
    }
    /** See IFocusableNode.getFocusableElement. */
    getFocusableElement() {
        const svgRoot = this.svgRoot;
        if (!svgRoot)
            throw new Error('Attempting to focus uninitialized icon.');
        return svgRoot;
    }
    /** See IFocusableNode.getFocusableTree. */
    getFocusableTree() {
        return this.sourceBlock.workspace;
    }
    /** See IFocusableNode.onNodeFocus. */
    onNodeFocus() {
        const blockBounds = this.sourceBlock.getBoundingRectangle();
        const bounds = new Rect(blockBounds.top + this.offsetInBlock.y, blockBounds.top + this.offsetInBlock.y + this.getSize().height, blockBounds.left + this.offsetInBlock.x, blockBounds.left + this.offsetInBlock.x + this.getSize().width);
        this.sourceBlock.workspace.scrollBoundsIntoView(bounds);
    }
    /** See IFocusableNode.onNodeBlur. */
    onNodeBlur() { }
    /** See IFocusableNode.canBeFocused. */
    canBeFocused() {
        return true;
    }
    /**
     * Returns the block that this icon is attached to.
     *
     * @returns The block this icon is attached to.
     */
    getSourceBlock() {
        return this.sourceBlock;
    }
}
//# sourceMappingURL=icon.js.map