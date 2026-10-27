import { z } from 'zod';

export function decodeText(input: unknown): string {
  const parsed = z.instanceof(Uint8Array).safeParse(input);
  if (!parsed.success) throw new Error('Unsupported text encoding.');
  try {
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(parsed.data);
    if (text.includes('\0')) throw new Error('Unsupported text encoding.');
    return text;
  } catch {
    throw new Error('Unsupported text encoding.');
  }
}

export function byteOffset(text: string, offset: number): number {
  if (!Number.isInteger(offset) || offset < 0 || offset > text.length) {
    throw new Error('Invalid text boundary.');
  }
  const previous = text.charCodeAt(offset - 1);
  const current = text.charCodeAt(offset);
  if (previous >= 0xd800 && previous <= 0xdbff && current >= 0xdc00 && current <= 0xdfff) {
    throw new Error('Invalid text boundary.');
  }
  return Buffer.byteLength(text.slice(0, offset), 'utf8');
}

export function lineEnding(text: string): '\r\n' | '\n' {
  return /\r?\n/.exec(text)?.[0] === '\r\n' ? '\r\n' : '\n';
}