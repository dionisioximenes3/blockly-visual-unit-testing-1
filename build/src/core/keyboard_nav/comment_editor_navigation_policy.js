/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommentEditor } from '../comments/comment_editor.js';
/**
 * Set of rules controlling keyboard navigation from a comment editor.
 * This is a no-op placeholder (other than isNavigable/isApplicable) since
 * comment editors handle their own navigation when editing ends.
 */
export class CommentEditorNavigationPolicy {
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
     * Returns whether or not the given comment editor can be navigated to.
     *
     * @param current The instance to check for navigability.
     * @returns False.
     */
    isNavigable(current) {
        return current.canBeFocused();
    }
    /**
     * Returns whether the given object can be navigated from by this policy.
     *
     * @param current The object to check if this policy applies to.
     * @returns True if the object is a CommentEditor.
     */
    isApplicable(current) {
        return current instanceof CommentEditor;
    }
}
//# sourceMappingURL=comment_editor_navigation_policy.js.map