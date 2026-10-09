/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { isFocusableNode } from './i_focusable_node.js';
/** Checks whether the given object is an ISelectable. */
export function isSelectable(obj) {
    return (isFocusableNode(obj) &&
        typeof obj.id === 'string' &&
        typeof obj.workspace === 'object' &&
        typeof obj.select === 'function' &&
        typeof obj.unselect === 'function');
}
//# sourceMappingURL=i_selectable.js.map