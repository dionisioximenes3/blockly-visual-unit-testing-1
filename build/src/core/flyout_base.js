/**
 * @license
 * Copyright 2011 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as browserEvents from './browser_events.js';
import { ComponentManager } from './component_manager.js';
import { DeleteArea } from './delete_area.js';
import { EventType } from './events/type.js';
import * as eventUtils from './events/utils.js';
import { FlyoutItem } from './flyout_item.js';
import { FlyoutMetricsManager } from './flyout_metrics_manager.js';
import { FlyoutNavigator } from './flyout_navigator.js';
import { FlyoutSeparator } from './flyout_separator.js';
import * as registry from './registry.js';
import * as renderManagement from './render_management.js';
import { ScrollbarPair } from './scrollbar_pair.js';
import { SEPARATOR_TYPE } from './separator_flyout_inflater.js';
import * as blocks from './serialization/blocks.js';
import { Coordinate } from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import * as idGenerator from './utils/idgenerator.js';
import { Svg } from './utils/svg.js';
import * as toolbox from './utils/toolbox.js';
import * as Variables from './variables.js';
import { WorkspaceSvg } from './workspace_svg.js';
/**
 * Class for a flyout.
 */
export class Flyout extends DeleteArea {
    /**
     * @param workspaceOptions Dictionary of options for the
     *     workspace.
     */
    constructor(workspaceOptions) {
        super();
        /**
         * Whether the flyout should be laid out horizontally or not.
         *
         * @internal
         */
        this.horizontalLayout = false;
        /**
         * Array holding info needed to unbind events.
         * Used for disposing.
         * Ex: [[node, name, func], [node, name, func]].
         */
        this.boundEvents = [];
        /**
         * Function that will be registered as a change listener on the workspace
         * to reflow when elements in the flyout workspace change.
         */
        this.reflowWrapper = null;
        /**
         * List of flyout elements.
         */
        this.contents = [];
        /**
         * Does the flyout automatically close when a block is created?
         */
        this.autoClose = true;
        /**
         * Whether the flyout is visible.
         */
        this.visible = false;
        /**
         * Whether the workspace containing this flyout is visible.
         */
        this.containerVisible = true;
        /**
         * Corner radius of the flyout background.
         */
        this.CORNER_RADIUS = 8;
        /**
         * Top/bottom padding between scrollbar and edge of flyout background.
         */
        this.SCROLLBAR_MARGIN = 2.5;
        /**
         * Width of flyout.
         */
        this.width_ = 0;
        /**
         * Height of flyout.
         */
        this.height_ = 0;
        // clang-format off
        /**
         * Range of a drag angle from a flyout considered "dragging toward
         * workspace". Drags that are within the bounds of this many degrees from
         * the orthogonal line to the flyout edge are considered to be "drags toward
         * the workspace".
         *
         * @example
         *
         * ```
         * Flyout                                                 Edge   Workspace
         * [block] /  <-within this angle, drags "toward workspace" |
         * [block] ---- orthogonal to flyout boundary ----          |
         * [block] \                                                |
         * ```
         *
         * The angle is given in degrees from the orthogonal.
         *
         * This is used to know when to create a new block and when to scroll the
         * flyout. Setting it to 360 means that all drags create a new block.
         */
        // clang-format on
        this.dragAngleRange_ = 70;
        /**
         * The path around the background of the flyout, which will be filled with a
         * background colour.
         */
        this.svgBackground_ = null;
        /**
         * The root SVG group for the button or label.
         */
        this.svgGroup_ = null;
        /**
         * Map from flyout content type to the corresponding inflater class
         * responsible for creating concrete instances of the content type.
         */
        this.inflaters = new Map();
        workspaceOptions.setMetrics = this.setMetrics_.bind(this);
        this.workspace_ = new WorkspaceSvg(workspaceOptions);
        this.workspace_.setMetricsManager(new FlyoutMetricsManager(this.workspace_, this));
        this.workspace_.internalIsFlyout = true;
        // Keep the workspace visibility consistent with the flyout's visibility.
        this.workspace_.setVisible(this.visible);
        this.workspace_.setNavigator(new FlyoutNavigator(this));
        /**
         * The unique id for this component that is used to register with the
         * ComponentManager.
         */
        this.id = idGenerator.genUid();
        /**
         * Is RTL vs LTR.
         */
        this.RTL = !!workspaceOptions.RTL;
        /**
         * Position of the toolbox and flyout relative to the workspace.
         */
        this.toolboxPosition_ = workspaceOptions.toolboxPosition;
        /**
         * Width of output tab.
         */
        this.tabWidth_ = this.workspace_.getRenderer().getConstants().TAB_WIDTH;
        /**
         * Margin around the edges of the elements in the flyout.
         */
        this.MARGIN = this.CORNER_RADIUS;
        // TODO: Move GAP_X and GAP_Y to their appropriate files.
        /**
         * Gap between items in horizontal flyouts. Can be overridden with the "sep"
         * element.
         */
        this.GAP_X = this.MARGIN * 3;
        /**
         * Gap between items in vertical flyouts. Can be overridden with the "sep"
         * element.
         */
        this.GAP_Y = this.MARGIN * 3;
    }
    /**
     * Creates the flyout's DOM.  Only needs to be called once.  The flyout can
     * either exist as its own SVG element or be a g element nested inside a
     * separate SVG element.
     *
     * @param tagName The type of tag to
     *     put the flyout in. This should be <svg> or <g>.
     * @returns The flyout's SVG group.
     */
    createDom(tagName) {
        /*
            <svg | g>
              <path class="blocklyFlyoutBackground"/>
              <g class="blocklyFlyout"></g>
            </ svg | g>
            */
        // Setting style to display:none to start. The toolbox and flyout
        // hide/show code will set up proper visibility and size later.
        this.svgGroup_ = dom.createSvgElement(tagName, {
            'class': 'blocklyFlyout',
        });
        this.svgGroup_.style.display = 'none';
        this.svgBackground_ = dom.createSvgElement(Svg.PATH, { 'class': 'blocklyFlyoutBackground' }, this.svgGroup_);
        this.svgGroup_.appendChild(this.workspace_.createDom());
        this.workspace_
            .getThemeManager()
            .subscribe(this.svgBackground_, 'flyoutBackgroundColour', 'fill');
        this.workspace_
            .getThemeManager()
            .subscribe(this.svgBackground_, 'flyoutOpacity', 'fill-opacity');
        return this.svgGroup_;
    }
    /**
     * Initializes the flyout.
     *
     * @param targetWorkspace The workspace in which to
     *     create new blocks.
     */
    init(targetWorkspace) {
        this.targetWorkspace = targetWorkspace;
        this.workspace_.targetWorkspace = targetWorkspace;
        this.workspace_.scrollbar = new ScrollbarPair(this.workspace_, this.horizontalLayout, !this.horizontalLayout, 'blocklyFlyoutScrollbar', this.SCROLLBAR_MARGIN);
        this.hide();
        this.boundEvents.push(browserEvents.conditionalBind(this.svgGroup_, 'wheel', this, this.wheel_));
        // Dragging the flyout up and down.
        this.boundEvents.push(browserEvents.conditionalBind(this.svgBackground_, 'pointerdown', this, this.onMouseDown));
        // A flyout connected to a workspace doesn't have its own current gesture.
        this.workspace_.getGesture = this.targetWorkspace.getGesture.bind(this.targetWorkspace);
        // Get variables from the main workspace rather than the target workspace.
        this.workspace_.setVariableMap(this.targetWorkspace.getVariableMap());
        this.workspace_.createPotentialVariableMap();
        targetWorkspace.getComponentManager().addComponent({
            component: this,
            weight: ComponentManager.ComponentWeight.FLYOUT_WEIGHT,
            capabilities: [
                ComponentManager.Capability.AUTOHIDEABLE,
                ComponentManager.Capability.DELETE_AREA,
                ComponentManager.Capability.DRAG_TARGET,
            ],
        });
    }
    /**
     * Dispose of this flyout.
     * Unlink from all DOM elements to prevent memory leaks.
     */
    dispose() {
        this.hide();
        this.targetWorkspace.getComponentManager().removeComponent(this.id);
        for (const event of this.boundEvents) {
            browserEvents.unbind(event);
        }
        this.boundEvents.length = 0;
        if (this.workspace_) {
            this.workspace_.getThemeManager().unsubscribe(this.svgBackground_);
            this.workspace_.dispose();
        }
        if (this.svgGroup_) {
            dom.removeNode(this.svgGroup_);
        }
    }
    /**
     * Get the width of the flyout.
     *
     * @returns The width of the flyout.
     */
    getWidth() {
        return this.width_;
    }
    /**
     * Get the height of the flyout.
     *
     * @returns The width of the flyout.
     */
    getHeight() {
        return this.height_;
    }
    /**
     * Get the scale (zoom level) of the flyout. By default,
     * this matches the target workspace scale, but this can be overridden.
     *
     * @returns Flyout workspace scale.
     */
    getFlyoutScale() {
        return this.targetWorkspace.scale;
    }
    /**
     * Get the workspace inside the flyout.
     *
     * @returns The workspace inside the flyout.
     */
    getWorkspace() {
        return this.workspace_;
    }
    /**
     * Sets whether this flyout automatically closes when blocks are dragged out,
     * the workspace is clicked, etc, or not.
     */
    setAutoClose(autoClose) {
        this.autoClose = autoClose;
        this.targetWorkspace.recordDragTargets();
        this.targetWorkspace.resizeContents();
    }
    /** Automatically hides the flyout if it is an autoclosing flyout. */
    autoHide(onlyClosePopups) {
        if (!onlyClosePopups &&
            this.targetWorkspace.getFlyout(true) === this &&
            this.autoClose)
            this.hide();
    }
    /**
     * Get the target workspace inside the flyout.
     *
     * @returns The target workspace inside the flyout.
     */
    getTargetWorkspace() {
        return this.targetWorkspace;
    }
    /**
     * Is the flyout visible?
     *
     * @returns True if visible.
     */
    isVisible() {
        return this.visible;
    }
    /**
     * Set whether the flyout is visible. A value of true does not necessarily
     * mean that the flyout is shown. It could be hidden because its container is
     * hidden.
     *
     * @param visible True if visible.
     */
    setVisible(visible) {
        const visibilityChanged = visible !== this.isVisible();
        this.visible = visible;
        if (visibilityChanged) {
            if (!this.autoClose) {
                // Auto-close flyouts are ignored as drag targets, so only non
                // auto-close flyouts need to have their drag target updated.
                this.targetWorkspace.recordDragTargets();
            }
            this.updateDisplay();
        }
    }
    /**
     * Set whether this flyout's container is visible.
     *
     * @param visible Whether the container is visible.
     */
    setContainerVisible(visible) {
        const visibilityChanged = visible !== this.containerVisible;
        this.containerVisible = visible;
        if (visibilityChanged) {
            this.updateDisplay();
        }
    }
    /**
     * Get the list of elements of the current flyout.
     *
     * @returns The array of flyout elements.
     */
    getContents() {
        return this.contents;
    }
    /**
     * Store the list of elements on the flyout.
     *
     * @param contents - The array of items for the flyout.
     */
    setContents(contents) {
        this.contents = contents;
    }
    /**
     * Update the display property of the flyout based whether it thinks it should
     * be visible and whether its containing workspace is visible.
     */
    updateDisplay() {
        let show = true;
        if (!this.containerVisible) {
            show = false;
        }
        else {
            show = this.isVisible();
        }
        if (this.svgGroup_) {
            this.svgGroup_.style.display = show ? 'block' : 'none';
        }
        // Update the scrollbar's visibility too since it should mimic the
        // flyout's visibility.
        this.workspace_.scrollbar?.setContainerVisible(show);
    }
    /**
     * Update the view based on coordinates calculated in position().
     *
     * @param width The computed width of the flyout's SVG group
     * @param height The computed height of the flyout's SVG group.
     * @param x The computed x origin of the flyout's SVG group.
     * @param y The computed y origin of the flyout's SVG group.
     */
    positionAt_(width, height, x, y) {
        this.svgGroup_?.setAttribute('width', `${width}`);
        this.svgGroup_?.setAttribute('height', `${height}`);
        this.workspace_.setCachedParentSvgSize(width, height);
        if (this.svgGroup_) {
            const transform = 'translate(' + x + 'px,' + y + 'px)';
            dom.setCssTransform(this.svgGroup_, transform);
        }
        // Update the scrollbar (if one exists).
        const scrollbar = this.workspace_.scrollbar;
        if (scrollbar) {
            // Set the scrollbars origin to be the top left of the flyout.
            scrollbar.setOrigin(x, y);
            scrollbar.resize();
            // If origin changed and metrics haven't changed enough to trigger
            // reposition in resize, we need to call setPosition. See issue #4692.
            if (scrollbar.hScroll) {
                scrollbar.hScroll.setPosition(scrollbar.hScroll.position.x, scrollbar.hScroll.position.y);
            }
            if (scrollbar.vScroll) {
                scrollbar.vScroll.setPosition(scrollbar.vScroll.position.x, scrollbar.vScroll.position.y);
            }
        }
    }
    /**
     * Hide and empty the flyout.
     */
    hide() {
        if (!this.isVisible()) {
            return;
        }
        this.setVisible(false);
        if (this.reflowWrapper) {
            this.workspace_.removeChangeListener(this.reflowWrapper);
            this.reflowWrapper = null;
        }
        // Do NOT delete the flyout contents here.  Wait until Flyout.show.
        // https://neil.fraser.name/news/2014/08/09/
    }
    /**
     * Show and populate the flyout.
     *
     * @param flyoutDef Contents to display
     *     in the flyout. This is either an array of Nodes, a NodeList, a
     *     toolbox definition, or a string with the name of the dynamic category.
     */
    show(flyoutDef) {
        this.workspace_.setResizesEnabled(false);
        this.hide();
        this.clearOldBlocks();
        // Handle dynamic categories, represented by a name instead of a list.
        if (typeof flyoutDef === 'string') {
            flyoutDef = this.getDynamicCategoryContents(flyoutDef);
        }
        this.setVisible(true);
        // Parse the Array, Node or NodeList into a a list of flyout items.
        const parsedContent = toolbox.convertFlyoutDefToJsonArray(flyoutDef);
        const flyoutInfo = this.createFlyoutInfo(parsedContent);
        renderManagement.triggerQueuedRenders(this.workspace_);
        this.setContents(flyoutInfo);
        this.layout_(flyoutInfo);
        if (this.horizontalLayout) {
            this.height_ = 0;
        }
        else {
            this.width_ = 0;
        }
        this.reflow();
        this.workspace_.setResizesEnabled(true);
        // Listen for block change events, and reflow the flyout in response. This
        // accommodates e.g. resizing a non-autoclosing flyout in response to the
        // user typing long strings into fields on the blocks in the flyout.
        this.reflowWrapper = (event) => {
            if (event.type === EventType.BLOCK_CHANGE ||
                event.type === EventType.BLOCK_FIELD_INTERMEDIATE_CHANGE) {
                this.reflow();
            }
        };
        this.workspace_.addChangeListener(this.reflowWrapper);
    }
    /**
     * Create the contents array and gaps array necessary to create the layout for
     * the flyout.
     *
     * @param parsedContent The array
     *     of objects to show in the flyout.
     * @returns The list of contents needed to lay out the flyout.
     */
    createFlyoutInfo(parsedContent) {
        const contents = [];
        const defaultGap = this.horizontalLayout ? this.GAP_X : this.GAP_Y;
        for (const info of parsedContent) {
            if ('custom' in info) {
                const customInfo = info;
                const categoryName = customInfo['custom'];
                const flyoutDef = this.getDynamicCategoryContents(categoryName);
                const parsedDynamicContent = toolbox.convertFlyoutDefToJsonArray(flyoutDef);
                contents.push(...this.createFlyoutInfo(parsedDynamicContent));
            }
            const type = info['kind'].toLowerCase();
            const inflater = this.getInflaterForType(type);
            if (inflater) {
                contents.push(inflater.load(info, this));
                const gap = inflater.gapForItem(info, defaultGap);
                if (gap) {
                    contents.push(new FlyoutItem(new FlyoutSeparator(gap, this.horizontalLayout ? "x" /* SeparatorAxis.X */ : "y" /* SeparatorAxis.Y */), SEPARATOR_TYPE));
                }
            }
        }
        return this.normalizeSeparators(contents);
    }
    /**
     * Updates and returns the provided list of flyout contents to flatten
     * separators as needed.
     *
     * When multiple separators occur one after another, the value of the last one
     * takes precedence and the earlier separators in the group are removed.
     *
     * @param contents The list of flyout contents to flatten separators in.
     * @returns An updated list of flyout contents with only one separator between
     *     each non-separator item.
     */
    normalizeSeparators(contents) {
        for (let i = contents.length - 1; i > 0; i--) {
            const elementType = contents[i].getType().toLowerCase();
            const previousElementType = contents[i - 1].getType().toLowerCase();
            if (elementType === SEPARATOR_TYPE &&
                previousElementType === SEPARATOR_TYPE) {
                // Remove previousElement from the array, shifting the current element
                // forward as a result. This preserves the behavior where explicit
                // separator elements override the value of prior implicit (or explicit)
                // separator elements.
                contents.splice(i - 1, 1);
            }
        }
        return contents;
    }
    /**
     * Gets the flyout definition for the dynamic category.
     *
     * @param categoryName The name of the dynamic category.
     * @returns The definition of the
     *     flyout in one of its many forms.
     */
    getDynamicCategoryContents(categoryName) {
        // Look up the correct category generation function and call that to get a
        // valid XML list.
        const fnToApply = this.workspace_.targetWorkspace.getToolboxCategoryCallback(categoryName);
        if (typeof fnToApply !== 'function') {
            throw TypeError("Couldn't find a callback function when opening" +
                ' a toolbox category.');
        }
        return fnToApply(this.workspace_.targetWorkspace);
    }
    /**
     * Delete elements from a previous showing of the flyout.
     */
    clearOldBlocks() {
        this.getContents().forEach((item) => {
            const inflater = this.getInflaterForType(item.getType());
            inflater?.disposeItem(item);
        });
        // Clear potential variables from the previous showing.
        this.workspace_.getPotentialVariableMap()?.clear();
    }
    /**
     * Pointer down on the flyout background.  Start a vertical scroll drag.
     *
     * @param e Pointer down event.
     */
    onMouseDown(e) {
        const gesture = this.targetWorkspace.getGesture(e);
        if (gesture) {
            gesture.handleFlyoutStart(e, this);
        }
    }
    /**
     * Does this flyout allow you to create a new instance of the given block?
     * Used for deciding if a block can be "dragged out of" the flyout.
     *
     * @param block The block to copy from the flyout.
     * @returns True if you can create a new instance of the block, false
     *    otherwise.
     * @internal
     */
    isBlockCreatable(block) {
        return block.isEnabled() && !this.getTargetWorkspace().isReadOnly();
    }
    /**
     * Create a copy of this block on the workspace.
     *
     * @param originalBlock The block to copy from the flyout.
     * @returns The newly created block.
     * @throws {Error} if something went wrong with deserialization.
     * @internal
     */
    createBlock(originalBlock) {
        let newBlock = null;
        eventUtils.disable();
        const variablesBeforeCreation = this.targetWorkspace.getAllVariables();
        this.targetWorkspace.setResizesEnabled(false);
        try {
            newBlock = this.placeNewBlock(originalBlock);
        }
        finally {
            eventUtils.enable();
        }
        // Close the flyout.
        this.targetWorkspace.hideChaff();
        const newVariables = Variables.getAddedVariables(this.targetWorkspace, variablesBeforeCreation);
        if (eventUtils.isEnabled()) {
            eventUtils.setGroup(true);
            // Fire a VarCreate event for each (if any) new variable created.
            for (let i = 0; i < newVariables.length; i++) {
                const thisVariable = newVariables[i];
                eventUtils.fire(new (eventUtils.get(EventType.VAR_CREATE))(thisVariable));
            }
            // Block events come after var events, in case they refer to newly created
            // variables.
            eventUtils.fire(new (eventUtils.get(EventType.BLOCK_CREATE))(newBlock));
        }
        if (this.autoClose) {
            this.hide();
        }
        return newBlock;
    }
    /**
     * Reflow flyout contents.
     */
    reflow() {
        if (this.reflowWrapper) {
            this.workspace_.removeChangeListener(this.reflowWrapper);
        }
        this.reflowInternal_();
        if (this.reflowWrapper) {
            this.workspace_.addChangeListener(this.reflowWrapper);
        }
    }
    /**
     * @returns True if this flyout may be scrolled with a scrollbar or
     *     by dragging.
     * @internal
     */
    isScrollable() {
        return this.workspace_.scrollbar
            ? this.workspace_.scrollbar.isVisible()
            : false;
    }
    /**
     * Copy a block from the flyout to the workspace and position it correctly.
     *
     * @param oldBlock The flyout block to copy.
     * @returns The new block in the main workspace.
     */
    placeNewBlock(oldBlock) {
        const targetWorkspace = this.targetWorkspace;
        const svgRootOld = oldBlock.getSvgRoot();
        if (!svgRootOld) {
            throw Error('oldBlock is not rendered');
        }
        // Clone the block.
        const json = this.serializeBlock(oldBlock);
        // Normally this resizes leading to weird jumps. Save it for terminateDrag.
        targetWorkspace.setResizesEnabled(false);
        const block = blocks.append(json, targetWorkspace);
        this.positionNewBlock(oldBlock, block);
        return block;
    }
    /**
     * Serialize a block to JSON.
     *
     * @param block The block to serialize.
     * @returns A serialized representation of the block.
     */
    serializeBlock(block) {
        return blocks.save(block);
    }
    /**
     * Positions a block on the target workspace.
     *
     * @param oldBlock The flyout block being copied.
     * @param block The block to posiiton.
     */
    positionNewBlock(oldBlock, block) {
        const targetWorkspace = this.targetWorkspace;
        // The offset in pixels between the main workspace's origin and the upper
        // left corner of the injection div.
        const mainOffsetPixels = targetWorkspace.getOriginOffsetInPixels();
        // The offset in pixels between the flyout workspace's origin and the upper
        // left corner of the injection div.
        const flyoutOffsetPixels = this.workspace_.getOriginOffsetInPixels();
        // The position of the old block in flyout workspace coordinates.
        const oldBlockPos = oldBlock.getRelativeToSurfaceXY();
        // The position of the old block in pixels relative to the flyout
        // workspace's origin.
        oldBlockPos.scale(this.workspace_.scale);
        // The position of the old block in pixels relative to the upper left corner
        // of the injection div.
        const oldBlockOffsetPixels = Coordinate.sum(flyoutOffsetPixels, oldBlockPos);
        // The position of the old block in pixels relative to the origin of the
        // main workspace.
        const finalOffset = Coordinate.difference(oldBlockOffsetPixels, mainOffsetPixels);
        // The position of the old block in main workspace coordinates.
        finalOffset.scale(1 / targetWorkspace.scale);
        // No 'reason' provided since events are disabled.
        block.moveTo(new Coordinate(finalOffset.x, finalOffset.y));
    }
    /**
     * Returns the inflater responsible for constructing items of the given type.
     *
     * @param type The type of flyout content item to provide an inflater for.
     * @returns An inflater object for the given type, or null if no inflater
     *     is registered for that type.
     */
    getInflaterForType(type) {
        if (this.inflaters.has(type)) {
            return this.inflaters.get(type) ?? null;
        }
        const InflaterClass = registry.getClass(registry.Type.FLYOUT_INFLATER, type);
        if (InflaterClass) {
            const inflater = new InflaterClass();
            this.inflaters.set(type, inflater);
            return inflater;
        }
        return null;
    }
    /**
     * See IFocusableNode.getFocusableElement.
     *
     * @deprecated v12: Use the Flyout's workspace for focus operations, instead.
     */
    getFocusableElement() {
        throw new Error('Flyouts are not directly focusable.');
    }
    /**
     * See IFocusableNode.getFocusableTree.
     *
     * @deprecated v12: Use the Flyout's workspace for focus operations, instead.
     */
    getFocusableTree() {
        throw new Error('Flyouts are not directly focusable.');
    }
    /** See IFocusableNode.onNodeFocus. */
    onNodeFocus() { }
    /** See IFocusableNode.onNodeBlur. */
    onNodeBlur() { }
    /** See IFocusableNode.canBeFocused. */
    canBeFocused() {
        return false;
    }
    /**
     * See IFocusableNode.getRootFocusableNode.
     *
     * @deprecated v12: Use the Flyout's workspace for focus operations, instead.
     */
    getRootFocusableNode() {
        throw new Error('Flyouts are not directly focusable.');
    }
    /**
     * See IFocusableNode.getRestoredFocusableNode.
     *
     * @deprecated v12: Use the Flyout's workspace for focus operations, instead.
     */
    getRestoredFocusableNode(_previousNode) {
        throw new Error('Flyouts are not directly focusable.');
    }
    /**
     * See IFocusableNode.getNestedTrees.
     *
     * @deprecated v12: Use the Flyout's workspace for focus operations, instead.
     */
    getNestedTrees() {
        throw new Error('Flyouts are not directly focusable.');
    }
    /**
     * See IFocusableNode.lookUpFocusableNode.
     *
     * @deprecated v12: Use the Flyout's workspace for focus operations, instead.
     */
    lookUpFocusableNode(_id) {
        throw new Error('Flyouts are not directly focusable.');
    }
    /** See IFocusableTree.onTreeFocus. */
    onTreeFocus(_node, _previousTree) { }
    /**
     * See IFocusableNode.onTreeBlur.
     *
     * @deprecated v12: Use the Flyout's workspace for focus operations, instead.
     */
    onTreeBlur(_nextTree) {
        throw new Error('Flyouts are not directly focusable.');
    }
}
//# sourceMappingURL=flyout_base.js.map