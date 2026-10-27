---
description: Step 4 - Create the dependency-ordered implementation plan
agent: agent
---

## Scope

Local repository paths only. Detect Node and Python stacks. No GitHub URL cloning, no --branch, no network retries. Everything else in docs/requirements.md stays in scope. Record deferred items in Known Limitations. Never modify samples/; it is a read-only test target.

## Task

Read docs/requirements.md, docs/architecture.md, and docs/design-review.md if present. Flag inconsistencies rather than inventing requirements.

Write docs/impl-plan.md as a dependency-ordered task list. Give every task a stable ID, priority (P0/P1/P2), status, dependency IDs, FR/NFR coverage, expected files, implementation work, tests, and measurable completion criteria. Mark blocked tasks as BLOCKED with the concrete reason and prerequisite; do not schedule work that depends on an unresolved design decision as ready.

Include strict TypeScript, unit tests for every function (happy path plus failure or "Not Found"), integration checks, 80% coverage in all four metrics, security checks, failure preservation, and cross-platform/Node compatibility gates from the requirements. Each task must end with npx vitest run and a commit on feature/doc-sync after passing checks. Include a verification task using a disposable copy of samples/bookmark-api, never edits to samples/.

Add Known Limitations mapping deferred URL/cloning/branch/retry and Java/Maven/Go stack work to the relevant requirement IDs, including partial deferrals. Do not mark deferred work complete. Do not implement code in this step.