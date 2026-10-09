/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @returns True if the given object is an IRenderedElement.
 */
export function isRenderedElement(obj) {
    return obj && typeof obj.getSvgRoot === 'function';
}
//# sourceMappingURL=i_rendered_element.js.map