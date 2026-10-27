import { z } from 'zod';
import { parse as parseToml } from 'smol-toml';
import { sanitizeEvidence } from './security.js';

export interface ManifestEvidence {
  stack: string;
  name: string;
  purpose: string;
  setup: string;
  usage: string[];
}

export function extractNode(content: string): ManifestEvidence {
  let manifest: Record<string, unknown>;
  try { manifest = z.record(z.string(), z.unknown()).parse(JSON.parse(content.replace(/^\ufeff/, ''))); }
  catch { throw new Error('Invalid Node manifest.'); }
  const usage: string[] = [];
  const scripts = z.record(z.string(), z.string()).safeParse(manifest.scripts);
  if (scripts.success) {
    for (const name of Object.keys(scripts.data).sort()) {
      if (sanitizeEvidence(name) === name && !name.includes('[REDACTED]')) usage.push(`npm run ${name}`);
    }
  }
  const bins = z.record(z.string(), z.string()).safeParse(manifest.bin);
  if (bins.success) {
    for (const name of Object.keys(bins.data).sort()) {
      if (sanitizeEvidence(name) === name && !name.includes('[REDACTED]')) usage.push(name);
    }
  } else if (typeof manifest.bin === 'string' && typeof manifest.name === 'string') {
    const name = manifest.name.split('/').at(-1)!;
    if (sanitizeEvidence(name) === name) usage.push(name);
  }
  return {
    stack: 'Node.js/TypeScript', name: sanitizeEvidence(manifest.name),
    purpose: sanitizeEvidence(manifest.description), setup: 'npm install', usage: [...new Set(usage)],
  };
}

export function extractPython(content: string | undefined, hasRequirements: boolean): ManifestEvidence {
  if (content === undefined && !hasRequirements) throw new Error('Python manifest evidence not found.');
  let manifest: Record<string, unknown> = {};
  if (content !== undefined) {
    try { manifest = z.record(z.string(), z.unknown()).parse(parseToml(content.replace(/^\ufeff/, ''))); }
    catch { throw new Error('Invalid Python manifest.'); }
  }
  const record = z.record(z.string(), z.unknown());
  const project = record.safeParse(manifest.project).data ?? {};
  const tool = record.safeParse(manifest.tool).data ?? {};
  const poetry = record.safeParse(tool.poetry).data ?? {};
  const usage: string[] = [];
  for (const candidate of [project.scripts, poetry.scripts]) {
    const scripts = z.record(z.string(), z.string()).safeParse(candidate);
    if (scripts.success) {
      for (const name of Object.keys(scripts.data).sort()) {
        if (sanitizeEvidence(name) === name && !name.includes('[REDACTED]')) usage.push(name);
      }
    }
  }
  return {
    stack: 'Python',
    name: [project.name, poetry.name].map(sanitizeEvidence).find((value) => value !== 'Not Found') ?? 'Not Found',
    purpose: [project.description, poetry.description].map(sanitizeEvidence).find((value) => value !== 'Not Found') ?? 'Not Found',
    setup: hasRequirements ? 'pip install -r requirements.txt' : 'Not Found',
    usage: [...new Set(usage)],
  };
}