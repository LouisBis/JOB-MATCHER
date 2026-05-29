/**
 * Saves user preferences sent in the POST body to /data/preferences/preferences.json.
 * Validates required fields and rejects unknown shapes.
 *
 * @returns {Array<{json: {success: boolean, preferences: Preferences}}>}
 */
const fs   = require('fs');
const path = require('path');

const FILE = '/data/preferences/preferences.json';
const body = $request.body;

if (!body || typeof body !== 'object') {
  throw new Error('Request body must be a JSON object');
}

const prefs = {
  minScore:         Number(body.minScore)                ?? 7,
  targetTitles:     Array.isArray(body.targetTitles)     ? body.targetTitles     : [],
  excludedKeywords: Array.isArray(body.excludedKeywords) ? body.excludedKeywords : [],
  locations:        Array.isArray(body.locations)        ? body.locations        : [],
  contractTypes:    Array.isArray(body.contractTypes)    ? body.contractTypes    : [],
};

fs.mkdirSync(path.dirname(FILE), { recursive: true });
fs.writeFileSync(FILE, JSON.stringify(prefs, null, 2) + '\n');

return [{ json: { success: true, preferences: prefs } }];
