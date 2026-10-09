/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Defines the type of an icon, so that it can be retrieved from block.getIcon
 */
export class IconType {
    /** @param name The name of the registry type. */
    constructor(name) {
        this.name = name;
    }
    /** @returns the name of the type. */
    toString() {
        return this.name;
    }
    /** @returns true if this icon type is equivalent to the given icon type. */
    equals(type) {
        return this.name === type.toString();
    }
}
IconType.MUTATOR = new IconType('mutator');
IconType.WARNING = new IconType('warning');
IconType.COMMENT = new IconType('comment');
//# sourceMappingURL=icon_types.js.map