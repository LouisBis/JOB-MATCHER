/**
 * Tests for the deduplicate.js n8n Code node.
 * Covers: new/seen offers filtering, seenOffers mutation, early-exit on empty, cap at 500.
 */
const path = require('path');
const { runNode } = require('./helpers/run-node');

jest.mock('fs');
const fs = require('fs');

const CODE = jest.requireActual('fs').readFileSync(
  path.resolve(__dirname, '../code/deduplicate.js'),
  'utf-8',
);

const OFFER_A = { url: 'https://example.com/job/a', title: 'Dev A' };
const OFFER_B = { url: 'https://example.com/job/b', title: 'Dev B' };

function makeContext(offers, staticData = {}) {
  return {
    $input: {
      // Pass offers as array → deduplicate uses the Array.isArray branch
      first: () => ({ json: offers }),
      all: () => offers.map((o) => ({ json: o })),
    },
    $getWorkflowStaticData: () => staticData,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: status file exists with a running pipeline
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(JSON.stringify({ running: true, step: 1 }));
  fs.writeFileSync.mockImplementation(() => {});
});

describe('deduplicate — filtering', () => {
  test('returns all offers when seenOffers is empty', () => {
    const result = runNode(CODE, makeContext([OFFER_A, OFFER_B], {}));
    expect(result).toHaveLength(2);
  });

  test('filters out already-seen offers', () => {
    const staticData = { seenOffers: [OFFER_A.url] };
    const result = runNode(CODE, makeContext([OFFER_A, OFFER_B], staticData));
    expect(result).toHaveLength(1);
    expect(result[0].json.title).toBe('Dev B');
  });

  test('returns empty array when all offers are already seen', () => {
    const staticData = { seenOffers: [OFFER_A.url, OFFER_B.url] };
    const result = runNode(CODE, makeContext([OFFER_A, OFFER_B], staticData));
    expect(result).toHaveLength(0);
  });
});

describe('deduplicate — seenOffers mutation', () => {
  test('adds new offer urls to seenOffers', () => {
    const staticData = {};
    runNode(CODE, makeContext([OFFER_A], staticData));
    expect(staticData.seenOffers).toContain(OFFER_A.url);
  });

  test('initialises seenOffers when missing from staticData', () => {
    const staticData = {};
    runNode(CODE, makeContext([OFFER_A], staticData));
    expect(Array.isArray(staticData.seenOffers)).toBe(true);
  });

  test('does not add duplicate url to seenOffers', () => {
    const staticData = { seenOffers: [OFFER_A.url] };
    runNode(CODE, makeContext([OFFER_A], staticData));
    const occurrences = staticData.seenOffers.filter((u) => u === OFFER_A.url).length;
    expect(occurrences).toBe(1);
  });
});

describe('deduplicate — early exit on no new offers', () => {
  test('writes running:false to status.json when all offers are already seen', () => {
    const staticData = { seenOffers: [OFFER_A.url] };
    runNode(CODE, makeContext([OFFER_A], staticData));

    const statusWrites = fs.writeFileSync.mock.calls.filter(
      ([file]) => file === '/data/status/status.json',
    );
    const lastWrite = statusWrites[statusWrites.length - 1][1];
    expect(JSON.parse(lastWrite).running).toBe(false);
  });

  test('does NOT write running:false when there are new offers', () => {
    const staticData = {};
    runNode(CODE, makeContext([OFFER_A], staticData));

    const statusWrites = fs.writeFileSync.mock.calls.filter(
      ([file]) => file === '/data/status/status.json',
    );
    // Only the step-update write at the top; no running:false
    const anyFalse = statusWrites.some(([, content]) => {
      try { return JSON.parse(content).running === false; } catch { return false; }
    });
    expect(anyFalse).toBe(false);
  });
});

describe('deduplicate — history cap', () => {
  test('caps seenOffers at 500 entries', () => {
    // Fill to 499, add 2 new → triggers cap to last 500
    const seen = Array.from({ length: 499 }, (_, i) => `url-${i}`);
    const staticData = { seenOffers: seen };
    runNode(CODE, makeContext([OFFER_A, OFFER_B], staticData));
    expect(staticData.seenOffers.length).toBeLessThanOrEqual(500);
  });
});
