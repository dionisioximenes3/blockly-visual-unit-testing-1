// scripts/testing.blocks.js
function registerTestingBlockDefs(Blockly) {
  if (typeof registerTestingMessages === 'function') {
    registerTestingMessages(Blockly);
  }
  
  const M = Blockly.Msg || {};

  const TEST_BLOCKS_PT = [
    {
      type: "test_suite",
      message0: (M.TEST_SUITE_TITLE || "Conjuntos de testes") + " %1 %2 " + (M.TEST_SUITE_CASES || "casos") + " %3",
      args0: [
        { type: "field_input", name: "NAME", text: "Suíte" },
        { type: "input_dummy" },
        { type: "input_statement", name: "CASES" }
      ],
      colour: 20,
      tooltip: M.TEST_SUITE_TT || "Agrupa e executa vários casos de teste.",
      helpUrl: ""
    },
    {
      type: "test_case",
      message0: (M.TEST_CASE_TITLE || "teste") + " %1 %2 " + (M.TEST_CASE_DO || "faça") + " %3",
      args0: [
        { type: "field_input", name: "NAME", text: "Caso 1" },
        { type: "input_dummy" },
        { type: "input_statement", name: "DO" }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 25,
      tooltip: M.TEST_CASE_TT || "Um caso de teste individual.",
      helpUrl: ""
    },
    {
      type: "test_hook",
      message0: "prepara %1 faça %2",
      args0: [
        {
          type: "field_dropdown",
          name: "KIND",
          options: [
            ["antes de todos", "BEFORE_ALL"],
            ["depois de todos", "AFTER_ALL"],
            ["antes de cada caso", "BEFORE_EACH"],
            ["depois de cada caso", "AFTER_EACH"]
          ]
        },
        { type: "input_statement", name: "DO" }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 65,
      tooltip: "Configura hooks (before/after) da suíte e dos casos.",
      helpUrl: ""
    },
    {
      type: "assert_equals",
      message0: (M.ASSERT_EQUALS_TITLE || "verificar igual") + " %1 " + (M.ASSERT_EQUALS_A || "obtido") + " %2 " + (M.ASSERT_EQUALS_B || "esperado") + " %3",
      args0: [
        { type: "input_dummy" },
        { type: "input_value", name: "A", check: null },
        { type: "input_value", name: "B", check: null }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: M.ASSERT_EQUALS_TT || "Verifica se A === B.",
      helpUrl: ""
    },
    {
      type: "assert_true",
      message0: (M.ASSERT_TRUE_TITLE || "verificar verdadeiro") + " %1 " + (M.ASSERT_TRUE_X || "condição") + " %2",
      args0: [
        { type: "input_dummy" },
        { type: "input_value", name: "COND" }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: M.ASSERT_TRUE_TT || "Verifica se a condição é verdadeira.",
      helpUrl: ""
    },
    {
      type: "assert_approx",
      message0: "verificar aproximadamente %1 obtido %2 esperado %3 tolerância %4",
      args0: [
        { type: "input_dummy" },
        { type: "input_value", name: "A" },
        { type: "input_value", name: "B" },
        { type: "input_value", name: "EPS" }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Verifica se dois números são próximos dentro da tolerância.",
      helpUrl: ""
    },
    {
      type: "assert_deep_equals",
      message0: "verificar deep igual %1 obtido %2 esperado %3",
      args0: [
        { type: "input_dummy" },
        { type: "input_value", name: "A" },
        { type: "input_value", name: "B" }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Compara listas/objetos por conteúdo (igualdade profunda).",
      helpUrl: ""
    },
    {
      type: "assert_throws_stmt",
      message0: "espera exceção — executar %1 faça %2",
      args0: [
        { type: "input_dummy" },
        { type: "input_statement", name: "DO" }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: "Passa se a execução (blocos dentro) lançar uma exceção.",
      helpUrl: ""
    },
    {
      type: "throw_error",
      message0: "lançar erro %1",
      args0: [
        { type: "field_input", name: "MSG", text: "erro" }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 10,
      tooltip: "Lança uma exceção.",
      helpUrl: ""
    },
    {
      type: "mock_function",
      message0: "função mock %1 nome %2 retorno %3",
      args0: [
        { type: "input_dummy" },
        { type: "input_value", name: "NAME" },
        { type: "input_value", name: "RET" }
      ],
      output: null,
      colour: 290,
      tooltip: "Cria uma função mock que regista chamadas e devolve um valor.",
      helpUrl: ""
    },
    {
      type: "mock_calls",
      message0: "chamadas do mock %1 nome %2",
      args0: [
        { type: "input_dummy" },
        { type: "input_value", name: "NAME" }
      ],
      output: "Number",
      colour: 290,
      tooltip: "Obtém o número de chamadas registadas por um mock.",
      helpUrl: ""
    },
    {
      type: "mock_reset",
      message0: "restaurar mocks",
      previousStatement: null,
      nextStatement: null,
      colour: 290,
      tooltip: "Restaura as funções originais e limpa todos os mocks.",
      helpUrl: ""
    },
    {
      type: "test_summary_text",
      message0: "resumo %1 nome %2",
      args0: [
        {
          type: "field_dropdown",
          name: "SCOPE",
          options: [
            ["do caso", "CASE"],
            ["do conjunto", "SUITE"]
          ]
        },
        { type: "input_value", name: "NAME", check: "String" }
      ],
      inputsInline: true,
      output: "String",
      colour: 45,
      tooltip: "Devolve o resumo (caso ou conjunto) pelo nome.",
      helpUrl: ""
    },
    {
      type: "eval_expression",
      message0: "avaliar expressão %1",
      args0: [
        { type: "input_value", name: "EXPR" }
      ],
      output: null,
      colour: 230,
      tooltip: "Avalia expressão JavaScript.",
      helpUrl: ""
    },
    {
      type: "factorial_value",
      message0: "factorial de %1",
      args0: [
        { type: "input_value", name: "N", check: "Number" }
      ],
      output: "Number",
      colour: 230,
      tooltip: "Calcula o factorial de um número",
      helpUrl: ""
    },
    {
      type: "classificar_numero",
      message0: "classificar número %1",
      args0: [
        { type: "input_value", name: "N" }
      ],
      output: "String",
      colour: 210,
      tooltip: "Retorna 'par' ou 'ímpar'",
      helpUrl: ""
    },
    {
      type: "assert_throws",
      message0: "espera exceção %1",
      args0: [
        { type: "input_value", name: "EXPR" }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160
    },
    {
      type: "show_result",
      message0: "mostrar resultado %1",
      args0: [
        { type: "input_value", name: "VALUE" }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 45,
      tooltip: "Mostra o valor no painel 'Saída do Programa'.",
      helpUrl: ""
    }
  ];

  Blockly.defineBlocksWithJsonArray(TEST_BLOCKS_PT);
  console.log('✅ Testing blocks registered');
}