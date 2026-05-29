/**
 * Reads user preferences from /data/preferences/preferences.json.
 * Returns sensible defaults if the file doesn't exist yet.
 *
 * @returns {Array<{json: Preferences}>}
 */
const fs = require('fs');

const FILE = '/data/preferences/preferences.json';

const defaults = {
  minScore:        Number($env.MIN_SCORE || 7),
  targetTitles:    [],
  excludedKeywords: ($env.FILTER_EXCLUDE || '').split(',').map(s => s.trim()).filter(Boolean),
  locations:       [],
  contractTypes:   [],
};

if (!fs.existsSync(FILE)) {
  return [{ json: defaults }];
}

let prefs;
try {
  prefs = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
} catch (err) {
  return [{ json: defaults }];
}

return [{ json: { ...defaults, ...prefs } }];
