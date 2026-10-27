import { rm } from 'node:fs/promises';
import { afterEach, expect, it } from 'vitest';
import { generatedProjection, previewPlan, reportPlan } from '../src/reporting.js';
import { createSyncPlan } from '../src/sync-plan.js';
import { openRepository } from '../src/git.js';
import { createFixture, fixtureRoots } from './fixtures.js';

afterEach(async () => { await Promise.all(fixtureRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

it('projects only generated text and sanitizes old evidence', () => {
  const text = 'manual-sentinel\n\n<!-- docsync:start purpose -->\nTOKEN=synthetic-value\n<!-- docsync:end purpose -->';
  const projection = generatedProjection(Buffer.from(text));
  expect(projection.includes('manual-sentinel')).toBe(false);
  expect(projection.includes('synthetic-value')).toBe(false);
  expect(generatedProjection(undefined)).toBe('');
  expect(() => generatedProjection(Buffer.from('<!-- docsync:end purpose -->'))).toThrow('Invalid README');
});

it('prints safe diffs, SHA transition, summary and no-change results', async () => {
  const root = await createFixture();
  const repo = await openRepository(root);
  const plan = await createSyncPlan(repo, { mode: 'initial', sha: undefined }, { 'README.md': Buffer.from('# manual-sentinel'), 'CHANGELOG.md': Buffer.from('old-manual-sentinel'), '.docsync.json': undefined });
  const preview = previewPlan(plan);
  expect(preview).toContain('@@');
  expect(preview).toContain('Baseline: Not Found ->');
  expect(preview.includes('manual-sentinel')).toBe(false);
  expect(reportPlan(plan)).toContain('Not Found sections:');
  const repeat = await createSyncPlan(repo, { mode: 'incremental', sha: repo.head }, plan.files);
  expect(reportPlan(repeat)).toContain('No changes detected');
  expect(previewPlan(repeat)).not.toContain('@@');
});