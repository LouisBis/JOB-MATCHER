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

  return {
    json: {
      title: original.title,
      link: original.link,
      creator: original.creator,
      score: Number(parsed.score),
      matchReasons: Array.isArray(parsed.match_reasons) ? parsed.match_reasons : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      summary: parsed.summary || '',
      chatId: $env.TELEGRAM_CHAT_ID || '',
      minScore: Number($env.MIN_SCORE || 7),
    },
  };
});
