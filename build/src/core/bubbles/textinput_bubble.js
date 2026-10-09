/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CommentEditor } from '../comments/comment_editor.js';
import * as Css from '../css.js';
import { getFocusManager } from '../focus_manager.js';
import * as touch from '../touch.js';
import { browserEvents } from '../utils.js';
import { Coordinate } from '../utils/coordinate.js';
import * as dom from '../utils/dom.js';
import * as drag from '../utils/drag.js';
import { Rect } from '../utils/rect.js';
import { Size } from '../utils/size.js';
import { Svg } from '../utils/svg.js';
import { Bubble } from './bubble.js';
/**
 * A bubble that displays editable text. It can also be resized by the user.
 * Used by the comment icon.
 */
export class TextInputBubble extends Bubble {
    /**
     * @param workspace The workspace this bubble belongs to.
     * @param anchor The anchor location of the thing this bubble is attached to.
     *     The tail of the bubble will point to this location.
     * @param ownerRect An optional rect we don't want the bubble to overlap with
     *     when automatically positioning.
     * @param owner The object that owns/hosts this bubble.
     */
    constructor(workspace, anchor, ownerRect, owner) {
        super(workspace, anchor, ownerRect, undefined, owner);
        this.workspace = workspace;
        this.anchor = anchor;
        this.ownerRect = ownerRect;
        this.owner = owner;
        /**
         * Event data associated with the listener for pointer up events on the
         * resize group.
         */
        this.resizePointerUpListener = null;
        /**
         * Event data associated with the listener for pointer move events on the
         * resize group.
         */
        this.resizePointerMoveListener = null;
        /** Functions listening for changes to the size of this bubble. */
        this.sizeChangeListeners = [];
        /** Functions listening for changes to the location of this bubble. */
        this.locationChangeListeners = [];
        /** The default size of this bubble, including borders. */
        this.DEFAULT_SIZE = new Size(160 + Bubble.DOUBLE_BORDER, 80 + Bubble.DOUBLE_BORDER);
        /** The minimum size of this bubble, including borders. */
        this.MIN_SIZE = new Size(45 + Bubble.DOUBLE_BORDER, 20 + Bubble.DOUBLE_BORDER);
        this.editable = true;
        dom.addClass(this.svgRoot, 'blocklyTextInputBubble');
        this.editor = new CommentEditor(workspace, this.id, () => {
            getFocusManager().focusNode(this);
        });
        this.contentContainer.appendChild(this.editor.getDom());
        this.resizeGroup = this.createResizeHandle(this.svgRoot, workspace);
        this.setSize(this.DEFAULT_SIZE, true);
    }
    /** @returns the text of this bubble. */
    getText() {
        return this.editor.getText();
    }
    /** Sets the text of this bubble. Calls change listeners. */
    setText(text) {
        this.editor.setText(text);
    }
    /** Sets whether or not the text in the bubble is editable. */
    setEditable(editable) {
        this.editable = editable;
        this.editor.setEditable(editable);
    }
    /** Returns whether or not the text in the bubble is editable. */
    isEditable() {
        return this.editable;
    }
    /** Adds a change listener to be notified when this bubble's text changes. */
    addTextChangeListener(listener) {
        this.editor.addTextChangeListener(listener);
    }
    /** Adds a change listener to be notified when this bubble's size changes. */
    addSizeChangeListener(listener) {
        this.sizeChangeListeners.push(listener);
    }
    /** Adds a change listener to be notified when this bubble's location changes. */
    addLocationChangeListener(listener) {
        this.locationChangeListeners.push(listener);
    }
    /** Creates the resize handler elements and binds events to them. */
    createResizeHandle(container, workspace) {
        const resizeHandle = dom.createSvgElement(Svg.IMAGE, {
            'class': 'blocklyResizeHandle',
            'href': `${workspace.options.pathToMedia}resize-handle.svg`,
        }, container);
        browserEvents.conditionalBind(resizeHandle, 'pointerdown', this, this.onResizePointerDown);
        return resizeHandle;
    }
    /**
     * Sets the size of this bubble, including the border.
     *
     * @param size Sets the size of this bubble, including the border.
     * @param relayout If true, reposition the bubble from scratch so that it is
     *     optimally visible. If false, reposition it so it maintains the same
     *     position relative to the anchor.
     */
    setSize(size, relayout = false) {
        size.width = Math.max(size.width, this.MIN_SIZE.width);
        size.height = Math.max(size.height, this.MIN_SIZE.height);
        const widthMinusBorder = size.width - Bubble.DOUBLE_BORDER;
        const heightMinusBorder = size.height - Bubble.DOUBLE_BORDER;
        this.editor.updateSize(new Size(widthMinusBorder, heightMinusBorder), new Size(0, 0));
        this.editor.getDom().setAttribute('x', `${Bubble.DOUBLE_BORDER / 2}`);
        this.editor.getDom().setAttribute('y', `${Bubble.DOUBLE_BORDER / 2}`);
        this.resizeGroup.setAttribute('y', `${heightMinusBorder}`);
        if (this.workspace.RTL) {
            this.resizeGroup.setAttribute('x', `${-Bubble.DOUBLE_BORDER}`);
        }
        else {
            this.resizeGroup.setAttribute('x', `${widthMinusBorder}`);
        }
        super.setSize(size, relayout);
        this.onSizeChange();
    }
    /** @returns the size of this bubble. */
    getSize() {
        // Overridden to be public.
        return super.getSize();
    }
    moveDuringDrag(newLoc) {
        super.moveDuringDrag(newLoc);
        this.onLocationChange();
    }
    setPositionRelativeToAnchor(left, top) {
        super.setPositionRelativeToAnchor(left, top);
        this.onLocationChange();
    }
    positionByRect(rect = new Rect(0, 0, 0, 0)) {
        super.positionByRect(rect);
        this.onLocationChange();
    }
    /** Handles mouse down events on the resize target. */
    onResizePointerDown(e) {
        this.bringToFront();
        if (browserEvents.isRightButton(e)) {
            e.stopPropagation();
            return;
        }
        drag.start(this.workspace, e, new Coordinate(this.workspace.RTL ? -this.getSize().width : this.getSize().width, this.getSize().height));
        this.resizePointerUpListener = browserEvents.conditionalBind(document, 'pointerup', this, this.onResizePointerUp);
        this.resizePointerMoveListener = browserEvents.conditionalBind(document, 'pointermove', this, this.onResizePointerMove);
        this.workspace.hideChaff();
        // This event has been handled.  No need to bubble up to the document.
        e.stopPropagation();
    }
    /** Handles pointer up events on the resize target. */
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
    }
    /** Handles pointer move events on the resize target. */
    onResizePointerMove(e) {
        const delta = drag.move(this.workspace, e);
        this.setSize(new Size(this.workspace.RTL ? -delta.x : delta.x, delta.y), false);
        this.onSizeChange();
    }
    /** Handles a size change event for the text area. Calls event listeners. */
    onSizeChange() {
        for (const listener of this.sizeChangeListeners) {
            listener();
        }
    }
    /** Handles a location change event for the text area. Calls event listeners. */
    onLocationChange() {
        for (const listener of this.locationChangeListeners) {
            listener();
        }
    }
    /**
     * Returns the text editor component of this bubble.
     *
     * @internal
     */
    getEditor() {
        return this.editor;
    }
}
Css.register(`
.blocklyTextInputBubble .blocklyTextarea {
  background-color: var(--commentFillColour);
  border: 0;
  box-sizing: border-box;
  display: block;
  outline: 0;
  padding: 5px;
  resize: none;
  width: 100%;
  height: 100%;
}
`);
//# sourceMappingURL=textinput_bubble.js.map