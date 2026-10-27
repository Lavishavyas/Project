import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { readBaseline } from '../src/baseline.js';
import { openRepository } from '../src/git.js';
import { createFixture, fixtureRoots } from './fixtures.js';

afterEach(async () => { await Promise.all(fixtureRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

it('classifies initial, incremental and unavailable history', async () => {
  const root = await createFixture();
  const repo = await openRepository(root);
  expect((await readBaseline(repo)).mode).toBe('initial');
  await writeFile(join(root, '.docsync.json'), JSON.stringify({ lastSyncedSha: repo.head }));
  expect(await readBaseline(repo)).toEqual({ mode: 'incremental', sha: repo.head });
  await writeFile(join(root, '.docsync.json'), JSON.stringify({ lastSyncedSha: 'f'.repeat(40) }));
  expect(await readBaseline(repo)).toEqual({ mode: 'fallback', sha: undefined });
});

it('rejects malformed or unexpected state without echoing content', async () => {
  const root = await createFixture();
  const repo = await openRepository(root);
  for (const content of ['bad', '{}', '{"lastSyncedSha":"invalid"}', '{"unexpected":true}']) {
    await writeFile(join(root, '.docsync.json'), content);
    await expect(readBaseline(repo)).rejects.toThrow('Invalid sync state.');
  }
});