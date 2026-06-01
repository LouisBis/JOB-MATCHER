/**
 * Tests for the write-cv.js n8n Code node.
 * Covers: input validation, filename sanitization, file writes, return shape.
 */
const path = require('path');
const { runNode } = require('./helpers/run-node');

jest.mock('fs');
const fs = require('fs');

// Load source once using the real fs, bypassing the Jest mock
const CODE = jest.requireActual('fs').readFileSync(
  path.resolve(__dirname, '../code/write-cv.js'),
  'utf-8',
);

function makeInput(body) {
  return {
    $input: { first: () => ({ json: { body } }) },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  fs.mkdirSync.mockImplementation(() => {});
  fs.writeFileSync.mockImplementation(() => {});
});

describe('write-cv — input validation', () => {
  test('throws when text is empty', () => {
    expect(() => runNode(CODE, makeInput({ text: '', filename: 'cv.txt' })))
      .toThrow('CV content is empty');
  });

  test('throws when text is whitespace only', () => {
    expect(() => runNode(CODE, makeInput({ text: '   ', filename: 'cv.txt' })))
      .toThrow('CV content is empty');
  });

  test('throws when text exceeds 1 MB', () => {
    const bigText = 'a'.repeat(1_000_001);
    expect(() => runNode(CODE, makeInput({ text: bigText, filename: 'cv.txt' })))
      .toThrow('CV content exceeds 1 MB limit');
  });
});

describe('write-cv — filename sanitization', () => {
  test('strips path traversal via path.basename', () => {
    const result = runNode(CODE, makeInput({ text: 'hello', filename: '../../../etc/passwd' }));
    expect(result[0].json.filename).toBe('passwd');
  });

  test('replaces special chars with underscores', () => {
    const result = runNode(CODE, makeInput({ text: 'hello', filename: 'my cv!@#.txt' }));
    expect(result[0].json.filename).toBe('my cv___.txt');
  });

  test('falls back to cv.txt when filename is absent', () => {
    const result = runNode(CODE, makeInput({ text: 'hello' }));
    expect(result[0].json.filename).toBe('cv.txt');
  });

  test('accepts valid filenames unchanged', () => {
    const result = runNode(CODE, makeInput({ text: 'hello', filename: 'louis-cv_v2.txt' }));
    expect(result[0].json.filename).toBe('louis-cv_v2.txt');
  });
});

describe('write-cv — file writes', () => {
  test('writes trimmed content + newline to cv.txt', () => {
    runNode(CODE, makeInput({ text: '  mon cv content  ', filename: 'cv.txt' }));
    expect(fs.writeFileSync).toHaveBeenCalledWith('/data/cv/cv.txt', 'mon cv content\n');
  });

  test('writes both cv.txt and cv.meta.json', () => {
    runNode(CODE, makeInput({ text: 'content', filename: 'cv.txt' }));
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    const calls = fs.writeFileSync.mock.calls.map(([p]) => p);
    expect(calls).toContain('/data/cv/cv.txt');
    expect(calls).toContain('/data/cv/cv.meta.json');
  });
});

describe('write-cv — return value', () => {
  test('returns success:true with filename and uploadedAt', () => {
    const result = runNode(CODE, makeInput({ text: 'mon cv', filename: 'cv.txt' }));
    expect(result[0].json.success).toBe(true);
    expect(result[0].json.filename).toBe('cv.txt');
    expect(result[0].json.uploadedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('write-cv — legacy format (no body wrapper)', () => {
  test('falls back to root json when body is absent', () => {
    const context = {
      $input: { first: () => ({ json: { text: 'hello', filename: 'cv.txt' } }) },
    };
    const result = runNode(CODE, context);
    expect(result[0].json.success).toBe(true);
  });
});
