/**
 * @license
 * Copyright 2015 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CodeGenerator } from '../../core/generator.js';
import { inputTypes } from '../../core/inputs/input_types.js';
import { Names } from '../../core/names.js';
import * as stringUtils from '../../core/utils/string.js';
/**
 * Order of operation ENUMs.
 * http://php.net/manual/en/language.operators.precedence.php
 */
// prettier-ignore
export var Order;
(function (Order) {
    Order[Order["ATOMIC"] = 0] = "ATOMIC";
    Order[Order["CLONE"] = 1] = "CLONE";
    Order[Order["NEW"] = 1] = "NEW";
    Order[Order["MEMBER"] = 2.1] = "MEMBER";
    Order[Order["FUNCTION_CALL"] = 2.2] = "FUNCTION_CALL";
    Order[Order["POWER"] = 3] = "POWER";
    Order[Order["INCREMENT"] = 4] = "INCREMENT";
    Order[Order["DECREMENT"] = 4] = "DECREMENT";
    Order[Order["BITWISE_NOT"] = 4] = "BITWISE_NOT";
    Order[Order["CAST"] = 4] = "CAST";
    Order[Order["SUPPRESS_ERROR"] = 4] = "SUPPRESS_ERROR";
    Order[Order["INSTANCEOF"] = 5] = "INSTANCEOF";
    Order[Order["LOGICAL_NOT"] = 6] = "LOGICAL_NOT";
    Order[Order["UNARY_PLUS"] = 7.1] = "UNARY_PLUS";
    Order[Order["UNARY_NEGATION"] = 7.2] = "UNARY_NEGATION";
    Order[Order["MULTIPLICATION"] = 8.1] = "MULTIPLICATION";
    Order[Order["DIVISION"] = 8.2] = "DIVISION";
    Order[Order["MODULUS"] = 8.3] = "MODULUS";
    Order[Order["ADDITION"] = 9.1] = "ADDITION";
    Order[Order["SUBTRACTION"] = 9.2] = "SUBTRACTION";
    Order[Order["STRING_CONCAT"] = 9.3] = "STRING_CONCAT";
    Order[Order["BITWISE_SHIFT"] = 10] = "BITWISE_SHIFT";
    Order[Order["RELATIONAL"] = 11] = "RELATIONAL";
    Order[Order["EQUALITY"] = 12] = "EQUALITY";
    Order[Order["REFERENCE"] = 13] = "REFERENCE";
    Order[Order["BITWISE_AND"] = 13] = "BITWISE_AND";
    Order[Order["BITWISE_XOR"] = 14] = "BITWISE_XOR";
    Order[Order["BITWISE_OR"] = 15] = "BITWISE_OR";
    Order[Order["LOGICAL_AND"] = 16] = "LOGICAL_AND";
    Order[Order["LOGICAL_OR"] = 17] = "LOGICAL_OR";
    Order[Order["IF_NULL"] = 18] = "IF_NULL";
    Order[Order["CONDITIONAL"] = 19] = "CONDITIONAL";
    Order[Order["ASSIGNMENT"] = 20] = "ASSIGNMENT";
    Order[Order["LOGICAL_AND_WEAK"] = 21] = "LOGICAL_AND_WEAK";
    Order[Order["LOGICAL_XOR"] = 22] = "LOGICAL_XOR";
    Order[Order["LOGICAL_OR_WEAK"] = 23] = "LOGICAL_OR_WEAK";
    Order[Order["NONE"] = 99] = "NONE";
})(Order || (Order = {}));
export class PhpGenerator extends CodeGenerator {
    /** @param name Name of the language the generator is for. */
    constructor(name = 'PHP') {
        super(name);
        /** List of outer-inner pairings that do NOT require parentheses. */
        this.ORDER_OVERRIDES = [
            // (foo()).bar() -> foo().bar()
            // (foo())[0] -> foo()[0]
            [Order.MEMBER, Order.FUNCTION_CALL],
            // (foo[0])[1] -> foo[0][1]
            // (foo.bar).baz -> foo.bar.baz
            [Order.MEMBER, Order.MEMBER],
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
        this.addReservedWords(
        // http://php.net/manual/en/reserved.keywords.php
        '__halt_compiler,abstract,and,array,as,break,callable,case,catch,class,' +
            'clone,const,continue,declare,default,die,do,echo,else,elseif,empty,' +
            'enddeclare,endfor,endforeach,endif,endswitch,endwhile,eval,exit,' +
            'extends,final,for,foreach,function,global,goto,if,implements,include,' +
            'include_once,instanceof,insteadof,interface,isset,list,namespace,new,' +
            'or,print,private,protected,public,require,require_once,return,static,' +
            'switch,throw,trait,try,unset,use,var,while,xor,' +
            // http://php.net/manual/en/reserved.constants.php
            'PHP_VERSION,PHP_MAJOR_VERSION,PHP_MINOR_VERSION,PHP_RELEASE_VERSION,' +
            'PHP_VERSION_ID,PHP_EXTRA_VERSION,PHP_ZTS,PHP_DEBUG,PHP_MAXPATHLEN,' +
            'PHP_OS,PHP_SAPI,PHP_EOL,PHP_INT_MAX,PHP_INT_SIZE,DEFAULT_INCLUDE_PATH,' +
            'PEAR_INSTALL_DIR,PEAR_EXTENSION_DIR,PHP_EXTENSION_DIR,PHP_PREFIX,' +
            'PHP_BINDIR,PHP_BINARY,PHP_MANDIR,PHP_LIBDIR,PHP_DATADIR,' +
            'PHP_SYSCONFDIR,PHP_LOCALSTATEDIR,PHP_CONFIG_FILE_PATH,' +
            'PHP_CONFIG_FILE_SCAN_DIR,PHP_SHLIB_SUFFIX,E_ERROR,E_WARNING,E_PARSE,' +
            'E_NOTICE,E_CORE_ERROR,E_CORE_WARNING,E_COMPILE_ERROR,' +
            'E_COMPILE_WARNING,E_USER_ERROR,E_USER_WARNING,E_USER_NOTICE,' +
            'E_DEPRECATED,E_USER_DEPRECATED,E_ALL,E_STRICT,' +
            '__COMPILER_HALT_OFFSET__,TRUE,FALSE,NULL,__CLASS__,__DIR__,__FILE__,' +
            '__FUNCTION__,__LINE__,__METHOD__,__NAMESPACE__,__TRAIT__');
    }
    /**
     * Initialise the database of variable names.
     *
     * @param workspace Workspace to generate code from.
     */
    init(workspace) {
        super.init(workspace);
        if (!this.nameDB_) {
            this.nameDB_ = new Names(this.RESERVED_WORDS_, '$');
        }
        else {
            this.nameDB_.reset();
        }
        this.nameDB_.setVariableMap(workspace.getVariableMap());
        this.nameDB_.populateVariables(workspace);
        this.nameDB_.populateProcedures(workspace);
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
        code = super.finish(code);
        this.isInitialized = false;
        this.nameDB_.reset();
        return definitions.join('\n\n') + '\n\n\n' + code;
    }
    /**
     * Naked values are top-level blocks with outputs that aren't plugged into
     * anything.
     *
     * @param line Line of generated code.
     * @returns Legal line of code.
     */
    scrubNakedValue(line) {
        return line + ';\n';
    }
    /**
     * Encode a string as a properly escaped PHP string, complete with
     * quotes.
     *
     * @param string Text to encode.
     * @returns PHP string.
     */
    quote_(string) {
        string = string
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\\n')
            .replace(/'/g, "\\'");
        return "'" + string + "'";
    }
    /**
     * Encode a string as a properly escaped multiline PHP string, complete with
     * quotes.
     * @param string Text to encode.
     * @returns PHP string.
     */
    multiline_quote_(string) {
        const lines = string.split(/\n/g).map(this.quote_);
        // Join with the following, plus a newline:
        // . "\n" .
        // Newline escaping only works in double-quoted strings.
        return lines.join(' . "\\n" .\n');
    }
    /**
     * Common tasks for generating PHP from blocks.
     * Handles comments for the specified block and any connected value blocks.
     * Calls any statements following this block.
     *
     * @param block The current block.
     * @param code The PHP code created for this block.
     * @param thisOnly True to generate code for only this statement.
     * @returns PHP code with comments and subsequent blocks added.
     */
    scrub_(block, code, thisOnly = false) {
        let commentCode = '';
        // Only collect comments for blocks that aren't inline.
        if (!block.outputConnection || !block.outputConnection.targetConnection) {
            // Collect comment for this block.
            let comment = block.getCommentText();
            if (comment) {
                comment = stringUtils.wrap(comment, this.COMMENT_WRAP - 3);
                commentCode += this.prefixLines(comment, '// ') + '\n';
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
        let defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
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
//# sourceMappingURL=php_generator.js.map