/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Image field.  Used for pictures, icons, etc.
 *
 * @class
 */
// Former goog.module ID: Blockly.FieldImage
import { Field } from './field.js';
import * as fieldRegistry from './field_registry.js';
import * as dom from './utils/dom.js';
import * as parsing from './utils/parsing.js';
import { Size } from './utils/size.js';
import { Svg } from './utils/svg.js';
/**
 * Class for an image on a block.
 */
export class FieldImage extends Field {
    /**
     * @param src The URL of the image.
     *     Also accepts Field.SKIP_SETUP if you wish to skip setup (only used by
     * subclasses that want to handle configuration and setting the field value
     * after their own constructors have run).
     * @param width Width of the image.
     * @param height Height of the image.
     * @param alt Optional alt text for when block is collapsed.
     * @param onClick Optional function to be called when the image is
     *     clicked. If onClick is defined, alt must also be defined.
     * @param flipRtl Whether to flip the icon in RTL.
     * @param config A map of options used to configure the field.
     *     See the [field creation documentation]{@link
     * https://developers.google.com/blockly/guides/create-custom-blocks/fields/built-in-fields/image#creation}
     * for a list of properties this parameter supports.
     */
    constructor(src, width, height, alt, onClick, flipRtl, config) {
        super(Field.SKIP_SETUP);
        /** The function to be called when this field is clicked. */
        this.clickHandler = null;
        /** The rendered field's image element. */
        this.imageElement = null;
        /**
         * Editable fields usually show some sort of UI indicating they are
         * editable. This field should not.
         */
        this.EDITABLE = false;
        /**
         * Used to tell if the field needs to be rendered the next time the block is
         * rendered. Image fields are statically sized, and only need to be
         * rendered at initialization.
         */
        this.isDirty_ = false;
        /** Whether to flip this image in RTL. */
        this.flipRtl = false;
        /** Alt text of this image. */
        this.altText = '';
        const imageHeight = Number(parsing.replaceMessageReferences(height));
        const imageWidth = Number(parsing.replaceMessageReferences(width));
        if (isNaN(imageHeight) || isNaN(imageWidth)) {
            throw Error('Height and width values of an image field must cast to' + ' numbers.');
        }
        if (imageHeight <= 0 || imageWidth <= 0) {
            throw Error('Height and width values of an image field must be greater' +
                ' than 0.');
        }
        /** The size of the area rendered by the field. */
        this.size_ = new Size(imageWidth, imageHeight + FieldImage.Y_PADDING);
        /**
         * Store the image height, since it is different from the field height.
         */
        this.imageHeight = imageHeight;
        if (typeof onClick === 'function') {
            this.clickHandler = onClick;
        }
        if (src === Field.SKIP_SETUP)
            return;
        if (config) {
            this.configure_(config);
        }
        else {
            this.flipRtl = !!flipRtl;
            this.altText = parsing.replaceMessageReferences(alt) || '';
        }
        this.setValue(parsing.replaceMessageReferences(src));
    }
    /**
     * Configure the field based on the given map of options.
     *
     * @param config A map of options to configure the field based on.
     */
    configure_(config) {
        super.configure_(config);
        if (config.flipRtl)
            this.flipRtl = config.flipRtl;
        if (config.alt) {
            this.altText = parsing.replaceMessageReferences(config.alt);
        }
    }
    /**
     * Create the block UI for this image.
     */
    initView() {
        this.imageElement = dom.createSvgElement(Svg.IMAGE, {
            'height': this.imageHeight + 'px',
            'width': this.size_.width + 'px',
            'alt': this.altText,
        }, this.fieldGroup_);
        this.imageElement.setAttributeNS(dom.XLINK_NS, 'xlink:href', this.value_);
        if (this.fieldGroup_) {
            dom.addClass(this.fieldGroup_, 'blocklyImageField');
        }
        if (this.clickHandler) {
            this.imageElement.style.cursor = 'pointer';
        }
    }
    updateSize_() { }
    // NOP
    /**
     * Ensure that the input value (the source URL) is a string.
     *
     * @param newValue The input value.
     * @returns A string, or null if invalid.
     */
    doClassValidation_(newValue) {
        if (typeof newValue !== 'string') {
            return null;
        }
        return newValue;
    }
    /**
     * Update the value of this image field, and update the displayed image.
     *
     * @param newValue The value to be saved. The default validator guarantees
     *     that this is a string.
     */
    doValueUpdate_(newValue) {
        this.value_ = newValue;
        if (this.imageElement) {
            this.imageElement.setAttributeNS(dom.XLINK_NS, 'xlink:href', this.value_);
        }
    }
    /**
     * Get whether to flip this image in RTL
     *
     * @returns True if we should flip in RTL.
     */
    getFlipRtl() {
        return this.flipRtl;
    }
    /**
     * Set the alt text of this image.
     *
     * @param alt New alt text.
     */
    setAlt(alt) {
        if (alt === this.altText) {
            return;
        }
        this.altText = alt || '';
        if (this.imageElement) {
            this.imageElement.setAttribute('alt', this.altText);
        }
    }
    /**
     * Check whether this field should be clickable.
     *
     * @returns Whether this field is clickable.
     */
    isClickable() {
        // Images are only clickable if they have a click handler and fulfill the
        // contract to be clickable: enabled and attached to an editable block.
        return super.isClickable() && !!this.clickHandler;
    }
    /**
     * If field click is called, and click handler defined,
     * call the handler.
     */
    showEditor_() {
        if (this.clickHandler) {
            this.clickHandler(this);
        }
    }
    /**
     * Set the function that is called when this image  is clicked.
     *
     * @param func The function that is called when the image is clicked, or null
     *     to remove.
     */
    setOnClickHandler(func) {
        this.clickHandler = func;
    }
    /**
     * Use the `getText_` developer hook to override the field's text
     * representation.
     * Return the image alt text instead.
     *
     * @returns The image alt text.
     */
    getText_() {
        return this.altText;
    }
    /**
     * Construct a FieldImage from a JSON arg object,
     * dereferencing any string table references.
     *
     * @param options A JSON object with options (src, width, height, alt, and
     *     flipRtl).
     * @returns The new field instance.
     * @nocollapse
     * @internal
     */
    static fromJson(options) {
        if (!options.src || !options.width || !options.height) {
            throw new Error('src, width, and height values for an image field are' +
                'required. The width and height must be non-zero.');
        }
        // `this` might be a subclass of FieldImage if that class doesn't override
        // the static fromJson method.
        return new this(options.src, options.width, options.height, undefined, undefined, undefined, options);
    }
}
/**
 * Vertical padding below the image, which is included in the reported height
 * of the field.
 */
FieldImage.Y_PADDING = 1;
fieldRegistry.register('field_image', FieldImage);
FieldImage.prototype.DEFAULT_VALUE = '';
//# sourceMappingURL=field_image.js.map