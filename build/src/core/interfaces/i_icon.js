/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { isFocusableNode } from './i_focusable_node.js';
/** Type guard that checks whether the given object is an IIcon. */
export function isIcon(obj) {
    return (isFocusableNode(obj) &&
        typeof obj.getType === 'function' &&
        typeof obj.initView === 'function' &&
        typeof obj.dispose === 'function' &&
        typeof obj.getWeight === 'function' &&
        typeof obj.getSize === 'function' &&
        typeof obj.applyColour === 'function' &&
        typeof obj.hideForInsertionMarker === 'function' &&
        typeof obj.updateEditable === 'function' &&
        typeof obj.updateCollapsed === 'function' &&
        typeof obj.isShownWhenCollapsed === 'function' &&
        typeof obj.setOffsetInBlock === 'function' &&
        typeof obj.onLocationChange === 'function' &&
        typeof obj.onClick === 'function');
}
//# sourceMappingURL=i_icon.js.map