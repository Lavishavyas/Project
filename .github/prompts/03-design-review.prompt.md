---
description: Step 3 - Review the architecture and hand off agreed fixes
agent: reviewer
---

## Scope

Local repository paths only. Detect Node and Python stacks. No GitHub URL cloning, no --branch, no network retries. Everything else in docs/requirements.md stays in scope. Record deferred items in Known Limitations. Never modify samples/; it is a read-only test target.

## Task

Read docs/requirements.md and docs/architecture.md. Review the design for correctness, traceability, security, error handling, testability, and feasibility within this Scope.

Write docs/design-review.md with:
1. Findings and risks, each with severity (Critical, High, Medium, Low), evidence, affected FR/NFR IDs, and a proposed fix.
2. Agreed decisions grounded in requirements or explicit user decisions; separate unapproved proposals and ambiguities.
3. A concrete architecture remediation checklist and acceptance checks.
4. Known Limitations listing deferred requirements, including the deferred portions of mixed-scope FRs/NFRs.

Then use Apply Design Review Fixes to hand off to the default agent, which updates docs/architecture.md to fix the agreed issues and records remaining blockers. The reviewer must not edit architecture or source code. If a handoff cannot be executed automatically, provide the handoff action and remediation instructions, and state that fixes remain pending; do not claim they were applied. Preserve Scope and FR/NFR traceability throughout.