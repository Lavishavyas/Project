import fs from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSafePath } from './git.js';
import { OUTPUT_NAMES } from './sync-plan.js';
import type { Destinations, OutputName } from './sync-plan.js';

export interface StagedOutput { name: OutputName; target: string; candidate: string; original: Buffer | undefined; mode: number | undefined }
export interface StagedOutputs { directory: string; items: StagedOutput[] }

export function equalBytes(left: Buffer | undefined, right: Buffer | undefined): boolean {
  return left === undefined ? right === undefined : right !== undefined && left.equals(right);
}

export async function readDestinations(root: string): Promise<Destinations> {
  const result: Destinations = { 'README.md': undefined, 'CHANGELOG.md': undefined, '.docsync.json': undefined };
  for (const name of OUTPUT_NAMES) {
    const target = join(root, name);
    await assertSafePath(target);
    try {
      if (!(await fs.lstat(target)).isFile()) throw new Error('Unsafe repository or output path.');
      result[name] = await fs.readFile(target);
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw new Error('Unsafe repository or output path.');
    }
  }
  return result;
}

export async function stageOutputs(root: string, original: Destinations, files: Destinations): Promise<StagedOutputs> {
  const protectedRoot = fileURLToPath(new URL('../samples/', import.meta.url));
  const relation = relative(protectedRoot, resolve(root));
  if (relation === '' || (!relation.startsWith('..') && !isAbsolute(relation))) throw new Error('Samples are read-only; use a disposable copy.');
  const current = await readDestinations(root);
  for (const name of OUTPUT_NAMES) {
    if (!equalBytes(current[name], original[name])) throw new Error('Output changed during sync.');
    if (files[name] === undefined && original[name] !== undefined) throw new Error('Invalid output plan.');
  }
  const directory = await fs.mkdtemp(join(root, '.docsync-stage-'));
  const items: StagedOutput[] = [];
  try {
    for (const name of OUTPUT_NAMES) {
      if (equalBytes(original[name], files[name])) continue;
      const target = join(root, name);
      const mode = original[name] === undefined ? undefined : (await fs.stat(target)).mode & 0o777;
      const candidate = join(directory, name);
      const bytes = files[name];
      if (bytes === undefined) throw new Error('Invalid output plan.');
      await fs.writeFile(candidate, bytes, { flag: 'wx', mode: mode ?? 0o600 });
      if (original[name] !== undefined) await fs.writeFile(join(directory, name + '.backup'), original[name], { flag: 'wx', mode: 0o600 });
      items.push({ name, target, candidate, original: original[name], mode });
    }
    return { directory, items };
  } catch {
    await fs.rm(directory, { recursive: true, force: true });
    throw new Error('Documentation could not be staged.');
  }
}