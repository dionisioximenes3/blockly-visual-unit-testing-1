/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Connection } from '../../connection.js';
import { ConnectionType } from '../../connection_type.js';
import { ConstantProvider } from './constants.js';
import { Drawer } from './drawer.js';
import { RenderInfo } from './info.js';
import { PathObject } from './path_object.js';
/**
 * The base class for a block renderer.
 */
export class Renderer {
    /**
     * @param name The renderer name.
     */
    constructor(name) {
        /**
         * Rendering constant overrides, passed in through options.
         */
        this.overrides = null;
        this.name = name;
    }
    /**
     * Gets the class name that identifies this renderer.
     *
     * @returns The CSS class name.
     */
    getClassName() {
        return this.name + '-renderer';
    }
    /**
     * Initialize the renderer.
     *
     * @param theme The workspace theme object.
     * @param opt_rendererOverrides Rendering constant overrides.
     */
    init(theme, opt_rendererOverrides) {
        this.constants_ = this.makeConstants_();
        if (opt_rendererOverrides) {
            this.overrides = opt_rendererOverrides;
            Object.assign(this.constants_, opt_rendererOverrides);
        }
        this.constants_.setTheme(theme);
        this.constants_.init();
    }
    /**
     * Create any DOM elements that this renderer needs.
     * If you need to create additional DOM elements, override the
     * {@link blockRendering#ConstantProvider.createDom} method instead.
     *
     * @param svg The root of the workspace's SVG.
     * @param theme The workspace theme object.
     * @param injectionDivIfIsParent The div containing the parent workspace and
     *   all related workspaces and block containers, if this renderer is for the
     *   parent workspace. CSS variables representing SVG patterns will be scoped
     *   to this container. Child workspaces should not override the CSS variables
     *   created by the parent and thus do not need access to the injection div.
     * @internal
     */
    createDom(svg, theme, injectionDivIfIsParent) {
        this.constants_.createDom(svg, this.name + '-' + theme.name, '.' + this.getClassName() + '.' + theme.getClassName(), injectionDivIfIsParent);
    }
    /**
     * Refresh the renderer after a theme change.
     *
     * @param svg The root of the workspace's SVG.
     * @param theme The workspace theme object.
     * @param injectionDivIfIsParent The div containing the parent workspace and
     *   all related workspaces and block containers, if this renderer is for the
     *   parent workspace. CSS variables representing SVG patterns will be scoped
     *   to this container. Child workspaces should not override the CSS variables
     *   created by the parent and thus do not need access to the injection div.
     */
    refreshDom(svg, theme, injectionDivIfIsParent) {
        const previousConstants = this.getConstants();
        previousConstants.dispose();
        this.constants_ = this.makeConstants_();
        if (this.overrides) {
            Object.assign(this.constants_, this.overrides);
        }
        // Ensure the constant provider's random identifier does not change.
        this.constants_.randomIdentifier = previousConstants.randomIdentifier;
        this.constants_.setTheme(theme);
        this.constants_.init();
        this.createDom(svg, theme, injectionDivIfIsParent);
    }
    /**
     * Dispose of this renderer.
     * Delete all DOM elements that this renderer and its constants created.
     */
    dispose() {
        if (this.constants_) {
            this.constants_.dispose();
        }
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
        return new PathObject(root, style, this.constants_);
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
    /**
     * Determine whether or not to highlight a connection.
     *
     * @param _conn The connection to determine whether or not to highlight.
     * @returns True if we should highlight the connection.
     */
    shouldHighlightConnection(_conn) {
        return true;
    }
    /**
     * Checks if an orphaned block can connect to the "end" of the topBlock's
     * block-clump. If the clump is a row the end is the last input. If the clump
     * is a stack, the end is the last next connection. If the clump is neither,
     * then this returns false.
     *
     * @param topBlock The top block of the block clump we want to try and connect
     *     to.
     * @param orphanBlock The orphan block that wants to find a home.
     * @param localType The type of the connection being dragged.
     * @returns Whether there is a home for the orphan or not.
     */
    orphanCanConnectAtEnd(topBlock, orphanBlock, localType) {
        const orphanConnection = localType === ConnectionType.OUTPUT_VALUE
            ? orphanBlock.outputConnection
            : orphanBlock.previousConnection;
        return !!Connection.getConnectionForOrphanedConnection(topBlock, orphanConnection);
    }
    /**
     * Render the block.
     *
     * @param block The block to render.
     * @internal
     */
    render(block) {
        const info = this.makeRenderInfo_(block);
        info.measure();
        this.makeDrawer_(block, info).draw();
    }
}
//# sourceMappingURL=renderer.js.map