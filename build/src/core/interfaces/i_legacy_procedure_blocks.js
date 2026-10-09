/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/** @internal */
export function isLegacyProcedureDefBlock(obj) {
    return obj && typeof obj.getProcedureDef === 'function';
}
/** @internal */
export function isLegacyProcedureCallBlock(obj) {
    return (obj &&
        typeof obj.getProcedureCall === 'function' &&
        typeof obj.renameProcedure === 'function');
}
//# sourceMappingURL=i_legacy_procedure_blocks.js.map