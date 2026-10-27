import { posix } from 'node:path';
import ignore from 'ignore';
import { readBlob, readTree } from './git.js';
import type { Repository } from './git.js';
import { decodeText } from './text.js';

export type Snapshot = Map<string, string>;

export function eligiblePath(path: string, rules: ReadonlyMap<string, string>): boolean {
  const parts = path.split('/');
  const name = parts.at(-1)!;
  if (parts.some((part) => ['.git', 'node_modules', 'dist'].includes(part.toLowerCase()))) return false;
  if (['.docsync.json', 'changelog.md'].includes(name.toLowerCase())) return false;
  if ((/^\.env(?:\.|$)/i.test(name) && name !== '.env.example') || /\.(pem|key|p12)$/i.test(name)) return false;
  let excluded = false;
  for (let depth = 0; depth < parts.length; depth++) {
    const directory = parts.slice(0, depth).join('/');
    const content = rules.get(directory);
    if (content !== undefined) {
      const matcher = ignore().add(content);
      const local = parts.slice(depth).join('/');
      const result = matcher.test(local);
      if (result.ignored) excluded = true;
      if (result.unignored) excluded = false;
      for (let end = 1; end < parts.length - depth; end++) {
        if (matcher.ignores(parts.slice(depth, depth + end).join('/') + '/')) return false;
      }
    }
  }
  return !excluded;
}

export async function scanRepository(repo: Repository, sha = repo.head): Promise<Snapshot> {
  const entries = await readTree(repo, sha);
  const rules = new Map<string, string>();
  for (const entry of entries) {
    if (posix.basename(entry.path) === '.gitignore' && eligiblePath(entry.path, new Map())) {
      const directory = posix.dirname(entry.path);
      rules.set(directory === '.' ? '' : directory, decodeText(await readBlob(repo, entry.oid)));
    }
  }
  const snapshot: Snapshot = new Map();
  for (const entry of entries.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)) {
    if (!eligiblePath(entry.path, rules)) continue;
    const bytes = await readBlob(repo, entry.oid);
    try { snapshot.set(entry.path, decodeText(bytes)); }
    catch {
      if (['README.md', 'package.json', 'pyproject.toml'].includes(posix.basename(entry.path))) {
        throw new Error('Unsupported text encoding.');
      }
      snapshot.set(entry.path, '');
    }
  }
  return snapshot;
}