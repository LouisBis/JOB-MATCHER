const fs = require('fs');
try { const s = JSON.parse(fs.readFileSync('/data/status/status.json','utf-8')); fs.writeFileSync('/data/status/status.json', JSON.stringify({...s, step: 3}) + '\n'); } catch(e) {}

/**
 * Pre-filters job offers by title before the expensive LLM scoring step.
 * Drops any offer whose title contains a keyword from FILTER_EXCLUDE (case-insensitive).
 * If FILTER_EXCLUDE is not set, all items pass through unchanged.
 *
 * @example FILTER_EXCLUDE=java,python,devops,data engineer,chef de projet
 * @returns {Array<{json}>} - Items that passed the filter
 */
const raw = $env.FILTER_EXCLUDE || '';

if (!raw.trim()) {
  return $input.all();
}

const excluded = raw.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);

return $input.all().filter(item => {
  const title = (item.json.title || '').toLowerCase();
  return !excluded.some(kw => title.includes(kw));
});
