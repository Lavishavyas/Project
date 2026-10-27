import { markdown } from './evidence.js';
import type { Evidence } from './evidence.js';
import { sanitizeEvidence } from './security.js';
import { byteOffset, lineEnding } from './text.js';

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

export type Sections = Record<SectionName, string>;
export const SECTION_HEADINGS: Record<SectionName, string> = {
  'project-name': 'Project Name', purpose: 'Purpose', 'tech-stack': 'Tech Stack',
  setup: 'Setup/Install Steps', usage: 'Usage', 'project-structure': 'Project Structure',
  'environment-variables': 'Environment Variables',
};

export function generateSections(evidence: Evidence, environment: string[]): Sections {
  const list = (items: string[]): string => items.length
    ? items.map((item) => `- ${sanitizeEvidence(item)}`).join('\n') : 'Not Found';
  return {
    'project-name': sanitizeEvidence(evidence.name), purpose: sanitizeEvidence(evidence.purpose),
    'tech-stack': list(evidence.stacks), setup: list(evidence.setup), usage: list(evidence.usage),
    'project-structure': list(evidence.structure), 'environment-variables': list(environment),
  };
}

export function renderReadme(current: string, sections: Sections, impacted: ReadonlySet<SectionName>): { text: string; updated: SectionName[] } {
  const ranges = ownedRanges(current);
  const newline = lineEnding(current);
  const updated = new Set<SectionName>();
  const block = (name: SectionName): string => {
    const body = sanitizeEvidence(sections[name]).replace(/<!--/g, '&lt;!--').replace(/\r?\n/g, newline);
    return `<!-- docsync:start ${name} -->${newline}## ${SECTION_HEADINGS[name]}${newline}${newline}${body}${newline}<!-- docsync:end ${name} -->`;
  };
  let bytes = Buffer.from(current);
  for (const range of [...ranges].reverse()) {
    if (!impacted.has(range.name)) continue;
    const replacement = Buffer.from(block(range.name));
    if (!bytes.subarray(range.start, range.end).equals(replacement)) {
      bytes = Buffer.concat([bytes.subarray(0, range.start), replacement, bytes.subarray(range.end)]);
      updated.add(range.name);
    }
  }
  let text = bytes.toString('utf8');
  const missing = SECTION_NAMES.filter((name) => !ranges.some((range) => range.name === name));
  if (missing.length) {
    text += (text ? newline + newline : '') + missing.map(block).join(newline + newline) + newline;
    for (const name of missing) updated.add(name);
  }
  return { text, updated: SECTION_NAMES.filter((name) => updated.has(name)) };
}