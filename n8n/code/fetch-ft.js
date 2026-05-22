/**
 * Fetches job offers from the France Travail API using a client credentials OAuth flow,
 * then normalizes results to the common job offer schema.
 *
 * Uses Node's built-in https module — $helpers is not available in n8n Code nodes.
 * Returns an empty array if FT credentials are not configured.
 *
 * @returns {Array<{json: {url, title, company, city, description, source}}>}
 */
const https = require('https');

const clientId     = $env.FT_CLIENT_ID     || '';
const clientSecret = $env.FT_CLIENT_SECRET || '';
const query        = $env.APIFY_QUERY      || '';
const departement  = $env.FT_DEPARTEMENT   || '75';
const maxItems     = Math.min(Number($env.APIFY_MAX_ITEMS || 50), 150);

if (!clientId || !clientSecret) {
  return [];
}

/**
 * Makes an HTTPS request and returns the parsed JSON response.
 *
 * @param {{hostname, path, method, headers}} options
 * @param {string} [body]
 * @returns {Promise<object>}
 */
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} from ${options.hostname}: ${data.slice(0, 300)}`));
          return;
        }
        // 204 No Content = valid response with no body (e.g. zero search results)
        if (res.statusCode === 204 || data.trim() === '') {
          resolve({});
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`HTTP ${res.statusCode} — non-JSON response: "${data.slice(0, 400)}"`)); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Step 1: Get OAuth access token (France Travail requires Basic Auth, not body params)
const basicAuth  = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const tokenBody  = `grant_type=client_credentials&scope=${encodeURIComponent('api_offresdemploiv2 o2dsoffre')}`;

const tokenData = await httpsRequest({
  hostname: 'entreprise.francetravail.fr',
  path:     '/connexion/oauth2/access_token?realm=%2Fpartenaire',
  method:   'POST',
  headers:  {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type':  'application/x-www-form-urlencoded',
    'Content-Length': tokenBody.length,
  },
}, tokenBody);

const token = tokenData.access_token;
if (!token) {
  throw new Error('France Travail OAuth: no access_token in response');
}

// Step 2: Search job offers (range is 0-based, inclusive, max 150 per call)
// departement is optional — omit to search nationally
const searchPath = '/partenaire/offresdemploi/v2/offres/search?' +
  `motsCles=${encodeURIComponent(query)}` +
  (departement ? `&departement=${encodeURIComponent(departement)}` : '') +
  `&range=0-${maxItems - 1}`;

const jobsData = await httpsRequest({
  hostname: 'api.francetravail.io',
  path:     searchPath,
  method:   'GET',
  headers:  {
    Authorization: `Bearer ${token}`,
    Accept:        'application/json',
  },
});

const offers = Array.isArray(jobsData.resultats) ? jobsData.resultats : [];

// Step 3: Normalize to common schema — include structured metadata for better LLM scoring
return offers.map(offer => {
  const metadata = [
    offer.typeContratLibelle ? `Contract: ${offer.typeContratLibelle}`  : '',
    offer.experienceLibelle  ? `Experience: ${offer.experienceLibelle}` : '',
    offer.salaire?.libelle   ? `Salary: ${offer.salaire.libelle}`       : '',
  ].filter(Boolean).join(' | ');

  const description = [metadata, offer.description || '']
    .filter(Boolean)
    .join('\n')
    .slice(0, 1000);

  return {
    json: {
      url:         `https://candidat.francetravail.fr/offres/emploi/${offer.id}/detail`,
      title:       offer.intitule             || '',
      company:     offer.entreprise?.nom      || '',
      city:        offer.lieuTravail?.libelle || '',
      description,
      source:      'france-travail',
    },
  };
});
