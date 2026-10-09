/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { FlyoutSeparator } from '../flyout_separator.js';
/**
 * Set of rules controlling keyboard navigation from a flyout separator.
 * This is a no-op placeholder, since flyout separators can't be navigated to.
 */
export class FlyoutSeparatorNavigationPolicy {
    getFirstChild(_current) {
        return null;
    }
    getParent(_current) {
        return null;
    }
    getNextSibling(_current) {
        return null;
    }
    getPreviousSibling(_current) {
        return null;
    }
    /**
     * Returns whether or not the given flyout separator can be navigated to.
     *
     * @param _current The instance to check for navigability.
     * @returns False.
     */
    isNavigable(_current) {
        return false;
    }
    /**
     * Returns whether the given object can be navigated from by this policy.
     *
     * @param current The object to check if this policy applies to.
     * @returns True if the object is a FlyoutSeparator.
     */
    isApplicable(current) {
        return current instanceof FlyoutSeparator;
    }
}
//# sourceMappingURL=flyout_separator_navigation_policy.js.map