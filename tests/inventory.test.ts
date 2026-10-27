import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { simpleGit } from 'simple-git';
import { afterEach, describe, expect, it } from 'vitest';
import { eligiblePath, scanRepository } from '../src/inventory.js';
import { openRepository } from '../src/git.js';
import { createFixture, fixtureRoots } from './fixtures.js';

afterEach(async () => { await Promise.all(fixtureRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

describe('eligiblePath', () => {
  it('applies nested rules, negations and excluded parent directories', () => {
    const rules = new Map([['', '*.tmp\nblocked/'], ['src', '!keep.tmp\n*.log']]);
    expect(eligiblePath('src/keep.tmp', rules)).toBe(true);
    expect(eligiblePath('src/file.log', rules)).toBe(false);
    expect(eligiblePath('blocked/file', rules)).toBe(false);
    expect(eligiblePath('src/main.ts', rules)).toBe(true);
  });
  it('excludes secret and generated files before access', () => {
    for (const path of ['.env', '.env.local', 'secret.pem', 'node_modules/x', 'dist/x', '.git/x', 'sub/.docsync.json', 'CHANGELOG.md']) {
      expect(eligiblePath(path, new Map())).toBe(false);
    }
    expect(eligiblePath('.env.example', new Map())).toBe(true);
  });
});

describe('scanRepository', () => {
  it('uses committed ignores even for tracked files and ignores dirty rules', async () => {
    const root = await createFixture({ '.gitignore': '*.tmp', 'ignored.tmp': 'ignored', 'keep.txt': 'committed', '.env': 'synthetic-only' });
    await simpleGit(root).add(['--force', 'ignored.tmp', '.env']).commit('force tracked');
    const repo = await openRepository(root);
    await writeFile(join(root, '.gitignore'), 'keep.txt');
    const snapshot = await scanRepository(repo);
    expect(snapshot.has('ignored.tmp')).toBe(false);
    expect(snapshot.has('.env')).toBe(false);
    expect(snapshot.get('keep.txt')).toBe('committed');
    expect([...snapshot.keys()]).toEqual(['.gitignore', 'keep.txt']);
  });
  it('returns an empty inventory without inventing evidence', async () => {
    const root = await createFixture();
    expect((await scanRepository(await openRepository(root))).size).toBe(0);
  });
});