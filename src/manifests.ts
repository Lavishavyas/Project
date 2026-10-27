import { z } from 'zod';
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