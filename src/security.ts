import { z } from 'zod';

export const NOT_FOUND = 'Not Found';

const evidenceSchema = z.string().trim().min(1)
  .regex(/^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]*$/);

const redactions: ReadonlyArray<readonly [RegExp, string]> = [
  [/-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----[\s\S]*?(?:-----END (?:[A-Z0-9]+ )*PRIVATE KEY-----|$)/g, '[REDACTED]'],
  [/(?<![a-z0-9+.-])([a-z][a-z0-9+.-]*:\/\/)[^\s/?#]*@/gi, '$1[REDACTED]@'],
  [/\b(Bearer)\s+[A-Za-z0-9._~+\/=-]+/gi, '$1 [REDACTED]'],
  [/(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]+/g, '[REDACTED]'],
  [/(?:AKIA|ASIA)[A-Za-z0-9]+/g, '[REDACTED]'],
  [/(?<![\w.-])(["']?(?=[\w.-]*(?:secret|token|password|passwd|api[_-]?key))[\w.-]+["']?(?:\s*\])?\s*[:=]\s*)[\s\S]*/gi, '$1[REDACTED]'],
  [/((?:process\.env(?:\.[A-Za-z_]\w*|\[\s*["'][A-Za-z_]\w*["']\s*\])|os\.environ\[\s*["'][A-Za-z_]\w*["']\s*\])\s*(?:\?\?|\|\||&&|\+)?=(?!=)\s*)[\s\S]*/g, '$1[REDACTED]'],
];

export function sanitizeEvidence(input: unknown): string {
  const parsed = evidenceSchema.safeParse(input);
  if (!parsed.success) {
    return NOT_FOUND;
  }

  let output = parsed.data;
  for (const [pattern, replacement] of redactions) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

const diagnosticCodeSchema = z.enum([
  'invalid-input',
  'invalid-repository',
  'empty-repository',
  'missing-baseline',
  'dirty-working-tree',
  'invalid-state',
  'invalid-markers',
  'unsafe-path',
  'write-failure',
  'recovery-failure',
  'unexpected-error',
]);

export type DiagnosticCode = z.infer<typeof diagnosticCodeSchema>;

const diagnostics: Record<DiagnosticCode, string> = {
  'invalid-input': 'Invalid local repository request.',
  'invalid-repository': 'The path is missing or is not a git repository.',
  'empty-repository': 'The repository has no commits.',
  'missing-baseline': 'Baseline commit unavailable; performing a full scan.',
  'dirty-working-tree': 'Uncommitted source changes are ignored.',
  'invalid-state': 'Invalid sync state.',
  'invalid-markers': 'Invalid README section markers.',
  'unsafe-path': 'Unsafe repository or output path.',
  'write-failure': 'Documentation could not be written.',
  'recovery-failure': 'Recovery failed; output consistency is not guaranteed.',
  'unexpected-error': 'Documentation sync failed.',
};

export function formatDiagnostic(code: unknown): string {
  const parsed = diagnosticCodeSchema.safeParse(code);
  return parsed.success ? diagnostics[parsed.data] : diagnostics['unexpected-error'];
}