/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Rect } from './utils/rect.js';
/**
 * Representation of a gap between elements in a flyout.
 */
export class FlyoutSeparator {
    /**
     * Creates a new separator.
     *
     * @param gap The amount of space this separator should occupy.
     * @param axis The axis along which this separator occupies space.
     */
    constructor(gap, axis) {
        this.gap = gap;
        this.axis = axis;
        this.x = 0;
        this.y = 0;
    }
    /**
     * Returns the bounding box of this separator.
     *
     * @returns The bounding box of this separator.
     */
    getBoundingRectangle() {
        switch (this.axis) {
            case "x" /* SeparatorAxis.X */:
                return new Rect(this.y, this.y, this.x, this.x + this.gap);
            case "y" /* SeparatorAxis.Y */:
                return new Rect(this.y, this.y + this.gap, this.x, this.x);
        }
    }
    /**
     * Repositions this separator.
     *
     * @param dx The distance to move this separator on the X axis.
     * @param dy The distance to move this separator on the Y axis.
     * @param _reason The reason this move was initiated.
     */
    moveBy(dx, dy, _reason) {
        this.x += dx;
        this.y += dy;
    }
    /**
     * Returns false to prevent this separator from being navigated to by the
     * keyboard.
     *
     * @returns False.
     */
    isNavigable() {
        return false;
    }
    /** See IFocusableNode.getFocusableElement. */
    getFocusableElement() {
        throw new Error('Cannot be focused');
    }
    /** See IFocusableNode.getFocusableTree. */
    getFocusableTree() {
        throw new Error('Cannot be focused');
    }
    /** See IFocusableNode.onNodeFocus. */
    onNodeFocus() { }
    /** See IFocusableNode.onNodeBlur. */
    onNodeBlur() { }
    /** See IFocusableNode.canBeFocused. */
    canBeFocused() {
        return false;
    }
}
//# sourceMappingURL=flyout_separator.js.map