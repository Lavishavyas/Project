import { rm } from 'node:fs/promises';
import { afterEach, expect, it } from 'vitest';
import { createSyncPlan, semanticSnapshot } from '../src/sync-plan.js';
import { openRepository } from '../src/git.js';
import { createFixture, fixtureRoots } from './fixtures.js';

afterEach(async () => { await Promise.all(fixtureRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

it('removes generated-only evidence but preserves manual facts', () => {
  const generated = '<!-- docsync:start purpose -->\nold\n<!-- docsync:end purpose -->';
  expect(semanticSnapshot(new Map([['README.md', generated]])).has('README.md')).toBe(false);
  expect(semanticSnapshot(new Map([['README.md', '# Manual\n' + generated]])).get('README.md')).toBe('# Manual');
  expect(() => semanticSnapshot(new Map([['README.md', '<!-- docsync:start purpose -->']]))).toThrow('Invalid README');
});

it('plans initial output, a no-op repeat, and missing-history recovery without writing', async () => {
  const root = await createFixture({ 'package.json': '{"name":"fixture","description":"Purpose"}' });
  const repo = await openRepository(root);
  const initial = await createSyncPlan(repo, { mode: 'initial', sha: undefined }, { 'README.md': undefined, 'CHANGELOG.md': undefined, '.docsync.json': undefined }, new Date('2026-10-27'));
  expect(initial.updated).toHaveLength(7);
  expect(initial.sections['project-name']).toBe('fixture');
  const repeat = await createSyncPlan(repo, { mode: 'incremental', sha: repo.head }, initial.files);
  expect(repeat.updated).toEqual([]);
  expect(repeat.entry).toBe('');
  expect(repeat.files['README.md']).toEqual(initial.files['README.md']);
  const fallback = await createSyncPlan(repo, { mode: 'fallback', sha: undefined }, initial.files);
  expect(fallback.warnings).toContain('Baseline commit unavailable; performing a full scan.');
});