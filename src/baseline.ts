import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { assertSafePath, shaSchema } from './git.js';
import type { Repository } from './git.js';
import { decodeText } from './text.js';

export const stateSchema = z.strictObject({ lastSyncedSha: shaSchema });
export interface Baseline { mode: 'initial' | 'incremental' | 'fallback'; sha: string | undefined }

export async function readBaseline(repo: Repository): Promise<Baseline> {
  const path = join(repo.root, '.docsync.json');
  await assertSafePath(path);
  let bytes: Buffer;
  try { bytes = await readFile(path); }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { mode: 'initial', sha: undefined };
    }
    throw new Error('Invalid sync state.');
  }
  let sha: string;
  try { sha = stateSchema.parse(JSON.parse(decodeText(bytes))).lastSyncedSha; }
  catch { throw new Error('Invalid sync state.'); }
  try {
    if ((await repo.git.raw(['cat-file', '-t', sha])).trim() === 'commit') {
      return { mode: 'incremental', sha };
    }
  } catch {}
  return { mode: 'fallback', sha: undefined };
}