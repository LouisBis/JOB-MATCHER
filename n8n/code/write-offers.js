/**
 * Persists scored offers to /data/offers/offers.json.
 * Merges with existing offers by id — existing entries are updated in place,
 * new offers are appended. This means re-scoring an offer updates its score
 * without creating duplicates.
 *
 * @returns {Array<{json: Offer}>} - The full merged offers array
 */
const fs   = require('fs');
const path = require('path');

const FILE        = '/data/offers/offers.json';
const STATUS_FILE = '/data/status/status.json';

// Step 5 — saving
try { const s = JSON.parse(fs.readFileSync(STATUS_FILE,'utf-8')); fs.writeFileSync(STATUS_FILE, JSON.stringify({...s, step: 5}) + '\n'); } catch(e) {}

// Load existing offers (empty array if file doesn't exist yet)
let existing = [];
if (fs.existsSync(FILE)) {
  try {
    existing = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  } catch (err) {
    // Corrupted file — start fresh rather than crashing the pipeline
    existing = [];
  }
}

// Build a lookup map by id for O(1) merge
const byId = Object.fromEntries(existing.map(o => [o.id, o]));

// Strip internal-only fields before writing
const incomingOffers = $input.all().map(item => {
  const { chatId, minScore, matchReasons, concerns, ...offer } = item.json;
  return offer;
});

for (const offer of incomingOffers) {
  byId[offer.id] = offer;
}

const merged = Object.values(byId)
  .sort((a, b) => b.score - a.score);

fs.mkdirSync(path.dirname(FILE), { recursive: true });
fs.writeFileSync(FILE, JSON.stringify(merged, null, 2) + '\n');

// Pipeline complete
try { const s = JSON.parse(fs.readFileSync(STATUS_FILE,'utf-8')); fs.writeFileSync(STATUS_FILE, JSON.stringify({...s, running: false}) + '\n'); } catch(e) {}

return merged.map(offer => ({ json: offer }));
