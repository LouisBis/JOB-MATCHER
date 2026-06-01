/**
 * Returns current CV metadata and a short text preview.
 * Reads cv.meta.json for filename/date, cv.txt for the preview.
 *
 * @returns {Array<{json: CvInfo}>}
 */
const fs = require('fs');

const CV_FILE   = '/data/cv/cv.txt';
const META_FILE = '/data/cv/cv.meta.json';

let meta = { filename: null, uploadedAt: null };
if (fs.existsSync(META_FILE)) {
  try { meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8')); } catch (e) {}
}

let preview = null;
if (fs.existsSync(CV_FILE)) {
  try {
    preview = fs.readFileSync(CV_FILE, 'utf-8').slice(0, 400).trim();
  } catch (e) {}
}

return [{ json: { ...meta, preview, exists: preview !== null } }];
