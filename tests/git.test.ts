import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { simpleGit } from 'simple-git';
import { afterEach, describe, expect, it } from 'vitest';
import { assertSafePath, openRepository, readBlob, readTree } from '../src/git.js';
import { createFixture, fixtureRoots } from './fixtures.js';

afterEach(async () => { await Promise.all(fixtureRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

describe('committed git reader', () => {
  it('pins committed bytes and warns about dirty work', async () => {
    const root = await createFixture({ 'file with spaces.txt': 'committed' });
    await writeFile(join(root, 'file with spaces.txt'), 'dirty');
    const repo = await openRepository(root);
    const entries = await readTree(repo, repo.head);
    expect(repo.dirty).toBe(true);
    expect((await readBlob(repo, entries[0]!.oid)).toString()).toBe('committed');
    await expect(readBlob(repo, 'f'.repeat(40))).rejects.toThrow('Cannot read committed file.');
    await expect(readBlob(repo, '--bad')).rejects.toThrow('Cannot read committed file.');
    await expect(readTree(repo, 'f'.repeat(40))).rejects.toThrow('Cannot read committed repository tree.');
    await expect(readTree(repo, '--bad')).rejects.toThrow();
  });
  it('rejects invalid, non-git and empty paths', async () => {
    const root = await mkdtemp(join(tmpdir(), 'docsync-empty-'));
    fixtureRoots.push(root);
    await expect(openRepository(root)).rejects.toThrow('not a git repository');
    await simpleGit(root).init();
    await expect(openRepository(root)).rejects.toThrow('no commits');
    await expect(openRepository(join(root, 'missing'))).rejects.toThrow();
    await expect(openRepository(undefined)).rejects.toThrow();
  });
  it('allows absent output paths but rejects symbolic links', async () => {
    const root = await createFixture();
    await expect(assertSafePath(join(root, 'new.md'))).resolves.toBeUndefined();
    const link = join(root, 'link');
    await symlink(root, link, 'junction');
    await expect(assertSafePath(link)).rejects.toThrow('Unsafe');
  });
  it('validates fixture containment', async () => {
    await expect(createFixture({ '../escape': 'invalid' })).rejects.toThrow('Invalid fixture path.');
  });
});