/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Utility methods for size calculation.
 * These methods are not specific to Blockly, and could be factored out into
 * a JavaScript framework such as Closure.
 *
 * @class
 */
// Former goog.module ID: Blockly.utils.Size
/**
 * Class for representing sizes consisting of a width and height.
 */
export class Size {
    /**
     * @param width Width.
     * @param height Height.
     */
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
    /**
     * Compares sizes for equality.
     *
     * @param a A Size.
     * @param b A Size.
     * @returns True iff the sizes have equal widths and equal heights, or if both
     *     are null.
     */
    static equals(a, b) {
        if (a === b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        return a.width === b.width && a.height === b.height;
    }
    /**
     * Returns a new size with the maximum width and height values out of both
     * sizes.
     */
    static max(a, b) {
        return new Size(Math.max(a.width, b.width), Math.max(a.height, b.height));
    }
    /**
     * Returns a new size with the minimum width and height values out of both
     * sizes.
     */
    static min(a, b) {
        return new Size(Math.min(a.width, b.width), Math.min(a.height, b.height));
    }
}
//# sourceMappingURL=size.js.map