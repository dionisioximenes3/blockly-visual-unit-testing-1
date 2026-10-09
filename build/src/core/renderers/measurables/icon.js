/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Measurable } from './base.js';
import { Types } from './types.js';
/**
 * An object containing information about the space an icon takes up during
 * rendering.
 */
export class Icon extends Measurable {
    /**
     * An object containing information about the space an icon takes up during
     * rendering.
     *
     * @param constants The rendering constants provider.
     * @param icon The icon to measure and store information for.
     */
    constructor(constants, icon) {
        super(constants);
        this.icon = icon;
        this.flipRtl = false;
        this.type |= Types.ICON;
        const size = icon.getSize();
        this.height = size.height;
        this.width = size.width;
    }
}
//# sourceMappingURL=icon.js.map