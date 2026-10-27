import { posix } from 'node:path';
import type { Change } from './changes.js';
import { SECTION_NAMES } from './readme.js';
import type { SectionName } from './readme.js';

export function mapImpacts(changes: readonly Change[], full = false, missing: readonly SectionName[] = []): Set<SectionName> {
  if (full) return new Set(SECTION_NAMES);
  const impacted = new Set(missing);
  for (const change of changes) {
    const name = posix.basename(change.path);
    if (['package.json', 'pyproject.toml', 'requirements.txt'].includes(name)) {
      for (const section of ['project-name', 'purpose', 'tech-stack', 'setup', 'usage', 'environment-variables'] as const) impacted.add(section);
    } else if (name.toLowerCase() === 'readme.md') {
      for (const section of ['project-name', 'purpose', 'usage'] as const) impacted.add(section);
    } else impacted.add('environment-variables');
    if (change.kind !== 'modified') impacted.add('project-structure');
  }
  return impacted;
}