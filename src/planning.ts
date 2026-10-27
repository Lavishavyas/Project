import type { Change } from './changes.js';
import type { SectionName } from './readme.js';
import { sanitizeEvidence } from './security.js';
import { lineEnding } from './text.js';
import { stateSchema } from './baseline.js';

export function planChangelog(current: string, changes: readonly Change[], updated: readonly SectionName[], initial: boolean, date: Date): { text: string; entry: string } {
  if (!initial && !changes.length && !updated.length) return { text: current, entry: '' };
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid changelog date.');
  const newline = lineEnding(current);
  const paths = changes.length ? changes.map((change) => `- ${change.kind}: ${sanitizeEvidence(change.path)}`).join('\n') : '- Not Found';
  const sections = updated.length ? updated.map((name) => `- ${name}: ${initial ? 'added' : 'changed'}`).join('\n') : '- No documentation changes';
  const entry = `## ${date.toISOString().slice(0, 10)} - ${initial ? 'Initial documentation sync' : 'Documentation sync'}\n\nChanged paths:\n${paths}\n\nDocumentation updates:\n${sections}\n`.replace(/\n/g, newline);
  return { text: current + (current ? newline + newline : '') + entry, entry };
}

export function planState(head: unknown): string {
  const parsed = stateSchema.safeParse({ lastSyncedSha: head });
  if (!parsed.success) throw new Error('Invalid sync state.');
  return JSON.stringify(parsed.data, null, 2) + '\n';
}