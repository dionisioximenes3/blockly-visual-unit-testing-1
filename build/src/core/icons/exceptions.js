/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Thrown when you add more than one icon of the same type to a block.
 */
export class DuplicateIconType extends Error {
    /**
     * @internal
     */
    constructor(icon) {
        super(`Tried to append an icon of type ${icon.getType()} when an icon of ` +
            `that type already exists on the block. ` +
            `Use getIcon to access the existing icon.`);
        this.icon = icon;
    }
}
//# sourceMappingURL=exceptions.js.map