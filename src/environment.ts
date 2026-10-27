import { z } from 'zod';

export function extractExampleNames(input: unknown): string[] {
  const parsed = z.string().safeParse(input);
  if (!parsed.success) return [];
  return [...new Set([...parsed.data.matchAll(/^[ \t]*(?:export[ \t]+)?([A-Za-z_][A-Za-z0-9_]*)[ \t]*=/gm)]
    .map((match) => match[1]!))].sort();
}