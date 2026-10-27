import { execFile } from 'node:child_process';
import { lstat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { simpleGit } from 'simple-git';
import type { SimpleGit } from 'simple-git';
import { z } from 'zod';
import { parseLocalRequest } from './validation.js';

const execute = promisify(execFile);
export const shaSchema = z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);
export interface Repository { root: string; head: string; dirty: boolean; git: SimpleGit }
export interface TreeEntry { path: string; oid: string; mode: string }

export async function assertSafePath(target: string): Promise<void> {
  let current = resolve(target);
  while (true) {
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new Error('Unsafe repository or output path.');
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
        throw new Error('Unsafe repository or output path.');
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

export async function openRepository(input: unknown): Promise<Repository> {
  const { path } = parseLocalRequest({ path: input });
  await assertSafePath(path);
  try {
    if (!(await lstat(path)).isDirectory()) throw new Error();
    const git = simpleGit(resolve(path));
    const root = (await git.revparse(['--show-toplevel'])).trim();
    await assertSafePath(root);
    let head: string;
    try { head = shaSchema.parse((await git.revparse(['HEAD'])).trim()); }
    catch { throw new Error('The repository has no commits.'); }
    return { root, head, git: simpleGit(root), dirty: !(await git.status()).isClean() };
  } catch (error) {
    if (error instanceof Error && error.message === 'The repository has no commits.') throw error;
    throw new Error('The path is missing or is not a git repository.');
  }
}

export async function readTree(repo: Repository, sha: string): Promise<TreeEntry[]> {
  shaSchema.parse(sha);
  try {
    const output = await repo.git.raw(['ls-tree', '-r', '-z', sha]);
    return output.split('\0').flatMap((record) => {
      const match = /^(\d+) blob ([a-f0-9]+)\t([\s\S]*)$/.exec(record);
      return match && match[1] !== '120000'
        ? [{ mode: match[1]!, oid: match[2]!, path: match[3]! }] : [];
    });
  } catch { throw new Error('Cannot read committed repository tree.'); }
}

export async function readBlob(repo: Repository, oid: string): Promise<Buffer> {
  if (!shaSchema.safeParse(oid).success) throw new Error('Cannot read committed file.');
  try {
    const result = await execute('git', ['cat-file', 'blob', oid], {
      cwd: repo.root, encoding: 'buffer', maxBuffer: 32 * 1024 * 1024,
    });
    return result.stdout;
  } catch { throw new Error('Cannot read committed file.'); }
}