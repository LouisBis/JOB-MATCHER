// Read all env vars once and expose them as workflow data.
// $env is only accessible in Code nodes — this bridges the gap for HTTP Request nodes.
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
