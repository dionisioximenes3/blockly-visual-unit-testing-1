/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Input } from './input.js';
import { inputTypes } from './input_types.js';
/** Represents an input on a block with no connection. */
export class DummyInput extends Input {
    /**
     * @param name Language-neutral identifier which may used to find this input
     *     again.
     * @param block The block containing this input.
     */
    constructor(name, block) {
        super(name, block);
        this.name = name;
        this.type = inputTypes.DUMMY;
    }
}
//# sourceMappingURL=dummy_input.js.map