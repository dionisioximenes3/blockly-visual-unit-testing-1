/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as browserEvents from '../browser_events.js';
import * as css from '../css.js';
import * as layers from '../layers.js';
import * as touch from '../touch.js';
import { Coordinate } from '../utils/coordinate.js';
import * as dom from '../utils/dom.js';
import * as drag from '../utils/drag.js';
import { Size } from '../utils/size.js';
import { Svg } from '../utils/svg.js';
import { CollapseCommentBarButton } from './collapse_comment_bar_button.js';
import { CommentEditor } from './comment_editor.js';
import { DeleteCommentBarButton } from './delete_comment_bar_button.js';
export class CommentView {
    constructor(workspace, commentId) {
        this.workspace = workspace;
        this.commentId = commentId;
        /** Whether the comment is collapsed or not. */
        this.collapsed = false;
        /** Whether the comment is editable or not. */
        this.editable = true;
        /** The current location of the comment in workspace coordinates. */
        this.location = new Coordinate(0, 0);
        /** Listeners for changes to size. */
        this.sizeChangeListeners = [];
        /** Listeners for disposal. */
        this.disposeListeners = [];
        /** Listeners for collapsing. */
        this.collapseChangeListeners = [];
        /**
         * Event data for the pointer up event on the resize handle. Used to
         * unregister the listener.
         */
        this.resizePointerUpListener = null;
        /**
         * Event data for the pointer move event on the resize handle. Used to
         * unregister the listener.
         */
        this.resizePointerMoveListener = null;
        /** Whether this comment view is currently being disposed or not. */
        this.disposing = false;
        /** Whether this comment view has been disposed or not. */
        this.disposed = false;
        this.svgRoot = dom.createSvgElement(Svg.G, {
            'class': 'blocklyComment blocklyEditable blocklyDraggable',
        });
        this.highlightRect = this.createHighlightRect(this.svgRoot);
        ({
            topBarGroup: this.topBarGroup,
            topBarBackground: this.topBarBackground,
            deleteButton: this.deleteButton,
            foldoutButton: this.foldoutButton,
            textPreview: this.textPreview,
            textPreviewNode: this.textPreviewNode,
        } = this.createTopBar(this.svgRoot));
        this.commentEditor = this.createTextArea();
        this.resizeHandle = this.createResizeHandle(this.svgRoot, workspace);
        // TODO: Remove this comment before merging.
        // I think we want comments to exist on the same layer as blocks.
        workspace.getLayerManager()?.append(this, layers.BLOCK);
        // Set size to the default size.
        this.size = CommentView.defaultCommentSize;
        this.setSizeWithoutFiringEvents(this.size);
        // Set default transform (including inverted scale for RTL).
        this.moveTo(new Coordinate(0, 0));
    }
    /**
     * Creates the rect we use for highlighting the comment when it's selected.
     */
    createHighlightRect(svgRoot) {
        return dom.createSvgElement(Svg.RECT, { 'class': 'blocklyCommentHighlight' }, svgRoot);
    }
    /**
     * Creates the top bar and the elements visually within it.
     * Registers event listeners.
     */
    createTopBar(svgRoot) {
        const topBarGroup = dom.createSvgElement(Svg.G, {
            'class': 'blocklyCommentTopbar',
        }, svgRoot);
        const topBarBackground = dom.createSvgElement(Svg.RECT, {
            'class': 'blocklyCommentTopbarBackground',
        }, topBarGroup);
        const deleteButton = new DeleteCommentBarButton(this.commentId, this.workspace, topBarGroup, this);
        const foldoutButton = new CollapseCommentBarButton(this.commentId, this.workspace, topBarGroup, this);
        this.addDisposeListener(() => {
            deleteButton.dispose();
            foldoutButton.dispose();
        });
        const textPreview = dom.createSvgElement(Svg.TEXT, {
            'class': 'blocklyCommentPreview blocklyCommentText blocklyText',
        }, topBarGroup);
        const textPreviewNode = document.createTextNode('');
        textPreview.appendChild(textPreviewNode);
        return {
            topBarGroup,
            topBarBackground,
            deleteButton,
            foldoutButton,
            textPreview,
            textPreviewNode,
        };
    }
    /**
     * Creates the text area where users can type. Registers event listeners.
     */
    createTextArea() {
        // When the user is done editing comment, focus the entire comment.
        const onFinishEditing = () => this.svgRoot.focus();
        const commentEditor = new CommentEditor(this.workspace, this.commentId, onFinishEditing);
        this.svgRoot.appendChild(commentEditor.getDom());
        commentEditor.addTextChangeListener((oldText, newText) => {
            this.updateTextPreview(newText);
            // Update size in case our minimum size increased.
            this.setSize(this.size);
        });
        return commentEditor;
    }
    /**
     *
     * @returns The FocusableNode representing the editor portion of this comment.
     */
    getEditorFocusableNode() {
        return this.commentEditor;
    }
    /** Creates the DOM elements for the comment resize handle. */
    createResizeHandle(svgRoot, workspace) {
        const resizeHandle = dom.createSvgElement(Svg.IMAGE, {
            'class': 'blocklyResizeHandle',
            'href': `${workspace.options.pathToMedia}resize-handle.svg`,
        }, svgRoot);
        browserEvents.conditionalBind(resizeHandle, 'pointerdown', this, this.onResizePointerDown);
        return resizeHandle;
    }
    /** Returns the root SVG group element of the comment view. */
    getSvgRoot() {
        return this.svgRoot;
    }
    /**
     * Returns the current size of the comment in workspace units.
     * Respects collapsing.
     */
    getSize() {
        return this.collapsed ? this.topBarBackground.getBBox() : this.size;
    }
    /**
     * Sets the size of the comment in workspace units, and updates the view
     * elements to reflect the new size.
     */
    setSizeWithoutFiringEvents(size) {
        const topBarSize = this.topBarBackground.getBBox();
        const textPreviewSize = this.textPreview.getBBox();
        const resizeSize = this.resizeHandle.getBBox();
        size = Size.max(size, this.calcMinSize(topBarSize));
        this.size = size;
        this.svgRoot.setAttribute('height', `${size.height}`);
        this.svgRoot.setAttribute('width', `${size.width}`);
        this.updateHighlightRect(size);
        this.updateTopBarSize(size);
        this.commentEditor.updateSize(size, topBarSize);
        this.deleteButton.reposition();
        this.foldoutButton.reposition();
        this.updateTextPreviewSize(size, topBarSize, textPreviewSize);
        this.updateResizeHandlePosition(size, resizeSize);
    }
    /**
     * Sets the size of the comment in workspace units, updates the view
     * elements to reflect the new size, and triggers size change listeners.
     */
    setSize(size) {
        const oldSize = this.preResizeSize || this.size;
        this.setSizeWithoutFiringEvents(size);
        this.onSizeChange(oldSize, this.size);
    }
    /**
     * Calculates the minimum size for the uncollapsed comment based on text
     * size and visible icons.
     *
     * The minimum width is based on the width of the truncated preview text.
     *
     * The minimum height is based on the height of the top bar.
     */
    calcMinSize(topBarSize) {
        this.updateTextPreview(this.commentEditor.getText() ?? '');
        const textPreviewWidth = dom.getTextWidth(this.textPreview);
        let width = textPreviewWidth;
        if (this.foldoutButton.isVisible()) {
            width += this.foldoutButton.getSize(true).getWidth();
        }
        else if (textPreviewWidth) {
            width += 4; // Arbitrary margin before text.
        }
        if (this.deleteButton.isVisible()) {
            width += this.deleteButton.getSize(true).getWidth();
        }
        else if (textPreviewWidth) {
            width += 4; // Arbitrary margin after text.
        }
        // Arbitrary additional height.
        const height = topBarSize.height + 20;
        return new Size(width, height);
    }
    /** Updates the size of the highlight rect to reflect the new size. */
    updateHighlightRect(size) {
        this.highlightRect.setAttribute('height', `${size.height}`);
        this.highlightRect.setAttribute('width', `${size.width}`);
        if (this.workspace.RTL) {
            this.highlightRect.setAttribute('x', `${-size.width}`);
        }
    }
    /** Updates the size of the top bar to reflect the new size. */
    updateTopBarSize(size) {
        this.topBarBackground.setAttribute('width', `${size.width}`);
    }
    /**
     * Updates the size and position of the text preview elements to reflect the new size.
     */
    updateTextPreviewSize(size, topBarSize, textPreviewSize) {
        const textPreviewMargin = (topBarSize.height - textPreviewSize.height) / 2;
        const foldoutSize = this.foldoutButton.getSize(true);
        const deleteSize = this.deleteButton.getSize(true);
        const textPreviewWidth = size.width - foldoutSize.getWidth() - deleteSize.getWidth();
        this.textPreview.setAttribute('x', `${(this.workspace.RTL ? -1 : 1) * foldoutSize.getWidth()}`);
        this.textPreview.setAttribute('y', `${textPreviewMargin + textPreviewSize.height / 2}`);
        this.textPreview.setAttribute('width', `${textPreviewWidth}`);
    }
    /** Updates the position of the resize handle to reflect the new size. */
    updateResizeHandlePosition(size, resizeSize) {
        this.resizeHandle.setAttribute('y', `${size.height - resizeSize.height}`);
        this.resizeHandle.setAttribute('x', `${size.width - resizeSize.width}`);
    }
    /**
     * Triggers listeners when the size of the comment changes, either
     * programmatically or manually by the user.
     */
    onSizeChange(oldSize, newSize) {
        // Loop through listeners backwards in case they remove themselves.
        for (let i = this.sizeChangeListeners.length - 1; i >= 0; i--) {
            this.sizeChangeListeners[i](oldSize, newSize);
        }
    }
    /**
     * Registers a callback that listens for size changes.
     *
     * @param listener Receives callbacks when the size of the comment changes.
     *     The new and old size are in workspace units.
     */
    addSizeChangeListener(listener) {
        this.sizeChangeListeners.push(listener);
    }
    /** Removes the given listener from the list of size change listeners. */
    removeSizeChangeListener(listener) {
        this.sizeChangeListeners.splice(this.sizeChangeListeners.indexOf(listener), 1);
    }
    /**
     * Handles starting an interaction with the resize handle to resize the
     * comment.
     */
    onResizePointerDown(e) {
        if (!this.isEditable())
            return;
        this.bringToFront();
        if (browserEvents.isRightButton(e)) {
            e.stopPropagation();
            return;
        }
        this.preResizeSize = this.getSize();
        drag.start(this.workspace, e, new Coordinate(this.workspace.RTL ? -this.getSize().width : this.getSize().width, this.getSize().height));
        this.resizePointerUpListener = browserEvents.conditionalBind(document, 'pointerup', this, this.onResizePointerUp);
        this.resizePointerMoveListener = browserEvents.conditionalBind(document, 'pointermove', this, this.onResizePointerMove);
        this.workspace.hideChaff();
        e.stopPropagation();
    }
    /** Ends an interaction with the resize handle. */
    onResizePointerUp(_e) {
        touch.clearTouchIdentifier();
        if (this.resizePointerUpListener) {
            browserEvents.unbind(this.resizePointerUpListener);
            this.resizePointerUpListener = null;
        }
        if (this.resizePointerMoveListener) {
            browserEvents.unbind(this.resizePointerMoveListener);
            this.resizePointerMoveListener = null;
        }
        // When ending a resize drag, notify size change listeners to fire an event.
        this.setSize(this.size);
        this.preResizeSize = undefined;
    }
    /** Resizes the comment in response to a drag on the resize handle. */
    onResizePointerMove(e) {
        const size = drag.move(this.workspace, e);
        this.setSizeWithoutFiringEvents(new Size(this.workspace.RTL ? -size.x : size.x, size.y));
    }
    /** Returns true if the comment is currently collapsed. */
    isCollapsed() {
        return this.collapsed;
    }
    /** Sets whether the comment is currently collapsed or not. */
    setCollapsed(collapsed) {
        this.collapsed = collapsed;
        if (collapsed) {
            dom.addClass(this.svgRoot, 'blocklyCollapsed');
        }
        else {
            dom.removeClass(this.svgRoot, 'blocklyCollapsed');
        }
        // Repositions resize handle and such.
        this.setSizeWithoutFiringEvents(this.size);
        this.onCollapse();
    }
    /**
     * Triggers listeners when the collapsed-ness of the comment changes, either
     * progrmatically or manually by the user.
     */
    onCollapse() {
        // Loop through listeners backwards in case they remove themselves.
        for (let i = this.collapseChangeListeners.length - 1; i >= 0; i--) {
            this.collapseChangeListeners[i](this.collapsed);
        }
    }
    /** Registers a callback that listens for collapsed-ness changes. */
    addOnCollapseListener(listener) {
        this.collapseChangeListeners.push(listener);
    }
    /** Removes the given listener from the list of on collapse listeners. */
    removeOnCollapseListener(listener) {
        this.collapseChangeListeners.splice(this.collapseChangeListeners.indexOf(listener), 1);
    }
    /** Returns true if the comment is currently editable. */
    isEditable() {
        return this.editable;
    }
    /** Sets the editability of the comment. */
    setEditable(editable) {
        this.editable = editable;
        if (this.editable) {
            dom.addClass(this.svgRoot, 'blocklyEditable');
            dom.removeClass(this.svgRoot, 'blocklyReadonly');
        }
        else {
            dom.removeClass(this.svgRoot, 'blocklyEditable');
            dom.addClass(this.svgRoot, 'blocklyReadonly');
        }
        this.commentEditor.setEditable(editable);
    }
    /** Returns the current location of the comment in workspace coordinates. */
    getRelativeToSurfaceXY() {
        return this.location;
    }
    /**
     * Moves the comment view to the given location.
     *
     * @param location The location to move to in workspace coordinates.
     */
    moveTo(location) {
        this.location = location;
        this.svgRoot.setAttribute('transform', `translate(${location.x}, ${location.y})`);
    }
    /** Returns the current text of the comment. */
    getText() {
        return this.commentEditor.getText();
    }
    /** Sets the current text of the comment. */
    setText(text) {
        this.commentEditor.setText(text);
    }
    /** Sets the placeholder text displayed for an empty comment. */
    setPlaceholderText(text) {
        this.commentEditor.setPlaceholderText(text);
    }
    /** Registers a callback that listens for text changes on the comment editor. */
    addTextChangeListener(listener) {
        this.commentEditor.addTextChangeListener(listener);
    }
    /** Removes the given listener from the comment editor. */
    removeTextChangeListener(listener) {
        this.commentEditor.removeTextChangeListener(listener);
    }
    /** Updates the preview text element to reflect the given text. */
    updateTextPreview(text) {
        this.textPreviewNode.textContent = this.truncateText(text);
    }
    /** Truncates the text to fit within the top view. */
    truncateText(text) {
        return text.length >= 12 ? `${text.substring(0, 9)}...` : text;
    }
    /** Brings the workspace comment to the front of its layer. */
    bringToFront() {
        const parent = this.svgRoot.parentNode;
        const childNodes = parent.childNodes;
        // Avoid moving the comment if it's already at the bottom.
        if (childNodes[childNodes.length - 1] !== this.svgRoot) {
            parent.appendChild(this.svgRoot);
        }
    }
    /**
     * Handles disposing of the comment when we get a pointer down event on the
     * delete icon.
     */
    onDeleteDown(e) {
        touch.clearTouchIdentifier();
        if (browserEvents.isRightButton(e)) {
            e.stopPropagation();
            return;
        }
        this.dispose();
        e.stopPropagation();
    }
    /** Disposes of this comment view. */
    dispose() {
        this.disposing = true;
        dom.removeNode(this.svgRoot);
        // Loop through listeners backwards in case they remove themselves.
        for (let i = this.disposeListeners.length - 1; i >= 0; i--) {
            this.disposeListeners[i]();
        }
        this.disposeListeners.length = 0;
        this.disposed = true;
    }
    /** Returns whether this comment view has been disposed or not. */
    isDisposed() {
        return this.disposed;
    }
    /**
     * Returns true if this comment view is currently being disposed or has
     * already been disposed.
     */
    isDeadOrDying() {
        return this.disposing || this.disposed;
    }
    /** Registers a callback that listens for disposal of this view. */
    addDisposeListener(listener) {
        this.disposeListeners.push(listener);
    }
    /** Removes the given listener from the list of disposal listeners. */
    removeDisposeListener(listener) {
        this.disposeListeners.splice(this.disposeListeners.indexOf(listener), 1);
    }
    /**
     * @internal
     */
    getCommentBarButtons() {
        return [this.foldoutButton, this.deleteButton];
    }
}
/** The default size of newly created comments. */
CommentView.defaultCommentSize = new Size(120, 100);
css.register(`
.injectionDiv {
  --commentFillColour: #FFFCC7;
  --commentBorderColour: #F2E49B;
}

.blocklyComment .blocklyTextarea {
  background-color: var(--commentFillColour);
  border: 1px solid var(--commentBorderColour);
  box-sizing: border-box;
  display: block;
  outline: 0;
  padding: 5px;
  resize: none;
  width: 100%;
  height: 100%;
}

.blocklyReadonly.blocklyComment .blocklyTextarea {
  cursor: inherit;
}

.blocklyDeleteIcon {
  width: 20px;
  height: 20px;
  display: none;
  cursor: pointer;
}

.blocklyFoldoutIcon {
  width: 20px;
  height: 20px;
  transform-origin: 12px 12px;
  cursor: pointer;
}
.blocklyResizeHandle {
  width: 12px;
  height: 12px;
  cursor: se-resize;
}
.blocklyReadonly.blocklyComment .blocklyResizeHandle {
  cursor: inherit;
}

.blocklyCommentTopbarBackground {
  fill: var(--commentBorderColour);
  height: 24px;
}

.blocklyComment .blocklyCommentPreview.blocklyText {
  fill: #000;
  dominant-baseline: middle;
  visibility: hidden;
}

.blocklyCollapsed.blocklyComment .blocklyCommentPreview {
  visibility: visible;
}

.blocklyCollapsed.blocklyComment .blocklyCommentForeignObject,
.blocklyCollapsed.blocklyComment .blocklyResizeHandle {
  display: none;
}

.blocklyCollapsed.blocklyComment .blocklyFoldoutIcon {
  transform: rotate(-90deg);
}

.blocklyRTL .blocklyCommentTopbar {
  transform: scale(-1, 1);
}

.blocklyRTL .blocklyCommentForeignObject {
  direction: rtl;
}

.blocklyRTL .blocklyCommentPreview {
  /* Revert the scale and control RTL using direction instead. */
  transform: scale(-1, 1);
  direction: rtl;
}

.blocklyRTL .blocklyResizeHandle {
  transform: scale(-1, 1);
  cursor: sw-resize;
}

.blocklyCommentHighlight {
  fill: none;
}

.blocklyCommentText.blocklyActiveFocus {
  border-color: #fc3;
  border-width: 2px;
}

.blocklySelected .blocklyCommentHighlight {
  stroke: #fc3;
  stroke-width: 3px;
}

.blocklyCollapsed.blocklySelected .blocklyCommentHighlight {
  stroke: none;
}

.blocklyCollapsed.blocklySelected .blocklyCommentTopbarBackground {
  stroke: #fc3;
  stroke-width: 3px;
}
`);
//# sourceMappingURL=comment_view.js.map