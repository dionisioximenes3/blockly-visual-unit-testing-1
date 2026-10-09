// scripts/testing.messages.js
function registerTestingMessages(Blockly) {
  if (!Blockly) return;
  
  const M = Blockly.Msg || {};

  const defaults = {
    TEST_SUITE_TITLE: 'Conjuntos de testes',
    TEST_SUITE_CASES: 'casos',
    TEST_SUITE_TT: 'Agrupa e executa vários casos de teste.',
    TEST_CASE_TITLE: 'teste',
    TEST_CASE_DO: 'faça',
    TEST_CASE_TT: 'Um caso de teste individual.',
    ASSERT_EQUALS_TITLE: 'verificar igual',
    ASSERT_EQUALS_A: 'obtido',
    ASSERT_EQUALS_B: 'esperado',
    ASSERT_EQUALS_MSG: 'mensagem',
    ASSERT_EQUALS_TT: 'Verifica se A === B.',
    ASSERT_TRUE_TITLE: 'verificar verdadeiro',
    ASSERT_TRUE_X: 'condição',
    ASSERT_TRUE_TT: 'Verifica se a condição é verdadeira.',
    ASSERT_THROWS_TITLE: 'esperar exceção',
    ASSERT_THROWS_FN: 'função',
    ASSERT_THROWS_TT: 'Verifica se a função lança uma exceção.',
    TEST_PRINT_SUMMARY: 'imprimir resumo dos testes',
    TEST_PRINT_TT: 'Mostra um resumo PASS/FAIL dos testes.'
  };

  for (const [key, value] of Object.entries(defaults)) {
    if (!M[key]) {
      M[key] = value;
    }
  }

  return M;
}

console.log('✅ Testing messages registered');