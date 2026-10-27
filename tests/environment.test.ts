import { describe, expect, it } from 'vitest';
import { extractExampleNames } from '../src/environment.js';

describe('extractExampleNames', () => {
  it('emits sorted unique assignment names without values', () => {
    expect(extractExampleNames('export Z=synthetic\nA="synthetic"\nZ=other\n# COMMENT=value\nBAD-NAME=value'))
      .toEqual(['A', 'Z']);
  });
  it('returns no invented names for missing or invalid evidence', () => {
    expect(extractExampleNames(undefined)).toEqual([]);
    expect(extractExampleNames('no assignment\n2BAD=value')).toEqual([]);
  });
});