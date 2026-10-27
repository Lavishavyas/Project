import { Command } from 'commander';
import { z } from 'zod';
import { formatDiagnostic } from './security.js';
import { parseLocalRequest } from './validation.js';
import type { LocalRequest } from './validation.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRepository } from './git.js';
import { readBaseline } from './baseline.js';
import { createSyncPlan } from './sync-plan.js';
import { commitOutputs, readDestinations } from './transaction.js';
import { previewPlan, reportPlan } from './reporting.js';

const argumentsSchema = z.array(z.string());

export function parseCliArgs(input: unknown): LocalRequest {
  const parsed = argumentsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(formatDiagnostic('invalid-input'));
  }

  const command = new Command()
    .name('doc-sync')
    .argument('<path>')
    .option('--dry-run', 'Preview changes without writing files')
    .helpOption(false)
    .allowExcessArguments(false)
    .exitOverride()
    .configureOutput({ writeOut: String, writeErr: String });

  try {
    command.parse(parsed.data, { from: 'user' });
    return parseLocalRequest({ path: command.args[0], ...command.opts() });
  } catch {
    throw new Error(formatDiagnostic('invalid-input'));
  }
}

export async function runCli(input: unknown): Promise<{ output: string; exitCode: number }> {
  try {
    const request = parseCliArgs(input);
    const repo = await openRepository(request.path);
    const baseline = await readBaseline(repo);
    const original = await readDestinations(repo.root);
    const plan = await createSyncPlan(repo, baseline, original);
    const output = (request.dryRun ? previewPlan(plan) + '\n' : '') + reportPlan(plan);
    if (!request.dryRun) await commitOutputs(repo.root, original, plan.files);
    return { output, exitCode: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const safeMessages = new Set([
      'Invalid local repository request.', 'The path is missing or is not a git repository.',
      'The repository has no commits.', 'Unsafe repository or output path.', 'Invalid sync state.',
      'Invalid README section markers.', 'Unsupported text encoding.', 'Invalid Node manifest.',
      'Invalid Python manifest.', 'Cannot read committed repository tree.', 'Cannot read committed file.',
      'Cannot compare baseline commits.', 'Output changed during sync.', 'Invalid output plan.',
      'Documentation could not be staged.', 'Documentation could not be written.',
      'Recovery failed; output consistency is not guaranteed.', 'Samples are read-only; use a disposable copy.',
    ]);
    return { output: safeMessages.has(message) ? message : formatDiagnostic('unexpected-error'), exitCode: 1 };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runCli(process.argv.slice(2));
  (result.exitCode ? process.stderr : process.stdout).write(result.output + '\n');
  process.exitCode = result.exitCode;
}