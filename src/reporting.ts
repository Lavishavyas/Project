import { createTwoFilesPatch } from 'diff';
import { ownedRanges, SECTION_NAMES } from './readme.js';
import { sanitizeEvidence } from './security.js';
import { decodeText } from './text.js';
import { mapImpacts } from './impact.js';
import type { SyncPlan } from './sync-plan.js';

export function generatedProjection(bytes: Buffer | undefined): string {
  if (bytes === undefined) return '';
  const text = decodeText(bytes);
  return ownedRanges(text).map((range) => sanitizeEvidence(bytes.subarray(range.start, range.end).toString('utf8'))).join('\n\n');
}

export function previewPlan(plan: SyncPlan): string {
  const before = generatedProjection(plan.original['README.md']);
  const after = generatedProjection(plan.files['README.md']);
  const diffs: string[] = ['Generated-only preview; hunk coordinates refer to projections.'];
  if (before !== after) diffs.push(createTwoFilesPatch('README.generated', 'README.generated', before, after, '', '', { context: 0 }));
  if (plan.entry) diffs.push(createTwoFilesPatch('CHANGELOG.append', 'CHANGELOG.append', '', sanitizeEvidence(plan.entry), '', '', { context: 0 }));
  diffs.push(`Baseline: ${plan.beforeSha ?? 'Not Found'} -> ${plan.head}`);
  return diffs.join('\n');
}

export function reportPlan(plan: SyncPlan): string {
  const messages = [...plan.warnings];
  if (!plan.updated.length && !plan.changes.length && !plan.entry) messages.push('No changes detected');
  else {
    messages.push(`Changed files: ${plan.changes.map((change) => sanitizeEvidence(change.path)).join(', ') || 'Not Found'}`);
    messages.push(`Impacted sections: ${[...mapImpacts(plan.changes, plan.beforeSha === undefined)].join(', ') || 'None'}`);
    messages.push(`Updated sections: ${plan.updated.join(', ') || 'None'}`);
  }
  messages.push(`Not Found sections: ${SECTION_NAMES.filter((name) => plan.sections[name] === 'Not Found').join(', ') || 'None'}`);
  return messages.join('\n');
}