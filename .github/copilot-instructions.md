# Project: doc-sync-agent

A TypeScript CLI that scans a git repo, generates or updates its README, tracks changes since the last sync, and logs them to CHANGELOG.md.

## Stack
- TypeScript (strict mode), Node 20+, ESM
- vitest for tests, commander for CLI, simple-git for git, zod for validation

## Rules
- Never modify anything under samples/. It is a read-only test target.
- Never invent facts. If information is not in the repo, write "Not Found".
- Never output secrets. List environment variables by name only.
- Validate all external input (paths, URLs, CLI args) with zod.
- Handle errors explicitly: empty repo, invalid path, missing files, API failures.
- Prefer small, pure, well-named functions. No duplicated logic.
- Every new function needs a unit test covering the happy path and a failure or "Not Found" case.

## Workflow
- Source of truth for requirements: docs/requirements.md
- Architecture: docs/architecture.md. Do not deviate without updating it.
- Follow docs/impl-plan.md task order.