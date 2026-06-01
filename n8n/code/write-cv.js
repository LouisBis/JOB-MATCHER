/**
 * Writes uploaded CV text to /data/cv/cv.txt and saves metadata.
 * Expects a JSON body { text: string, filename: string } from the webhook.
 *
 * @returns {Array<{json: {success, filename, uploadedAt}}>}
 */
const fs   = require('fs');
const path = require('path');

const CV_FILE   = '/data/cv/cv.txt';
const META_FILE = '/data/cv/cv.meta.json';

const { text, filename } = $input.first().json.body ?? $input.first().json;

if (!text?.trim()) {
  throw new Error('CV content is empty — check the uploaded file');
}

// Reject payloads larger than 1 MB of text (frontend enforces 5 MB file size,
// but direct API calls bypass that check)
if (text.length > 1_000_000) {
  throw new Error('CV content exceeds 1 MB limit');
}

// Strip path separators from the filename so it can never be used as a path
const safeFilename = path.basename(String(filename || 'cv.txt')).replace(/[^a-zA-Z0-9._\- ]/g, '_');

fs.mkdirSync(path.dirname(CV_FILE), { recursive: true });
fs.writeFileSync(CV_FILE, text.trim() + '\n');

const meta = { filename: safeFilename, uploadedAt: new Date().toISOString() };
fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2) + '\n');

return [{ json: { success: true, filename: safeFilename, uploadedAt: meta.uploadedAt } }];
