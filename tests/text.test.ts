import { describe, expect, it } from 'vitest';
import { byteOffset, decodeText, lineEnding } from '../src/text.js';

describe('decodeText', () => {
  it('preserves UTF-8, BOM and line endings', () => {
    const text = '\ufeffcaf\u00e9 \ud83d\ude00\r\nmanual\n';
    expect(decodeText(Buffer.from(text))).toBe(text);
  });
  it('rejects invalid bytes, NUL and non-byte inputs safely', () => {
    for (const input of [Buffer.from([0xff]), Buffer.from([0]), undefined, 'text']) {
      expect(() => decodeText(input)).toThrow('Unsupported text encoding.');
    }
  });
});

describe('byteOffset', () => {
  it('maps string offsets without normalizing original bytes', () => {
    const text = 'caf\u00e9 \ud83d\ude00';
    expect(byteOffset(text, 4)).toBe(5);
    expect(byteOffset(text, text.length)).toBe(Buffer.from(text).length);
    expect(byteOffset(text, 0)).toBe(0);
  });
  it('rejects out-of-range and split-surrogate boundaries', () => {
    for (const offset of [-1, 0.5, 1, 3, NaN]) {
      expect(() => byteOffset('\ud83d\ude00', offset)).toThrow('Invalid text boundary.');
    }
  });
});

describe('lineEnding', () => {
  it('uses the first existing newline without normalizing mixed text', () => {
    expect(lineEnding('first\r\nsecond\n')).toBe('\r\n');
    expect(lineEnding('first\nsecond\r\n')).toBe('\n');
  });
  it('falls back to LF when no newline evidence exists', () => {
    expect(lineEnding('')).toBe('\n');
    expect(lineEnding('manual')).toBe('\n');
  });
});