// Persist seen offer IDs across executions — avoids re-notifying the same offer
const staticData = $getWorkflowStaticData('global');
if (!staticData.seenOffers) staticData.seenOffers = [];

// Apify sync endpoint returns a JSON array in a single item
const input = $input.first().json;
const offers = Array.isArray(input) ? input : $input.all().map(i => i.json);

const newItems = [];
for (const offer of offers) {
  const id = offer.url || offer.key;
  if (id && !staticData.seenOffers.includes(id)) {
    staticData.seenOffers.push(id);
    newItems.push({ json: offer });
  }
}

// Cap history to prevent unbounded memory growth
if (staticData.seenOffers.length > 500) {
  staticData.seenOffers = staticData.seenOffers.slice(-500);
}

return newItems;
