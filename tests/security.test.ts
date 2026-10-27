import { describe, expect, it } from 'vitest';
import { formatDiagnostic, NOT_FOUND, sanitizeEvidence } from '../src/security.js';

describe('sanitizeEvidence', () => {
  it('preserves ordinary approved evidence and variable names', () => {
    expect(sanitizeEvidence('  project description  ')).toBe('project description');
    expect(sanitizeEvidence('API_KEY\nDATABASE_URL')).toBe('API_KEY\nDATABASE_URL');
    expect(sanitizeEvidence('npm run test')).toBe('npm run test');
  });

  it.each([undefined, null, '', '  ', 42, {}, new Error('untrusted')])(
    'returns Not Found for absent or invalid evidence',
    (input) => {
      expect(sanitizeEvidence(input)).toBe(NOT_FOUND);
    },
  );

  it('rejects terminal escapes and other unsafe control characters', () => {
    expect(sanitizeEvidence('text\u001b[31m')).toBe(NOT_FOUND);
    expect(sanitizeEvidence('text\0')).toBe(NOT_FOUND);
  });

  it.each(['', 'RSA ', 'EC ', 'ENCRYPTED ', 'OPENSSH '])(
    'redacts complete and truncated private-key blocks',
    (kind) => {
      const sentinel = 'synthetic-private-material';
      const block = `-----BEGIN ${kind}PRIVATE KEY-----\n${sentinel}\n-----END ${kind}PRIVATE KEY-----`;
      expect(sanitizeEvidence(block)).toBe('[REDACTED]');
      expect(sanitizeEvidence(block.split('-----END')[0]).includes(sentinel)).toBe(false);
    },
  );

  it('removes URL user-info, including multiple at signs', () => {
    expect(sanitizeEvidence('https://user:example@host/repo'))
      .toBe('https://[REDACTED]@host/repo');
    expect(sanitizeEvidence('ssh://user:example@part@host/repo'))
      .toBe('ssh://[REDACTED]@host/repo');
    expect(sanitizeEvidence('https://host/repo')).toBe('https://host/repo');
  });

  it('redacts bearer credentials case-insensitively', () => {
    expect(sanitizeEvidence('Authorization: bEaReR synthetic.value+/= next'))
      .toBe('Authorization: bEaReR [REDACTED] next');
  });

  it.each(['ghp_', 'github_pat_', 'gho_', 'ghu_', 'ghs_', 'ghr_'])(
    'redacts supported token prefixes even when embedded in filenames',
    (prefix) => {
      const sentinel = `${prefix}syntheticvalue123`;
      const output = sanitizeEvidence(`folder/prefix_${sentinel}.txt`);
      expect(output.includes(sentinel)).toBe(false);
      expect(output).toContain('[REDACTED]');
    },
  );

  it.each(['AKIA', 'ASIA'])('redacts AWS access-key identifiers', (prefix) => {
    const sentinel = `${prefix}SYNTHETIC12345678`;
    expect(sanitizeEvidence(`file_${sentinel}.txt`).includes(sentinel)).toBe(false);
  });

  it.each(['secret', 'TOKEN', 'myPassword', 'db_passwd', 'api_key', 'apiKey', 'api-key'])(
    'redacts sensitive assignments conservatively through the remaining candidate',
    (key) => {
      const sentinel = 'synthetic-assigned-value';
      const candidates = [
        `${key}=${sentinel}`,
        `"${key}": "${sentinel}"`,
        `settings["${key}"] = '${sentinel}'`,
        `${key} = "unterminated\n${sentinel}`,
      ];
      for (const candidate of candidates) {
        const output = sanitizeEvidence(candidate);
        expect(output.includes(sentinel)).toBe(false);
        expect(output).toContain('[REDACTED]');
      }
    },
  );

  it.each([
    'process.env.X',
    'process.env["X"]',
    "process.env['X']",
    'os.environ["X"]',
    "os.environ['X']",
  ])('redacts assigned environment values regardless of variable name', (reference) => {
    const sentinel = 'synthetic-environment-value';
    for (const operator of ['=', '??=', '||=', '&&=', '+=']) {
      const output = sanitizeEvidence(`${reference} ${operator} "${sentinel}"`);
      expect(output.includes(sentinel)).toBe(false);
      expect(output).toContain('[REDACTED]');
    }
  });

  it('does not turn a simple comparison into an assignment', () => {
    expect(sanitizeEvidence('process.env.X === undefined'))
      .toBe('process.env.X === undefined');
  });

  it('is deterministic and idempotent on already-sanitized fields', () => {
    const first = sanitizeEvidence('https://user:example@host/path with Bearer synthetic');
    expect(sanitizeEvidence(first)).toBe(first);
    expect(sanitizeEvidence('TOKEN=[REDACTED]')).toBe('TOKEN=[REDACTED]');
  });

  it('preserves long dotted names without assignments or credentials', () => {
    const candidate = 'secret.field.'.repeat(1400);
    expect(sanitizeEvidence(candidate)).toBe(candidate);
  });
});

describe('formatDiagnostic', () => {
  it.each([
    ['invalid-input', 'Invalid local repository request.'],
    ['invalid-repository', 'The path is missing or is not a git repository.'],
    ['empty-repository', 'The repository has no commits.'],
    ['missing-baseline', 'Baseline commit unavailable; performing a full scan.'],
    ['dirty-working-tree', 'Uncommitted source changes are ignored.'],
    ['invalid-state', 'Invalid sync state.'],
    ['invalid-markers', 'Invalid README section markers.'],
    ['unsafe-path', 'Unsafe repository or output path.'],
    ['write-failure', 'Documentation could not be written.'],
    ['recovery-failure', 'Recovery failed; output consistency is not guaranteed.'],
    ['unexpected-error', 'Documentation sync failed.'],
  ])('uses the fixed message for a known category', (code, message) => {
    expect(formatDiagnostic(code)).toBe(message);
  });

  it.each([undefined, null, 3, {}, 'unknown', new Error('untrusted')])(
    'does not echo unknown categories or exception messages',
    (input) => {
      expect(formatDiagnostic(input)).toBe('Documentation sync failed.');
    },
  );
});