/**
 * Tests for the parse-score.js n8n Code node.
 * Covers: valid parsing, preamble stripping, error cases, id stability.
 */
const path = require('path');
const { runNode } = require('./helpers/run-node');

const CODE = jest.requireActual('fs').readFileSync(
  path.resolve(__dirname, '../code/parse-score.js'),
  'utf-8',
);

const BASE_ORIGINAL = {
  title: 'Développeur Frontend',
  creator: 'Acme Corp',
  city: 'Paris',
  contractType: 'CDI',
  source: 'indeed',
  link: 'https://example.com/job/1',
  description: 'Description du poste',
  publishedAt: '2026-01-01',
};

const VALID_LLM_RESPONSE = JSON.stringify({
  score: 85,
  match_reasons: ['Angular expertise', 'Remote friendly'],
  concerns: ['Senior required'],
  summary: 'Bon match pour ce profil.',
});

function makeContext(responses, originals) {
  return {
    $input: {
      all: () => responses.map((r) => ({ json: { response: r } })),
    },
    $: () => ({
      all: () => originals.map((o) => ({ json: o })),
    }),
  };
}

describe('parse-score — valid response', () => {
  test('maps all fields from LLM response and original offer', () => {
    const [{ json }] = runNode(CODE, makeContext([VALID_LLM_RESPONSE], [BASE_ORIGINAL]));
    expect(json.score).toBe(85);
    expect(json.matchReasons).toEqual(['Angular expertise', 'Remote friendly']);
    expect(json.concerns).toEqual(['Senior required']);
    expect(json.summary).toBe('Bon match pour ce profil.');
    expect(json.title).toBe('Développeur Frontend');
    expect(json.company).toBe('Acme Corp');
    expect(json.location).toBe('Paris');
    expect(json.contractType).toBe('CDI');
    expect(json.source).toBe('indeed');
    expect(json.url).toBe('https://example.com/job/1');
    expect(json.id).toBeTruthy();
    expect(json.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('strips LLM preamble before the first {', () => {
    const withPreamble = 'Voici mon analyse :\n' + VALID_LLM_RESPONSE;
    const [{ json }] = runNode(CODE, makeContext([withPreamble], [BASE_ORIGINAL]));
    expect(json.score).toBe(85);
  });

  test('coerces score to a number', () => {
    const response = JSON.stringify({ score: '72', summary: 'ok' });
    const [{ json }] = runNode(CODE, makeContext([response], [BASE_ORIGINAL]));
    expect(typeof json.score).toBe('number');
    expect(json.score).toBe(72);
  });

  test('defaults match_reasons and concerns to [] when absent', () => {
    const response = JSON.stringify({ score: 50, summary: 'pas de raisons' });
    const [{ json }] = runNode(CODE, makeContext([response], [BASE_ORIGINAL]));
    expect(json.matchReasons).toEqual([]);
    expect(json.concerns).toEqual([]);
  });

  test('defaults summary to empty string when absent', () => {
    const response = JSON.stringify({ score: 60 });
    const [{ json }] = runNode(CODE, makeContext([response], [BASE_ORIGINAL]));
    expect(json.summary).toBe('');
  });
});

describe('parse-score — id stability', () => {
  test('generates the same id for the same source + link across runs', () => {
    const ctx = makeContext([VALID_LLM_RESPONSE], [BASE_ORIGINAL]);
    const [r1] = runNode(CODE, ctx);
    const [r2] = runNode(CODE, makeContext([VALID_LLM_RESPONSE], [BASE_ORIGINAL]));
    expect(r1.json.id).toBe(r2.json.id);
  });

  test('generates different ids for different links', () => {
    const other = { ...BASE_ORIGINAL, link: 'https://example.com/job/2' };
    const [r1] = runNode(CODE, makeContext([VALID_LLM_RESPONSE], [BASE_ORIGINAL]));
    const [r2] = runNode(CODE, makeContext([VALID_LLM_RESPONSE], [other]));
    expect(r1.json.id).not.toBe(r2.json.id);
  });
});

describe('parse-score — error cases', () => {
  test('throws when LLM response contains no JSON object', () => {
    expect(() => runNode(CODE, makeContext(['no json here'], [BASE_ORIGINAL])))
      .toThrow(/no JSON in response/);
  });

  test('throws when JSON is malformed', () => {
    expect(() => runNode(CODE, makeContext(['{bad: json}'], [BASE_ORIGINAL])))
      .toThrow(/LLM scoring failed/);
  });

  test('processes multiple items in a batch', () => {
    const other = { ...BASE_ORIGINAL, link: 'https://example.com/job/2', title: 'Dev B' };
    const result = runNode(
      CODE,
      makeContext([VALID_LLM_RESPONSE, VALID_LLM_RESPONSE], [BASE_ORIGINAL, other]),
    );
    expect(result).toHaveLength(2);
    expect(result[1].json.title).toBe('Dev B');
  });
});
