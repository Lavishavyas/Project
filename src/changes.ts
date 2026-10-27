import type { Repository } from './git.js';
import { shaSchema } from './git.js';
import type { Snapshot } from './inventory.js';

export interface Change { path: string; kind: 'added' | 'deleted' | 'modified' }

export function detectChanges(before: Snapshot, after: Snapshot): Change[] {
  const result: Change[] = [];
  for (const path of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    if (!before.has(path)) result.push({ path, kind: 'added' });
    else if (!after.has(path)) result.push({ path, kind: 'deleted' });
    else if (before.get(path) !== after.get(path)) result.push({ path, kind: 'modified' });
  }
  return result;
}

export async function readChanges(repo: Repository, baseline: string, before: Snapshot, after: Snapshot): Promise<Change[]> {
  shaSchema.parse(baseline);
  let paths: string[];
  try {
    paths = (await repo.git.diff(['--name-only', '--no-renames', '-z', `${baseline}..${repo.head}`])).split('\0');
  } catch { throw new Error('Cannot compare baseline commits.'); }
  const changes = detectChanges(before, after);
  for (const path of paths) {
    if (before.has(path) && after.has(path) && !/(?:^|\/)readme\.md$/i.test(path) && !changes.some((change) => change.path === path)) {
      changes.push({ path, kind: 'modified' });
    }
  }
  return changes.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}