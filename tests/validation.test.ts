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
});