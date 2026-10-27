# Implementation Plan: doc-sync-agent

## Scope

Local repository paths only. Detect Node and Python stacks. No GitHub URL cloning, no --branch, no network retries. Everything else in docs/requirements.md stays in scope. Deferred items are recorded in Known Limitations below, not marked complete. Never modify anything under samples/; it is a read-only test target.

Planning inputs: docs/requirements.md, docs/architecture.md, and docs/design-review.md as read on 2026-10-27. This document does not apply the outstanding design-review fixes, approve proposed policies, install dependencies, implement code, or execute application verification.

## Execution Rules

- Stable task IDs are ordered topologically below. Follow dependency order; within the ready set use priority P0 before P1 before P2. P2 is lower urgency, not optional acceptance work.
- READY means no unresolved prerequisite is known. BLOCKED means a named task, owner decision, or required verification result is missing. Nothing below is complete. Re-evaluate statuses after each task; do not treat writing this plan as clearing D-1 through D-5.
- Before implementation, inspect git status. Switch to feature/doc-sync if it exists or create it if absent, without discarding changes. Resolve branch-switch conflicts explicitly; never stage unrelated user work or samples/.
- Every task uses the applicable architecture components and existing repository conventions. Suggested implementation paths below are planned homes, not existing APIs; reuse a suitable existing file before creating another abstraction.
- Every new function, including shared test helpers, needs Vitest happy-path and failure or "Not Found" coverage. Use strict TypeScript and ESM. No AI, arbitrary setup execution, guessed evidence, raw secret output, or silent weakening of acceptance criteria.
- **Mandatory closeout for every task:** run focused checks, then `npx vitest run`; only after its task-specific checks and the suite pass, stage task-owned changes and commit on feature/doc-sync with the task ID in the message. Record commands, exit codes, evidence and status here. A failing/empty-suite invocation is not success; `--passWithNoTests` from the edit hook is not a replacement. Do not commit a task as complete while its owner decision or required gate is unresolved.
- T-01 creates the initial nonempty passing suite, allowing subsequent documentation/approval tasks to satisfy the same closeout rule. Obtain decisions outside implementation when necessary; absence of approval is a blocker, not permission to invent a requirement.
- Architecture/design-review edits listed below are future remediation work by the default agent. Keep requirements unchanged unless the user explicitly authorizes a requirement change. Record proposals as proposals until approved.
- Runtime evidence is separate from document checks. Do not report unrun platforms, benchmarks, coverage, recovery scenarios or sample runs as passed. The nine OS/Node combinations and reference-hardware performance gate remain required.

## Dependency-Ordered Tasks

### T-01 - Establish a compatible, testable TypeScript baseline

- **Priority:** P0
- **Status:** READY
- **Dependencies:** None.
- **Coverage:** FR-2; NFR-3, NFR-4, NFR-7. Components C01/C12; review D-2.
- **Expected files:** package.json, package-lock.json, tsconfig.json, vitest.config.ts, src/validation.ts, tests/validation.test.ts, docs/architecture.md, docs/design-review.md, docs/impl-plan.md.
- **Implementation work:** Select and lock commander, Vitest/coverage tooling and parser versions whose engines support Node 20; do not reuse the incompatible installed commander 15/Vitest 5 baseline unchanged. Configure ESM, strict TypeScript, build/typecheck scripts, executable package wiring as appropriate, and four separate 80% coverage thresholds. Verify proposed dependencies' engines before selecting them. Add only the minimal requirement-grounded local request/state schema and its nonempty tests needed to bootstrap the suite; defer policy-sensitive parsing, previews and writes. Record the chosen compatibility gate and exact versions in architecture and D-2 remediation status; do not claim all platforms passed.
- **Tests:** Valid/invalid local request and missing input/state-schema cases; typecheck/build; nonempty Vitest suite; inspect engine declarations and perform dependency audit without leaking credentials. Test every introduced function. Capture current-runtime results and explicitly list remaining matrix cells.
- **Completion criteria:** Strict ESM build and typecheck pass, selected versions declare minimum-runtime compatibility, test/coverage commands are wired, a nonempty `npx vitest run` passes, and D-2's design omission is addressed without claiming its full runtime matrix verified. Stage only owned changes and commit T-01 on feature/doc-sync after passing checks.

### T-02 - Resolve the fatal-write failure contract

- **Priority:** P0
- **Status:** BLOCKED
- **Dependencies:** T-01; explicit owner resolution of D-1.
- **Blocker/prerequisite:** FR-22 is unconditional while the architecture qualifies rollback success. An accepted supported failure/concurrency model and a requirement-conforming recovery strategy, or an explicitly authorized requirement interpretation/change, are absent. An error message alone cannot satisfy preservation.
- **Coverage:** FR-5, FR-12, FR-14, FR-22; NFR-6. Components C11/C12; review D-1.
- **Expected files:** docs/architecture.md, docs/design-review.md, docs/impl-plan.md; docs/requirements.md only if separately authorized by the user.
- **Implementation work:** Document the commit point, staging/snapshot lifecycle, baseline-last ordering, cleanup errors, failed rollback, concurrent replacement, interruption boundaries and exact recovery obligations. Distinguish fatal-error preservation from atomic visibility to readers. Do not silently add persistent journaling or waive impossible cases as an approved limitation. If no conforming accepted strategy exists, keep this task and normal-write dependents blocked.
- **Tests:** Specify a fault-injection case for each staging/write/flush/replace/cleanup boundary, original absence/existence combinations, baseline-only writes, recovery failure and concurrency. Keep the existing suite passing; these documented cases are not runtime results yet.
- **Completion criteria:** The owner-approved contract is recorded without contradicting FR-22, every listed fault has an explicit expected outcome, and remaining nonconformance is not called complete. Run `npx vitest run`, then commit T-02 on feature/doc-sync only after the decision and checks pass.

### T-03 - Approve text, ownership, counting and preview contracts

- **Priority:** P0
- **Status:** BLOCKED
- **Dependencies:** T-01; approval of unresolved policies in D-3/D-5 and architecture Section 10.
- **Blocker/prerequisite:** Encoding/byte mapping, mixed-ending append rules, marker examples in code, committed versus destination marker validity, malformed evidence classification, mixed README counting and projection-relative previews do not yet have approved expected outcomes.
- **Coverage:** FR-2, FR-5, FR-7, FR-8, FR-10, FR-11, FR-12, FR-15, FR-20, FR-21, FR-25; NFR-2, NFR-5, NFR-6. Components C03/C05/C07/C08/C10/C12; review D-3/D-5.
- **Expected files:** docs/architecture.md, docs/design-review.md, docs/impl-plan.md.
- **Implementation work:** Record original-byte authority and tested parser-offset conversion, accepted encodings/BOM handling, append convention without normalizing existing bytes, marker recognition in fenced/inline code, invalid HEAD versus repaired destination policy, binary/malformed optional evidence behavior, mixed/manual/generated README inventory semantics, and safe unified-preview coordinates. Existing section pairs may stay in arbitrary section order. Do not attribute new proposals to prior user decisions.
- **Tests:** Define acceptance fixtures for Unicode/emoji/BOM, invalid encoding, CRLF/LF/mixed endings, no final newline, marker examples/malformed permutations, mixed README counting, unsafe optional evidence and manual-secret-free previews. Run existing checks without claiming these future tests passed.
- **Completion criteria:** Every listed policy has an approved deterministic outcome and affected architecture/review entries agree; unresolved policies keep this task BLOCKED. Run `npx vitest run`, then commit T-03 on feature/doc-sync after approval and passing checks.

### T-04 - Specify eligibility-driven incremental invalidation

- **Priority:** P0
- **Status:** BLOCKED
- **Dependencies:** T-01.
- **Blocker/prerequisite:** T-01 is incomplete; D-4's effective inventory delta is not yet incorporated into the architecture. This is requirement-grounded remediation, not permission to choose unrelated unresolved policies.
- **Coverage:** FR-5, FR-7, FR-13, FR-15; NFR-2, NFR-5, NFR-6. Components C02/C03/C04/C07/C12; review D-4.
- **Expected files:** docs/architecture.md, docs/design-review.md, docs/impl-plan.md.
- **Implementation work:** Define committed old/new inventory comparison alongside raw git deltas. Treat unchanged tracked paths newly included/excluded by committed ignore rules as effective additions/removals for impact planning; keep HEAD rules authoritative for current inventory. Preserve rename endpoints, manual README evidence and generated-only suppression. Record any newly discovered requirement ambiguity as a blocker.
- **Tests:** Specify root/nested ignore-only commits affecting a manifest and environment-reference file, dirty ignore files, rename endpoints and generated-only README commits. Validate task-to-component/requirement mapping and run the suite.
- **Completion criteria:** D-4 has concrete expected inventory/count/section outcomes, is reflected consistently in architecture, and no existing scope gate is weakened. Run `npx vitest run`, then commit T-04 on feature/doc-sync after checks pass.

### T-05 - Implement the shared secret-safe output boundary

- **Priority:** P0
- **Status:** BLOCKED
- **Dependencies:** T-01.
- **Blocker/prerequisite:** Compatible toolchain and passing baseline suite are not established.
- **Coverage:** FR-2, FR-10, FR-17, FR-18, FR-20, FR-21, FR-24, FR-25; NFR-5, NFR-6. Components C01/C08/C10/C12.
- **Expected files:** src/security.ts, tests/security.test.ts, docs/impl-plan.md; reuse src/validation.ts for input-boundary integration.
- **Implementation work:** Centralize deterministic redaction and safe error categories before any command/manifest/path evidence is emitted. Cover all FR-25 token/key/private-block/user-info/bearer/environment-assignment patterns; unsafe evidence becomes "Not Found". Reject remote/credential-bearing input with constant messages. Do not pass manual destination text, raw exceptions, source bodies or script bodies to emitters.
- **Tests:** Each listed redaction pattern; safe text, absent/unsafe evidence and repeated deterministic sanitization; names/paths containing synthetic secrets; errors and malformed input; assertions that no sentinel value is printed. Never use real credentials.
- **Completion criteria:** Every new function has happy/failure coverage, required patterns and safe diagnostics pass focused tests, no secret values reach captured output, and `npx vitest run` passes. Commit T-05 on feature/doc-sync after checks pass.

### T-06 - Implement local CLI validation and committed git access

- **Priority:** P0
- **Status:** BLOCKED
- **Dependencies:** T-01, T-03, T-05.
- **Blocker/prerequisite:** Toolchain/security dependencies and approved evidence/error/encoding policies are incomplete.
- **Coverage:** FR-1, FR-2, FR-4, FR-5, FR-14, FR-15, FR-16, FR-21, FR-24, FR-25; NFR-3, NFR-7. Components C01/C02/C12.
- **Expected files:** src/cli.ts, src/validation.ts, src/git.ts, tests/validation.test.ts, tests/cli.test.ts, tests/git.test.ts, package.json, docs/impl-plan.md.
- **Implementation work:** Parse local path/--dry-run; reject URL, --branch and --out safely. Resolve root, validate boundaries and output components without following links/junctions, pin HEAD, obtain tracked paths/blob modes/content and baseline diffs via argument arrays. Use committed source/ignore evidence, warning on dirty source. Distinguish empty/non-git/invalid paths, malformed state, and unavailable commit fallback without network access.
- **Tests:** Valid local/nested paths, missing input, URL/options rejection, path with spaces, invalid/missing path, non-git/empty repo, wrong/missing/malformed baseline, dirty staged/unstaged/untracked source, symlinks/junctions and unsafe output types. Verify no script execution or raw git error output.
- **Completion criteria:** CLI validation and pinned readers return the agreed typed results, no dirty source affects evidence, failures are explicit/non-mutating, build/typecheck and `npx vitest run` pass. Commit T-06 on feature/doc-sync after checks pass; the full sync command is wired in T-14.

### T-07 - Implement deterministic eligibility and inventory

- **Priority:** P1
- **Status:** BLOCKED
- **Dependencies:** T-03, T-04, T-06.
- **Blocker/prerequisite:** Inventory contract/remediation and safe committed readers are incomplete.
- **Coverage:** FR-5, FR-6, FR-7, FR-13, FR-24; NFR-1, NFR-2, NFR-5, NFR-6. Components C03/C04/C12.
- **Expected files:** src/inventory.ts, tests/inventory.test.ts, tests/git.test.ts, docs/impl-plan.md.
- **Implementation work:** Apply committed nested ignores even to tracked files; exclude .git/node_modules/dist, prohibited secrets/links, state/changelog inputs and generated-only changes without deleting manual README evidence. Produce sorted relative paths, root-first manifest ordering, eligible counts and effective old/new inventory deltas. Warn above 500 and scan all eligible files without truncation.
- **Tests:** Nested negations/precedence checked against Git behavior, tracked-but-ignored paths, dirty ignore isolation, effective ignore-only additions/removals, renamed/manual/generated README cases under approved rules, deterministic ordering, exclusions and 501+ files.
- **Completion criteria:** Exact expected eligible paths/counts/impacts match fixtures and required Git semantics, all excluded secret files remain unopened, and `npx vitest run` passes. Commit T-07 on feature/doc-sync after checks pass.

### T-08 - Extract Node/Python and committed README evidence

- **Priority:** P1
- **Status:** BLOCKED
- **Dependencies:** T-03, T-05, T-07.
- **Blocker/prerequisite:** Approved parsing/ownership policies, sanitizer and inventory are incomplete.
- **Coverage:** FR-6, FR-7, FR-8, FR-9, FR-10, FR-15, FR-25; NFR-5, NFR-6. Components C05/C08/C12.
- **Expected files:** src/evidence.ts, src/readme.ts, tests/evidence.test.ts, tests/readme.test.ts, docs/impl-plan.md.
- **Implementation work:** Parse package JSON and Python TOML with chosen structured parsers and validate fields. Detect both stacks recursively; implement exact name/purpose/setup/usage ordering, directory-labeled command deduplication, pyproject-only setup "Not Found", and manual committed H1/prose/Usage fallbacks using Markdown/GFM parsing. Do not execute scripts, copy script bodies, extract dirty destination evidence, or add Maven/Go adapters.
- **Tests:** Node-only, Python-only, multi-stack/nested ordering, absent/invalid evidence under approved policy, every fallback, headings/lists/tables/badges/code exclusions, scripts/bin names without bodies, unsafe fields and dirty destination isolation. Include Unicode parser offsets under T-03's contract.
- **Completion criteria:** Evidence fixtures produce exact expected facts or "Not Found", deterministic repeat results and all new-function happy/failure tests pass, followed by `npx vitest run`. Commit T-08 on feature/doc-sync after checks pass.

### T-09 - Extract environment names without retaining values

- **Priority:** P1
- **Status:** BLOCKED
- **Dependencies:** T-05, T-07.
- **Blocker/prerequisite:** Safe inventory and output boundary are incomplete.
- **Coverage:** FR-7, FR-13, FR-24, FR-25; NFR-5, NFR-6. Components C06/C08/C12.
- **Expected files:** src/environment.ts, tests/environment.test.ts, docs/impl-plan.md.
- **Implementation work:** Collect only assignment names from exact-basename .env.example with optional export, plus all eight specified literal reference forms. Handle allowed quote styles, deduplicate/sort valid names, ignore dynamic expressions, never open prohibited .env/private-key files. Java/Go literal forms remain generic parsing, not stack detection.
- **Tests:** Each required form, both quote styles where applicable, invalid/dynamic names, empty/missing evidence, duplicate ordering, .env.example assignment/export parsing and value non-retention. Assert prohibited files are never opened and synthetic values never emitted.
- **Completion criteria:** Exact sorted names or "Not Found", every new-function happy/failure path and security assertions pass, followed by `npx vitest run`. Commit T-09 on feature/doc-sync after checks pass.

### T-10 - Implement byte-preserving README ownership and rendering

- **Priority:** P0
- **Status:** BLOCKED
- **Dependencies:** T-03, T-08, T-09.
- **Blocker/prerequisite:** Approved marker/byte/newline contracts and section evidence are incomplete; D-3/D-5 must not be bypassed.
- **Coverage:** FR-7, FR-11, FR-12, FR-13, FR-15, FR-17, FR-19; NFR-5, NFR-6. Components C05/C07/C12.
- **Expected files:** src/readme.ts, tests/readme.test.ts, docs/impl-plan.md.
- **Implementation work:** Validate exact canonical marker pairs, map approved parser coordinates to original byte buffers, preserve manual/unaffected bytes and existing pair order, append missing sections in canonical order, and render all seven sections. Accept an impacted-section set as an input; do not embed mutable git evidence or write files here.
- **Tests:** Full/partial/no markers, all malformed pair types, code examples under approved policy, missing README, manual duplicate headings, mixed endings, emoji/BOM/no final newline, unaffected sections, empty/unsafe evidence and repeated deterministic rendering.
- **Completion criteria:** Expected generated content and byte-exact preservation assertions pass; invalid ownership fails before writes. Run `npx vitest run`, then commit T-10 on feature/doc-sync after checks pass.

### T-11 - Plan incremental impacts, changelog and successful state

- **Priority:** P1
- **Status:** BLOCKED
- **Dependencies:** T-04, T-06, T-07, T-10.
- **Blocker/prerequisite:** Committed readers, eligibility invalidation and ownership rendering are incomplete.
- **Coverage:** FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19, FR-25; NFR-5, NFR-6. Components C04/C07/C08/C09/C12.
- **Expected files:** src/sync-plan.ts, tests/sync-plan.test.ts, src/validation.ts, docs/impl-plan.md.
- **Implementation work:** Build a pure complete output plan: initial scan, valid incremental diff, missing-history warning/full scan, relevant paths, unioned impacts including effective eligibility changes/rename endpoints, missing sections, byte-preserving changelog append and local state. Use an injected UTC clock and approved schema/layout. Advance the pinned SHA on successful normal no-change runs; do not invent a changed list when history is unavailable. Suppress generated-only loops and state-only changelog entries.
- **Tests:** Initial entry, missing/malformed/unavailable baseline distinctions, every section impact, ignore-only changes, generated-only commits, manual README changes, missing markers with no source diff, no-change baseline advance, date formatting, absent changelog and unsafe path/name reporting.
- **Completion criteria:** Exact planned bytes, expected section/path summaries and SHA transitions match fixtures without filesystem writes; all new-function cases and `npx vitest run` pass. Commit T-11 on feature/doc-sync after checks pass.

### T-12 - Implement secret-safe previews and reporting

- **Priority:** P1
- **Status:** BLOCKED
- **Dependencies:** T-03, T-05, T-11.
- **Blocker/prerequisite:** Preview policy is unapproved and complete sanitized plans are unavailable.
- **Coverage:** FR-17, FR-18, FR-20, FR-21, FR-25; NFR-5, NFR-6. Components C08/C10/C12.
- **Expected files:** src/reporting.ts, tests/reporting.test.ts, docs/impl-plan.md.
- **Implementation work:** Render approved safe unified projections, separate SHA transition, changed/added/"Not Found" results, no-change message and categorized warnings/errors. Exclude all existing manual README/changelog context; sanitize old generated text as well as additions. Preview rendering must not create temporary/output/state files.
- **Tests:** Missing outputs as empty, no-change runs, modified/removed/generated text, synthetic secrets in old owned content and manual context, filenames/headers, invalid input and captured stream errors under the approved failure contract. Compare before/after filesystem inventories for dry-run integration later.
- **Completion criteria:** Preview/summary output matches the approved format, all synthetic secret/manual-context assertions pass, no writes occur, and `npx vitest run` passes. Commit T-12 on feature/doc-sync after checks pass.

### T-13 - Implement the approved cross-file transaction

- **Priority:** P0
- **Status:** BLOCKED
- **Dependencies:** T-02, T-03, T-11.
- **Blocker/prerequisite:** D-1's accepted failure contract/recovery strategy is absent; planning a transaction does not approve the current conditional guarantee.
- **Coverage:** FR-2, FR-5, FR-12, FR-14, FR-19, FR-20, FR-21, FR-22; NFR-3, NFR-6. Components C09/C11/C12.
- **Expected files:** src/transaction.ts, tests/transaction.test.ts, docs/impl-plan.md.
- **Implementation work:** Implement only T-02's approved strategy: finish computation/validation, snapshot original bytes/existence/metadata, stage safely on the destination filesystem, revalidate boundaries/identities, replace changed data outputs and install baseline last. Retain recovery material through all relevant cleanup; dry runs never enter this component's write path. Do not silently narrow the failure model or mark partial recovery successful.
- **Tests:** Inject candidate/snapshot open/write/flush/close failures; each README/changelog/state replacement and immediately-after-replacement failure; cleanup/revalidation failure; absent/existing output combinations and baseline-only writes. Include rollback failure, concurrent edits and link swaps with exactly the approved expected outcomes. Compare all target bytes/existence and temporary-artifact inventory after each case.
- **Completion criteria:** Every approved FR-22 fault case preserves original targets/absence with correct nonzero outcome and no false success; unresolved cases remain failing/blocking, not skipped passes. Run build/typecheck and `npx vitest run`, then commit T-13 on feature/doc-sync only when all required checks pass.

### T-14 - Wire the CLI and complete integration/security coverage

- **Priority:** P0
- **Status:** BLOCKED
- **Dependencies:** T-06, T-12, T-13.
- **Blocker/prerequisite:** Dry-run/reporting and approved write transactions are incomplete; normal-write CLI must not bypass T-13.
- **Coverage:** FR-1, FR-2, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-21, FR-22, FR-24, FR-25; NFR-4, NFR-5, NFR-6, NFR-7. Components C01-C12.
- **Expected files:** src/cli.ts, tests/cli.test.ts, tests/integration.test.ts, existing focused test files, package.json, docs/impl-plan.md.
- **Implementation work:** Connect validate/pin/scan/extract/plan/preview-or-commit/report in architecture order. Exercise real disposable local git repositories, not mocked happy paths alone. Fill coverage gaps without adding unrelated functionality; carry all scoped local failure modes and no-network guarantees through the actual entry point.
- **Tests:** End-to-end initial/incremental/dry-run/real/no-change/fallback runs; dirty-source isolation; invalid/empty/non-git targets; byte-preserving manual edits; marker failures; unsafe outputs; prohibited-file non-access; secret-free logs/previews/errors; full transaction faults; no generated-only loop; direct CLI exit codes. Run `npx vitest run --coverage` with each of lines/branches/functions/statements >=80%, plus build/typecheck.
- **Completion criteria:** All in-scope integration cases and four independent coverage thresholds pass with a nonempty suite. Run final `npx vitest run`, then commit T-14 on feature/doc-sync after all checks pass. This does not substitute for reference-hardware or cross-platform verification.

### T-15 - Measure the full required performance fixture

- **Priority:** P2
- **Status:** BLOCKED
- **Dependencies:** T-14; access to the NFR-1 reference environment.
- **Blocker/prerequisite:** Integrated pipeline and recorded Linux x64/4-logical-CPU/8-GiB/SSD/Node-24 environment evidence are unavailable. A timing on another environment cannot be recorded as the required gate.
- **Coverage:** FR-5, FR-24; NFR-1, NFR-2, NFR-5, NFR-6. Components C03/C06/C12.
- **Expected files:** tests/performance.test.ts, reusable existing fixture helpers, docs/verification.md, docs/impl-plan.md.
- **Implementation work:** Retain deterministic construction of a 500-eligible-tracked-file fixture, each file <=16 KiB, all four stacks represented, 50 committed changed files. Maven/Go files exercise generic scanning/structure/environment extraction only, not deferred adapters. Use monotonic timing for scan/diff/sanitize/generation, excluding writes/cleanup/acquisition, and retain measurements. Do not claim a two-stack substitute satisfies NFR-1.
- **Tests:** Three consecutive measured runs each <30 seconds on the required environment, exact fixture counts/changes, deterministic results and 501+ warning-without-truncation behavior. New fixture helpers need happy/failure tests too.
- **Completion criteria:** Required environment and all three passing timings are recorded, not estimated; unavailable environment or excessive time keeps this task BLOCKED. Run `npx vitest run`, then commit T-15 on feature/doc-sync after checks pass.

### T-16 - Verify the read-only sample through a disposable copy

- **Priority:** P1
- **Status:** BLOCKED
- **Dependencies:** T-14; samples/bookmark-api exists and is readable without modifying it.
- **Blocker/prerequisite:** No integrated tool evidence is available yet; sample presence/readability has not been verified by this planning step. Missing samples must be reported, never created or repaired under samples/.
- **Coverage:** FR-5, FR-7, FR-11, FR-12, FR-14, FR-15, FR-17, FR-18, FR-20, FR-22, FR-24, FR-25; NFR-4, NFR-6. Components C01/C07/C09/C10/C11/C12.
- **Expected files:** docs/verification.md, docs/impl-plan.md, reusable integration tests only if a verified regression is found. All mutable fixtures live in a disposable directory outside samples/ and the scanned project tree.
- **Implementation work:** Record original sample git status/path metadata without exposing contents or opening prohibited secret files. Prepare an independent disposable copy/history, excluding prohibited files; derive the actual CLI invocation from implementation. Run --dry-run, real sync, then no-change and committed incremental runs against that copy. Never run write mode or git fixture commits against the original sample. Clean up only the disposable copy after recording evidence.
- **Tests:** Dry-run bytes/existence/state unchanged; all seven sections and marker pairs; missing/unsafe facts use "Not Found"; names-only environment output; no synthetic secret values or manual diff context; manual bytes preserved; initial/incremental/no-change changelog and baseline correctness. Assert original sample status/metadata inventory unchanged. Also run `npx vitest run --coverage` and retain all four >=80% results.
- **Completion criteria:** docs/verification.md contains actual preparation/invocation commands, exit codes, sanitized outputs, assertions and original-sample non-modification evidence. Missing sample, failed assertion or missing coverage is a blocker, not a pass. Run `npx vitest run`, then commit T-16 on feature/doc-sync after checks pass.

### T-17 - Close compatibility, audit and acceptance gates

- **Priority:** P1
- **Status:** BLOCKED
- **Dependencies:** T-14, T-15, T-16; all outstanding design approvals and access to required CI platforms/runtimes.
- **Blocker/prerequisite:** No completed runtime, sample, performance or nine-cell OS/Node matrix evidence exists. D-1 through D-5 are still pending in the source review.
- **Coverage:** All local portions of FR-1 through FR-25, excluding only documented deferrals; NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, NFR-7. Components C01-C12.
- **Expected files:** .github/workflows/ci.yml, docs/verification.md, docs/impl-plan.md, docs/design-review.md; package/lock/test changes only for explicitly diagnosed remaining defects and with regression tests.
- **Implementation work:** Run latest-patch Node 20/22/24 across Windows/macOS/Linux: locked install, strict typecheck/build, full tests and four coverage thresholds. Verify selected dependency engines/coverage-provider compatibility, run npm audit and record findings without blindly applying fixes. Consolidate implemented-versus-deferred FR/NFR evidence and review-remediation status. Resolve failing gates within approved scope; unavailable runners or unresolved approval are not waived.
- **Tests:** All nine matrix cells, actual executable smoke runs, the approved preservation/security regressions, current dependency audit, reference performance results and T-16 sample evidence. CI failures and audit findings require explicit disposition; never equate zero audit vulnerabilities with runtime compatibility.
- **Completion criteria:** All required scoped gates have actual passing evidence and all approval blockers are resolved; deferred features remain explicitly incomplete. Run final `npx vitest run`, then commit T-17 on feature/doc-sync after passing checks. No PR or remote push is authorized by this planning step.

## Requirement Coverage Index

Full requirements remain the source of truth; task references below cover local portions only. A mapping is planned work, not completed functionality.

| Requirement | Planned tasks | Scope note |
| --- | --- | --- |
| FR-1 | T-06, T-14, T-17 | Local inputs and safe remote rejection only. |
| FR-2 | T-01, T-03, T-05, T-06, T-13, T-14 | Local inputs/state/evidence validation; no accepted URL workflow. |
| FR-3 | None | Entire acquisition/default-branch/selected-branch/clone-cleanup behavior deferred. |
| FR-4 | T-06, T-14 | Reject URL-only options locally; remote output behavior deferred. |
| FR-5 | T-02, T-03, T-04, T-06, T-07, T-13, T-14, T-15, T-16 | Committed scan, containment and eligibility remain required. |
| FR-6 | T-07, T-08, T-14 | Node/Python detection only; unsupported evidence is "Not Found". |
| FR-7 | T-03, T-04, T-07, T-08, T-09, T-10, T-14, T-16 | All seven sections; Maven/Go-specific field extraction deferred. |
| FR-8 | T-03, T-08, T-14 | Supported manifest/README precedence; Maven-specific description extraction deferred. |
| FR-9 | T-08, T-14 | npm/pip mappings; pyproject-only "Not Found"; Maven/Go commands deferred. |
| FR-10 | T-03, T-05, T-08, T-14 | Manifest names and committed Usage fallback, never script bodies. |
| FR-11 | T-03, T-10, T-14, T-16 | All marker validation and approved recognition rules. |
| FR-12 | T-02, T-03, T-10, T-11, T-13, T-14, T-16 | Manual byte preservation and missing-section append. |
| FR-13 | T-04, T-07, T-09, T-10, T-11, T-14 | Effective inventory/source impacts; adapter-specific Java/Go impacts deferred. |
| FR-14 | T-02, T-06, T-11, T-13, T-14, T-16 | Successful local SHA only; remote identity/state deferred. |
| FR-15 | T-03, T-04, T-06, T-08, T-10, T-11, T-14, T-16 | HEAD evidence and dirty-source warning, destination-only preservation. |
| FR-16 | T-06, T-11, T-14 | Initial/missing-history fallback remains local and network-free. |
| FR-17 | T-05, T-10, T-11, T-12, T-14, T-16 | Changed/added/"Not Found" and impacted sections. |
| FR-18 | T-05, T-11, T-12, T-14, T-16 | Initial/dated append, suppression and no-change behavior. |
| FR-19 | T-10, T-11, T-13, T-14 | Default local writes blocked on approved failure handling. |
| FR-20 | T-03, T-05, T-12, T-13, T-14, T-16 | Write-free local preview; remote acquisition/--out semantics deferred. |
| FR-21 | T-03, T-05, T-06, T-12, T-13, T-14 | Clear local errors; GitHub HTTP/network behavior deferred. |
| FR-22 | T-02, T-13, T-14, T-16, T-17 | Approval blocker, not an authorized deferral. |
| FR-23 | None | Entire retry/backoff/rate-limit behavior deferred. |
| FR-24 | T-05, T-06, T-07, T-09, T-14, T-15, T-16 | All eight literal forms, including Java/Go, remain in scope. |
| FR-25 | T-03, T-05, T-06, T-08, T-09, T-11, T-12, T-14, T-16 | Shared sanitizer and local rejection without credential echo. |
| NFR-1 | T-07, T-15, T-17 | Full specified four-stack fixture and reference-environment timing. |
| NFR-2 | T-03, T-04, T-07, T-15, T-17 | Committed eligible counts and above-500 non-truncation. |
| NFR-3 | T-01, T-06, T-13, T-17 | Required minimum and full three-OS by three-Node matrix. |
| NFR-4 | T-01, T-14, T-16, T-17 | Happy/failure tests per function and four separate 80% gates. |
| NFR-5 | T-03, T-04, T-05, T-07, T-08, T-09, T-10, T-11, T-12, T-15, T-17 | Deterministic evidence/templates and injected UTC metadata. |
| NFR-6 | T-02, T-03, T-04, T-05, T-07, T-08, T-09, T-10, T-11, T-12, T-13, T-14, T-15, T-16, T-17 | All local safety gates; remote/retry and deferred adapter-specific tests excluded. |
| NFR-7 | T-01, T-06, T-14, T-17 | Required strict TypeScript/ESM/runtime and named libraries. |

## Known Limitations

| Requirement IDs | Deferred portion | Still required |
| --- | --- | --- |
| FR-1, FR-2, FR-3, FR-21, FR-25 | GitHub URL acceptance/validation and private/public classification, full cloning, branch resolution, remote availability/errors and clone cleanup. | Local validation, constant sanitized remote-input rejection, local error paths and secret protection. |
| FR-3, FR-4, FR-14, FR-20 | --branch, URL-only --out, remote identity/output seeding/reuse/collisions, remote baseline placement and temporary acquisition lifecycle. | Reject URL-only options locally, local baseline/manual preservation and no-write previews. |
| FR-23, NFR-6 | Network retries, 1/2/4-second backoff, four-attempt limits, HTTP 403/429 non-retry and associated tests. | All local failure handling, rollback and error-output tests. |
| FR-6, FR-7, FR-8, FR-9, FR-13, NFR-6 | Java/Maven/Go stack adapters, manifest-specific fields/setup/impacts and their adapter assertions. | Node/Python multi-stack support, generic Java/Go eligible files, structure and all required environment literal forms. |
| NFR-1, FR-24, NFR-6 | No deferral of performance-fixture composition or generic environment forms. | Full four-stack/500-file/50-change/three-run gate and System.getenv/os.Getenv/os.LookupEnv forms remain mandatory. |
| FR-5, FR-11, FR-12, FR-20, FR-22, NFR-2, NFR-3 | No authorized deferral for design/compatibility approval gaps or unavailable verification evidence. | Resolve D-1 through D-5 and approved policies, preserve all scoped requirements, and keep affected tasks blocked until gates pass. |

## Current Readiness and Evidence

- T-01 is the only initial READY task. T-02/T-03 require owner decisions; T-04 and later implementation tasks await listed prerequisites. No finding or task has been marked complete by this plan.
- Source documents still show D-1 through D-5 as pending. Do not claim architecture remediation was performed, or change source requirements to hide the inconsistency.
- Sample existence, dependency engine changes, actual Node-20 execution, build/tests, audit freshness, runtime recovery, coverage, benchmark and matrix execution are not verified by writing this plan.
- Creation of this document does not authorize implementation, branch creation, dependency installation, task commits, a remote push or PR now. The future per-task workflow above applies when implementation is requested.