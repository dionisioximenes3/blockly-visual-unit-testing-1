/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Enum for the type of a connection or input.
 */
export var inputTypes;
(function (inputTypes) {
    // A right-facing value input.  E.g. 'set item to' or 'return'.
    inputTypes[inputTypes["VALUE"] = 1] = "VALUE";
    // A down-facing block stack.  E.g. 'if-do' or 'else'.
    inputTypes[inputTypes["STATEMENT"] = 3] = "STATEMENT";
    // A dummy input.  Used to add field(s) with no input.
    inputTypes[inputTypes["DUMMY"] = 5] = "DUMMY";
    // An unknown type of input defined by an external developer.
    inputTypes[inputTypes["CUSTOM"] = 6] = "CUSTOM";
    // An input with no connections that is always the last input of a row. Any
    // subsequent input will be rendered on the next row. Any newline character in
    // a JSON block definition's message will be parsed as an end-row input.
    inputTypes[inputTypes["END_ROW"] = 7] = "END_ROW";
})(inputTypes || (inputTypes = {}));
//# sourceMappingURL=input_types.js.map