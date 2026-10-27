import fs from 'node:fs/promises';
import { join } from 'node:path';
import { simpleGit } from 'simple-git';
import { afterEach, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';
import { ownedRanges } from '../src/readme.js';
import { createFixture, fixtureRoots } from './fixtures.js';

afterEach(async () => { await Promise.all(fixtureRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))); });

it('runs dry-run, real sync, generated-only no-op and committed incremental updates', async () => {
  const manual = '# Manual title\r\n\r\nHand-maintained paragraph.\r\n';
  const root = await createFixture({
    'package.json': '{"name":"fixture","description":"Purpose","scripts":{"start":"do-not-emit-body"}}',
    'README.md': manual, '.env.example': 'EXAMPLE=synthetic-value', 'src/main.js': 'process.env.PORT',
  });
  const before = await fs.readdir(root);
  const dry = await runCli([root, '--dry-run']);
  expect(dry.exitCode).toBe(0);
  expect(dry.output).toContain('Generated-only preview');
  expect(dry.output.includes('synthetic-value')).toBe(false);
  expect(dry.output.includes('Hand-maintained paragraph')).toBe(false);
  expect(await fs.readdir(root)).toEqual(before);
  expect(await fs.readFile(join(root, 'README.md'), 'utf8')).toBe(manual);
  expect((await runCli([root])).exitCode).toBe(0);
  const readme = await fs.readFile(join(root, 'README.md'), 'utf8');
  expect(readme.startsWith(manual)).toBe(true);
  expect(ownedRanges(readme)).toHaveLength(7);
  expect(readme).toContain('EXAMPLE');
  expect(readme).toContain('PORT');
  expect(readme.includes('synthetic-value')).toBe(false);
  expect(readme.includes('do-not-emit-body')).toBe(false);
  await simpleGit(root).add('.').commit('generated documentation');
  const log = await fs.readFile(join(root, 'CHANGELOG.md'), 'utf8');
  const noOp = await runCli([root]);
  expect(noOp.output).toContain('No changes detected');
  expect(await fs.readFile(join(root, 'CHANGELOG.md'), 'utf8')).toBe(log);
  await fs.writeFile(join(root, 'src/main.js'), 'process.env.PORT; process.env.NEW_NAME');
  await simpleGit(root).add('.').commit('source change');
  const incremental = await runCli([root]);
  expect(incremental.exitCode).toBe(0);
  expect(incremental.output).toContain('environment-variables');
  const updated = await fs.readFile(join(root, 'README.md'), 'utf8');
  expect(updated).toContain('NEW_NAME');
  expect(updated.startsWith(manual)).toBe(true);
});

it('returns nonzero safe diagnostics on invalid input and malformed repositories', async () => {
  expect(await runCli([])).toEqual({ output: 'Invalid local repository request.', exitCode: 1 });
  const root = await createFixture({ 'package.json': 'invalid' });
  const before = await fs.readdir(root);
  expect(await runCli([root])).toEqual({ output: 'Invalid Node manifest.', exitCode: 1 });
  expect(await fs.readdir(root)).toEqual(before);
});