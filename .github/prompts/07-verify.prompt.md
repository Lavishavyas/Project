---
description: Step 7 - Verify tests, coverage, and sample documentation safely
agent: agent
---

## Scope

Local repository paths only. Detect Node and Python stacks. No GitHub URL cloning, no --branch, no network retries. Everything else in docs/requirements.md stays in scope. Record deferred items in Known Limitations. Never modify samples/; it is a read-only test target.

## Task

Read docs/requirements.md, docs/architecture.md, docs/impl-plan.md, and docs/code-review.md if present. Use the doc-sync skill. Determine the actual CLI invocation from the implemented entry point; do not invent a command or report checks that were not run.

1. Run `npx vitest run --coverage`. Require at least 80% each for lines, branches, functions, and statements. If coverage dependencies are missing, report and resolve that setup explicitly before rerunning; do not weaken thresholds or count an empty suite as passing.
2. Inspect samples/bookmark-api without changing it. If it is missing or cannot serve as a local git target, record the blocker rather than creating or repairing files under samples/.
3. Prepare a disposable copy of samples/bookmark-api outside samples/ and outside the scanned project tree. If it has no independent usable git history, initialize and commit only the disposable copy, excluding prohibited secret files. Treat this as the same sample verification fixture, not permission to change the original. Record the copy path and exact preparation commands without secret values.
4. Against that disposable sample target, run the implemented tool with `--dry-run`, verify output files and baseline are unchanged, then run it for real. Run again to check incremental/no-change behavior. Record exact invocations, exit codes, sanitized outputs, and assertions. Never run write mode against the original samples/bookmark-api.
5. Inspect the generated README: all seven required sections and canonical marker pairs exist, missing or unsafe evidence is "Not Found", environment variables are names only, and no secret values appear. Use synthetic sentinel secrets in the disposable fixture if needed; record pass/fail without printing sentinel values or reading prohibited .env files. Verify manual sections are preserved and original samples/ remains unchanged using before/after git status and file metadata inventory, without exposing file contents.
6. Check changelog dates, baseline SHA, invalid-path/empty-repo/missing-baseline behavior, and failure preservation through the existing tests. Record performance and platform verification evidence required by the NFRs; mark unavailable platforms or benchmarks as unverified, not passed. Clean up only the disposable copy after recording results.

Write docs/verification.md with commands, exit codes, sanitized outputs, coverage metrics, assertions and results, blockers, and Known Limitations. Deferred requirements and unverified gates must remain explicit. Do not change samples/ or fabricate evidence.