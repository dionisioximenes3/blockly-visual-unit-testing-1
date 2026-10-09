/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CodeGenerator } from '../../core/generator.js';
import { inputTypes } from '../../core/inputs/input_types.js';
import { Names, NameType } from '../../core/names.js';
import * as stringUtils from '../../core/utils/string.js';
import * as Variables from '../../core/variables.js';
/**
 * Order of operation ENUMs.
 * https://developer.mozilla.org/en/JavaScript/Reference/Operators/Operator_Precedence
 */
// prettier-ignore
export var Order;
(function (Order) {
    Order[Order["ATOMIC"] = 0] = "ATOMIC";
    Order[Order["NEW"] = 1.1] = "NEW";
    Order[Order["MEMBER"] = 1.2] = "MEMBER";
    Order[Order["FUNCTION_CALL"] = 2] = "FUNCTION_CALL";
    Order[Order["INCREMENT"] = 3] = "INCREMENT";
    Order[Order["DECREMENT"] = 3] = "DECREMENT";
    Order[Order["BITWISE_NOT"] = 4.1] = "BITWISE_NOT";
    Order[Order["UNARY_PLUS"] = 4.2] = "UNARY_PLUS";
    Order[Order["UNARY_NEGATION"] = 4.3] = "UNARY_NEGATION";
    Order[Order["LOGICAL_NOT"] = 4.4] = "LOGICAL_NOT";
    Order[Order["TYPEOF"] = 4.5] = "TYPEOF";
    Order[Order["VOID"] = 4.6] = "VOID";
    Order[Order["DELETE"] = 4.7] = "DELETE";
    Order[Order["AWAIT"] = 4.8] = "AWAIT";
    Order[Order["EXPONENTIATION"] = 5] = "EXPONENTIATION";
    Order[Order["MULTIPLICATION"] = 5.1] = "MULTIPLICATION";
    Order[Order["DIVISION"] = 5.2] = "DIVISION";
    Order[Order["MODULUS"] = 5.3] = "MODULUS";
    Order[Order["SUBTRACTION"] = 6.1] = "SUBTRACTION";
    Order[Order["ADDITION"] = 6.2] = "ADDITION";
    Order[Order["BITWISE_SHIFT"] = 7] = "BITWISE_SHIFT";
    Order[Order["RELATIONAL"] = 8] = "RELATIONAL";
    Order[Order["IN"] = 8] = "IN";
    Order[Order["INSTANCEOF"] = 8] = "INSTANCEOF";
    Order[Order["EQUALITY"] = 9] = "EQUALITY";
    Order[Order["BITWISE_AND"] = 10] = "BITWISE_AND";
    Order[Order["BITWISE_XOR"] = 11] = "BITWISE_XOR";
    Order[Order["BITWISE_OR"] = 12] = "BITWISE_OR";
    Order[Order["LOGICAL_AND"] = 13] = "LOGICAL_AND";
    Order[Order["LOGICAL_OR"] = 14] = "LOGICAL_OR";
    Order[Order["CONDITIONAL"] = 15] = "CONDITIONAL";
    Order[Order["ASSIGNMENT"] = 16] = "ASSIGNMENT";
    Order[Order["YIELD"] = 17] = "YIELD";
    Order[Order["COMMA"] = 18] = "COMMA";
    Order[Order["NONE"] = 99] = "NONE";
})(Order || (Order = {}));
/**
 * JavaScript code generator class.
 */
export class JavascriptGenerator extends CodeGenerator {
    /** @param name Name of the language the generator is for. */
    constructor(name = 'JavaScript') {
        super(name);
        /** List of outer-inner pairings that do NOT require parentheses. */
        this.ORDER_OVERRIDES = [
            // (foo()).bar -> foo().bar
            // (foo())[0] -> foo()[0]
            [Order.FUNCTION_CALL, Order.MEMBER],
            // (foo())() -> foo()()
            [Order.FUNCTION_CALL, Order.FUNCTION_CALL],
            // (foo.bar).baz -> foo.bar.baz
            // (foo.bar)[0] -> foo.bar[0]
            // (foo[0]).bar -> foo[0].bar
            // (foo[0])[1] -> foo[0][1]
            [Order.MEMBER, Order.MEMBER],
            // (foo.bar)() -> foo.bar()
            // (foo[0])() -> foo[0]()
            [Order.MEMBER, Order.FUNCTION_CALL],
            // !(!foo) -> !!foo
            [Order.LOGICAL_NOT, Order.LOGICAL_NOT],
            // a * (b * c) -> a * b * c
            [Order.MULTIPLICATION, Order.MULTIPLICATION],
            // a + (b + c) -> a + b + c
            [Order.ADDITION, Order.ADDITION],
            // a && (b && c) -> a && b && c
            [Order.LOGICAL_AND, Order.LOGICAL_AND],
            // a || (b || c) -> a || b || c
            [Order.LOGICAL_OR, Order.LOGICAL_OR],
        ];
        this.isInitialized = false;
        // Copy Order values onto instance for backwards compatibility
        // while ensuring they are not part of the publically-advertised
        // API.
        //
        // TODO(#7085): deprecate these in due course.  (Could initially
        // replace data properties with get accessors that call
        // deprecate.warn().)
        for (const key in Order) {
            // Must assign Order[key] to a temporary to get the type guard to work;
            // see https://github.com/microsoft/TypeScript/issues/10530.
            const value = Order[key];
            // Skip reverse-lookup entries in the enum.  Due to
            // https://github.com/microsoft/TypeScript/issues/55713 this (as
            // of TypeScript 5.5.2) actually narrows the type of value to
            // never - but that still allows the following assignment to
            // succeed.
            if (typeof value === 'string')
                continue;
            this['ORDER_' + key] = value;
        }
        // List of illegal variable names.  This is not intended to be a
        // security feature.  Blockly is 100% client-side, so bypassing
        // this list is trivial.  This is intended to prevent users from
        // accidentally clobbering a built-in object or function.
        //
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#Keywords
        this.addReservedWords('break,case,catch,class,const,continue,debugger,default,delete,do,' +
            'else,export,extends,finally,for,function,if,import,in,instanceof,' +
            'new,return,super,switch,this,throw,try,typeof,var,void,' +
            'while,with,yield,' +
            'enum,' +
            'implements,interface,let,package,private,protected,public,static,' +
            'await,' +
            'null,true,false,' +
            // Magic variable.
            'arguments,' +
            // Everything in the current environment (835 items in Chrome,
            // 104 in Node).
            Object.getOwnPropertyNames(globalThis).join(','));
    }
    /**
     * Initialise the database of variable names.
     *
     * @param workspace Workspace to generate code from.
     */
    init(workspace) {
        super.init(workspace);
        if (!this.nameDB_) {
            this.nameDB_ = new Names(this.RESERVED_WORDS_);
        }
        else {
            this.nameDB_.reset();
        }
        this.nameDB_.setVariableMap(workspace.getVariableMap());
        this.nameDB_.populateVariables(workspace);
        this.nameDB_.populateProcedures(workspace);
        const defvars = [];
        // Add developer variables (not created or named by the user).
        const devVarList = Variables.allDeveloperVariables(workspace);
        for (let i = 0; i < devVarList.length; i++) {
            defvars.push(this.nameDB_.getName(devVarList[i], NameType.DEVELOPER_VARIABLE));
        }
        // Add user variables, but only ones that are being used.
        const variables = Variables.allUsedVarModels(workspace);
        for (let i = 0; i < variables.length; i++) {
            defvars.push(this.nameDB_.getName(variables[i].getId(), NameType.VARIABLE));
        }
        // Declare all of the variables.
        if (defvars.length) {
            this.definitions_['variables'] = 'var ' + defvars.join(', ') + ';';
        }
        this.isInitialized = true;
    }
    /**
     * Prepend the generated code with the variable definitions.
     *
     * @param code Generated code.
     * @returns Completed code.
     */
    finish(code) {
        // Convert the definitions dictionary into a list.
        const definitions = Object.values(this.definitions_);
        // Call Blockly.CodeGenerator's finish.
        super.finish(code);
        this.isInitialized = false;
        this.nameDB_.reset();
        return definitions.join('\n\n') + '\n\n\n' + code;
    }
    /**
     * Naked values are top-level blocks with outputs that aren't plugged into
     * anything.  A trailing semicolon is needed to make this legal.
     *
     * @param line Line of generated code.
     * @returns Legal line of code.
     */
    scrubNakedValue(line) {
        return line + ';\n';
    }
    /**
     * Encode a string as a properly escaped JavaScript string, complete with
     * quotes.
     *
     * @param string Text to encode.
     * @returns JavaScript string.
     */
    quote_(string) {
        // Can't use goog.string.quote since Google's style guide recommends
        // JS string literals use single quotes.
        string = string
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\\n')
            .replace(/'/g, "\\'");
        return "'" + string + "'";
    }
    /**
     * Encode a string as a properly escaped multiline JavaScript string, complete
     * with quotes.
     * @param string Text to encode.
     * @returns JavaScript string.
     */
    multiline_quote_(string) {
        // Can't use goog.string.quote since Google's style guide recommends
        // JS string literals use single quotes.
        const lines = string.split(/\n/g).map(this.quote_);
        return lines.join(" + '\\n' +\n");
    }
    /**
     * Common tasks for generating JavaScript from blocks.
     * Handles comments for the specified block and any connected value blocks.
     * Calls any statements following this block.
     *
     * @param block The current block.
     * @param code The JavaScript code created for this block.
     * @param thisOnly True to generate code for only this statement.
     * @returns JavaScript code with comments and subsequent blocks added.
     */
    scrub_(block, code, thisOnly = false) {
        let commentCode = '';
        // Only collect comments for blocks that aren't inline.
        if (!block.outputConnection || !block.outputConnection.targetConnection) {
            // Collect comment for this block.
            let comment = block.getCommentText();
            if (comment) {
                comment = stringUtils.wrap(comment, this.COMMENT_WRAP - 3);
                commentCode += this.prefixLines(comment + '\n', '// ');
            }
            // Collect comments for all value arguments.
            // Don't collect comments for nested statements.
            for (let i = 0; i < block.inputList.length; i++) {
                if (block.inputList[i].type === inputTypes.VALUE) {
                    const childBlock = block.inputList[i].connection.targetBlock();
                    if (childBlock) {
                        comment = this.allNestedComments(childBlock);
                        if (comment) {
                            commentCode += this.prefixLines(comment, '// ');
                        }
                    }
                }
            }
        }
        const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
        const nextCode = thisOnly ? '' : this.blockToCode(nextBlock);
        return commentCode + code + nextCode;
    }
    /**
     * Generate code representing the specified value input, adjusted to take into
     * account indexing (zero- or one-based) and optionally by a specified delta
     * and/or by negation.
     *
     * @param block The block.
     * @param atId The ID of the input block to get (and adjust) the value of.
     * @param delta Value to add.
     * @param negate Whether to negate the value.
     * @param order The highest order acting on this value.
     * @returns The adjusted value or code that evaluates to it.
     */
    getAdjusted(block, atId, delta = 0, negate = false, order = Order.NONE) {
        if (block.workspace.options.oneBasedIndex) {
            delta--;
        }
        const defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
        let orderForInput = order;
        if (delta > 0) {
            orderForInput = Order.ADDITION;
        }
        else if (delta < 0) {
            orderForInput = Order.SUBTRACTION;
        }
        else if (negate) {
            orderForInput = Order.UNARY_NEGATION;
        }
        let at = this.valueToCode(block, atId, orderForInput) || defaultAtIndex;
        // Easy case: no adjustments.
        if (delta === 0 && !negate) {
            return at;
        }
        // If the index is a naked number, adjust it right now.
        if (stringUtils.isNumber(at)) {
            at = String(Number(at) + delta);
            if (negate) {
                at = String(-Number(at));
            }
            return at;
        }
        // If the index is dynamic, adjust it in code.
        if (delta > 0) {
            at = `${at} + ${delta}`;
        }
        else if (delta < 0) {
            at = `${at} - ${-delta}`;
        }
        if (negate) {
            at = delta ? `-(${at})` : `-${at}`;
        }
        if (Math.floor(order) >= Math.floor(orderForInput)) {
            at = `(${at})`;
        }
        return at;
    }
}
//# sourceMappingURL=javascript_generator.js.map