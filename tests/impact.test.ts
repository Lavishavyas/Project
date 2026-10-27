import { expect, it } from 'vitest';
import { mapImpacts } from '../src/impact.js';

it('unions manifest, manual README, source and structure impacts', () => {
  expect([...mapImpacts([{ path: 'package.json', kind: 'modified' }])]).toEqual(['project-name', 'purpose', 'tech-stack', 'setup', 'usage', 'environment-variables']);
  expect([...mapImpacts([{ path: 'README.md', kind: 'modified' }])]).toEqual(['project-name', 'purpose', 'usage']);
  expect([...mapImpacts([{ path: 'src/new.py', kind: 'added' }])]).toEqual(['environment-variables', 'project-structure']);
  expect(mapImpacts([{ path: 'old', kind: 'deleted' }]).has('project-structure')).toBe(true);
});

it('handles full scans, missing sections and no relevant changes', () => {
  expect(mapImpacts([], true).size).toBe(7);
  expect([...mapImpacts([], false, ['purpose'])]).toEqual(['purpose']);
  expect(mapImpacts([]).size).toBe(0);
});