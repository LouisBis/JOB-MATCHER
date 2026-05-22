/**
 * Maps Indeed (via Apify) job offers to the common normalized schema.
 *
 * @returns {Array<{json: {url, title, company, city, description, source}}>}
 */
const input = $input.first().json;
const offers = Array.isArray(input) ? input : $input.all().map(i => i.json);

return offers.map(offer => ({
  json: {
    url:         offer.url || offer.key || '',
    title:       offer.title || '',
    company:     offer.employer?.name || '',
    city:        offer.location?.city || '',
    description: (offer.description?.text || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000),
    source:      'indeed',
  },
}));
