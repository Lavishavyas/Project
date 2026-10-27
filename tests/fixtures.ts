import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { simpleGit } from 'simple-git';

export const fixtureRoots: string[] = [];

export async function createFixture(files: Record<string, string> = {}): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'docsync-test-'));
  fixtureRoots.push(root);
  for (const [path, content] of Object.entries(files)) {
    const destination = resolve(root, path);
    if (relative(root, destination).startsWith('..')) throw new Error('Invalid fixture path.');
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }
  await simpleGit(root).init()
    .addConfig('user.name', 'Doc Sync Test').addConfig('user.email', 'test@example.invalid')
    .add('.').commit('fixture', { '--allow-empty': null });
  return root;
}