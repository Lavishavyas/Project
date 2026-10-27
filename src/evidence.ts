import { posix } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';
import type { Snapshot } from './inventory.js';
import { extractNode, extractPython } from './manifests.js';
import type { ManifestEvidence } from './manifests.js';
import { sanitizeEvidence } from './security.js';

export const markdown = unified().use(remarkParse).use(remarkGfm);
export interface ReadmeEvidence { name: string; purpose: string; usage: string }
export interface Evidence { name: string; purpose: string; stacks: string[]; setup: string[]; usage: string[]; structure: string[] }

export function extractReadmeEvidence(manual: string): ReadmeEvidence {
  manual = manual.replace(/^\ufeff/, '');
  const nodes = markdown.parse(manual).children;
  const heading = nodes.find((node) => node.type === 'heading' && node.depth === 1);
  const paragraph = nodes.find((node) => node.type === 'paragraph' && toString(node, { includeImageAlt: false }).trim() !== '' && !/^\s*\[!\[/.test(manual.slice(node.position!.start.offset, node.position!.end.offset)));
  const usageIndex = nodes.findIndex((node) => node.type === 'heading' && /^#{1,6}\s/.test(manual.slice(node.position!.start.offset)) && toString(node).toLowerCase() === 'usage');
  let usage = '';
  if (usageIndex >= 0) {
    const node = nodes[usageIndex]!;
    const depth = node.type === 'heading' ? node.depth : 6;
    const end = nodes.slice(usageIndex + 1).find((candidate) => candidate.type === 'heading' && candidate.depth <= depth);
    usage = manual.slice(node.position!.end.offset, end?.position?.start.offset).trim();
  }
  return {
    name: sanitizeEvidence(heading ? toString(heading) : undefined),
    purpose: sanitizeEvidence(paragraph ? toString(paragraph, { includeImageAlt: false }).replace(/\r?\n/g, ' ') : undefined),
    usage: sanitizeEvidence(usage),
  };
}

export function extractEvidence(snapshot: Snapshot, manualReadme = ''): Evidence {
  const directories = [...new Set([...snapshot.keys()]
    .filter((path) => ['package.json', 'pyproject.toml', 'requirements.txt'].includes(posix.basename(path)))
    .map((path) => posix.dirname(path)))].sort((left, right) => left === '.' ? -1 : right === '.' ? 1 : left < right ? -1 : left > right ? 1 : 0);
  const facts: Array<{ directory: string; evidence: ManifestEvidence }> = [];
  for (const directory of directories) {
    const node = snapshot.get(posix.join(directory, 'package.json'));
    if (node !== undefined) facts.push({ directory, evidence: extractNode(node) });
    const python = snapshot.get(posix.join(directory, 'pyproject.toml'));
    const requirements = snapshot.has(posix.join(directory, 'requirements.txt'));
    if (python !== undefined || requirements) facts.push({ directory, evidence: extractPython(python, requirements) });
  }
  const fallback = extractReadmeEvidence(manualReadme);
  const setup: string[] = [];
  const usage: string[] = [];
  for (const { directory, evidence } of facts) {
    if (evidence.setup !== 'Not Found') setup.push(directory === '.' ? evidence.setup : `${directory}: ${evidence.setup}`);
    for (const command of evidence.usage) usage.push(directory === '.' ? command : `${directory}: ${command}`);
  }
  return {
    name: facts.find(({ evidence }) => evidence.name !== 'Not Found')?.evidence.name ?? fallback.name,
    purpose: facts.find(({ evidence }) => evidence.purpose !== 'Not Found')?.evidence.purpose ?? fallback.purpose,
    stacks: [...new Set(facts.map(({ evidence }) => evidence.stack))],
    setup: [...new Set(setup)], usage: usage.length ? [...new Set(usage)] : fallback.usage === 'Not Found' ? [] : [fallback.usage],
    structure: [...snapshot.keys()].sort(),
  };
}