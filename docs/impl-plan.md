# Implementation Plan: doc-sync-agent

## Scope

Local repository paths only, detecting Node/TypeScript and Python stacks. No GitHub URL cloning, --branch, --out, network retries, or Java/Maven/Go stack adapters. Other local requirements in docs/requirements.md and docs/architecture.md remain in scope. Never modify samples/; use a disposable copy for write-mode verification.

This replaces the previous detailed task breakdown. Task results are recorded below. Architecture/design-review owner-approval ambiguities remain unresolved; implementation does not approve their proposed policies.

Continuation update (2026-10-27): the user authorized proceeding without further questions. The task table and earlier evidence retain the original scheduling snapshot; the Execution Ledger below is authoritative for subsequent status. Architecture continuation decisions record implementation choices. Unverified runtime/platform gates and unconditional failure-preservation limits are not counted as passed.

## Execution Rules

- Tasks below are in dependency order. Among available tasks, prefer P0 (prerequisite/safety), then P1 (functional/acceptance), then P2 (performance). P2 remains mandatory.
- READY means no unfinished prerequisite is listed. BLOCKED tasks cannot start until every depends-on task finishes and any named approval/environment condition is satisfied. Reassess statuses after each completion.
- Keep each implementation task limited to its described behavior and tests. Use strict TypeScript, ESM, and the architecture's libraries; reuse existing modules and test helpers.
- Every new function needs Vitest happy-path and failure or "Not Found" tests. Run focused tests and `npx vitest run` after each task; a failing or empty suite is not a pass. T-01 creates the initial nonempty suite.
- For future implementation, work on feature/doc-sync, preserve unrelated changes, and commit only the completed task's files after its checks pass. This planning step creates no code, branch, dependency changes, or commits.
- Do not silently relax requirements or mark unavailable verification as passed. Record approved architecture decisions before dependent code; unresolved decisions remain blockers.

## Dependency-Ordered Tasks

Each description includes the task's focused acceptance check. Requirements covered refer only to the in-scope portions; Known Limitations records partial deferrals.

| Task ID | Description and Focused Check | Priority | Depends On | Requirements Covered | Status |
| --- | --- | --- | --- | --- | --- |
| T-01 | Establish Node-20-compatible locked dependencies, strict TypeScript/ESM, build/typecheck and Vitest with four 80% thresholds. Add a minimal validated local-request schema and nonempty happy/invalid-input tests; record D-2 compatibility choices without claiming the full matrix passed. | P0 | None | FR-2; NFR-3, NFR-4, NFR-7 | COMPLETE |
| T-02 | Resolve D-1's failure/concurrency contract, commit point and recovery obligations in architecture. Specify fault outcomes; obtain owner approval without weakening FR-22 implicitly. | P0 | T-01; owner approval | FR-5, FR-12, FR-14, FR-22; NFR-6 | BLOCKED |
| T-03 | Resolve D-3's encoding and parser-offset-to-byte-buffer contract, including malformed/binary evidence handling. Define Unicode, emoji, BOM and invalid-encoding preservation/failure fixtures. | P0 | T-01; owner approval | FR-2, FR-7, FR-12, FR-15, FR-21; NFR-6 | BLOCKED |
| T-04 | Resolve D-5's marker recognition, committed-versus-destination validation, and mixed-ending append policies. Define fenced/inline-code, malformed-pair and no-final-newline outcomes. | P0 | T-01; owner approval | FR-11, FR-12, FR-15, FR-21; NFR-5, NFR-6 | BLOCKED |
| T-05 | Confirm the secret-safe unified-preview contract: generated-only projections, no manual context, sanitized old/new text and explicit hunk coordinates. Define sentinel non-disclosure assertions. | P0 | T-01; owner approval | FR-20, FR-25; NFR-6 | BLOCKED |
| T-06 | Specify D-4's effective eligibility deltas and mixed README counting in architecture. Define ignore-only inclusion/exclusion and generated-only/manual README outcomes; seek approval for unresolved counting policy. | P0 | T-01; owner approval of counting policy | FR-5, FR-7, FR-13; NFR-2, NFR-5, NFR-6 | BLOCKED |
| T-07 | Implement the single sanitizer and categorized safe diagnostics. Test every FR-25 secret pattern, unsafe/missing evidence, filenames and errors; never emit raw exceptions or real secrets. | P0 | T-01 | FR-2, FR-10, FR-17, FR-18, FR-20, FR-21, FR-24, FR-25; NFR-5, NFR-6 | COMPLETE |
| T-08 | Parse and validate local path/--dry-run arguments. Test missing/invalid input and constant-message rejection of URLs, --branch and --out without credential echo. | P0 | T-01, T-07 | FR-1, FR-2, FR-4, FR-20, FR-21, FR-25; NFR-7 | COMPLETE |
| T-09 | Resolve a safe repository root, pin HEAD and read committed paths/modes/blobs using git argument arrays. Test spaces, empty/non-git paths, dirty-source isolation, symlinks/junctions and unsafe output ancestors. | P0 | T-03, T-08 | FR-5, FR-15, FR-21, FR-24; NFR-3, NFR-7 | BLOCKED |
| T-10 | Validate local .docsync.json and classify initial, incremental and unavailable-baseline runs. Test missing/malformed state, wrong object types, absent commits and warning/full-scan fallback without fetch. | P1 | T-09 | FR-2, FR-14, FR-15, FR-16, FR-21 | BLOCKED |
| T-11 | Build deterministic eligible inventory from HEAD with committed nested ignores and secret/link/generated-input exclusions. Test tracked-but-ignored files, dirty ignores, sorting, counts and >500 warning without truncation. | P1 | T-04, T-06, T-09 | FR-5, FR-6, FR-7, FR-13, FR-24; NFR-1, NFR-2, NFR-5 | BLOCKED |
| T-12 | Compare old/new eligible inventories alongside committed git deltas. Test unchanged files included/excluded by ignore-only commits, rename endpoints, and manual versus generated-only README changes. | P1 | T-06, T-10, T-11 | FR-5, FR-13, FR-15; NFR-2, NFR-5, NFR-6 | BLOCKED |
| T-13 | Extract Node manifest name/description, npm setup and scripts/bin names without script bodies. Test nested ordering, absent/invalid/unsafe fields and exact evidence or "Not Found". | P1 | T-07, T-11 | FR-6, FR-7, FR-8, FR-9, FR-10, FR-25; NFR-5 | BLOCKED |
| T-14 | Extract Python requirements/TOML stack and project/Poetry fields. Test nested precedence, pip requirements setup, pyproject-only setup "Not Found" and malformed/absent evidence under approved policy. | P1 | T-07, T-11 | FR-6, FR-7, FR-8, FR-9, FR-25; NFR-5 | BLOCKED |
| T-15 | Parse committed manual README fallbacks and combine manifest evidence in prescribed order. Test H1, prose and Usage fallbacks, GFM tables/lists/badges/code exclusions, multi-stack ordering and dirty-destination isolation. | P1 | T-03, T-04, T-13, T-14 | FR-6, FR-7, FR-8, FR-9, FR-10, FR-15; NFR-5 | BLOCKED |
| T-16 | Extract only assignment names from exact-basename .env.example, allowing export. Test duplicates, malformed/missing evidence and non-retention of values; assert prohibited .env/private-key files are never opened. | P1 | T-07, T-11 | FR-7, FR-24, FR-25; NFR-5, NFR-6 | BLOCKED |
| T-17 | Recognize all eight required literal environment-reference forms, including generic Java/Go forms. Test quote styles, dynamic-expression rejection, invalid names and sorted union with example names. | P1 | T-16 | FR-7, FR-13, FR-24, FR-25; NFR-5, NFR-6 | BLOCKED |
| T-18 | Implement marker validation and original-byte ownership ranges. Test every malformed pair type, code examples under approved policy, Unicode offsets, existing pair order and committed/destination validity distinctions. | P0 | T-03, T-04, T-11 | FR-11, FR-12, FR-15, FR-21; NFR-6 | BLOCKED |
| T-19 | Render seven sections from supplied evidence and an impacted-section set, appending missing sections. Test exact markers, "Not Found", absent README, mixed endings and byte-identical manual/unaffected content. | P1 | T-15, T-17, T-18 | FR-7, FR-11, FR-12, FR-13, FR-17, FR-19; NFR-5 | BLOCKED |
| T-20 | Calculate unioned section impacts and missing-section work. Test manifests, manual README, environment/source changes, effective eligibility transitions, renames and generated-only suppression. | P1 | T-12, T-18 | FR-12, FR-13, FR-15, FR-17; NFR-5, NFR-6 | BLOCKED |
| T-21 | Plan byte-preserving changelog appends with injected UTC dates. Test initial entry, relevant changes, no-change suppression, unavailable-history paths and safe entry text. | P1 | T-07, T-19, T-20 | FR-17, FR-18, FR-25; NFR-5 | BLOCKED |
| T-22 | Plan validated state transitions to pinned HEAD, including successful no-change runs. Test absent state, changed/unchanged SHA and exclusion of failed/dry-run advancement; perform no writes. | P1 | T-10 | FR-2, FR-14, FR-16; NFR-5 | BLOCKED |
| T-23 | Compose the pure complete README/changelog/state plan. Test initial/incremental/fallback/no-op modes, missing sections, current-destination preservation and deterministic repeated planning. | P1 | T-19, T-20, T-21, T-22 | FR-12, FR-13, FR-14, FR-16, FR-18, FR-19; NFR-5, NFR-6 | BLOCKED |
| T-24 | Render safe dry-run diffs, SHA transition and summaries under T-05's contract. Test no manual context/secret leaks, missing files as empty, no-change output and zero filesystem writes. | P1 | T-05, T-07, T-23 | FR-17, FR-18, FR-20, FR-21, FR-25; NFR-6 | BLOCKED |
| T-25 | Stage candidates and restorable original snapshots without replacing targets. Test preflight identity/link checks and injected open/write/flush/close failures; originals and absence must be preserved. | P0 | T-02, T-23 | FR-2, FR-5, FR-12, FR-19, FR-22; NFR-3, NFR-6 | BLOCKED |
| T-26 | Implement approved data-file replacement, baseline-last commit, cleanup and rollback. Fault-test every boundary, absent/existing outputs, baseline-only writes, recovery failure and concurrency; do not waive unresolved FR-22 cases. | P0 | T-25 | FR-5, FR-12, FR-14, FR-19, FR-21, FR-22; NFR-3, NFR-6 | BLOCKED |
| T-27 | Wire the actual CLI through scan/plan/preview-or-write/report. Test real disposable repositories for first-run, incremental, dry-run, no-change and fallback behavior with correct exit codes. | P1 | T-08, T-24, T-26 | FR-1, FR-2, FR-15, FR-16, FR-17, FR-19, FR-20, FR-21; NFR-7 | BLOCKED |
| T-28 | Add adversarial end-to-end preservation and security regressions. Test dirty sources, generated-only commits, malformed markers, prohibited-file non-access, output sentinels, symlinks and transaction failures through the entry point. | P0 | T-27 | FR-5, FR-11, FR-12, FR-13, FR-15, FR-20, FR-21, FR-22, FR-24, FR-25; NFR-6 | BLOCKED |
| T-29 | Close remaining happy/failure test gaps and measure coverage. Run strict typecheck/build and coverage; require >=80% separately for lines, branches, functions and statements without weakening exclusions or thresholds. | P1 | T-28 | NFR-4, NFR-6, NFR-7 | BLOCKED |
| T-30 | Verify samples/bookmark-api through an independent disposable copy only. Record dry-run/real/no-change/incremental commands, seven sections, "Not Found", names-only environment output, manual preservation, changelog/state and original-sample non-modification. | P1 | T-29; readable sample available | FR-7, FR-11, FR-12, FR-14, FR-17, FR-18, FR-20, FR-24, FR-25; NFR-6 | BLOCKED |
| T-31 | Measure the retained four-stack 500-file fixture with 50 committed changed files, each <=16 KiB. Record three consecutive scan/diff/sanitize/generation runs each <30 seconds; verify >500 behavior. | P2 | T-27; NFR-1 reference environment available | FR-5, FR-24; NFR-1, NFR-2, NFR-5 | BLOCKED |
| T-32 | Run locked install, typecheck/build, tests and coverage on latest-patch Node 20/22/24 across Windows/macOS/Linux. Record each matrix cell and npm audit results; unavailable cells are not passes. | P1 | T-29; required runners available | NFR-3, NFR-4, NFR-6, NFR-7 | BLOCKED |
| T-33 | Consolidate actual acceptance evidence and outstanding limitations in docs/verification.md and update review/task statuses. Require all scoped gates and approvals; never label deferred features or unrun checks complete. | P1 | T-30, T-31, T-32; all design blockers resolved | FR-22; NFR-1, NFR-2, NFR-3, NFR-4, NFR-5, NFR-6, NFR-7 | BLOCKED |

## External Blockers and Verification Conditions

- T-02: FR-22's unconditional preservation requirement and the architecture's conditional rollback guarantee must be reconciled explicitly. Power loss, forced termination, rollback failure and concurrent replacement are unresolved conditions, not authorized deferrals.
- T-03 through T-06: record approved encoding, marker/newline, preview and counting contracts in architecture and review before dependent implementation. Eligibility-only changes must invalidate affected sections; new policies must not be presented as prior user decisions.
- T-30: missing or unreadable samples/bookmark-api blocks sample verification; never create or repair the original. Keep disposable fixtures outside samples/ and the scanned project tree; do not open prohibited secret files while preparing evidence.
- T-31: retain all four stacks' files as generic eligible evidence, without adding Maven/Go adapters. Reference environment: Linux x64, 4 logical CPUs, 8 GiB RAM, SSD, Node 24. Exclude output writes and cleanup from timing. Other-hardware results do not satisfy the required gate.
- T-32: all nine OS/Node combinations remain required. Engine declarations and a clean audit do not prove runtime compatibility.

## Known Limitations

| Requirements | Deferred Work | Retained Local Behavior |
| --- | --- | --- |
| FR-1, FR-2, FR-3, FR-21, FR-25 | GitHub URL acceptance/classification/validation, full cloning, branch resolution, remote errors and clone lifecycle. | Validate local input and reject unsupported URLs without credential echo. FR-3 has no implementation task in this timebox. |
| FR-3, FR-4, FR-14, FR-20 | --branch, URL-only --out, remote output identity/seeding/reuse/collisions and remote state. | Reject URL-only options locally; preserve local outputs/state and write-free previews. |
| FR-23, NFR-6 | Network retries, backoff/rate-limit behavior and associated tests. | Local explicit failures, secret-safe errors and preservation tests. FR-23 has no implementation task in this timebox. |
| FR-6, FR-7, FR-8, FR-9, FR-13, NFR-6 | Java/Maven/Go adapters, manifest-specific fields/setup/impacts and adapter tests. | Node/Python multi-stack extraction; generic Java/Go paths and literal environment references remain supported evidence. |

All other scoped requirements remain mandatory, including the complete performance fixture, all eight literal environment-reference forms, four coverage thresholds and compatibility matrix. The task evidence below describes only checks actually performed; no deferred feature or unavailable platform is counted as complete.

## Task Evidence

### T-01 - Complete, 2026-10-27

- Clean worktree on feature/doc-sync before edits; samples/ and requirements remained unchanged.
- Pinned compatible/patched dependencies and parsers, strict ESM build/typecheck configuration, four coverage gates, and a zod local-request validator with 12 tests. Exact versions are recorded in architecture.
- `npm install --ignore-scripts`: exit 0; final audit reported zero vulnerabilities after replacing vulnerable initial candidates. No forced audit fix or lifecycle scripts used.
- `npm run typecheck`, `npm run build`, `npx vitest run`, and `npx vitest run --coverage`: exit 0; 12 tests passed; statements, branches, functions and lines all 100% on the initial validator.
- `npx --yes --package=node@20 -- node node_modules/vitest/vitest.mjs run`: exit 0; 12 tests passed. This is a local Node-20 smoke run, not the full nine-cell compatibility matrix.
- At T-01 closeout, T-07 became ready; its completed evidence follows. T-02 through T-06 still require the explicit owner decisions listed above; no approval was inferred.

### T-07 - Complete, 2026-10-27

- Added pure `sanitizeEvidence` and fixed-category `formatDiagnostic` functions with 56 focused tests. Unknown/unsafe fields become "Not Found"; unknown diagnostic categories use a constant message, never raw errors.
- Required private-key, URL user-info, bearer, GitHub token, AWS ID, sensitive-key assignment and environment-assignment patterns are covered with synthetic data. Sensitive/environment assignments conservatively redact the remaining candidate, preventing quoted or multiline tails from leaking. Existing manual destination content is not an input to these emitters.
- Added deterministic/idempotent and long dotted-name regressions; no files are read or written by the security functions. This does not claim a complete arbitrary-secret audit or implement repository scanning.
- `npx vitest run tests/security.test.ts`: exit 0, 56 tests passed. `npm run typecheck`, `npm run build`, `npx vitest run`, and `npx vitest run --coverage`: exit 0, 68 total tests passed; statements, branches, functions and lines all 100% on current source.
- At T-07 closeout, T-08 became ready; its completed evidence follows. Owner-approval blockers remain unchanged.

### T-08 - Complete, 2026-10-27

- Added pure `parseCliArgs` using commander and zod. It accepts one filesystem path and --dry-run, preserves paths/spaces, rejects URL/scp-style input and URL-only/unknown options, and returns a constant error without emitting commander output. The shared request schema also rejects remote forms.
- Added happy/failure, repeated-call isolation, option separator, Windows/POSIX/UNC paths, credential-bearing remote input, and stdout/stderr non-echoing checks. The module parses arguments only; it is not an executable repository sync implementation.
- `npx vitest run tests/cli.test.ts tests/validation.test.ts`: exit 0, 44 focused tests passed. `npm run typecheck`, `npm run build`, `npx vitest run`, and `npx vitest run --coverage`: exit 0, 100 total tests passed; all four coverage metrics 100% on current source.
- `npx --yes --package=node@20 -- node node_modules/vitest/vitest.mjs run`: exit 0, 100 tests passed. Full cross-platform/Node compatibility, real repository scans, README writes, failure recovery, performance and sample verification are not yet implemented or claimed passed.

### Remaining Blockers

- T-01, T-07 and T-08 are complete; no remaining task is READY. T-02 through T-06 require explicit owner approval of failure/concurrency, encoding/byte boundaries, marker/newline, safe preview and counting contracts.
- T-09 remains BLOCKED on T-03 even though T-08 is complete. All downstream repository/extraction/write/verification tasks retain their listed unmet dependencies. No design decision was inferred and no blocked work was skipped.
- Requirements and samples/ remain unchanged. No remote URL input, cloning, branch option, retry behavior, Maven adapter or Go adapter was implemented. The scanner/sync CLI still requires the blocked tasks.

## Execution Ledger

- T-11 COMPLETE: committed/nested ignore inventory, stable paths and pre-read secret/generated-input exclusions tested, including forced-tracked ignored files and dirty-rule isolation. Scale warning is emitted by CLI reporting, not the pure scanner.

- T-10 COMPLETE: local state schema and initial/incremental/unavailable-history classification tested; malformed state fails safely and missing commits never trigger network operations.

- T-09 COMPLETE: safe local root/HEAD discovery, byte-preserving committed blob reads and dirty-state detection; temporary-repository tests cover missing/empty paths, links, invalid objects and dirty isolation. Full-suite gate required before commit.

- T-06 COMPLETE (design contract): committed-rule eligibility transitions and mixed/generated-only README counting are specified with contract checks; behavioral inventory tests follow in T-11/T-12.

- T-05 COMPLETE (design contract): zero-context sanitized projections and no-write/no-manual-context requirements recorded and checked by policy tests. Runtime output assertions remain T-24 work.

- T-04 COMPLETE (policy/newline helper): standalone non-code marker ownership and independent HEAD/destination validation are specified; first-newline selection has existing/missing-evidence tests. Pair parsing follows in T-18.

- T-03 COMPLETE: strict UTF-8/BOM decoding and explicit byte-offset mapping have happy/failure tests, including malformed bytes and surrogate boundaries. Full-suite gate required before commit.

- T-02 COMPLETE (design sequencing): documented staged writes, original snapshots, baseline-last and handled-failure rollback. The existing 100-test suite is the closeout gate; transaction behavior awaits T-25/T-26. FR-22 under crash/concurrency/rollback failure remains an explicit assurance gap, not an accepted waived requirement.