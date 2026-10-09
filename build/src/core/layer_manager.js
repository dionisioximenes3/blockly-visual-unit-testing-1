/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { getFocusManager } from './focus_manager.js';
import * as layerNums from './layers.js';
import * as dom from './utils/dom.js';
import { Svg } from './utils/svg.js';
/** @internal */
export class LayerManager {
    /** @internal */
    constructor(workspace) {
        this.workspace = workspace;
        /** The layers elements not being dragged are appended to.  */
        this.layers = new Map();
        const injectionDiv = workspace.getInjectionDiv();
        // `getInjectionDiv` is actually nullable. We hit this if the workspace
        // is part of a flyout and the workspace the flyout is attached to hasn't
        // been appended yet.
        if (injectionDiv) {
            this.dragLayer = this.createDragLayer(injectionDiv);
            this.animationLayer = this.createAnimationLayer(injectionDiv);
        }
        // We construct these manually so we can add the css class for backwards
        // compatibility.
        const blockLayer = this.createLayer(layerNums.BLOCK);
        dom.addClass(blockLayer, 'blocklyBlockCanvas');
        const bubbleLayer = this.createLayer(layerNums.BUBBLE);
        dom.addClass(bubbleLayer, 'blocklyBubbleCanvas');
    }
    createDragLayer(injectionDiv) {
        const svg = dom.createSvgElement(Svg.SVG, {
            'class': 'blocklyBlockDragSurface',
            'xmlns': dom.SVG_NS,
            'xmlns:html': dom.HTML_NS,
            'xmlns:xlink': dom.XLINK_NS,
            'version': '1.1',
        });
        injectionDiv.append(svg);
        return dom.createSvgElement(Svg.G, {}, svg);
    }
    createAnimationLayer(injectionDiv) {
        const svg = dom.createSvgElement(Svg.SVG, {
            'class': 'blocklyAnimationLayer',
            'xmlns': dom.SVG_NS,
            'xmlns:html': dom.HTML_NS,
            'xmlns:xlink': dom.XLINK_NS,
            'version': '1.1',
        });
        injectionDiv.append(svg);
        return dom.createSvgElement(Svg.G, {}, svg);
    }
    /**
     * Appends the element to the animation layer. The animation layer doesn't
     * move when the workspace moves, so e.g. delete animations don't move
     * when a block delete triggers a workspace resize.
     *
     * @internal
     */
    appendToAnimationLayer(elem) {
        const currentTransform = this.dragLayer?.getAttribute('transform');
        // Only update the current transform when appending, so animations don't
        // move if the workspace moves.
        if (currentTransform) {
            this.animationLayer?.setAttribute('transform', currentTransform);
        }
        this.animationLayer?.appendChild(elem.getSvgRoot());
    }
    /**
     * Translates layers when the workspace is dragged or zoomed.
     *
     * @internal
     */
    translateLayers(newCoord, newScale) {
        const translation = `translate(${newCoord.x}, ${newCoord.y}) scale(${newScale})`;
        this.dragLayer?.setAttribute('transform', translation);
        for (const [_, layer] of this.layers) {
            layer.setAttribute('transform', translation);
        }
    }
    /**
     * Moves the given element to the drag layer, which exists on top of all other
     * layers, and the drag surface.
     *
     * @internal
     */
    moveToDragLayer(elem) {
        this.dragLayer?.appendChild(elem.getSvgRoot());
        if (elem.canBeFocused()) {
            // Since moving the element to the drag layer will cause it to lose focus,
            // ensure it regains focus (to ensure proper highlights & sent events).
            getFocusManager().focusNode(elem);
        }
    }
    /**
     * Moves the given element off of the drag layer.
     *
     * @internal
     */
    moveOffDragLayer(elem, layerNum) {
        this.append(elem, layerNum);
        if (elem.canBeFocused()) {
            // Since moving the element off the drag layer will cause it to lose focus,
            // ensure it regains focus (to ensure proper highlights & sent events).
            getFocusManager().focusNode(elem);
        }
    }
    /**
     * Appends the given element to a layer. If the layer does not exist, it is
     * created.
     *
     * @internal
     */
    append(elem, layerNum) {
        if (!this.layers.has(layerNum)) {
            this.createLayer(layerNum);
        }
        const childElem = elem.getSvgRoot();
        if (this.layers.get(layerNum)?.lastChild !== childElem) {
            // Only append the child if it isn't already last (to avoid re-firing
            // events like focused).
            this.layers.get(layerNum)?.appendChild(childElem);
        }
    }
    /**
     * Creates a layer and inserts it at the proper place given the layer number.
     *
     * More positive layers exist later in the dom and are rendered ontop of
     * less positive layers. Layers are added to the layer map as a side effect.
     */
    createLayer(layerNum) {
        const parent = this.workspace.getSvgGroup();
        const layer = dom.createSvgElement(Svg.G, {});
        let inserted = false;
        const sortedLayers = [...this.layers].sort((a, b) => a[0] - b[0]);
        for (const [num, sib] of sortedLayers) {
            if (layerNum < num) {
                parent.insertBefore(layer, sib);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            parent.appendChild(layer);
        }
        this.layers.set(layerNum, layer);
        return layer;
    }
    /**
     * Returns true if the given element is a layer managed by the layer manager.
     * False otherwise.
     *
     * @internal
     */
    hasLayer(elem) {
        return (elem === this.dragLayer ||
            new Set(this.layers.values()).has(elem));
    }
    /**
     * We need to be able to access this layer explicitly for backwards
     * compatibility.
     *
     * @internal
     */
    getBlockLayer() {
        return this.layers.get(layerNums.BLOCK);
    }
    /**
     * We need to be able to access this layer explicitly for backwards
     * compatibility.
     *
     * @internal
     */
    getBubbleLayer() {
        return this.layers.get(layerNums.BUBBLE);
    }
}
//# sourceMappingURL=layer_manager.js.map