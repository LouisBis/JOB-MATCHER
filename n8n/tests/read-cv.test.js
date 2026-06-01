/**
 * Tests for the read-cv.js n8n Code node.
 * Covers: missing files, metadata + preview, truncation, malformed JSON.
 */
const path = require('path');
const { runNode } = require('./helpers/run-node');

jest.mock('fs');
const fs = require('fs');

const CODE = jest.requireActual('fs').readFileSync(
  path.resolve(__dirname, '../code/read-cv.js'),
  'utf-8',
);

const META = { filename: 'louis-cv.txt', uploadedAt: '2026-01-15T10:30:00Z' };

beforeEach(() => jest.clearAllMocks());

describe('read-cv — no files on disk', () => {
  test('returns exists:false and null fields when no files exist', () => {
    fs.existsSync.mockReturnValue(false);
    const [{ json }] = runNode(CODE);
    expect(json).toEqual({ filename: null, uploadedAt: null, preview: null, exists: false });
  });
});

describe('read-cv — both files present', () => {
  test('returns metadata and truncated preview (≤ 400 chars)', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((file) => {
      if (file.includes('cv.meta.json')) return JSON.stringify(META);
      return 'Louis Bis — Frontend Developer\n' + 'x'.repeat(500);
    });

    const [{ json }] = runNode(CODE);
    expect(json.filename).toBe('louis-cv.txt');
    expect(json.uploadedAt).toBe('2026-01-15T10:30:00Z');
    expect(json.exists).toBe(true);
    expect(json.preview.length).toBeLessThanOrEqual(400);
  });

  test('does not truncate previews shorter than 400 chars', () => {
    fs.existsSync.mockReturnValue(true);
    const shortContent = 'Short CV content.';
    fs.readFileSync.mockImplementation((file) => {
      if (file.includes('cv.meta.json')) return JSON.stringify(META);
      return shortContent;
    });

    const [{ json }] = runNode(CODE);
    expect(json.preview).toBe(shortContent);
  });
});

describe('read-cv — partial state', () => {
  test('returns exists:false when cv.txt is missing even if meta exists', () => {
    fs.existsSync.mockImplementation((f) => f.includes('cv.meta.json'));
    fs.readFileSync.mockReturnValue(JSON.stringify(META));

    const [{ json }] = runNode(CODE);
    expect(json.exists).toBe(false);
    expect(json.filename).toBe('louis-cv.txt'); // meta was read
  });
});

describe('read-cv — resilience', () => {
  test('returns null metadata when meta JSON is malformed', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((file) => {
      if (file.includes('cv.meta.json')) return 'NOT VALID JSON {{{';
      return 'CV content here';
    });

    const [{ json }] = runNode(CODE);
    expect(json.filename).toBeNull(); // meta parse failed → default
    expect(json.exists).toBe(true);  // cv.txt was still readable
  });
});
