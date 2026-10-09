/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Class for the registry of context menu items. This is intended to be a
 * singleton. You should not create a new instance, and only access this class
 * from ContextMenuRegistry.registry.
 */
export class ContextMenuRegistry {
    /** Resets the existing singleton instance of ContextMenuRegistry. */
    constructor() {
        /** Registry of all registered RegistryItems, keyed by ID. */
        this.registeredItems = new Map();
        this.reset();
    }
    /** Clear and recreate the registry. */
    reset() {
        this.registeredItems.clear();
    }
    /**
     * Registers a RegistryItem.
     *
     * @param item Context menu item to register.
     * @throws {Error} if an item with the given ID already exists.
     */
    register(item) {
        if (this.registeredItems.has(item.id)) {
            throw Error('Menu item with ID "' + item.id + '" is already registered.');
        }
        this.registeredItems.set(item.id, item);
    }
    /**
     * Unregisters a RegistryItem with the given ID.
     *
     * @param id The ID of the RegistryItem to remove.
     * @throws {Error} if an item with the given ID does not exist.
     */
    unregister(id) {
        if (!this.registeredItems.has(id)) {
            throw new Error('Menu item with ID "' + id + '" not found.');
        }
        this.registeredItems.delete(id);
    }
    /**
     * @param id The ID of the RegistryItem to get.
     * @returns RegistryItem or null if not found
     */
    getItem(id) {
        return this.registeredItems.get(id) ?? null;
    }
    /**
     * Gets the valid context menu options for the given scope.
     * Options are only included if the preconditionFn shows
     * they should not be hidden.
     *
     * @param scope Current scope of context menu (i.e., the exact workspace or
     *     block being clicked on).
     * @param menuOpenEvent Event that caused the menu to open.
     * @returns the list of ContextMenuOptions
     */
    getContextMenuOptions(scope, menuOpenEvent) {
        const menuOptions = [];
        for (const item of this.registeredItems.values()) {
            if (item.scopeType) {
                // If the scopeType is present, check to make sure
                // that the option is compatible with the current scope
                if (item.scopeType === ScopeType.BLOCK && !scope.block)
                    continue;
                if (item.scopeType === ScopeType.COMMENT && !scope.comment)
                    continue;
                if (item.scopeType === ScopeType.WORKSPACE && !scope.workspace)
                    continue;
            }
            let menuOption;
            menuOption = {
                scope,
                weight: item.weight,
            };
            if (item.separator) {
                menuOption = {
                    ...menuOption,
                    separator: true,
                };
            }
            else {
                const precondition = item.preconditionFn(scope, menuOpenEvent);
                if (precondition === 'hidden')
                    continue;
                const displayText = typeof item.displayText === 'function'
                    ? item.displayText(scope)
                    : item.displayText;
                menuOption = {
                    ...menuOption,
                    text: displayText,
                    callback: item.callback,
                    enabled: precondition === 'enabled',
                };
            }
            menuOptions.push(menuOption);
        }
        menuOptions.sort(function (a, b) {
            return a.weight - b.weight;
        });
        return menuOptions;
    }
}
(function (ContextMenuRegistry) {
    /**
     * Where this menu item should be rendered. If the menu item should be
     * rendered in multiple scopes, e.g. on both a block and a workspace, it
     * should be registered for each scope.
     */
    let ScopeType;
    (function (ScopeType) {
        ScopeType["BLOCK"] = "block";
        ScopeType["WORKSPACE"] = "workspace";
        ScopeType["COMMENT"] = "comment";
    })(ScopeType = ContextMenuRegistry.ScopeType || (ContextMenuRegistry.ScopeType = {}));
    /**
     * Singleton instance of this class. All interactions with this class should
     * be done on this object.
     */
    ContextMenuRegistry.registry = new ContextMenuRegistry();
})(ContextMenuRegistry || (ContextMenuRegistry = {}));
export const ScopeType = ContextMenuRegistry.ScopeType;
//# sourceMappingURL=contextmenu_registry.js.map