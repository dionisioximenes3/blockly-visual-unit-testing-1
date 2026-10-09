// scripts/testing.generators.js
function registerTestingJsGenerators(Blockly, javascriptGenerator) {
  const JS = javascriptGenerator;
  
  JS.forBlock = JS.forBlock || {};

  const unique = (base) =>
    JS.nameDB_
      ? JS.nameDB_.getDistinctName(base, Blockly.Names.NameType.VARIABLE)
      : base + '_' + Math.random().toString(36).slice(2);

  // ==================== TEST SUITE ====================
  JS.forBlock['test_suite'] = function(block) {
    const name = block.getFieldValue('NAME') || 'Suíte';
    const suiteName = JSON.stringify(name);

    let hooksCode = '';
    let casesCode = '';

    let cur = block.getInputTargetBlock('CASES');
    while (cur) {
      const fn = JS.forBlock[cur.type];
      let out = fn ? fn(cur) : JS.blockToCode(cur);
      const code = (Array.isArray(out) ? out[0] : out) || '';

      if (cur.type === 'test_hook') {
        hooksCode += code;
      } else {
        casesCode += code;
      }
      cur = cur.getNextBlock();
    }

    return `
/* --- TEST SUITE: ${name} --- */
(async function(){
  if (UNIT_TEST_RUNTIME && UNIT_TEST_RUNTIME.clearHooks) {
    UNIT_TEST_RUNTIME.clearHooks();
  }

  ${hooksCode}

  await UNIT_TEST_RUNTIME.startSuite(${suiteName});

  try {
    ${casesCode}
  } finally {
    await UNIT_TEST_RUNTIME.endSuite();
  }
})();
`;
  };

  // ==================== TEST CASE ====================
  JS.forBlock['test_case'] = function(block) {
    let p = block.getSurroundParent();
    let inSuite = false;
    while (p) {
      if (p.type === 'test_suite') {
        inSuite = true;
        break;
      }
      p = p.getSurroundParent();
    }
    
    if (!inSuite) {
      return `console.warn("⚠️ ⚠️ Caso de teste deve estar dentro de conjunto de testes");\n`;
    }

    const name = block.getFieldValue('NAME') || 'Caso';
    const body = JS.statementToCode(block, 'DO') || '';
    const caseName = JSON.stringify(name);
    const okVar = unique('okCase');

    return `
if (UNIT_TEST_RUNTIME.shouldRunCase(${caseName})) {
  const ${okVar} = await UNIT_TEST_RUNTIME.startCase(${caseName});
  if (${okVar}) {
    try {
${body}
    } catch(__e){
      UNIT_TEST_RUNTIME.fail('Erro não tratado', __e);
    } finally {
      await UNIT_TEST_RUNTIME.endCase();
    }
  }
}
`;
  };

  // ==================== TEST HOOK ====================
  JS.forBlock['test_hook'] = function(block) {
    const kind = block.getFieldValue('KIND');
    const body = JS.statementToCode(block, 'DO') || '';

    const indentedBody = body.split('\n')
      .filter(line => line.trim())
      .map(line => '  ' + line)
      .join('\n') || '  // no code';

    if (kind === 'BEFORE_ALL') {
      return `UNIT_TEST_RUNTIME.setSuiteSetup(async () => {\n${indentedBody}\n});\n`;
    }
    if (kind === 'AFTER_ALL') {
      return `UNIT_TEST_RUNTIME.setSuiteTeardown(async () => {\n${indentedBody}\n});\n`;
    }
    if (kind === 'BEFORE_EACH') {
      return `UNIT_TEST_RUNTIME.setCaseSetup(async () => {\n${indentedBody}\n});\n`;
    }
    if (kind === 'AFTER_EACH') {
      return `UNIT_TEST_RUNTIME.setCaseTeardown(async () => {\n${indentedBody}\n});\n`;
    }

    return '';
  };

  // ==================== ASSERTIONS ====================
  JS.forBlock['assert_equals'] = function(block) {
    const A = JS.valueToCode(block, 'A', JS.ORDER_NONE) || 'undefined';
    const B = JS.valueToCode(block, 'B', JS.ORDER_NONE) || 'undefined';
    return `UNIT_TEST_RUNTIME.equals(${A}, ${B}, "assert equals");\n`;
  };

  JS.forBlock['assert_true'] = function(block) {
    const cond = JS.valueToCode(block, 'COND', JS.ORDER_NONE) || 'false';
    return `UNIT_TEST_RUNTIME.isTrue(${cond}, "assert true");\n`;
  };

  JS.forBlock['assert_approx'] = function(block) {
    const A = JS.valueToCode(block, 'A', JS.ORDER_NONE) || '0';
    const B = JS.valueToCode(block, 'B', JS.ORDER_NONE) || '0';
    const EPS = JS.valueToCode(block, 'EPS', JS.ORDER_NONE) || '1e-9';
    return `UNIT_TEST_RUNTIME.approx(${A}, ${B}, ${EPS}, "assert approx");\n`;
  };

  JS.forBlock['assert_deep_equals'] = function(block) {
    const A = JS.valueToCode(block, 'A', JS.ORDER_NONE) || 'undefined';
    const B = JS.valueToCode(block, 'B', JS.ORDER_NONE) || 'undefined';
    return `UNIT_TEST_RUNTIME.deepEquals(${A}, ${B}, "assert deep equals");\n`;
  };

  JS.forBlock['assert_throws'] = function(block) {
    const expr = JS.valueToCode(block, 'EXPR', JS.ORDER_NONE) || 'undefined';
    return `await UNIT_TEST_RUNTIME.expectThrows(async () => { ${expr}; });\n`;
  };

  JS.forBlock['assert_throws_stmt'] = function(block) {
    const body = JS.statementToCode(block, 'DO') || '';
    return `await UNIT_TEST_RUNTIME.expectThrows(async () => {\n${body}\n});\n`;
  };

  JS.forBlock['throw_error'] = function(block) {
    const msg = block.getFieldValue('MSG') || 'error';
    return `throw new Error(${JSON.stringify(msg)});\n`;
  };

  // ==================== MOCKS ====================
  JS.forBlock['mock_function'] = function(block) {
    const name = JS.valueToCode(block, 'NAME', JS.ORDER_NONE) || '"mock"';
    const ret = JS.valueToCode(block, 'RET', JS.ORDER_NONE) || 'undefined';
    return [`UNIT_TEST_RUNTIME.createMock(${name}, ${ret})`, JS.ORDER_FUNCTION_CALL];
  };

  JS.forBlock['mock_calls'] = function(block) {
    const name = JS.valueToCode(block, 'NAME', JS.ORDER_NONE) || '"mock"';
    return [`UNIT_TEST_RUNTIME.getMockCalls(${name})`, JS.ORDER_FUNCTION_CALL];
  };

  JS.forBlock['mock_reset'] = function() {
    return `UNIT_TEST_RUNTIME.restoreMocks();\n`;
  };

  // ==================== UTILITIES ====================
  JS.forBlock['test_summary_text'] = function(block) {
    const scope = block.getFieldValue('SCOPE');
    const name = JS.valueToCode(block, 'NAME', JS.ORDER_NONE) || '""';
    
    if (scope === 'CASE') {
      return [`UNIT_TEST_RUNTIME.caseSummaryText(${name})`, JS.ORDER_FUNCTION_CALL];
    }
    return [`UNIT_TEST_RUNTIME.suiteSummaryText(${name})`, JS.ORDER_FUNCTION_CALL];
  };

  JS.forBlock['eval_expression'] = function(block) {
    const expr = JS.valueToCode(block, 'EXPR', JS.ORDER_NONE) || 'undefined';
    return [expr, JS.ORDER_ATOMIC];
  };

  JS.forBlock['factorial_value'] = function(block) {
    const n = JS.valueToCode(block, 'N', JS.ORDER_NONE) || '0';
    const code = `(function(n){if(n<=1)return 1;return n*arguments.callee(n-1);})(${n})`;
    return [code, JS.ORDER_FUNCTION_CALL];
  };

  JS.forBlock['classificar_numero'] = function(block) {
    const n = JS.valueToCode(block, 'N', JS.ORDER_NONE) || '0';
    return [`(${n} % 2 === 0 ? "par" : "ímpar")`, JS.ORDER_CONDITIONAL];
  };

  JS.forBlock['show_result'] = function(block) {
    const value = JS.valueToCode(block, 'VALUE', JS.ORDER_NONE) || 'undefined';
    return `console.log("🔍 Resultado:", ${value});\n`;
  };

  // ==================== VARIABLES SET ====================
  JS.forBlock['variables_set'] = function(block) {
    if (!JS.nameDB_) {
      const varName = block.getFieldValue('VAR');
      const value = JS.valueToCode(block, 'VALUE', JS.ORDER_ASSIGNMENT) || '0';
      return `${varName} = ${value};\n`;
    }
    
    const varName = JS.nameDB_.getName(
      block.getFieldValue('VAR'),
      Blockly.Names.NameType.VARIABLE
    );
    const value = JS.valueToCode(block, 'VALUE', JS.ORDER_ASSIGNMENT) || '0';
    return `${varName} = ${value};\n`;
  };

  // ==================== PROCEDURES RETURN ====================
  JS.forBlock['procedures_return'] = function(block) {
    const value = JS.valueToCode(block, 'VALUE', JS.ORDER_NONE) || 'undefined';
    return `return ${value};\n`;
  };

  console.log('✅ JavaScript Generators Ready');
}

// ==================== REGISTER ====================
function registerAllGenerators(Blockly, javascriptGenerator) {
  registerTestingJsGenerators(Blockly, javascriptGenerator);
}

// ==================== INITIALIZATION ====================
if (typeof Blockly !== 'undefined' && Blockly.JavaScript) {
  const originalInit = Blockly.JavaScript.init;
  
  Blockly.JavaScript.init = function(workspace) {
    if (originalInit && originalInit !== this.init) {
      originalInit.call(this, workspace);
    }
    
    this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
    this.nameDB_.setVariableMap(workspace.getVariableMap());
    this.definitions_ = Object.create(null);
  };
}


//scripts/generators/javascript/procedures.js