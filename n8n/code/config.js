// Read all env vars once and expose them as workflow data.
// $env is only accessible in Code nodes — this bridges the gap for HTTP Request nodes.

// Pipeline step manifest — single source of truth for progress tracking.
// Add a label here when adding a new step to the workflow.
const PIPELINE_STEPS = [
  'Récupération des offres',
  'Déduplication',
  'Filtrage',
  'Scoring Ollama',
  'Sauvegarde',
];

const fs = require('fs');
try {
  fs.mkdirSync('/data/status', { recursive: true });
  fs.writeFileSync('/data/status/status.json',
    JSON.stringify({ running: true, step: 1, steps: PIPELINE_STEPS }) + '\n');
} catch(e) {}

const actorId = $env.APIFY_ACTOR_ID || 'valig~indeed-jobs-scraper';

return [{
  json: {
    apifyToken:      $env.APIFY_TOKEN || '',
    apifyUrl:        `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`,
    apifyQuery:      $env.APIFY_QUERY || '',
    apifyLocation:   $env.APIFY_LOCATION || '',
    apifyCountry:    $env.APIFY_COUNTRY || 'fr',
    apifyMaxItems:   Number($env.APIFY_MAX_ITEMS || 50),
    apifyDatePosted: $env.APIFY_DATE_POSTED || '7',
  },
}];
