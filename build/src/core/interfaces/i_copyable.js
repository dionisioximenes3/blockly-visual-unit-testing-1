/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/** @returns true if the given object is an ICopyable. */
export function isCopyable(obj) {
    return obj && typeof obj.toCopyData === 'function';
}
//# sourceMappingURL=i_copyable.js.map