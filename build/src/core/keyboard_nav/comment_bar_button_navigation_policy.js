/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommentBarButton } from '../comments/comment_bar_button.js';
/**
 * Set of rules controlling keyboard navigation from a CommentBarButton.
 */
export class CommentBarButtonNavigationPolicy {
    /**
     * Returns the first child of the given CommentBarButton.
     *
     * @param _current The CommentBarButton to return the first child of.
     * @returns Null.
     */
    getFirstChild(_current) {
        return null;
    }
    /**
     * Returns the parent of the given CommentBarButton.
     *
     * @param current The CommentBarButton to return the parent of.
     * @returns The parent comment of the given CommentBarButton.
     */
    getParent(current) {
        return current
            .getCommentView()
            .workspace.getCommentById(current.getCommentView().commentId);
    }
    /**
     * Returns the next peer node of the given CommentBarButton.
     *
     * @param current The CommentBarButton to find the following element of.
     * @returns The next CommentBarButton, if any.
     */
    getNextSibling(current) {
        const children = current.getCommentView().getCommentBarButtons();
        const currentIndex = children.indexOf(current);
        if (currentIndex >= 0 && currentIndex + 1 < children.length) {
            return children[currentIndex + 1];
        }
        return null;
    }
    /**
     * Returns the previous peer node of the given CommentBarButton.
     *
     * @param current The CommentBarButton to find the preceding element of.
     * @returns The CommentBarButton's previous CommentBarButton, if any.
     */
    getPreviousSibling(current) {
        const children = current.getCommentView().getCommentBarButtons();
        const currentIndex = children.indexOf(current);
        if (currentIndex > 0) {
            return children[currentIndex - 1];
        }
        return null;
    }
    /**
     * Returns whether or not the given CommentBarButton can be navigated to.
     *
     * @param current The instance to check for navigability.
     * @returns True if the given CommentBarButton can be focused.
     */
    isNavigable(current) {
        return current.canBeFocused();
    }
    /**
     * Returns whether the given object can be navigated from by this policy.
     *
     * @param current The object to check if this policy applies to.
     * @returns True if the object is an CommentBarButton.
     */
    isApplicable(current) {
        return current instanceof CommentBarButton;
    }
}
//# sourceMappingURL=comment_bar_button_navigation_policy.js.map