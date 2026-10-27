---
description: Step 5 - Implement the plan with tests and task commits
agent: agent
---

## Scope

Local repository paths only. Detect Node and Python stacks. No GitHub URL cloning, no --branch, no network retries. Everything else in docs/requirements.md stays in scope. Record deferred items in Known Limitations. Never modify samples/; it is a read-only test target.

## Task

Use the doc-sync skill at .github/skills/doc-sync/SKILL.md. Read docs/requirements.md, docs/architecture.md, and docs/impl-plan.md. Follow the plan in dependency order; do not skip blocked prerequisites or silently change the approved architecture.

Before edits, inspect git status. Switch to feature/doc-sync if it exists, or create it if absent, without discarding existing work. Stop and report conflicts that prevent a safe switch. Never revert or include unrelated user changes in task commits.

For each ready task:
1. Implement only its in-scope behavior using strict TypeScript, small well-named functions, commander, simple-git, and zod as specified.
2. Add Vitest tests for every new function: happy path and failure or "Not Found". Add focused regression and security tests for the task's risks. Never read secret-value files or expose secrets in test output.
3. Run focused checks while editing, then run `npx vitest run` after the task. Fix failures before proceeding; the edit hook's --passWithNoTests run is not a substitute for this gate.
4. Update task status and evidence in docs/impl-plan.md. Stage only task-owned changes and commit the completed task on feature/doc-sync with a descriptive message. If checks fail, mark the task blocked and do not commit it as complete.

Honor the read-only samples/ rule by creating fixtures elsewhere or using disposable copies. Preserve manual README content, committed-only extraction, dry-run behavior, all-or-nothing writes, secret filtering, performance, and compatibility requirements. Record deferred requirements in Known Limitations; do not implement URL input, --branch, retries, or Java/Maven/Go detection in this timebox.