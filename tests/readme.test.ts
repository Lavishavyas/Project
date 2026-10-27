import { describe, expect, it } from 'vitest';
import { generateSections, ownedRanges, renderReadme, SECTION_NAMES, stripOwned } from '../src/readme.js';
import { extractEvidence } from '../src/evidence.js';

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

describe('generateSections and renderReadme', () => {
  it('creates all sections and uses Not Found without inventing evidence', () => {
    const sections = generateSections(extractEvidence(new Map()), []);
    const rendered = renderReadme('', sections, new Set());
    expect(ownedRanges(rendered.text).map((range) => range.name)).toEqual([...SECTION_NAMES]);
    expect(sections['tech-stack']).toBe('Not Found');
    expect(sections['environment-variables']).toBe('Not Found');
    expect(rendered.updated).toHaveLength(7);
  });
  it('preserves manual bytes and unaffected sections while updating only impacts', () => {
    const sections = generateSections(extractEvidence(new Map([['package.json', '{"name":"initial"}']])), ['VARIABLE']);
    const first = renderReadme('\ufeffmanual \ud83d\ude00\r\n', sections, new Set()).text;
    const changed = { ...sections, purpose: 'changed', usage: 'must not change' };
    const next = renderReadme(first, changed, new Set(['purpose']));
    expect(next.text.startsWith('\ufeffmanual \ud83d\ude00\r\n')).toBe(true);
    expect(next.updated).toEqual(['purpose']);
    expect(next.text.includes('must not change')).toBe(false);
    expect(renderReadme(next.text, changed, new Set()).text).toBe(next.text);
  });
  it('rejects malformed ownership and escapes marker-like evidence', () => {
    const sections = generateSections(extractEvidence(new Map()), []);
    expect(() => renderReadme('<!-- docsync:end purpose -->', sections, new Set())).toThrow('Invalid README');
    expect(renderReadme('', { ...sections, purpose: '<!-- docsync:start usage -->' }, new Set()).text)
      .toContain('&lt;!-- docsync:start usage -->');
  });
});