/**
 * Returns the current pipeline status from /data/status/status.json.
 * Shape: { running: boolean, step: number, steps: string[] }
 * Returns { running: false, step: 0, steps: [] } if the file doesn't exist yet.
 */
const fs = require('fs');

const FILE = '/data/status/status.json';

let status = { running: false, step: 0, steps: [] };
if (fs.existsSync(FILE)) {
  try {
    status = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch (e) {
    // Corrupted file — return safe defaults
  }
}

return [{ json: status }];
