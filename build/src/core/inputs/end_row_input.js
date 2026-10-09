/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Input } from './input.js';
import { inputTypes } from './input_types.js';
/**
 * Represents an input on a block that is always the last input in the row. Any
 * following input will be rendered on the next row even if the block has inline
 * inputs. Any newline character in a JSON block definition's message will
 * automatically be parsed as an end-row input.
 */
export class EndRowInput extends Input {
    /**
     * @param name Language-neutral identifier which may used to find this input
     *     again.
     * @param block The block containing this input.
     */
    constructor(name, block) {
        super(name, block);
        this.name = name;
        this.type = inputTypes.END_ROW;
    }
}
//# sourceMappingURL=end_row_input.js.map