import { z } from 'zod';
import { posix } from 'node:path';
import type { Snapshot } from './inventory.js';

export function extractExampleNames(input: unknown): string[] {
  const parsed = z.string().safeParse(input);
  if (!parsed.success) return [];
  return [...new Set([...parsed.data.matchAll(/^[ \t]*(?:export[ \t]+)?([A-Za-z_][A-Za-z0-9_]*)[ \t]*=/gm)]
    .map((match) => match[1]!))].sort();
}

export function extractSourceNames(input: unknown): string[] {
  const parsed = z.string().safeParse(input);
  if (!parsed.success) return [];
  const patterns = [
    /\bprocess\.env\.(?<name>[A-Za-z_]\w*)\b/g,
    /\b(?:process\.env|os\.environ)\[\s*(["'])(?<name>[A-Za-z_]\w*)\1\s*\]/g,
    /\b(?:os\.environ\.get|os\.getenv|System\.getenv|os\.Getenv|os\.LookupEnv)\(\s*(["'])(?<name>[A-Za-z_]\w*)\1\s*(?:,|\))/g,
  ];
  const names = new Set<string>();
  for (const pattern of patterns) {
    for (const match of parsed.data.matchAll(pattern)) names.add(match.groups!['name']!);
  }
  return [...names].sort();
}

export function extractEnvironment(snapshot: Snapshot): string[] {
  const names = new Set<string>();
  for (const [path, content] of snapshot) {
    const extracted = posix.basename(path) === '.env.example' ? extractExampleNames(content) : extractSourceNames(content);
    for (const name of extracted) names.add(name);
  }
  return [...names].sort();
}