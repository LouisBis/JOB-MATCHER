#!/usr/bin/env node

/**
 * Injects n8n/code/*.js files into the workflow template and writes
 * the importable n8n/workflows/job-matcher.json.
 *
 * Run: npm run build
 */

const fs = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'n8n/workflows/job-matcher.template.json');
const CODE_DIR = path.join(ROOT, 'n8n/code');

// Allow overriding output path — used by docker n8n-init to write outside the ro mount
const OUTPUT = process.env.WORKFLOW_OUTPUT
  ? path.resolve(process.env.WORKFLOW_OUTPUT)
  : path.join(ROOT, 'n8n/workflows/job-matcher.json');

/** Maps node IDs defined in the template to their source files. */
const CODE_MAP = {
  'node-config':  'config.js',
  'node-dedup':   'deduplicate.js',
  'node-prepare': 'prepare-request.js',
  'node-parse':   'parse-score.js',
};

const workflow = JSON.parse(fs.readFileSync(TEMPLATE, 'utf-8'));

for (const node of workflow.nodes) {
  const file = CODE_MAP[node.id];
  if (!file) continue;
  node.parameters.jsCode = fs.readFileSync(path.join(CODE_DIR, file), 'utf-8');
}

fs.writeFileSync(OUTPUT, JSON.stringify(workflow, null, 2) + '\n');
console.log(`Built ${OUTPUT}`);
