/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { WorkspaceSvg } from '../workspace_svg.js';
/**
 * Set of rules controlling keyboard navigation from a workspace.
 */
export class WorkspaceNavigationPolicy {
    /**
     * Returns the first child of the given workspace.
     *
     * @param current The workspace to return the first child of.
     * @returns The top block of the first block stack, if any.
     */
    getFirstChild(current) {
        const blocks = current.getTopBlocks(true);
        return blocks.length ? blocks[0] : null;
    }
    /**
     * Returns the parent of the given workspace.
     *
     * @param _current The workspace to return the parent of.
     * @returns Null.
     */
    getParent(_current) {
        return null;
    }
    /**
     * Returns the next sibling of the given workspace.
     *
     * @param _current The workspace to return the next sibling of.
     * @returns Null.
     */
    getNextSibling(_current) {
        return null;
    }
    /**
     * Returns the previous sibling of the given workspace.
     *
     * @param _current The workspace to return the previous sibling of.
     * @returns Null.
     */
    getPreviousSibling(_current) {
        return null;
    }
    /**
     * Returns whether or not the given workspace can be navigated to.
     *
     * @param current The instance to check for navigability.
     * @returns True if the given workspace can be focused.
     */
    isNavigable(current) {
        return current.canBeFocused() && !current.isMutator;
    }
    /**
     * Returns whether the given object can be navigated from by this policy.
     *
     * @param current The object to check if this policy applies to.
     * @returns True if the object is a WorkspaceSvg.
     */
    isApplicable(current) {
        return current instanceof WorkspaceSvg;
    }
}
//# sourceMappingURL=workspace_navigation_policy.js.map