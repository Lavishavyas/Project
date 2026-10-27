import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { simpleGit } from 'simple-git';
import { afterEach, expect, it } from 'vitest';
import { detectChanges, readChanges } from '../src/changes.js';
import { openRepository } from '../src/git.js';
import { scanRepository } from '../src/inventory.js';
import { createFixture, fixtureRoots } from './fixtures.js';

afterEach(async () => { await Promise.all(fixtureRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

it('detects changes and effective inventory transitions, including rename endpoints', () => {
  expect(detectChanges(new Map([['old', 'a'], ['same', 'x'], ['edit', 'a']]), new Map([['new', 'a'], ['same', 'x'], ['edit', 'b']])))
    .toEqual([{ path: 'edit', kind: 'modified' }, { path: 'new', kind: 'added' }, { path: 'old', kind: 'deleted' }]);
  expect(detectChanges(new Map(), new Map())).toEqual([]);
});

it('runs the committed diff and accounts for ignore-only commits', async () => {
  const root = await createFixture({ 'keep.txt': 'keep', '.gitignore': '' });
  const initial = await openRepository(root);
  const before = await scanRepository(initial);
  await writeFile(join(root, '.gitignore'), 'keep.txt');
  await simpleGit(root).add('.gitignore').commit('ignore tracked file');
  const repo = await openRepository(root);
  const changes = await readChanges(repo, initial.head, before, await scanRepository(repo));
  expect(changes).toContainEqual({ path: 'keep.txt', kind: 'deleted' });
  await expect(readChanges(repo, 'f'.repeat(40), before, new Map())).rejects.toThrow('Cannot compare baseline commits.');
});

it('retains git-reported example changes after discarding example values', async () => {
  const root = await createFixture({ '.env.example': 'NAME=first-synthetic' });
  const initial = await openRepository(root);
  const before = await scanRepository(initial);
  await writeFile(join(root, '.env.example'), 'NAME=second-synthetic');
  await simpleGit(root).add('.env.example').commit('example change');
  const repo = await openRepository(root);
  const after = await scanRepository(repo);
  expect(before.get('.env.example')).toBe('NAME=');
  expect(after.get('.env.example')).toBe('NAME=');
  expect(await readChanges(repo, initial.head, before, after)).toEqual([{ path: '.env.example', kind: 'modified' }]);
});