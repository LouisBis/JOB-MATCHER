/**
 * Parses the LLM JSON response and builds a complete Offer object
 * ready to be written to disk and served by the API webhooks.
 *
 * Reads original offer metadata from the Prepare Request node
 * to restore fields that were passed to the LLM but not returned.
 *
 * @returns {Array<{json: Offer}>}
 */
return $input.all().map((item, index) => {
  const raw = item.json.response || '';

  // Retrieve original offer data from the paired upstream item
  const original = $('Prepare Request').all()[index].json;

  const openIdx = raw.indexOf('{');
  if (openIdx === -1) {
    throw new Error(`LLM scoring failed for "${original.title}": no JSON in response`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw.slice(openIdx));
  } catch (err) {
    throw new Error(`LLM scoring failed for "${original.title}": ${err.message}`);
  }

  // Deterministic id — stable across runs for the same offer
  const idSource = `${original.source}::${original.link}`;
  const id = idSource.split('').reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0)
    .toString(36).replace('-', 'n');

  return {
    json: {
      id,
      title:        original.title,
      company:      original.creator,
      location:     original.city,
      contractType: original.contractType || '',
      source:       original.source,
      url:          original.link,
      description:  original.description,
      score:        Number(parsed.score),
      matchReasons: Array.isArray(parsed.match_reasons) ? parsed.match_reasons : [],
      concerns:     Array.isArray(parsed.concerns) ? parsed.concerns : [],
      summary:      parsed.summary || '',
      publishedAt:  original.publishedAt || '',
      fetchedAt:    new Date().toISOString(),
      // Kept for Telegram notification node
      chatId:   $env.TELEGRAM_CHAT_ID || '',
      minScore: Number($env.MIN_SCORE || 7),
    },
  };
});
