import { describe, expect, it } from 'vitest';
import { extractNode, extractPython } from '../src/manifests.js';

describe('extractNode', () => {
  it('extracts declared fields and names, never script bodies', () => {
    const result = extractNode(JSON.stringify({ name: 'tool', description: 'Purpose', scripts: { test: 'body-only' }, bin: { tool: 'bin.js' } }));
    expect(result).toEqual({ stack: 'Node.js/TypeScript', name: 'tool', purpose: 'Purpose', setup: 'npm install', usage: ['npm run test', 'tool'] });
    expect(JSON.stringify(result).includes('body-only')).toBe(false);
  });
  it('uses Not Found for absent or unsafe optional fields', () => {
    expect(extractNode('{}')).toEqual({ stack: 'Node.js/TypeScript', name: 'Not Found', purpose: 'Not Found', setup: 'npm install', usage: [] });
    expect(extractNode('{"name":3,"description":null}').name).toBe('Not Found');
    expect(extractNode('{"scripts":{"ghp_synthetic":"body"}}').usage).toEqual([]);
  });
  it('supports a string executable entry and rejects malformed manifests', () => {
    expect(extractNode('{"name":"@team/tool","bin":"bin.js"}').usage).toEqual(['tool']);
    expect(() => extractNode('invalid')).toThrow('Invalid Node manifest.');
    expect(() => extractNode('[]')).toThrow('Invalid Node manifest.');
  });
});

describe('extractPython', () => {
  it('uses project fields before Poetry and lists declared executable names', () => {
    const result = extractPython('[project]\nname="project"\ndescription="Purpose"\n[project.scripts]\nrun="module:main"\n[tool.poetry]\nname="fallback"', true);
    expect(result).toEqual({ stack: 'Python', name: 'project', purpose: 'Purpose', setup: 'pip install -r requirements.txt', usage: ['run'] });
  });
  it('supports Poetry fallback, requirements-only and pyproject-only evidence', () => {
    expect(extractPython('[tool.poetry]\nname="poetry"', false).name).toBe('poetry');
    expect(extractPython('[project]\nname="project"', false).setup).toBe('Not Found');
    expect(extractPython(undefined, true).purpose).toBe('Not Found');
  });
  it('rejects malformed or absent evidence instead of guessing', () => {
    expect(() => extractPython('[invalid', false)).toThrow('Invalid Python manifest.');
    expect(() => extractPython(undefined, false)).toThrow('evidence not found');
  });
});