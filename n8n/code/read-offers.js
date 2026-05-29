/**
 * Reads all scored offers from /data/offers/offers.json and returns them
 * sorted by score descending. Returns an empty array if the file doesn't
 * exist yet (pipeline hasn't run).
 *
 * @returns {Array<{json: Offer}>}
 */
const fs = require('fs');

const FILE = '/data/offers/offers.json';

if (!fs.existsSync(FILE)) {
  return [{ json: [] }];
}

let offers;
try {
  offers = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
} catch (err) {
  throw new Error(`Cannot read offers file: ${err.message}`);
}

// Wrap in an object — n8n items must have json as a plain object, not an array.
// The Respond to Webhook node uses $json.offers to serialize the array.
return [{ json: { offers } }];
