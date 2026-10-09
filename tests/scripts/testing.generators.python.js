// scripts/testing.generators.python.js
(function() {
  function registerTestingPyGenerators(Blockly, pythonGenerator) {
    if (!pythonGenerator) {
      console.warn("⚠️ Python generator não encontrado.");
      return;
    }

    console.log("🔥 Registrando Python generators...");

    pythonGenerator.forBlock = pythonGenerator.forBlock || {};

    const ORDER_ATOMIC = pythonGenerator.ORDER_ATOMIC || 0;
    const ORDER_FUNCTION_CALL = pythonGenerator.ORDER_FUNCTION_CALL || 2;
    const ORDER_CONDITIONAL = pythonGenerator.ORDER_CONDITIONAL || 13;
    const ORDER_NONE = pythonGenerator.ORDER_NONE || 99;

    function pyString(value) {
      return JSON.stringify(String(value ?? ""));
    }

    function safeName(value) {
      return String(value || "caso")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w]+/g, "_")
        .replace(/^(\d)/, "_$1")
        .replace(/^_+|_+$/g, "") || "caso";
    }

    function value(block, inputName, fallback = "None") {
      try {
        return pythonGenerator.valueToCode(block, inputName, ORDER_NONE) || fallback;
      } catch (e) {
        console.warn(`⚠️ Erro no input "${inputName}" do bloco ${block.type}:`, e);
        return fallback;
      }
    }

    function statements(block, inputName) {
      try {
        return pythonGenerator.statementToCode(block, inputName) || "";
      } catch (e) {
        console.warn(`⚠️ Erro no statement "${inputName}" do bloco ${block.type}:`, e);
        return "";
      }
    }

    function normalizeBody(code) {
      if (!code || !code.trim()) return "    pass\n";
      return code.endsWith("\n") ? code : code + "\n";
    }

    function indent(code, spaces = 4) {
      const pad = " ".repeat(spaces);
      const clean = code || "";
      return clean
        .split("\n")
        .map(line => line.trim() ? pad + line : line)
        .join("\n");
    }

    function isInsideSuite(block) {
      let parent = block.getSurroundParent && block.getSurroundParent();
      while (parent) {
        if (parent.type === "test_suite") return true;
        parent = parent.getSurroundParent && parent.getSurroundParent();
      }
      return false;
    }

    // ==================== TEST SUITE ====================
    pythonGenerator.forBlock["test_suite"] = function(block, gen) {
      const rawName = block.getFieldValue("NAME") || "Suíte";
      const fnName = "__run_suite_" + safeName(rawName);

      let hooksCode = "";
      let casesCode = "";

      let cur = block.getInputTargetBlock("CASES");
      while (cur) {
        let out = "";
        const fn = gen.forBlock && gen.forBlock[cur.type];

        try {
          const generated = fn ? fn(cur, gen) : gen.blockToCode(cur);
          out = Array.isArray(generated) ? generated[0] : generated;
        } catch (e) {
          console.warn("⚠️ Bloco sem generator Python:", cur.type, e);
          out = "";
        }

        if (cur.type === "test_hook") {
          hooksCode += out || "";
        } else {
          casesCode += out || "";
        }

        cur = cur.getNextBlock();
      }

      return `
# ===== TEST SUITE: ${rawName} =====

__ut_suite_setup = None
__ut_suite_teardown = None
__ut_case_setup = None
__ut_case_teardown = None
__ut_only_case = None
__ut_results = []
__ut_mocks = {}

def __ut_clear_hooks():
    global __ut_suite_setup, __ut_suite_teardown, __ut_case_setup, __ut_case_teardown
    __ut_suite_setup = None
    __ut_suite_teardown = None
    __ut_case_setup = None
    __ut_case_teardown = None

def __ut_should_run_case(name):
    return (__ut_only_case is None) or str(name) == str(__ut_only_case)

def __ut_record(status, message):
    __ut_results.append({"status": status, "message": str(message)})
    icon = "✅" if status == "APROVADO" else "❌"
    print(f"{icon} {message}")

def __ut_equals(actual, expected, message="assert equals"):
    ok = actual == expected
    __ut_record("APROVADO" if ok else "FALHA", f"{message} | obtido={actual!r}, esperado={expected!r}")
    return ok

def __ut_is_true(condition, message="assert true"):
    ok = bool(condition)
    __ut_record("APROVADO" if ok else "FALHA", f"{message} | condição={condition!r}")
    return ok

def __ut_approx(actual, expected, eps=1e-9, message="assert approx"):
    ok = abs(actual - expected) <= eps
    __ut_record("APROVADO" if ok else "FALHA", f"{message} | obtido={actual!r}, esperado≈{expected!r}, tolerância={eps!r}")
    return ok

def __ut_deep_equals(actual, expected, message="assert deep equals"):
    ok = actual == expected
    __ut_record("APROVADO" if ok else "FALHA", f"{message} | obtido={actual!r}, esperado={expected!r}")
    return ok

def __ut_create_mock(name, ret):
    n = str(name)
    __ut_mocks[n] = {"calls": 0, "ret": ret}

    def _fn(*args, **kwargs):
        __ut_mocks[n]["calls"] += 1
        return ret

    globals()[n] = _fn
    return _fn

def __ut_get_mock_calls(name):
    return __ut_mocks.get(str(name), {}).get("calls", 0)

def __ut_restore_mocks():
    global __ut_mocks
    for n in list(__ut_mocks.keys()):
        if n in globals():
            del globals()[n]
    __ut_mocks = {}

def __ut_case_summary_text(name):
    passed = sum(1 for r in __ut_results if r["status"] == "APROVADO")
    failed = sum(1 for r in __ut_results if r["status"] == "FALHA")
    total = passed + failed
    passed_text = "aprovado" if passed == 1 else "aprovados"
    status = "✅" if failed == 0 else "❌"
    return f'{status} "{name}": {passed}/{total} {passed_text}'

def __ut_suite_summary_text(name):
    passed = sum(1 for r in __ut_results if r["status"] == "APROVADO")
    failed = sum(1 for r in __ut_results if r["status"] == "FALHA")
    total = passed + failed
    passed_text = "aprovado" if passed == 1 else "aprovados"
    failed_text = "falha" if failed == 1 else "falhas"
    status = "✅" if failed == 0 else "❌"
    return f'{status} "{name}": {passed}/{total} {passed_text}, {failed} {failed_text}'

def ${fnName}():
    global __ut_suite_setup, __ut_suite_teardown

    __ut_clear_hooks()

${indent(hooksCode, 4)}

    if callable(__ut_suite_setup):
        __ut_suite_setup()

    try:
${indent(casesCode || "pass\n", 8)}
    finally:
        if callable(__ut_suite_teardown):
            __ut_suite_teardown()

${fnName}()
`;
    };

    // ==================== TEST CASE ====================
    pythonGenerator.forBlock["test_case"] = function(block) {
      if (!isInsideSuite(block)) {
        return `print("⚠️ test_case deve estar dentro de test_suite")\n`;
      }

      const rawName = block.getFieldValue("NAME") || "Caso";
      const fnName = "__case_" + safeName(rawName);
      const body = normalizeBody(statements(block, "DO"));

      return `
def ${fnName}():
    global __ut_case_setup, __ut_case_teardown

    if not __ut_should_run_case(${pyString(rawName)}):
        return

    if callable(__ut_case_setup):
        __ut_case_setup()

    try:
${indent(body, 8)}
    except Exception as __e:
        __ut_record("FALHA", "Erro não tratado: " + str(__e))
    finally:
        if callable(__ut_case_teardown):
            __ut_case_teardown()

${fnName}()
`;
    };

    // ==================== HOOKS ====================
    pythonGenerator.forBlock["test_hook"] = function(block) {
      const kind = block.getFieldValue("KIND");
      const body = normalizeBody(statements(block, "DO"));

      if (kind === "BEFORE_ALL") {
        return `
def __before_all():
${indent(body, 4)}
global __ut_suite_setup
__ut_suite_setup = __before_all
`;
      }

      if (kind === "AFTER_ALL") {
        return `
def __after_all():
${indent(body, 4)}
global __ut_suite_teardown
__ut_suite_teardown = __after_all
`;
      }

      if (kind === "BEFORE_EACH") {
        return `
def __before_each():
${indent(body, 4)}
global __ut_case_setup
__ut_case_setup = __before_each
`;
      }

      if (kind === "AFTER_EACH") {
        return `
def __after_each():
${indent(body, 4)}
global __ut_case_teardown
__ut_case_teardown = __after_each
`;
      }

      return "";
    };

    // ==================== ASSERTIONS ====================
    pythonGenerator.forBlock["assert_equals"] = function(block) {
      const A = value(block, "A", "None");
      const B = value(block, "B", "None");
      return `__ut_equals(${A}, ${B}, "assert equals")\n`;
    };

    pythonGenerator.forBlock["assert_true"] = function(block) {
      const COND = value(block, "COND", "False");
      return `__ut_is_true(${COND}, "assert true")\n`;
    };

    pythonGenerator.forBlock["assert_approx"] = function(block) {
      const A = value(block, "A", "0");
      const B = value(block, "B", "0");
      const EPS = value(block, "EPS", "1e-9");
      return `__ut_approx(${A}, ${B}, ${EPS}, "assert approx")\n`;
    };

    pythonGenerator.forBlock["assert_deep_equals"] = function(block) {
      const A = value(block, "A", "None");
      const B = value(block, "B", "None");
      return `__ut_deep_equals(${A}, ${B}, "assert deep equals")\n`;
    };

    pythonGenerator.forBlock["assert_throws"] = function(block) {
      const EXPR = value(block, "EXPR", "None");
      return `
__ut_ok = False
try:
    ${EXPR}
except Exception:
    __ut_ok = True
__ut_is_true(__ut_ok, "assert throws")
`;
    };

    pythonGenerator.forBlock["assert_throws_stmt"] = function(block) {
      const body = normalizeBody(statements(block, "DO"));
      return `
__ut_ok = False
try:
${indent(body, 4)}
except Exception:
    __ut_ok = True
__ut_is_true(__ut_ok, "assert throws")
`;
    };

    pythonGenerator.forBlock["throw_error"] = function(block) {
      const msg = block.getFieldValue("MSG") || "erro";
      return `raise Exception(${pyString(msg)})\n`;
    };

    // ==================== MOCKS ====================
    pythonGenerator.forBlock["mock_function"] = function(block) {
      const NAME = value(block, "NAME", '"mock"');
      const RET = value(block, "RET", "None");
      return [`__ut_create_mock(${NAME}, ${RET})`, ORDER_FUNCTION_CALL];
    };

    pythonGenerator.forBlock["mock_calls"] = function(block) {
      const NAME = value(block, "NAME", '"mock"');
      return [`__ut_get_mock_calls(${NAME})`, ORDER_FUNCTION_CALL];
    };

    pythonGenerator.forBlock["mock_reset"] = function() {
      return `__ut_restore_mocks()\n`;
    };

    // ==================== UTILITIES ====================
    pythonGenerator.forBlock["test_summary_text"] = function(block) {
      const scope = block.getFieldValue("SCOPE");
      const NAME = value(block, "NAME", '""');

      if (scope === "CASE") {
        return [`__ut_case_summary_text(${NAME})`, ORDER_FUNCTION_CALL];
      }

      return [`__ut_suite_summary_text(${NAME})`, ORDER_FUNCTION_CALL];
    };

    pythonGenerator.forBlock["eval_expression"] = function(block) {
      const EXPR = value(block, "EXPR", "None");
      return [EXPR, ORDER_ATOMIC];
    };

    pythonGenerator.forBlock["factorial_value"] = function(block) {
      const N = value(block, "N", "0");
      const code = `(1 if (${N}) <= 1 else __import__("math").prod(range(1, int(${N}) + 1)))`;
      return [code, ORDER_FUNCTION_CALL];
    };

    pythonGenerator.forBlock["classificar_numero"] = function(block) {
      const N = value(block, "N", "0");
      return [`("par" if (${N}) % 2 == 0 else "ímpar")`, ORDER_CONDITIONAL];
    };

    pythonGenerator.forBlock["show_result"] = function(block) {
      const VALUE = value(block, "VALUE", "None");
      return `print("🔍 Resultado:", ${VALUE})\n`;
    };

    console.log("✅ Python Generators registados");
  }

  if (typeof window !== 'undefined') {
    window.registerTestingPyGenerators = registerTestingPyGenerators;
  }
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = registerTestingPyGenerators;
  }
})();