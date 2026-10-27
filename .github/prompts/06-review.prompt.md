---
description: Step 6 - Review implementation and hand off fixes
agent: reviewer
---

## Scope

Local repository paths only. Detect Node and Python stacks. No GitHub URL cloning, no --branch, no network retries. Everything else in docs/requirements.md stays in scope. Record deferred items in Known Limitations. Never modify samples/; it is a read-only test target.

## Task

Read docs/requirements.md, docs/architecture.md, docs/impl-plan.md, and the implementation and tests. Review against Correctness, Security, Error Handling, Test Coverage, Code Clarity, DRY, and Dependency Safety.

Run existing non-mutating checks and `npm audit`; do not run npm audit fix, install dependencies, or modify source, tests, configuration, or lockfiles as the reviewer. Report audit command exit status and sanitized findings. If the registry is unavailable, state that dependency safety is unverified rather than treating an unavailable audit as a pass. The application's no-network-retries scope does not prohibit this requested development audit.

Write docs/code-review.md with findings first, ordered by severity (Critical, High, Medium, Low). For each finding include evidence and file/line references, affected FR/NFR IDs, impact, a recommended fix, and a regression check. Include results or gaps for all seven review areas, actual command results, a remediation checklist, and Known Limitations. Do not report deferred features as implementation regressions; still report failures of the remaining in-scope requirements.

Then use Apply Code Review Fixes to hand off to the default agent, which fixes the issues, adds regression tests, runs `npx vitest run` and `npm audit`, and records addressed versus remaining findings in docs/code-review.md. Preserve task order and commit completed remediation tasks on feature/doc-sync only after their checks pass. The reviewer must never edit source code. If handoff execution needs user action, provide the handoff action and exact remediation steps and mark fixes pending rather than claiming completion.