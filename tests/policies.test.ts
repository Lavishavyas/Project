import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const architecture = readFileSync(new URL('../docs/architecture.md', import.meta.url), 'utf8');

describe('continuation design contracts', () => {
  it('requires safe previews without claiming full-file patch semantics', () => {
    expect(architecture.includes('T-05: Preview only sanitized generated-section projections')).toBe(true);
    expect(architecture.includes('projection-relative coordinates')).toBe(true);
    expect(architecture.includes('Never include manual context')).toBe(true);
  });
  it('does not waive failed-recovery and crash limitations', () => {
    expect(architecture.includes('never report failed recovery as success')).toBe(true);
  });
  it('requires effective eligibility deltas and retains manual README evidence', () => {
    expect(architecture.includes('include/exclude transitions are effective additions/removals')).toBe(true);
    expect(architecture.includes('Count mixed manual/generated README evidence once')).toBe(true);
    expect(architecture.includes('exclude generated-only README evidence')).toBe(true);
  });
});