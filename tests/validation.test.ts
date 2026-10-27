import { describe, expect, it } from 'vitest';
import { parseLocalRequest } from '../src/validation.js';

describe('parseLocalRequest', () => {
  it('accepts a local path and defaults to normal mode', () => {
    expect(parseLocalRequest({ path: './repo' })).toEqual({
      path: './repo',
      dryRun: false,
    });
  });

  it('preserves paths containing spaces and accepts dry runs', () => {
    expect(parseLocalRequest({ path: 'C:\\team repos\\project', dryRun: true }))
      .toEqual({ path: 'C:\\team repos\\project', dryRun: true });
  });

  it.each([undefined, null, {}, { path: '' }, { path: '   ' }, { path: 3 }])(
    'rejects missing or invalid requests without echoing input',
    (input) => {
      expect(() => parseLocalRequest(input)).toThrow('Invalid local repository request.');
    },
  );

  it.each(['repo\0path', 'repo\npath', 'repo\rpath'])(
    'rejects path control characters',
    (path) => {
      expect(() => parseLocalRequest({ path })).toThrow('Invalid local repository request.');
    },
  );

  it('rejects unknown fields and non-boolean modes', () => {
    expect(() => parseLocalRequest({ path: '.', extra: true }))
      .toThrow('Invalid local repository request.');
    expect(() => parseLocalRequest({ path: '.', dryRun: 'true' }))
      .toThrow('Invalid local repository request.');
  });

  it.each([
    'https://github.com/team/repo',
    'HTTPS://github.com/team/repo',
    'https:github.com/team/repo',
    'ssh://git@github.com/team/repo',
    'file:///local/repo',
    'git@github.com:team/repo.git',
  ])('rejects URL and scp-like remote inputs', (path) => {
    expect(() => parseLocalRequest({ path }))
      .toThrow(new Error('Invalid local repository request.'));
  });
});