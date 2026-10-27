import { markdown } from './evidence.js';
import { byteOffset } from './text.js';

export const SECTION_NAMES = ['project-name', 'purpose', 'tech-stack', 'setup', 'usage', 'project-structure', 'environment-variables'] as const;
export type SectionName = typeof SECTION_NAMES[number];
export interface OwnedRange { name: SectionName; start: number; end: number }

export function ownedRanges(text: string): OwnedRange[] {
  const ranges: OwnedRange[] = [];
  const seen = new Set<string>();
  let open: { name: SectionName; offset: number } | undefined;
  const prefix = text.startsWith('\ufeff') ? 1 : 0;
  for (const node of markdown.parse(text.slice(prefix)).children) {
    if (node.type !== 'html') continue;
    for (const comment of node.value.matchAll(/<!--[\s\S]*?-->/g)) {
      if (!comment[0].startsWith('<!-- docsync:')) continue;
      const offset = prefix + node.position!.start.offset! + comment.index;
      const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
      const newline = text.indexOf('\n', offset + comment[0].length);
      const lineEnd = newline < 0 ? text.length : newline;
      if (text.slice(lineStart, offset).trim() || text.slice(offset + comment[0].length, lineEnd).trim()) continue;
      const match = /^<!-- docsync:(start|end) ([a-z-]+) -->$/.exec(comment[0]);
      if (!match || !SECTION_NAMES.includes(match[2] as SectionName)) throw new Error('Invalid README section markers.');
      const name = match[2] as SectionName;
      if (match[1] === 'start') {
        if (open || seen.has(name)) throw new Error('Invalid README section markers.');
        seen.add(name);
        open = { name, offset };
      } else {
        if (!open || open.name !== name) throw new Error('Invalid README section markers.');
        ranges.push({ name, start: byteOffset(text, open.offset), end: byteOffset(text, offset + comment[0].length) });
        open = undefined;
      }
    }
  }
  if (open) throw new Error('Invalid README section markers.');
  return ranges;
}

export function stripOwned(text: string): string {
  let bytes = Buffer.from(text);
  for (const range of ownedRanges(text).reverse()) {
    bytes = Buffer.concat([bytes.subarray(0, range.start), bytes.subarray(range.end)]);
  }
  return bytes.toString('utf8');
}