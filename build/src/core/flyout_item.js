/**
 * Representation of an item displayed in a flyout.
 */
export class FlyoutItem {
    /**
     * Creates a new FlyoutItem.
     *
     * @param element The element that will be displayed in the flyout.
     * @param type The type of element. Should correspond to the type of the
     *     flyout inflater that created this object.
     */
    constructor(element, type) {
        this.element = element;
        this.type = type;
    }
    /**
     * Returns the element displayed in the flyout.
     */
    getElement() {
        return this.element;
    }
    /**
     * Returns the type of flyout element this item represents.
     */
    getType() {
        return this.type;
    }
}
//# sourceMappingURL=flyout_item.js.map