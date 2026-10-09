/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Determines whether the provided object fulfills the contract of
 * IFocusableNode.
 *
 * @param obj The object to test.
 * @returns Whether the provided object can be used as an IFocusableNode.
 */
export function isFocusableNode(obj) {
    return (obj &&
        typeof obj.getFocusableElement === 'function' &&
        typeof obj.getFocusableTree === 'function' &&
        typeof obj.onNodeFocus === 'function' &&
        typeof obj.onNodeBlur === 'function' &&
        typeof obj.canBeFocused === 'function');
}
//# sourceMappingURL=i_focusable_node.js.map