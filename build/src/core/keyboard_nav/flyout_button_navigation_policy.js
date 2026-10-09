/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { FlyoutButton } from '../flyout_button.js';
/**
 * Set of rules controlling keyboard navigation from a flyout button.
 */
export class FlyoutButtonNavigationPolicy {
    /**
     * Returns null since flyout buttons have no children.
     *
     * @param _current The FlyoutButton instance to navigate from.
     * @returns Null.
     */
    getFirstChild(_current) {
        return null;
    }
    /**
     * Returns the parent workspace of the given flyout button.
     *
     * @param current The FlyoutButton instance to navigate from.
     * @returns The given flyout button's parent workspace.
     */
    getParent(current) {
        return current.getWorkspace();
    }
    /**
     * Returns null since inter-item navigation is done by FlyoutNavigationPolicy.
     *
     * @param _current The FlyoutButton instance to navigate from.
     * @returns Null.
     */
    getNextSibling(_current) {
        return null;
    }
    /**
     * Returns null since inter-item navigation is done by FlyoutNavigationPolicy.
     *
     * @param _current The FlyoutButton instance to navigate from.
     * @returns Null.
     */
    getPreviousSibling(_current) {
        return null;
    }
    /**
     * Returns whether or not the given flyout button can be navigated to.
     *
     * @param current The instance to check for navigability.
     * @returns True if the given flyout button can be focused.
     */
    isNavigable(current) {
        return current.canBeFocused();
    }
    /**
     * Returns whether the given object can be navigated from by this policy.
     *
     * @param current The object to check if this policy applies to.
     * @returns True if the object is a FlyoutButton.
     */
    isApplicable(current) {
        return current instanceof FlyoutButton;
    }
}
//# sourceMappingURL=flyout_button_navigation_policy.js.map