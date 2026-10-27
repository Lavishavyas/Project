import type { Repository } from './git.js';
import type { Baseline } from './baseline.js';
import type { Change } from './changes.js';
import { readChanges } from './changes.js';
import { scanRepository } from './inventory.js';
import type { Snapshot } from './inventory.js';
import { extractEvidence } from './evidence.js';
import { extractEnvironment } from './environment.js';
import { generateSections, ownedRanges, renderReadme, SECTION_NAMES, stripOwned } from './readme.js';
import type { SectionName, Sections } from './readme.js';
import { mapImpacts } from './impact.js';
import { planChangelog, planState } from './planning.js';
import { decodeText } from './text.js';
import { formatDiagnostic } from './security.js';

export const OUTPUT_NAMES = ['README.md', 'CHANGELOG.md', '.docsync.json'] as const;
export type OutputName = typeof OUTPUT_NAMES[number];
export type Destinations = Record<OutputName, Buffer | undefined>;
export interface SyncPlan {
  files: Destinations; original: Destinations; changes: Change[]; updated: SectionName[];
  sections: Sections; entry: string; beforeSha: string | undefined; head: string; warnings: string[];
}

export function semanticSnapshot(snapshot: Snapshot): Snapshot {
  const result = new Map(snapshot);
  for (const [path, content] of result) {
    if (/(?:^|\/)readme\.md$/i.test(path)) {
      const manual = stripOwned(content).trim();
      if (manual) result.set(path, manual);
      else result.delete(path);
    }
  }
  return result;
}

export async function createSyncPlan(repo: Repository, baseline: Baseline, original: Destinations, date = new Date()): Promise<SyncPlan> {
  const current = semanticSnapshot(await scanRepository(repo));
  let changes: Change[] = [];
  if (baseline.sha) changes = await readChanges(repo, baseline.sha, semanticSnapshot(await scanRepository(repo, baseline.sha)), current);
  const readme = original['README.md'] === undefined ? '' : decodeText(original['README.md']);
  const changelog = original['CHANGELOG.md'] === undefined ? '' : decodeText(original['CHANGELOG.md']);
  const owned = ownedRanges(readme);
  const missing = SECTION_NAMES.filter((name) => !owned.some((range) => range.name === name));
  const sections = generateSections(extractEvidence(current, current.get('README.md') ?? ''), extractEnvironment(current));
  const rendered = renderReadme(readme, sections, mapImpacts(changes, baseline.mode !== 'incremental', missing));
  const log = planChangelog(changelog, changes, rendered.updated, baseline.mode === 'initial', date);
  const warnings: string[] = [];
  if (repo.dirty) warnings.push(formatDiagnostic('dirty-working-tree'));
  if (baseline.mode === 'fallback') warnings.push(formatDiagnostic('missing-baseline'));
  if (current.size > 500) warnings.push('More than 500 eligible files; scanning all files without a 30-second guarantee.');
  return {
    files: { 'README.md': Buffer.from(rendered.text), 'CHANGELOG.md': original['CHANGELOG.md'] === undefined && !log.entry ? undefined : Buffer.from(log.text), '.docsync.json': Buffer.from(planState(repo.head)) },
    original, changes, updated: rendered.updated, sections, entry: log.entry, beforeSha: baseline.sha, head: repo.head, warnings,
  };
}