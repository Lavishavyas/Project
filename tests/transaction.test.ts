import fs from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { equalBytes, readDestinations, stageOutputs } from '../src/transaction.js';
import { createFixture, fixtureRoots } from './fixtures.js';

afterEach(async () => { vi.restoreAllMocks(); await Promise.all(fixtureRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))); });

describe('transaction staging', () => {
  it('compares bytes and distinguishes absent outputs', () => {
    expect(equalBytes(undefined, undefined)).toBe(true);
    expect(equalBytes(Buffer.from('a'), Buffer.from('a'))).toBe(true);
    expect(equalBytes(Buffer.from('a'), undefined)).toBe(false);
    expect(equalBytes(undefined, Buffer.from('a'))).toBe(false);
  });
  it('snapshots and stages without touching destination bytes', async () => {
    const root = await createFixture({ 'README.md': 'manual' });
    const original = await readDestinations(root);
    const staged = await stageOutputs(root, original, { ...original, 'README.md': Buffer.from('changed') });
    expect((await fs.readFile(join(root, 'README.md'))).toString()).toBe('manual');
    expect(staged.items).toHaveLength(1);
    expect((await fs.readFile(staged.items[0]!.candidate)).toString()).toBe('changed');
  });
  it('refuses changed targets, invalid plans, unsafe output types and protected samples', async () => {
    const root = await createFixture({ 'README.md': 'manual' });
    const original = await readDestinations(root);
    await expect(stageOutputs(root, original, { ...original, 'README.md': undefined })).rejects.toThrow('Invalid output plan.');
    await fs.writeFile(join(root, 'README.md'), 'concurrent');
    await expect(stageOutputs(root, original, original)).rejects.toThrow('Output changed');
    await fs.mkdir(join(root, 'CHANGELOG.md'));
    await expect(readDestinations(root)).rejects.toThrow('Unsafe');
    await expect(stageOutputs(fileURLToPath(new URL('../samples/bookmark-api', import.meta.url)), original, original)).rejects.toThrow('read-only');
  });
  it('cleans staging when candidate creation fails', async () => {
    const root = await createFixture();
    const original = await readDestinations(root);
    vi.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('synthetic failure'));
    await expect(stageOutputs(root, original, { ...original, 'README.md': Buffer.from('new') })).rejects.toThrow('could not be staged');
    expect((await fs.readdir(root)).some((name) => name.startsWith('.docsync-stage-'))).toBe(false);
  });
});