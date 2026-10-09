/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/** A type guard which checks if the given block is a procedure block. */
export function isProcedureBlock(block) {
    block = block;
    return (typeof block.getProcedureModel === 'function' &&
        typeof block.doProcedureUpdate === 'function' &&
        typeof block.isProcedureDef === 'function');
}
//# sourceMappingURL=i_procedure_block.js.map