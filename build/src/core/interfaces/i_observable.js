/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Type guard for checking if an object fulfills IObservable.
 *
 * @internal
 */
export function isObservable(obj) {
    return (obj &&
        typeof obj.startPublishing === 'function' &&
        typeof obj.stopPublishing === 'function');
}
//# sourceMappingURL=i_observable.js.map