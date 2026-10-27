## Summary
doc-sync-agent is a TypeScript CLI that scans a local git repository, generates or updates its README inside marker-owned sections, tracks committed changes through a saved baseline SHA, and logs each sync to CHANGELOG.md. It was built through the 8-step agentic SDLC using Copilot agents, prompts, instructions, a skill and hooks.

## Changes Made
- docs/: requirements, architecture, design-review, impl-plan, code-review, verification
- .github/: copilot-instructions, architect and reviewer agents, doc-sync skill, hooks, prompts 01-08
- src/: scanner, manifest and environment extractors, marker parser, renderer, impact mapper, changelog planner, baseline state, transactional writer, CLI
- tests/: 176 vitest tests
- CHANGELOG.md: initial release entry

## Test Evidence
- 176 tests passed (19 files); typecheck clean
- Coverage: 97.08% statements, 89.70% branches, 100% functions, 97.83% lines
- Dry-run on bookmark-api previewed all 7 sections; a real run on a copy succeeded

## Known Limitations
- Local paths only: GitHub URL input, --branch and network retries are not implemented
- Stacks other than Node and Python are reported as Not Found
- Tech Stack shows "Node.js/TypeScript" for plain JavaScript projects

## Reviewer Checklist
- [ ] Requirements in docs/requirements.md are met for local-path scope
- [ ] No secret values appear in generated output
- [ ] Manual README content is preserved
- [ ] Tests pass and coverage is at least 80%
- [ ] Known limitations are acceptable
