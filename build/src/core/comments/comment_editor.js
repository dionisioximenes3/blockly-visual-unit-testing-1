/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as browserEvents from '../browser_events.js';
import { getFocusManager } from '../focus_manager.js';
import * as touch from '../touch.js';
import * as dom from '../utils/dom.js';
import { Rect } from '../utils/rect.js';
import { Svg } from '../utils/svg.js';
import * as svgMath from '../utils/svg_math.js';
/**
 * String added to the ID of a workspace comment to identify
 * the focusable node for the comment editor.
 */
export const COMMENT_EDITOR_FOCUS_IDENTIFIER = '_comment_textarea_';
/** The part of a comment that can be typed into. */
export class CommentEditor {
    constructor(workspace, commentId, onFinishEditing) {
        this.workspace = workspace;
        this.onFinishEditing = onFinishEditing;
        /** Listeners for changes to text. */
        this.textChangeListeners = [];
        /** The current text of the comment. Updates on text area change. */
        this.text = '';
        this.foreignObject = dom.createSvgElement(Svg.FOREIGNOBJECT, {
            'class': 'blocklyCommentForeignObject',
        });
        const body = document.createElementNS(dom.HTML_NS, 'body');
        body.setAttribute('xmlns', dom.HTML_NS);
        body.className = 'blocklyMinimalBody';
        this.textArea = document.createElementNS(dom.HTML_NS, 'textarea');
        this.textArea.setAttribute('tabindex', '-1');
        this.textArea.setAttribute('dir', this.workspace.RTL ? 'RTL' : 'LTR');
        dom.addClass(this.textArea, 'blocklyCommentText');
        dom.addClass(this.textArea, 'blocklyTextarea');
        dom.addClass(this.textArea, 'blocklyText');
        body.appendChild(this.textArea);
        this.foreignObject.appendChild(body);
        if (commentId) {
            this.id = commentId + COMMENT_EDITOR_FOCUS_IDENTIFIER;
            this.textArea.setAttribute('id', this.id);
        }
        // Register browser event listeners for the user typing in the textarea.
        browserEvents.conditionalBind(this.textArea, 'change', this, this.onTextChange);
        // Register listener for pointerdown to focus the textarea.
        browserEvents.conditionalBind(this.textArea, 'pointerdown', this, (e) => {
            // don't allow this event to bubble up
            // and steal focus away from the editor/comment.
            e.stopPropagation();
            getFocusManager().focusNode(this);
            touch.clearTouchIdentifier();
        });
        // Don't zoom with mousewheel; let it scroll instead.
        browserEvents.conditionalBind(this.textArea, 'wheel', this, (e) => {
            e.stopPropagation();
        });
        // Register listener for keydown events that would finish editing.
        browserEvents.conditionalBind(this.textArea, 'keydown', this, this.handleKeyDown);
    }
    /** Gets the dom structure for this comment editor. */
    getDom() {
        return this.foreignObject;
    }
    /** Gets the current text of the comment. */
    getText() {
        return this.text;
    }
    /** Sets the current text of the comment and fires change listeners. */
    setText(text) {
        this.textArea.value = text;
        this.onTextChange();
    }
    /**
     * Triggers listeners when the text of the comment changes, either
     * programmatically or manually by the user.
     */
    onTextChange() {
        const oldText = this.text;
        this.text = this.textArea.value;
        // Loop through listeners backwards in case they remove themselves.
        for (let i = this.textChangeListeners.length - 1; i >= 0; i--) {
            this.textChangeListeners[i](oldText, this.text);
        }
    }
    /**
     * Do something when the user indicates they've finished editing.
     *
     * @param e Keyboard event.
     */
    handleKeyDown(e) {
        if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
            if (this.onFinishEditing)
                this.onFinishEditing();
            e.stopPropagation();
        }
    }
    /** Registers a callback that listens for text changes. */
    addTextChangeListener(listener) {
        this.textChangeListeners.push(listener);
    }
    /** Removes the given listener from the list of text change listeners. */
    removeTextChangeListener(listener) {
        this.textChangeListeners.splice(this.textChangeListeners.indexOf(listener), 1);
    }
    /** Sets the placeholder text displayed for an empty comment. */
    setPlaceholderText(text) {
        this.textArea.placeholder = text;
    }
    /** Sets whether the textarea is editable. If not, the textarea will be readonly. */
    setEditable(isEditable) {
        if (isEditable) {
            this.textArea.removeAttribute('readonly');
        }
        else {
            this.textArea.setAttribute('readonly', 'true');
        }
    }
    /** Update the size of the comment editor element. */
    updateSize(size, topBarSize) {
        this.foreignObject.setAttribute('height', `${size.height - topBarSize.height}`);
        this.foreignObject.setAttribute('width', `${size.width}`);
        this.foreignObject.setAttribute('y', `${topBarSize.height}`);
        if (this.workspace.RTL) {
            this.foreignObject.setAttribute('x', `${-size.width}`);
        }
    }
    getFocusableElement() {
        return this.textArea;
    }
    getFocusableTree() {
        return this.workspace;
    }
    onNodeFocus() {
        const bbox = Rect.from(this.foreignObject.getBoundingClientRect());
        this.workspace.scrollBoundsIntoView(Rect.createFromPoint(svgMath.screenToWsCoordinates(this.workspace, bbox.getOrigin()), bbox.getWidth(), bbox.getHeight()));
    }
    onNodeBlur() { }
    canBeFocused() {
        if (this.id)
            return true;
        return false;
    }
}
//# sourceMappingURL=comment_editor.js.map