/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * A separator used for separating toolbox categories.
 *
 * @class
 */
// Former goog.module ID: Blockly.ToolboxSeparator
import * as Css from '../css.js';
import * as registry from '../registry.js';
import * as dom from '../utils/dom.js';
import { ToolboxItem } from './toolbox_item.js';
/**
 * Class for a toolbox separator. This is the thin visual line that appears on
 * the toolbox. This item is not interactable.
 */
export class ToolboxSeparator extends ToolboxItem {
    /**
     * @param separatorDef The information needed to create a separator.
     * @param toolbox The parent toolbox for the separator.
     */
    constructor(separatorDef, toolbox) {
        super(separatorDef, toolbox);
        /** All the CSS class names that are used to create a separator. */
        this.cssConfig_ = { 'container': 'blocklyTreeSeparator' };
        this.htmlDiv = null;
        const cssConfig = separatorDef['cssconfig'] || separatorDef['cssConfig'];
        Object.assign(this.cssConfig_, cssConfig);
    }
    init() {
        this.createDom_();
    }
    /**
     * Creates the DOM for a separator.
     *
     * @returns The parent element for the separator.
     */
    createDom_() {
        const container = document.createElement('div');
        // Ensure that the separator has a tab index to ensure it receives focus
        // when clicked (since clicking isn't managed by the toolbox).
        container.tabIndex = -1;
        container.id = this.getId();
        const className = this.cssConfig_['container'];
        if (className) {
            dom.addClass(container, className);
        }
        this.htmlDiv = container;
        return container;
    }
    getDiv() {
        return this.htmlDiv;
    }
    dispose() {
        dom.removeNode(this.htmlDiv);
    }
}
/** Name used for registering a toolbox separator. */
ToolboxSeparator.registrationName = 'sep';
/** CSS for Toolbox.  See css.js for use. */
Css.register(`
.blocklyTreeSeparator {
  border-bottom: solid #e5e5e5 1px;
  height: 0;
  margin: 5px 0;
}

.blocklyToolbox[layout="h"] .blocklyTreeSeparator {
  border-right: solid #e5e5e5 1px;
  border-bottom: none;
  height: auto;
  margin: 0 5px 0 5px;
  padding: 5px 0;
  width: 0;
}
`);
registry.register(registry.Type.TOOLBOX_ITEM, ToolboxSeparator.registrationName, ToolboxSeparator);
//# sourceMappingURL=separator.js.map