/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as registry from '../registry.js';
/**
 * Registers the given paster so that it cna be used for pasting.
 *
 * @param type The type of the paster to register, e.g. 'block', 'comment', etc.
 * @param paster The paster to register.
 */
export function register(type, paster) {
    registry.register(registry.Type.PASTER, type, paster);
}
/**
 * Unregisters the paster associated with the given type.
 *
 * @param type The type of the paster to unregister.
 */
export function unregister(type) {
    registry.unregister(registry.Type.PASTER, type);
}
//# sourceMappingURL=registry.js.map