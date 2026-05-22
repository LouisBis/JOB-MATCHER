const fs = require('fs');

let cvContent;
try {
  cvContent = fs.readFileSync('/data/cv/cv.txt', 'utf-8').trim();
} catch (err) {
  throw new Error(`Cannot read CV file: ${err.message}`);
}

return $input.all().map(item => {
  const title = item.json.title || 'Untitled';
  const link = item.json.url || '';
  const creator = item.json.employer?.name || '';
  const city = item.json.location?.city || '';

  const rawDesc = item.json.description?.text || '';
  // Truncate to avoid exceeding the model context window (4096 tokens)
  const description = rawDesc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);

  const prompt = [
    'Score the following job offer against the candidate CV.',
    'Return ONLY a valid JSON object with these exact keys:',
    '  score (integer 1-10)',
    '  match_reasons (array of strings)',
    '  concerns (array of strings)',
    '  summary (string, max 2 sentences)',
    '',
    'CV:',
    cvContent,
    '',
    'Job offer:',
    `Title: ${title}`,
    city ? `Location: ${city}` : '',
    `Description: ${description || 'N/A'}`,
  ].filter(Boolean).join('\n');

  return {
    json: {
      title,
      link,
      creator,
      body: {
        model: $env.OLLAMA_MODEL || 'mistral',
        prompt,
        stream: false,
        keep_alive: -1,
        num_predict: 512,
        // Forces the model to output valid JSON — eliminates all parsing issues
        format: 'json',
      },
    },
  };
});
