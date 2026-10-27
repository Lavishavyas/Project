import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseCliArgs } from '../src/cli.js';

afterEach(vi.restoreAllMocks);

describe('parseCliArgs', () => {
  it('accepts a single local path in normal mode', () => {
    expect(parseCliArgs(['./repo'])).toEqual({ path: './repo', dryRun: false });
  });

  it('accepts dry-run before or after a path and does not retain prior parse state', () => {
    expect(parseCliArgs(['--dry-run', './repo'])).toEqual({ path: './repo', dryRun: true });
    expect(parseCliArgs(['./repo', '--dry-run'])).toEqual({ path: './repo', dryRun: true });
    expect(parseCliArgs(['./repo'])).toEqual({ path: './repo', dryRun: false });
  });

  it.each(['C:\\team repos\\project', 'C:/team/project', '/team/project', '\\\\server\\repo'])(
    'preserves filesystem path forms and spaces',
    (path) => {
      expect(parseCliArgs([path])).toEqual({ path, dryRun: false });
    },
  );

  it('accepts a path beginning with a hyphen after the option separator', () => {
    expect(parseCliArgs(['--', '-repo'])).toEqual({ path: '-repo', dryRun: false });
  });

  it.each([
    { input: undefined },
    { input: null },
    { input: {} },
    { input: [3] },
    { input: [] },
    { input: ['--dry-run'] },
    { input: ['first', 'second'] },
    { input: ['./repo', '--unknown'] },
    { input: ['./repo', '--dry-run=true'] },
    { input: [''] },
    { input: ['   '] },
    { input: ['repo\0path'] },
    { input: ['repo\npath'] },
  ])('rejects invalid argv shapes, options and path values', ({ input }) => {
    expect(() => parseCliArgs(input))
      .toThrow(new Error('Invalid local repository request.'));
  });

  it.each([
    ['https://github.com/team/repo'],
    ['ssh://git@github.com/team/repo'],
    ['git@github.com:team/repo.git'],
    ['file:///local/repo'],
    ['https://user:synthetic-value@github.com/team/repo'],
  ])('rejects remote inputs without echoing credentials', (path) => {
    expect(() => parseCliArgs([path]))
      .toThrow(new Error('Invalid local repository request.'));
  });

  it('suppresses commander output for unsupported URL options', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    expect(() => parseCliArgs(['.', '--branch', 'synthetic-value']))
      .toThrow(new Error('Invalid local repository request.'));
    expect(() => parseCliArgs(['.', '--out', 'synthetic-value']))
      .toThrow(new Error('Invalid local repository request.'));
    expect(() => parseCliArgs(['.', '--unknown=synthetic-value']))
      .toThrow(new Error('Invalid local repository request.'));
    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).not.toHaveBeenCalled();
  });
});