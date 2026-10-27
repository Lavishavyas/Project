import { describe, expect, it } from 'vitest';
import { planChangelog, planState } from '../src/planning.js';

describe('planChangelog', () => {
  it('appends a dated initial entry and preserves previous bytes', () => {
    const result = planChangelog('\ufeffmanual\r\n', [{ path: 'package.json', kind: 'added' }], ['purpose'], true, new Date('2026-10-27T23:59:00Z'));
    expect(result.text.startsWith('\ufeffmanual\r\n')).toBe(true);
    expect(result.entry).toContain('2026-10-27 - Initial documentation sync');
    expect(result.entry).toContain('purpose: added');
  });
  it('does not append no-change entries and sanitizes emitted paths', () => {
    expect(planChangelog('existing', [], [], false, new Date()).text).toBe('existing');
    const result = planChangelog('', [{ path: 'ghp_synthetic', kind: 'modified' }], [], false, new Date('2026-10-27'));
    expect(result.entry.includes('ghp_synthetic')).toBe(false);
    expect(result.entry).toContain('No documentation changes');
    expect(planChangelog('', [], ['purpose'], true, new Date('2026-10-27')).entry).toContain('Not Found');
  });
  it('rejects invalid time input before any writing', () => {
    expect(() => planChangelog('', [], [], true, new Date('invalid'))).toThrow('Invalid changelog date.');
  });
});

describe('planState', () => {
  it('deterministically plans a pinned SHA without any persistence', () => {
    expect(JSON.parse(planState('a'.repeat(40)))).toEqual({ lastSyncedSha: 'a'.repeat(40) });
    expect(planState('a'.repeat(40))).toBe(planState('a'.repeat(40)));
    expect(JSON.parse(planState('b'.repeat(64))).lastSyncedSha).toHaveLength(64);
  });
  it('rejects invalid and absent state candidates safely', () => {
    expect(() => planState(undefined)).toThrow('Invalid sync state.');
    expect(() => planState('invalid')).toThrow('Invalid sync state.');
  });
});