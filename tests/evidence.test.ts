import { describe, expect, it } from 'vitest';
import { extractEvidence, extractReadmeEvidence } from '../src/evidence.js';

describe('extractReadmeEvidence', () => {
  it('uses prose and an ATX usage section, not tables or code', () => {
    const manual = '# Name\n\n| a | b |\n| - | - |\n| x | y |\n\n```text\nignored\n```\n\nActual purpose\nsecond line.\n\n## Usage\nrun command\n\n## Other\nother';
    expect(extractReadmeEvidence(manual)).toEqual({ name: 'Name', purpose: 'Actual purpose second line.', usage: 'run command' });
  });
  it('reports absent evidence as Not Found', () => {
    expect(extractReadmeEvidence('')).toEqual({ name: 'Not Found', purpose: 'Not Found', usage: 'Not Found' });
  });
});

describe('extractEvidence', () => {
  it('lists every stack and gives root manifests precedence over nested ones', () => {
    const snapshot = new Map([
      ['nested/package.json', '{"name":"nested","scripts":{"run":"hidden"}}'],
      ['package.json', '{"name":"root"}'],
      ['pyproject.toml', '[project]\nname="python"\ndescription="purpose"'],
      ['requirements.txt', 'package'],
    ]);
    const facts = extractEvidence(snapshot);
    expect(facts.name).toBe('root');
    expect(facts.purpose).toBe('purpose');
    expect(facts.stacks).toEqual(['Node.js/TypeScript', 'Python']);
    expect(facts.setup).toEqual(['npm install', 'pip install -r requirements.txt', 'nested: npm install']);
    expect(facts.usage).toEqual(['nested: npm run run']);
  });
  it('uses manual evidence only as fallback and never guesses unknown stacks', () => {
    const facts = extractEvidence(new Map([['go.mod', 'module ignored']]), '# Manual\n\nPurpose\n\n## Usage\nmanual command');
    expect(facts.name).toBe('Manual');
    expect(facts.stacks).toEqual([]);
    expect(facts.usage).toEqual(['manual command']);
    expect(extractEvidence(new Map()).name).toBe('Not Found');
  });
});