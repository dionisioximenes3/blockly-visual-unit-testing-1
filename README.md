# Visual Unit Testing Framework for Blockly

A visual unit testing framework integrated into Blockly for automated program validation and programming education.

## Overview

This project presents a prototype that integrates unit testing capabilities into the Blockly visual programming environment. The framework enables learners to construct test cases using visual blocks, execute tests, compare actual and expected results, and receive automated feedback.

The system is developed as part of doctoral research at the University of Évora, Portugal.

## Research Objectives

The main objectives are to:

- Integrate unit testing into block-based visual programming.
- Enable learners to define test cases using visual blocks.
- Support automated validation of program behaviour.
- Provide immediate feedback on test execution.
- Explore the potential of visual unit testing in programming education.

## System Components

The prototype comprises four main components:

1. **Visual Testing Blocks:** Blockly blocks for defining test suites, test cases, and assertions.
2. **Code Generators:** Components that translate visual testing blocks into executable testing instructions.
3. **Unit Testing Runtime:** An execution engine that evaluates assertions and records test results.
4. **Feedback Interface:** A user interface that displays test outcomes and execution summaries.

## Main Features

- Visual test suite and test case definition.
- Equality and Boolean assertions.
- Approximate value comparison.
- Exception testing.
- Automated PASS/FAIL reporting.
- Test execution summaries.
- Workspace import and export.
- Automatic workspace saving.
- Integration with Blockly's visual programming interface.

## Project Structure

The research prototype is implemented within a Blockly-based project.

Relevant files include:

```text
tests/
├── playground.html
├── data/
│   └── questions.json
└── scripts/
    ├── testing.blocks.js
    ├── testing.generators.js
    ├── testing.generators.python.js
    ├── testing.messages.js
    └── unit_test_runtime.js
```

## Requirements

- Node.js 18 or later.
- npm.
- A modern web browser.

## Installation

Clone the repository:

```bash
git clone https://github.com/dionisioximenes3/blockly-visual-unit-testing-1.git
cd blockly-visual-unit-testing-1
```

Install dependencies:

```bash
npm ci
```

## Running the Prototype

Start a local HTTP server from the project root:

```bash
python3 -m http.server 8000
```

Open the following address in your browser:

```text
http://localhost:8000/tests/playground.html
```

The prototype provides a visual programming workspace, a testing block category, and a panel for displaying test execution results.

Depending on the local build state, Blockly's generated resources may need to be built before launching the prototype.

## Example: Unit Testing

Consider a function that doubles an input value:

```javascript
function dobro(x) {
  return 2 * x;
}
```

A visual test can verify that:

```text
Actual result: dobro(2) = 4
Expected result: 4
Test status: PASS
```

If the expected value differs from the actual result, the framework reports a failed assertion.

## Evaluation Status

The prototype has undergone preliminary technical testing using representative programming examples to examine test execution, incorrect behaviour detection, and automated feedback.

These tests support an initial assessment of technical feasibility. They do not constitute a final empirical evaluation of educational effectiveness.

Further research will investigate usability and educational impact with students and teachers.

## Research Publication

**Integrating Unit Testing in Blockly: Automated Program Validation for Programming Education**

RECPAD 2026 — Portuguese Conference on Pattern Recognition.

## Authors

- Dionísio Miguel de Jesus Ximenes
- Francisco Manuel Gonçalves Coelho

University of Évora, Portugal.

## License

See the repository's `LICENSE` file for the applicable licensing terms.

## Research Context

This prototype is part of ongoing doctoral research on visual unit testing systems designed to support programming education.
