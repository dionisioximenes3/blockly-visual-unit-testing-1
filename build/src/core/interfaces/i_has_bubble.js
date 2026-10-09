/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/** Type guard that checks whether the given object is a IHasBubble. */
export function hasBubble(obj) {
    return (typeof obj.bubbleIsVisible === 'function' &&
        typeof obj.setBubbleVisible === 'function' &&
        typeof obj.getBubble === 'function');
}
//# sourceMappingURL=i_has_bubble.js.map