/**
 * Returns a single offer matching the :id route parameter.
 * Responds with 404 if not found.
 *
 * @returns {Array<{json: Offer}>}
 */
const fs = require('fs');

const FILE = '/data/offers/offers.json';
const id   = $request.params.id;

if (!id) {
  throw new Error('Missing route parameter: id');
}

if (!fs.existsSync(FILE)) {
  $respond({ statusCode: 404, body: { error: 'No offers found' } });
  return [];
}

let offers;
try {
  offers = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
} catch (err) {
  throw new Error(`Cannot read offers file: ${err.message}`);
}

const offer = offers.find(o => o.id === id);

if (!offer) {
  $respond({ statusCode: 404, body: { error: `Offer ${id} not found` } });
  return [];
}

return [{ json: offer }];
