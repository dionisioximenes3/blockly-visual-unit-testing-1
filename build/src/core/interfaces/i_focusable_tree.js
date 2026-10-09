/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Determines whether the provided object fulfills the contract of
 * IFocusableTree.
 *
 * @param obj The object to test.
 * @returns Whether the provided object can be used as an IFocusableTree.
 */
export function isFocusableTree(obj) {
    return (obj &&
        typeof obj.getRootFocusableNode === 'function' &&
        typeof obj.getRestoredFocusableNode === 'function' &&
        typeof obj.getNestedTrees === 'function' &&
        typeof obj.lookUpFocusableNode === 'function' &&
        typeof obj.onTreeFocus === 'function' &&
        typeof obj.onTreeBlur === 'function');
}
//# sourceMappingURL=i_focusable_tree.js.map