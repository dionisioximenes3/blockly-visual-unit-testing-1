// scripts/unit_test_runtime.js
window.UNIT_TEST_RUNTIME = (function () {
  // ==================== ESTADO ====================
  let suites = [];
  let currentSuite = null;
  let currentCase = null;
  
  let suiteSetup = null;
  let suiteTeardown = null;
  let caseSetup = null;
  let caseTeardown = null;
  
  let onlyCase = null;
  let mocks = {};
  
  // ==================== NÚCLEO ====================
  function reset() {
    suites = [];
    currentSuite = null;
    currentCase = null;
    suiteSetup = null;
    suiteTeardown = null;
    caseSetup = null;
    caseTeardown = null;
    onlyCase = null;
    mocks = {};
  }
  
  function clear() {
    reset();
  }
  
  function clearHooks() {
    suiteSetup = null;
    suiteTeardown = null;
    caseSetup = null;
    caseTeardown = null;
  }
  
  // ==================== MÉTODOS DE SUITE ====================
  async function startSuite(name) {
    currentSuite = {
      name: name,
      cases: [],
      passed: 0,
      failed: 0,
      assertions: []
    };
    suites.push(currentSuite);
    
    if (suiteSetup) {
      try {
        await suiteSetup();
      } catch(e) {
        console.error(`[Erro de Configuração da Suite] ${e.message}`);
        currentSuite.failed++;
      }
    }
    return true;
  }
  
  async function endSuite() {
    if (suiteTeardown) {
      try {
        await suiteTeardown();
      } catch(e) {
        console.error(`[Erro de Desmontagem da Suite] ${e.message}`);
        if (currentSuite) currentSuite.failed++;
      }
    }
    currentSuite = null;
  }
  
  function setSuiteSetup(fn) { suiteSetup = fn; }
  function setSuiteTeardown(fn) { suiteTeardown = fn; }
  
  // ==================== MÉTODOS DE CASO ====================
  function shouldRunCase(name) {
    if (onlyCase === null) return true;
    return String(onlyCase) === String(name);
  }
  
  async function startCase(name) {
    if (caseSetup) {
      try {
        await caseSetup();
      } catch(e) {
        console.error(`[Erro de Configuração do Caso] ${e.message}`);
        return false;
      }
    }
    
    currentCase = {
      name: name,
      assertions: [],
      passed: 0,
      failed: 0
    };
    
    if (currentSuite) {
      currentSuite.cases.push(currentCase);
    }
    
    return true;
  }
  
  async function endCase() {
    if (caseTeardown) {
      try {
        await caseTeardown();
      } catch(e) {
        console.error(`[Erro de Desmontagem do Caso] ${e.message}`);
        if (currentCase) currentCase.failed++;
      }
    }
    
    if (currentCase && currentSuite) {
      currentSuite.passed += currentCase.passed;
      currentSuite.failed += currentCase.failed;
    }
    
    currentCase = null;
  }
  
  function setCaseSetup(fn) { caseSetup = fn; }
  function setCaseTeardown(fn) { caseTeardown = fn; }
  
  function fail(message, error) {
    const msg = message + (error ? `: ${error.message}` : '');
    _pushResult('FALHA', msg);
  }
  
  // ==================== ASSERTIVAS ====================
  function _pushResult(status, message) {
    const item = { status, message, timestamp: new Date().toISOString() };
    
    if (currentCase) {
      currentCase.assertions.push(item);
      if (status === 'APROVADO') currentCase.passed++;
      if (status === 'FALHA') currentCase.failed++;
    } else if (currentSuite) {
      currentSuite.assertions.push(item);
    }
  }
  
  function equals(actual, expected, message = '') {
    const pass = actual === expected;
    const msg = message || `Esperado: ${JSON.stringify(expected)}, Obtido: ${JSON.stringify(actual)}`;
    _pushResult(pass ? 'APROVADO' : 'FALHA', msg);
    return pass;
  }
  
  function isTrue(condition, message = '') {
    const pass = Boolean(condition);
    const msg = message || `Esperado verdadeiro, obtido ${condition}`;
    _pushResult(pass ? 'APROVADO' : 'FALHA', msg);
    return pass;
  }
  
  function approx(actual, expected, epsilon = 1e-9, message = '') {
    const pass = Math.abs(actual - expected) <= epsilon;
    const msg = message || `Esperado ≈ ${expected}, obtido ${actual} (ε=${epsilon})`;
    _pushResult(pass ? 'APROVADO' : 'FALHA', msg);
    return pass;
  }
  
  function deepEquals(actual, expected, message = '') {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    const msg = message || `Falha na igualdade profunda`;
    _pushResult(pass ? 'APROVADO' : 'FALHA', msg);
    return pass;
  }
  
  async function expectThrows(fn, message = '') {
    let threw = false;
    let errorMessage = '';
    try {
      await fn();
    } catch(e) {
      threw = true;
      errorMessage = e.message;
    }
    const msg = message || `Exceção esperada${threw ? ` - Obtido: ${errorMessage}` : ' - Nenhuma exceção lançada'}`;
    _pushResult(threw ? 'APROVADO' : 'FALHA', msg);
    return threw;
  }
  
  function assertEquals(actual, expected, message = '') {
    return equals(actual, expected, message);
  }
  
  function assertTrue(condition, message = '') {
    return isTrue(condition, message);
  }
  
  // ==================== MOCKS ====================
  function createMock(name, returnValue) {
    const mockName = String(name).replace(/['"]/g, '');
    mocks[mockName] = { calls: 0, args: [], returnValue: returnValue };
    
    const mockFn = function(...args) {
      mocks[mockName].calls++;
      mocks[mockName].args.push(args);
      return returnValue;
    };
    
    window[mockName] = mockFn;
    return mockFn;
  }
  
  function getMockCalls(name) {
    const mockName = String(name).replace(/['"]/g, '');
    return mocks[mockName] ? mocks[mockName].calls : 0;
  }
  
  function restoreMocks() {
    for (const name in mocks) {
      if (window[name] && typeof window[name] === 'function') {
        delete window[name];
      }
    }
    mocks = {};
  }
  
  // ==================== SAÍDA ====================
  function show(value) {
    console.log(value);
    return value;
  }
  
  // ==================== MÉTODOS DE RESUMO ====================
  function caseSummaryText(name) {
    const targetName = String(name).replace(/['"]/g, '');
    
    for (const suite of suites) {
      for (const testCase of suite.cases) {
        if (String(testCase.name) === targetName) {
          const total = testCase.passed + testCase.failed;
          const passedText = testCase.passed === 1 ? 'aprovado' : 'aprovados';
          const status = testCase.failed === 0 ? '✅' : '❌';
          return `${status} "${testCase.name}": ${testCase.passed}/${total} ${passedText}`;
        }
      }
    }
    return `❓ "${targetName}" não encontrado`;
  }
  
  function suiteSummaryText(name) {
    const targetName = String(name).replace(/['"]/g, '');
    const suite = suites.find(s => String(s.name) === targetName);
    
    if (suite) {
      const total = suite.passed + suite.failed;
      const passedText = suite.passed === 1 ? 'aprovado' : 'aprovados';
      const failedText = suite.failed === 1 ? 'falha' : 'falhas';
      const status = suite.failed === 0 ? '✅' : '❌';
      return `${status} "${suite.name}": ${suite.passed}/${total} ${passedText}, ${suite.failed} ${failedText}`;
    }
    return `❓ Suite "${targetName}" não encontrada`;
  }
  
  function getResults() {
    return { suites };
  }
  
  function simpleSummary() {
    let totalPass = 0;
    let totalFail = 0;
    
    for (const suite of suites) {
      totalPass += suite.passed || 0;
      totalFail += suite.failed || 0;
    }
    
    const total = totalPass + totalFail;
    const passedText = totalPass === 1 ? 'Aprovado' : 'Aprovados';
    const failedText = totalFail === 1 ? 'Falha' : 'Falhas';
    const status = totalFail === 0 ? '✅ TUDO APROVADO' : '❌ ALGUMAS FALHAS';
    return `${status} | ${passedText}: ${totalPass} | ${failedText}: ${totalFail} | Total: ${total}`;
  }

  function summary() {
    let totalPass = 0;
    let totalFail = 0;
    
    for (const suite of suites) {
      totalPass += suite.passed || 0;
      totalFail += suite.failed || 0;
    }
    
    const total = totalPass + totalFail;
    const passPercent = total > 0 ? Math.round((totalPass / total) * 100) : 0;
    
    let output = '\n';
    output += '=' .repeat(60) + '\n';
    output += '📊 RELATÓRIO DE TESTES\n';
    output += '=' .repeat(60) + '\n';
    
    if (totalFail === 0 && total > 0) {
      output += '✅ TODOS OS TESTES APROVADOS!\n';
    } else if (total > 0) {
      if (totalFail === 1) {
        output += '⚠️ ALGUM TESTE FALHOU!\n';
      } else {
        output += '⚠️ ALGUNS TESTES FALHARAM!\n';
      }
    } else {
      output += '📝 Nenhum teste executado\n';
    }
    
    const aprovadosText = (totalPass === 1) ? 'Aprovado' : 'Aprovados';
    const falhasText = (totalFail === 1) ? 'Falha' : 'Falhas';
    
    output += `✅ ${aprovadosText}: ${totalPass}  |  ❌ ${falhasText}: ${totalFail}  |  📊 Total: ${total}  |  📈 Taxa: ${passPercent}%\n`;
    output += '-'.repeat(60) + '\n';
    
    for (const suite of suites) {
      const suiteTotal = suite.passed + suite.failed;
      const suitePassPercent = suiteTotal > 0 ? Math.round((suite.passed / suiteTotal) * 100) : 0;
      const suiteIcon = suite.failed === 0 ? '✅' : '❌';
      
      output += `${suiteIcon} Conjunto de testes: ${suite.name} - ${suite.passed}/${suiteTotal} (${suitePassPercent}%)\n`;
      
      for (const testCase of suite.cases) {
        const caseTotal = testCase.passed + testCase.failed;
        const caseIcon = testCase.failed === 0 ? '  ✓' : '  ✗';
        output += `${caseIcon} ${testCase.name}: ${testCase.passed}/${caseTotal}\n`;
      }
      output += '\n';
    }
    
    output += '=' .repeat(60);
    return output;
  }

  // ==================== EXPORTAÇÕES ====================
  return {
    reset,
    clear,
    clearHooks,
    getResults,
    summary,
    simpleSummary,
  
    startSuite,
    endSuite,
    setSuiteSetup,
    setSuiteTeardown,
    shouldRunCase,
    startCase,
    endCase,
    setCaseSetup,
    setCaseTeardown,
    fail,
    startTest: startCase,
    equals,
    isTrue,
    approx,
    deepEquals,
    expectThrows,
    assertEquals,
    assertTrue,
    createMock,
    getMockCalls,
    restoreMocks,
    show,
    caseSummaryText,
    suiteSummaryText
  };
})();

console.log('✅ Unit Test Runtime carregado');