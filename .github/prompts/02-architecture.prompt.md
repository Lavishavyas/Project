---
description: Step 2 - Design the high-level architecture
agent: architect
---

## Scope

Local repository paths only. Detect Node and Python stacks. No GitHub URL cloning, no --branch, no network retries. Everything else in docs/requirements.md stays in scope. Record deferred items in Known Limitations. Never modify samples/; it is a read-only test target.

## Task

Read docs/requirements.md. Design only the in-scope portions, preserving the original FR/NFR IDs. Flag ambiguity rather than inventing requirements. Do not edit the requirements to conceal deferrals.

Write docs/architecture.md with these sections:
1. Overview (3-4 sentences)
2. Technology choices, each with a one-line reason
3. Component diagram (Mermaid)
4. Components and responsibilities (table: Component, Responsibility, Inputs, Outputs, Requirements covered)
5. Data flow (Mermaid), including first-run, incremental, dry-run, and error paths
6. Data and state: .docsync.json schema, README marker format, CHANGELOG entry format
7. Error handling strategy, including how "no files modified on fatal error" is guaranteed
8. Security design: how secrets are kept out of output
9. Traceability matrix: every FR and NFR mapped to a component
10. Risks and open questions
11. Known Limitations: deferred requirements by ID, including partial deferrals for GitHub URLs, cloning, --branch, retries, and Java/Maven/Go detection

Every component must cover at least one FR/NFR ID. The traceability matrix must distinguish implemented scope from deferred portions rather than assigning components to excluded features. Include a concrete cross-file write/rollback strategy, manual-content preservation, secret-safe previews, and a verification strategy that uses a disposable copy of samples/bookmark-api. Do not write any code. Do not invent requirements.