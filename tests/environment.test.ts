import { describe, expect, it } from 'vitest';
import { extractEnvironment, extractExampleNames, extractSourceNames } from '../src/environment.js';

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

describe('extractSourceNames', () => {
  it('covers all required literal reference forms and quote styles', () => {
    const source = `process.env.A; process.env["B"]; os.environ['C']; os.environ.get("D"); os.getenv('E'); System.getenv("F"); os.Getenv("G"); os.LookupEnv("H")`;
    expect(extractSourceNames(source)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  });
  it('does not infer names from dynamic expressions or invalid evidence', () => {
    expect(extractSourceNames('process.env[name]; os.getenv(dynamic); os.Getenv("BAD-NAME")')).toEqual([]);
    expect(extractSourceNames(undefined)).toEqual([]);
  });
});

describe('extractEnvironment', () => {
  it('unions names without retaining values', () => {
    expect(extractEnvironment(new Map([['.env.example', 'A='], ['src/main.ts', 'process.env.A; process.env.Z']]))).toEqual(['A', 'Z']);
  });
  it('returns an empty result when no names are evidenced', () => {
    expect(extractEnvironment(new Map([['main.py', 'print(1)']]))).toEqual([]);
  });
});