---
description: Step 2 - Design the high-level architecture
agent: architect
---

Read docs/requirements.md.

Write docs/architecture.md with these sections:
1. Overview (3-4 sentences)
2. Technology choices, each with a one-line reason
3. Component diagram (Mermaid)
4. Components and responsibilities (table: Component, Responsibility, Inputs, Outputs, Requirements covered)
5. Data flow (Mermaid), including first-run and error paths
6. Data and state: .docsync.json schema, README marker format, CHANGELOG entry format
7. Error handling strategy, including how "no files modified on fatal error" is guaranteed
8. Security design: how secrets are kept out of output
9. Traceability matrix: every FR and NFR mapped to a component
10. Risks and open questions

Do not write any code. Do not invent requirements.