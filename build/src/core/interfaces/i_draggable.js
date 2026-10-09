/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/** Returns whether the given object is an IDraggable or not. */
export function isDraggable(obj) {
    return (obj &&
        typeof obj.getRelativeToSurfaceXY === 'function' &&
        typeof obj.isMovable === 'function' &&
        typeof obj.startDrag === 'function' &&
        typeof obj.drag === 'function' &&
        typeof obj.endDrag === 'function' &&
        typeof obj.revertDrag === 'function');
}
//# sourceMappingURL=i_draggable.js.map