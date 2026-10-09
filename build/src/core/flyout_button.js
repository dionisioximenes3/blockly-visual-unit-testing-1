/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Class for a button in the flyout.
 *
 * @class
 */
// Former goog.module ID: Blockly.FlyoutButton
import * as browserEvents from './browser_events.js';
import * as Css from './css.js';
import { idGenerator } from './utils.js';
import { Coordinate } from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import * as parsing from './utils/parsing.js';
import { Rect } from './utils/rect.js';
import * as style from './utils/style.js';
import { Svg } from './utils/svg.js';
/**
 * Class for a button or label in the flyout.
 */
export class FlyoutButton {
    /**
     * @param workspace The workspace in which to place this button.
     * @param targetWorkspace The flyout's target workspace.
     * @param json The JSON specifying the label/button.
     * @param isFlyoutLabel Whether this button should be styled as a label.
     * @internal
     */
    constructor(workspace, targetWorkspace, json, isFlyoutLabel) {
        this.workspace = workspace;
        this.targetWorkspace = targetWorkspace;
        this.isFlyoutLabel = isFlyoutLabel;
        /** The width of the button's rect. */
        this.width = 0;
        /** The height of the button's rect. */
        this.height = 0;
        /** The SVG element with the text of the label or button. */
        this.svgText = null;
        /**
         * Holds the cursors svg element when the cursor is attached to the button.
         * This is null if there is no cursor on the button.
         */
        this.cursorSvg = null;
        this.text = json['text'];
        this.position = new Coordinate(0, 0);
        /** The key to the function called when this button is clicked. */
        this.callbackKey =
            json['callbackKey'] /* Check the lower case version
                                                         too to satisfy IE */
                ||
                    json['callbackkey'];
        /** If specified, a CSS class to add to this button. */
        this.cssClass = json['web-class'] || null;
        /** The JSON specifying the label / button. */
        this.info = json;
        let cssClass = this.isFlyoutLabel
            ? 'blocklyFlyoutLabel'
            : 'blocklyFlyoutButton';
        if (this.cssClass) {
            cssClass += ' ' + this.cssClass;
        }
        this.id = idGenerator.getNextUniqueId();
        this.svgGroup = dom.createSvgElement(Svg.G, { 'id': this.id, 'class': cssClass }, this.workspace.getCanvas());
        let shadow;
        if (!this.isFlyoutLabel) {
            // Shadow rectangle (light source does not mirror in RTL).
            shadow = dom.createSvgElement(Svg.RECT, {
                'class': 'blocklyFlyoutButtonShadow',
                'rx': FlyoutButton.BORDER_RADIUS,
                'ry': FlyoutButton.BORDER_RADIUS,
                'x': 1,
                'y': 1,
            }, this.svgGroup);
        }
        // Background rectangle.
        const rect = dom.createSvgElement(Svg.RECT, {
            'class': this.isFlyoutLabel
                ? 'blocklyFlyoutLabelBackground'
                : 'blocklyFlyoutButtonBackground',
            'rx': FlyoutButton.BORDER_RADIUS,
            'ry': FlyoutButton.BORDER_RADIUS,
        }, this.svgGroup);
        const svgText = dom.createSvgElement(Svg.TEXT, {
            'class': this.isFlyoutLabel ? 'blocklyFlyoutLabelText' : 'blocklyText',
            'x': 0,
            'y': 0,
            'text-anchor': 'middle',
        }, this.svgGroup);
        let text = parsing.replaceMessageReferences(this.text);
        if (this.workspace.RTL) {
            // Force text to be RTL by adding an RLM.
            text += '\u200F';
        }
        svgText.textContent = text;
        if (this.isFlyoutLabel) {
            this.svgText = svgText;
            this.workspace
                .getThemeManager()
                .subscribe(this.svgText, 'flyoutForegroundColour', 'fill');
        }
        const fontSize = style.getComputedStyle(svgText, 'fontSize');
        const fontWeight = style.getComputedStyle(svgText, 'fontWeight');
        const fontFamily = style.getComputedStyle(svgText, 'fontFamily');
        this.width = dom.getFastTextWidthWithSizeString(svgText, fontSize, fontWeight, fontFamily);
        const fontMetrics = dom.measureFontMetrics(text, fontSize, fontWeight, fontFamily);
        this.height = this.height || fontMetrics.height;
        if (!this.isFlyoutLabel) {
            this.width += 2 * FlyoutButton.TEXT_MARGIN_X;
            this.height += 2 * FlyoutButton.TEXT_MARGIN_Y;
            shadow?.setAttribute('width', String(this.width));
            shadow?.setAttribute('height', String(this.height));
        }
        rect.setAttribute('width', String(this.width));
        rect.setAttribute('height', String(this.height));
        svgText.setAttribute('x', String(this.width / 2));
        svgText.setAttribute('y', String(this.height / 2 - fontMetrics.height / 2 + fontMetrics.baseline));
        this.updateTransform();
        this.onMouseDownWrapper = browserEvents.conditionalBind(this.svgGroup, 'pointerdown', this, this.onMouseDown);
        this.onMouseUpWrapper = browserEvents.conditionalBind(this.svgGroup, 'pointerup', this, this.onMouseUp);
    }
    createDom() {
        // No-op, now handled in constructor. Will be removed in followup refactor
        // PR that updates the flyout classes to use inflaters.
        return this.svgGroup;
    }
    /** Correctly position the flyout button and make it visible. */
    show() {
        this.updateTransform();
        this.svgGroup.setAttribute('display', 'block');
    }
    /** Update SVG attributes to match internal state. */
    updateTransform() {
        this.svgGroup.setAttribute('transform', 'translate(' + this.position.x + ',' + this.position.y + ')');
    }
    /**
     * Move the button to the given x, y coordinates.
     *
     * @param x The new x coordinate.
     * @param y The new y coordinate.
     */
    moveTo(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.updateTransform();
    }
    /**
     * Move the element by a relative offset.
     *
     * @param dx Horizontal offset in workspace units.
     * @param dy Vertical offset in workspace units.
     * @param _reason Why is this move happening?  'user', 'bump', 'snap'...
     */
    moveBy(dx, dy, _reason) {
        this.moveTo(this.position.x + dx, this.position.y + dy);
    }
    /** @returns Whether or not the button is a label. */
    isLabel() {
        return this.isFlyoutLabel;
    }
    /**
     * Location of the button.
     *
     * @returns x, y coordinates.
     * @internal
     */
    getPosition() {
        return this.position;
    }
    /**
     * Returns the coordinates of a bounded element describing the dimensions of
     * the element. Coordinate system: workspace coordinates.
     *
     * @returns Object with coordinates of the bounded element.
     */
    getBoundingRectangle() {
        return new Rect(this.position.y, this.position.y + this.height, this.position.x, this.position.x + this.width);
    }
    /** @returns Text of the button. */
    getButtonText() {
        return this.text;
    }
    /**
     * Get the button's target workspace.
     *
     * @returns The target workspace of the flyout where this button resides.
     */
    getTargetWorkspace() {
        return this.targetWorkspace;
    }
    /**
     * Get the button's workspace.
     *
     * @returns The workspace in which to place this button.
     */
    getWorkspace() {
        return this.workspace;
    }
    /** Dispose of this button. */
    dispose() {
        browserEvents.unbind(this.onMouseDownWrapper);
        browserEvents.unbind(this.onMouseUpWrapper);
        if (this.svgGroup) {
            dom.removeNode(this.svgGroup);
        }
        if (this.svgText) {
            this.workspace.getThemeManager().unsubscribe(this.svgText);
        }
    }
    /**
     * Add the cursor SVG to this buttons's SVG group.
     *
     * @param cursorSvg The SVG root of the cursor to be added to the button SVG
     *     group.
     */
    setCursorSvg(cursorSvg) {
        if (!cursorSvg) {
            this.cursorSvg = null;
            return;
        }
        if (this.svgGroup) {
            this.svgGroup.appendChild(cursorSvg);
            this.cursorSvg = cursorSvg;
        }
    }
    /**
     * Do something when the button is clicked.
     *
     * @param e Pointer up event.
     */
    onMouseUp(e) {
        const gesture = this.targetWorkspace.getGesture(e);
        if (gesture) {
            gesture.cancel();
        }
        if (this.isFlyoutLabel && this.callbackKey) {
            console.warn('Labels should not have callbacks. Label text: ' + this.text);
        }
        else if (!this.isFlyoutLabel &&
            !(this.callbackKey &&
                this.targetWorkspace.getButtonCallback(this.callbackKey))) {
            console.warn('Buttons should have callbacks. Button text: ' + this.text);
        }
        else if (!this.isFlyoutLabel) {
            const callback = this.targetWorkspace.getButtonCallback(this.callbackKey);
            if (callback) {
                callback(this);
            }
        }
    }
    onMouseDown(e) {
        const gesture = this.targetWorkspace.getGesture(e);
        const flyout = this.targetWorkspace.getFlyout();
        if (gesture && flyout) {
            gesture.handleFlyoutStart(e, flyout);
        }
    }
    /**
     * @returns The root SVG element of this rendered element.
     */
    getSvgRoot() {
        return this.svgGroup;
    }
    /** See IFocusableNode.getFocusableElement. */
    getFocusableElement() {
        return this.svgGroup;
    }
    /** See IFocusableNode.getFocusableTree. */
    getFocusableTree() {
        return this.workspace;
    }
    /** See IFocusableNode.onNodeFocus. */
    onNodeFocus() {
        const xy = this.getPosition();
        const bounds = new Rect(xy.y, xy.y + this.height, xy.x, xy.x + this.width);
        this.workspace.scrollBoundsIntoView(bounds);
    }
    /** See IFocusableNode.onNodeBlur. */
    onNodeBlur() { }
    /** See IFocusableNode.canBeFocused. */
    canBeFocused() {
        return true;
    }
}
/** The horizontal margin around the text in the button. */
FlyoutButton.TEXT_MARGIN_X = 5;
/** The vertical margin around the text in the button. */
FlyoutButton.TEXT_MARGIN_Y = 2;
/** The radius of the flyout button's borders. */
FlyoutButton.BORDER_RADIUS = 4;
/** CSS for buttons and labels. See css.js for use. */
Css.register(`
.blocklyFlyoutButton {
  fill: #888;
  cursor: default;
}

.blocklyFlyoutButtonShadow {
  fill: #666;
}

.blocklyFlyoutButton:hover {
  fill: #aaa;
}

.blocklyFlyoutLabel {
  cursor: default;
}

.blocklyFlyoutLabelBackground {
  opacity: 0;
}
`);
//# sourceMappingURL=flyout_button.js.map