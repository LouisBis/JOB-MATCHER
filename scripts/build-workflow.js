#!/usr/bin/env node

/**
 * Builds all *.template.json workflows in n8n/workflows/ by injecting
 * the matching Code node source files from n8n/code/.
 *
 * Node ID → source file mapping is declared in CODE_MAP below.
 * Run: npm run build
 */

const fs   = require('fs');
const path = require('path');

const ROOT         = path.join(__dirname, '..');
const WORKFLOWS_DIR = path.join(ROOT, 'n8n/workflows');
const CODE_DIR      = path.join(ROOT, 'n8n/code');

// Allow overriding the output directory — used by docker n8n-init
const OUTPUT_DIR = process.env.WORKFLOW_OUTPUT_DIR
  ? path.resolve(process.env.WORKFLOW_OUTPUT_DIR)
  : WORKFLOWS_DIR;

/** Maps node IDs to their source files in n8n/code/. */
const CODE_MAP = {
  'node-config':           'config.js',
  'node-normalize-indeed': 'normalize-indeed.js',
  'node-fetch-ft':         'fetch-ft.js',
  'node-dedup':            'deduplicate.js',
  'node-pre-filter':       'pre-filter.js',
  'node-prepare':          'prepare-request.js',
  'node-parse':            'parse-score.js',
  'node-format-error':     'format-error.js',
};

const templates = fs.readdirSync(WORKFLOWS_DIR)
  .filter(f => f.endsWith('.template.json'));

for (const templateFile of templates) {
  const workflow = JSON.parse(
    fs.readFileSync(path.join(WORKFLOWS_DIR, templateFile), 'utf-8')
  );

  for (const node of workflow.nodes) {
    const file = CODE_MAP[node.id];
    if (!file) continue;
    node.parameters.jsCode = fs.readFileSync(path.join(CODE_DIR, file), 'utf-8');
  }

  const outputFile = templateFile.replace('.template.json', '.json');
  fs.writeFileSync(
    path.join(OUTPUT_DIR, outputFile),
    JSON.stringify(workflow, null, 2) + '\n'
  );
  console.log(`Built ${outputFile}`);
}
