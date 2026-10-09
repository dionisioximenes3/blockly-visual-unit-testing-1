/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { FlyoutButton } from './flyout_button.js';
import { FlyoutItem } from './flyout_item.js';
import * as registry from './registry.js';
const BUTTON_TYPE = 'button';
/**
 * Class responsible for creating buttons for flyouts.
 */
export class ButtonFlyoutInflater {
    /**
     * Inflates a flyout button from the given state and adds it to the flyout.
     *
     * @param state A JSON representation of a flyout button.
     * @param flyout The flyout to create the button on.
     * @returns A newly created FlyoutButton.
     */
    load(state, flyout) {
        const button = new FlyoutButton(flyout.getWorkspace(), flyout.targetWorkspace, state, false);
        button.show();
        return new FlyoutItem(button, BUTTON_TYPE);
    }
    /**
     * Returns the amount of space that should follow this button.
     *
     * @param state A JSON representation of a flyout button.
     * @param defaultGap The default spacing for flyout items.
     * @returns The amount of space that should follow this button.
     */
    gapForItem(state, defaultGap) {
        return defaultGap;
    }
    /**
     * Disposes of the given button.
     *
     * @param item The flyout button to dispose of.
     */
    disposeItem(item) {
        const element = item.getElement();
        if (element instanceof FlyoutButton) {
            element.dispose();
        }
    }
    /**
     * Returns the type of items this inflater is responsible for creating.
     *
     * @returns An identifier for the type of items this inflater creates.
     */
    getType() {
        return BUTTON_TYPE;
    }
}
registry.register(registry.Type.FLYOUT_INFLATER, BUTTON_TYPE, ButtonFlyoutInflater);
//# sourceMappingURL=button_flyout_inflater.js.map