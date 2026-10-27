import fs from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { commitOutputs, equalBytes, readDestinations, stageOutputs } from '../src/transaction.js';
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

describe('transaction commit and recovery', () => {
  it('installs baseline last and removes staging after success', async () => {
    const root = await createFixture({ 'README.md': 'old' });
    const original = await readDestinations(root);
    const rename = vi.spyOn(fs, 'rename');
    await commitOutputs(root, original, { 'README.md': Buffer.from('new'), 'CHANGELOG.md': Buffer.from('log'), '.docsync.json': Buffer.from('state') });
    expect(rename.mock.calls.map((call) => String(call[1]).split(/[\\/]/).at(-1))).toEqual(['README.md', 'CHANGELOG.md', '.docsync.json']);
    expect((await readDestinations(root))['README.md']?.toString()).toBe('new');
    expect((await fs.readdir(root)).some((name) => name.startsWith('.docsync-stage-'))).toBe(false);
  });
  it.each([1, 2, 3])('restores all original bytes after a replacement failure', async (failure) => {
    const root = await createFixture({ 'README.md': 'old', 'CHANGELOG.md': 'old log', '.docsync.json': 'old state' });
    const original = await readDestinations(root);
    const rename = fs.rename.bind(fs);
    let count = 0;
    vi.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
      count++;
      if (count === failure) throw new Error('synthetic replacement failure');
      return rename(from, to);
    });
    await expect(commitOutputs(root, original, { 'README.md': Buffer.from('new'), 'CHANGELOG.md': Buffer.from('new log'), '.docsync.json': Buffer.from('new state') })).rejects.toThrow('could not be written');
    expect(await readDestinations(root)).toEqual(original);
  });
  it('removes new outputs when a later replacement fails', async () => {
    const root = await createFixture();
    const original = await readDestinations(root);
    const rename = fs.rename.bind(fs);
    let count = 0;
    vi.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
      if (++count === 2) throw new Error('synthetic replacement failure');
      return rename(from, to);
    });
    await expect(commitOutputs(root, original, { 'README.md': Buffer.from('new'), 'CHANGELOG.md': Buffer.from('log'), '.docsync.json': Buffer.from('state') })).rejects.toThrow('could not be written');
    expect(await readDestinations(root)).toEqual(original);
  });
  it('rolls back after a cleanup failure', async () => {
    const root = await createFixture({ 'README.md': 'old' });
    const original = await readDestinations(root);
    vi.spyOn(fs, 'rm').mockRejectedValueOnce(new Error('synthetic cleanup failure'));
    await expect(commitOutputs(root, original, { ...original, 'README.md': Buffer.from('new') })).rejects.toThrow('could not be written');
    expect(await readDestinations(root)).toEqual(original);
  });
  it('reports failed recovery explicitly instead of claiming preservation', async () => {
    const root = await createFixture({ 'README.md': 'old' });
    const original = await readDestinations(root);
    const write = fs.writeFile.bind(fs);
    vi.spyOn(fs, 'rename').mockRejectedValueOnce(new Error('synthetic failure'));
    vi.spyOn(fs, 'writeFile').mockImplementation(async (path, data, options) => {
      if (String(path) === join(root, 'README.md')) throw new Error('synthetic recovery failure');
      return write(path, data, options);
    });
    await expect(commitOutputs(root, original, { ...original, 'README.md': Buffer.from('new') })).rejects.toThrow('Recovery failed; output consistency is not guaranteed.');
  });
});