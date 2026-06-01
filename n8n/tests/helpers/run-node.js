/**
 * Executes an n8n Code node script in an isolated VM context.
 *
 * Code nodes use top-level `return` and rely on n8n globals ($input, etc.).
 * The script is wrapped in an IIFE to make `return` legal, and globals are
 * injected via the VM context so the code can use them without modification.
 *
 * @param {string} code       - Source code of the node (as a string)
 * @param {object} n8nContext - n8n globals to inject ($input, $getWorkflowStaticData, $)
 * @returns The value returned by the code node
 */
const vm = require('vm');

function runNode(code, n8nContext = {}) {
  const context = vm.createContext({
    require,
    module: { exports: {} },
    exports: {},
    process,
    console,
    ...n8nContext,
  });
  // Wrap in IIFE: top-level `return` is invalid in a script but valid in a function
  return vm.runInContext(`(function() { ${code} })()`, context);
}

module.exports = { runNode };
