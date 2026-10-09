/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as browserEvents from '../browser_events.js';
import * as touch from '../touch.js';
import * as dom from '../utils/dom.js';
import { Svg } from '../utils/svg.js';
import { CommentBarButton } from './comment_bar_button.js';
/**
 * Magic string appended to the comment ID to create a unique ID for this button.
 */
export const COMMENT_COLLAPSE_BAR_BUTTON_FOCUS_IDENTIFIER = '_collapse_bar_button';
/**
 * Button that toggles the collapsed state of a comment.
 */
export class CollapseCommentBarButton extends CommentBarButton {
    /**
     * Creates a new CollapseCommentBarButton instance.
     *
     * @param id The ID of this button's parent comment.
     * @param workspace The workspace this button's parent comment is displayed on.
     * @param container An SVG group that this button should be a child of.
     */
    constructor(id, workspace, container, commentView) {
        super(id, workspace, container, commentView);
        this.id = id;
        this.workspace = workspace;
        this.container = container;
        this.commentView = commentView;
        this.icon = dom.createSvgElement(Svg.IMAGE, {
            'class': 'blocklyFoldoutIcon',
            'href': `${this.workspace.options.pathToMedia}foldout-icon.svg`,
            'id': `${this.id}${COMMENT_COLLAPSE_BAR_BUTTON_FOCUS_IDENTIFIER}`,
        }, this.container);
        this.bindId = browserEvents.conditionalBind(this.icon, 'pointerdown', this, this.performAction.bind(this));
    }
    /**
     * Disposes of this button.
     */
    dispose() {
        browserEvents.unbind(this.bindId);
    }
    /**
     * Adjusts the positioning of this button within its container.
     */
    reposition() {
        const margin = this.getMargin();
        this.icon.setAttribute('y', `${margin}`);
        this.icon.setAttribute('x', `${margin}`);
    }
    /**
     * Toggles the collapsed state of the parent comment.
     *
     * @param e The event that triggered this action.
     */
    performAction(e) {
        touch.clearTouchIdentifier();
        this.getCommentView().bringToFront();
        if (e && e instanceof PointerEvent && browserEvents.isRightButton(e)) {
            e.stopPropagation();
            return;
        }
        this.getCommentView().setCollapsed(!this.getCommentView().isCollapsed());
        this.workspace.hideChaff();
        e?.stopPropagation();
    }
}
//# sourceMappingURL=collapse_comment_bar_button.js.map