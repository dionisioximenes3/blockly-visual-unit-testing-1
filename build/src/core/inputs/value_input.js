/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ConnectionType } from '../connection_type.js';
import { Input } from './input.js';
import { inputTypes } from './input_types.js';
/** Represents an input on a block with a value connection. */
export class ValueInput extends Input {
    /**
     * @param name Language-neutral identifier which may used to find this input
     *     again.
     * @param block The block containing this input.
     */
    constructor(name, block) {
        // Errors are maintained for people not using typescript.
        if (!name)
            throw new Error('Value inputs must have a non-empty name');
        super(name, block);
        this.name = name;
        this.type = inputTypes.VALUE;
        this.connection = this.makeConnection(ConnectionType.INPUT_VALUE);
    }
}
//# sourceMappingURL=value_input.js.map