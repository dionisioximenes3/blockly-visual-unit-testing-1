/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/** Type guard that checks whether the given object is a ISerializable. */
export function isSerializable(obj) {
    return (obj &&
        typeof obj.saveState === 'function' &&
        typeof obj.loadState === 'function');
}
//# sourceMappingURL=i_serializable.js.map