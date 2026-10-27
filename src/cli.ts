import { Command } from 'commander';
import { z } from 'zod';
import { formatDiagnostic } from './security.js';
import { parseLocalRequest } from './validation.js';
import type { LocalRequest } from './validation.js';

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