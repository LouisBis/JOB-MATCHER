const fs = require('fs');

let cvContent;
try {
  cvContent = fs.readFileSync('/data/cv/cv.txt', 'utf-8').trim();
} catch (err) {
  throw new Error(`Cannot read CV file: ${err.message}`);
}

return $input.all().map(item => {
  const title       = item.json.title       || 'Untitled';
  const link        = item.json.url         || '';
  const creator     = item.json.company     || '';
  const city        = item.json.city        || '';
  const source      = item.json.source      || '';
  // Already normalized and truncated upstream — no HTML stripping needed
  const description = item.json.description || '';

  const system = [
    'You are an experienced tech recruiter.',
    'Your job is to evaluate how well a job offer matches a candidate\'s profile.',
    'You read CVs carefully to infer the candidate\'s domain (frontend, backend, etc.),',
    'preferred contract type (CDI, freelance, etc.), seniority, and tech stack.',
    'You are strict: a domain or contract mismatch is a dealbreaker, not a minor concern.',
  ].join(' ');

  const prompt = [
    'Score the following job offer against the candidate CV.',
    '',
    'Rules:',
    '- Infer the candidate\'s preferred role, contract type, and seniority from the CV',
    '- A fundamental mismatch (wrong domain, wrong contract type) must result in a score of 1 to 3',
    '- A score of 8 to 10 requires strong alignment on stack, seniority, and contract type',
    '',
    'Return ONLY a valid JSON object with these exact keys:',
    '  score (integer 1-10)',
    '  match_reasons (array of strings)',
    '  concerns (array of strings)',
    '  summary (string: 2 sentences on the job itself — company, product, context — not the candidate)',
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
      source,
      ollamaUrl: `${$env.OLLAMA_BASE_URL || 'http://host.docker.internal:11434'}/api/generate`,
      body: {
        model: $env.OLLAMA_MODEL || 'mistral',
        system,
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
