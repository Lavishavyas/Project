import { describe, expect, it } from 'vitest';
import { ownedRanges, stripOwned } from '../src/readme.js';

describe('ownedRanges and stripOwned', () => {
  it('uses original UTF-8 bytes and preserves manual text', () => {
    const text = '\ufeffcaf\u00e9 \ud83d\ude00\r\n<!-- docsync:start purpose -->\r\nold\r\n<!-- docsync:end purpose -->\r\nmanual';
    const ranges = ownedRanges(text);
    expect(ranges).toHaveLength(1);
    expect(Buffer.from(text).subarray(ranges[0]!.start, ranges[0]!.end).toString()).toContain('old');
    expect(stripOwned(text)).toBe('\ufeffcaf\u00e9 \ud83d\ude00\r\n\r\nmanual');
  });
  it('does not claim fenced or inline examples and allows absent evidence', () => {
    const text = '```html\n<!-- docsync:start purpose -->\n```\n\n`<!-- docsync:end purpose -->`';
    expect(ownedRanges(text)).toEqual([]);
    expect(stripOwned(text)).toBe(text);
    expect(ownedRanges('')).toEqual([]);
    expect(ownedRanges('<div><!-- docsync:start purpose --></div>')).toEqual([]);
  });
  it.each([
    '<!-- docsync:start unknown -->',
    '<!-- docsync:end purpose -->',
    '<!-- docsync:start purpose -->',
    '<!-- docsync:start purpose -->\n<!-- docsync:end usage -->',
    '<!-- docsync:start purpose -->\n<!-- docsync:start usage -->',
    '<!-- docsync:start purpose -->\n<!-- docsync:end purpose -->\n<!-- docsync:start purpose -->',
  ])('rejects invalid ownership before any mutation', (text) => {
    expect(() => ownedRanges(text)).toThrow('Invalid README section markers.');
    expect(() => stripOwned(text)).toThrow('Invalid README section markers.');
  });
});