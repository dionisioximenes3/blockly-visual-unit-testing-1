/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as blockRendering from '../common/block_rendering.js';
import { Renderer as BaseRenderer } from '../common/renderer.js';
import { ConstantProvider } from './constants.js';
import { Drawer } from './drawer.js';
import { RenderInfo } from './info.js';
import { PathObject } from './path_object.js';
/**
 * The zelos renderer. This renderer emulates Scratch-style and MakeCode-style
 * rendering.
 *
 * Zelos is the ancient Greek spirit of rivalry and emulation.
 */
export class Renderer extends BaseRenderer {
    /**
     * @param name The renderer name.
     */
    constructor(name) {
        super(name);
    }
    /**
     * Create a new instance of the renderer's constant provider.
     *
     * @returns The constant provider.
     */
    makeConstants_() {
        return new ConstantProvider();
    }
    /**
     * Create a new instance of the renderer's render info object.
     *
     * @param block The block to measure.
     * @returns The render info object.
     */
    makeRenderInfo_(block) {
        return new RenderInfo(this, block);
    }
    /**
     * Create a new instance of the renderer's drawer.
     *
     * @param block The block to render.
     * @param info An object containing all information needed to render this
     *     block.
     * @returns The drawer.
     */
    makeDrawer_(block, info) {
        return new Drawer(block, info);
    }
    /**
     * Create a new instance of a renderer path object.
     *
     * @param root The root SVG element.
     * @param style The style object to use for colouring.
     * @returns The renderer path object.
     */
    makePathObject(root, style) {
        return new PathObject(root, style, this.getConstants());
    }
    /**
     * Get the current renderer's constant provider.  We assume that when this is
     * called, the renderer has already been initialized.
     *
     * @returns The constant provider.
     */
    getConstants() {
        return this.constants_;
    }
}
blockRendering.register('zelos', Renderer);
//# sourceMappingURL=renderer.js.map