import { z } from 'zod';

export const localRequestSchema = z.strictObject({
  path: z.string().regex(/\S/).regex(/^[^\0\r\n]*$/),
  dryRun: z.boolean().default(false),
});

export type LocalRequest = z.output<typeof localRequestSchema>;

export function parseLocalRequest(input: unknown): LocalRequest {
  const result = localRequestSchema.safeParse(input);
  if (!result.success) {
    throw new Error('Invalid local repository request.');
  }
  return result.data;
}