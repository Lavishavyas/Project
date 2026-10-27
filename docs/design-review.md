# Design Review: doc-sync-agent

Review date: 2026-10-27.

## Scope and Outcome

Review docs/architecture.md against docs/requirements.md for local repository paths and Node/Python detection only. GitHub URL operation/cloning, --branch, network retries, and Java/Maven/Go stack adapters are deferred. All other requirements remain in scope, including generic Java/Go environment-reference extraction and the original four-stack performance fixture. Never modify samples/; write-mode verification must use a disposable copy.

**Outcome: changes requested.** Two High findings block unconditional design approval. Three Medium findings require explicit contracts and acceptance tests. Findings concern documented design gaps or observed package metadata, not reproduced application failures. No application behavior has been implemented or verified by this review.

## Findings and Risks

### D-1 - High: FR-22 preservation is conditional, not an accepted guarantee

- **Evidence:** [architecture.md](architecture.md#L192) promises unchanged targets only "provided rollback operations succeed". [architecture.md](architecture.md#L194) explicitly allows preservation failure after rollback errors or concurrent edits; the FR-22 traceability row also records this as unresolved. FR-22 requires fatal errors, including write-time failures, to preserve all three output files. Baseline-last is useful but does not restore a README already replaced when changelog replacement and subsequent rollback both fail.
- **Classification:** Observed specification/design mismatch; actual recovery behavior is unverified. Atomic visibility to concurrent readers is not itself a stated requirement and must not be confused with preservation after a fatal failure.
- **Affected requirements/components:** FR-5, FR-12, FR-14, FR-22, NFR-6; C11, C12.
- **Impact:** The design cannot be signed off as satisfying FR-22 under the failure cases it explicitly leaves unresolved. Logging a recovery error does not satisfy unchanged outputs.
- **Proposed fix:** Retain staging, original snapshots, preflight checks and baseline-last, but make FR-22 an explicit approval blocker. Specify the supported failure and concurrency model, exact commit point, cleanup behavior, and recovery obligations. Obtain an explicit owner decision for any requirement interpretation or narrower guarantee; do not silently waive FR-22 or introduce a persistent journal as an agreed feature. If the requirement remains unconditional, identify an implementation strategy that meets it or leave the task blocked.
- **Acceptance check:** Fault-inject every stage, replacement and cleanup boundary with each combination of absent/existing outputs, then compare bytes/existence of README, changelog and state. Independently inject rollback failure and concurrent replacement. Report the latter cases as unresolved failures unless an approved contract establishes how they are handled; never report FR-22 passed merely because normal rollback succeeds.

### D-2 - High: Installed dependency baseline does not support Node 20

**T-01 remediation (2026-10-27):** The evidence below describes the review-time baseline. Commander is now pinned to 13.1.0, Vitest/coverage to 4.1.12 and Vite to 6.4.5, with compatible type definitions and an ESM build. Initial vulnerable Vitest/TOML/diff candidates were replaced with patched releases. Strict typecheck, build, 12 tests, all four coverage gates and a temporary Node-20 test run pass; installation audit reports zero vulnerabilities. The architecture now records exact versions and the compatibility gate. D-2's design/toolchain omission is addressed; the full required OS/Node matrix remains pending and is not claimed complete.

- **Evidence:** The technology table targets Node 20+ at [architecture.md](architecture.md#L12), but does not identify compatible package versions. Inspection of [../node_modules/commander/package.json](../node_modules/commander/package.json) found commander 15.0.0 requiring Node `>=22.12.0`; [../node_modules/vitest/package.json](../node_modules/vitest/package.json) declares Vitest 5.0.5 requiring `^22.12.0 || ^24.0.0 || >=26.0.0`. [../package.json](../package.json) currently declares CommonJS, whereas the required implementation uses ESM.
- **Classification:** Observed engine declarations and module configuration, not an executed Node-20 failure. ESM migration is ordinary implementation work, not proof that the proposed ESM design is wrong. The incompatible engine declarations are the current feasibility blocker.
- **Affected requirements/components:** NFR-3, NFR-4, NFR-6, NFR-7; C01, C12 and shared runtime/toolchain.
- **Impact:** A successful run on the currently selected newer Node does not establish the required Node-20 compatibility. An implementation plan using the installed versions unchanged cannot claim the minimum-runtime gate is met.
- **Proposed fix:** Document a dependency compatibility gate: select and pin versions of commander, Vitest/coverage tooling and proposed parser dependencies that support Node 20 and the selected ESM build. Plan manifest, lockfile and module configuration updates through the default agent, not this review. Do not solve this by raising the minimum Node version without authorization.
- **Acceptance check:** On Node 20, 22 and 24, install the chosen locked dependency set and run build/type checks and tests on Windows, macOS and Linux. Verify declared engines and actual coverage-provider compatibility. Record the full matrix or mark unavailable cells unverified.

### D-3 - Medium: Markdown offsets lack an explicit byte-preservation contract

- **Evidence:** [architecture.md](architecture.md#L18) selects Markdown AST source offsets, while [architecture.md](architecture.md#L160) requires splicing byte ranges and preserving all manual bytes. No conversion contract between JavaScript string offsets and encoded Buffer positions is specified; binary/non-UTF-8 handling remains open in Section 10.
- **Classification:** Unverified implementation risk from a missing representation boundary, not a demonstrated corrupting splice.
- **Affected requirements/components:** FR-7, FR-11, FR-12, FR-15, FR-22, NFR-6; C05, C07, C11, C12.
- **Impact:** Treating UTF-16 string offsets as UTF-8 byte offsets can select the wrong range after multibyte characters and corrupt manual text or marker boundaries. Decode/re-encode approaches can also normalize bytes that must remain unchanged.
- **Proposed fix:** Specify original byte buffers as the preservation authority, explicit validated decoding for parsing, and a tested mapping from parser offsets to original byte boundaries. Alternatively use a boundary method that never assumes these coordinate systems are interchangeable. Propose a clear failure policy for unsupported encodings; do not silently rewrite them.
- **Acceptance check:** Verify byte-for-byte preservation with accented text, emoji before/inside/outside markers, a BOM, CRLF/LF, missing final newline and invalid encoding fixtures. Check unaffected generated sections as well as manual bytes. Test invalid-input failure before writes under the approved encoding policy.

### D-4 - Medium: Eligibility changes do not have an explicit impact-invalidation rule

- **Evidence:** [architecture.md](architecture.md#L118) uses committed eligibility rules on both sides, but [architecture.md](architecture.md#L162) only enumerates manifest/README/source changes and actual file additions/deletions/renames. It does not say whether changed `.gitignore` rules produce effective inventory additions/removals when the affected tracked files have no git content delta.
- **Classification:** Observed missing design contract; stale documentation is an unverified consequence, not a reproduced failure.
- **Affected requirements/components:** FR-5, FR-7, FR-13, FR-15, NFR-2, NFR-5, NFR-6; C02, C03, C04, C07, C12.
- **Impact:** Committing only an ignore-rule change can remove a previously eligible manifest or source file from HEAD's inventory. If C04 processes only raw changed paths, stack/setup/purpose/structure/environment sections can remain stale while the baseline advances.
- **Proposed fix:** Define an effective eligible-inventory comparison in addition to raw git deltas. Re-evaluate eligibility under committed rules, then treat eligible-to-excluded and excluded-to-eligible transitions as removals/additions for section impacts. Preserve generated-only README suppression. Describe this as an implementation of existing eligibility/incremental requirements, not a new feature.
- **Acceptance check:** Commit only root and nested ignore-rule changes that include/exclude an unchanged tracked Node/Python manifest and an environment-reference source file. Assert correct impacted sections, structure/count changes, and unchanged manual content. Dirty uncommitted ignore rules must have no effect.

### D-5 - Medium: Marker and append policies remain unresolved implementation blockers

- **Evidence:** [architecture.md](architecture.md#L260) leaves marker-like comments in fenced code unresolved, and [architecture.md](architecture.md#L160) leaves mixed-ending append behavior open. Section 10 also leaves malformed committed markers versus valid current destination markers undecided. These cases determine ownership and failure behavior, not merely presentation.
- **Classification:** Observed unresolved design decisions; no parser behavior has been tested.
- **Affected requirements/components:** FR-11, FR-12, FR-15, FR-21, NFR-5, NFR-6; C05, C07, C12.
- **Impact:** Implementations can disagree about whether a documentation example owns content, whether a dirty repair of markers can be used, or which bytes to append. Ownership mistakes can overwrite manual examples; unresolved policies also prevent reproducible tests.
- **Proposed fix:** Propose explicit recognition rules for marker comments, distinguish committed evidence validation from destination ownership validation, and define a deterministic append convention without changing existing bytes. Keep choices that are not established by requirements clearly labeled as proposals until approved. Existing pairs may appear in any section order; reject malformed pairing rather than inventing a canonical existing-section order.
- **Acceptance check:** Exercise marker examples inside fenced/inline code and ordinary comments, crossed/duplicate/unknown/unmatched pairs, malformed HEAD with a repaired destination and vice versa, mixed line endings, and missing final newline. Verify either the approved merge or a safe pre-write failure with exact original bytes.

## Agreed Decisions

These decisions are supported by the requirements or the user's explicit timebox. Review recommendations above are not automatically agreed decisions.

- Local paths only, with Node/Python detection; reject remote inputs and URL-only options without echoing credentials. Keep original FR/NFR IDs and record partial deferrals.
- Committed HEAD supplies extraction evidence; current destination documentation supplies preservation/merge bytes only. Warn on dirty source without extracting it.
- Use deterministic extraction and approved setup mappings. Missing/unsafe evidence is "Not Found"; no AI or guessed facts.
- Preserve manual README bytes and unaffected owned sections; append missing marked sections and reject malformed ownership. Keep all seven canonical marker names.
- Track the successful commit SHA in local `.docsync.json`; no advance on failure/dry-run, and advance after a successful no-change run.
- Keep secret-value files unread, emit environment names only, sanitize all emitted evidence, and never reproduce manual destination text in previews or raw errors.
- Retain the full four-stack performance fixture, all eight literal environment-reference forms, four 80% coverage thresholds, and the three-OS by Node-20/22/24 matrix. Deferring Java/Go stack detection does not defer these gates.
- Never modify samples/. All write-mode sample verification must use a disposable copy with independent local history as needed.

### Proposals and Remaining Approval Questions

- D-1's failure/concurrency contract requires explicit approval; FR-22 has not been relaxed.
- D-2's exact compatible package versions and proposed parser dependencies were selected and locked by the implementation agent in T-01, not installed by the reviewer. Full OS/Node runtime verification remains pending.
- D-3's encoding policy and D-5's marker/append policies need an approved contract before dependent implementation tasks are considered ready.
- Generated-only, zero-context preview projections are a reasonable proposal for reconciling FR-20 with FR-25. Projection-relative hunk coordinates are not yet an explicit user decision; do not describe previews as apply-ready full-file patches.
- The local `lastSyncedSha` field and proposed changelog layout are architecture choices; retain them as design choices rather than attributing their exact syntax to the user.

## Architecture Remediation Checklist

The original review was read-only outside this document. The implementation agent subsequently completed T-01's D-2 toolchain/design remediation; all other architecture remediation and owner approvals remain pending.

- [ ] D-1: Mark FR-22 acceptance blocked; document exact recoverable-failure/commit/cleanup behavior and obtain an explicit decision on unresolved conditions. Acceptance: the stated contract matches requirements, and fault cases have pass/fail criteria without waived failures.
- [x] D-2 design/toolchain gate: Record the compatible pinned versions and ESM baseline in architecture after T-01 checks. The full compatibility matrix remains an outstanding runtime gate.
- [ ] D-3: Specify parser-offset to byte-buffer mapping and unsupported-encoding policy. Acceptance: Unicode/BOM/newline and invalid-encoding preservation tests are described concretely.
- [ ] D-4: Specify effective eligibility-delta invalidation. Acceptance: ignore-only committed changes update impacted sections and counts without consulting dirty rules.
- [ ] D-5: Separate proposed marker/newline/committed-versus-destination policies from confirmed requirements. Acceptance: ambiguous cases have approved expected outcomes, or their implementation tasks remain blocked.
- [ ] Preserve every FR-1 through FR-25 and NFR-1 through NFR-7 traceability row; retain scope deferrals rather than deleting requirements.
- [ ] Retain secret-safe preview projection design as a proposal until accepted; include original/manual sentinel non-disclosure tests.
- [ ] Rerun document section/traceability checks, diagnostics and protected-file checks after remediation. Record addressed findings and remaining blockers in this review document; do not claim runtime gates passed from document checks.

## Review Evidence and Verification Limits

- Read the current requirements, architecture and reviewer instructions. Initial `git status --short` was clean.
- Static inspection found all 25 FR and 7 NFR traceability rows in the architecture. ID presence is not proof of behavioral compliance.
- Local metadata inspection returned commander 15.0.0 and Vitest 5.0.5 with the engine declarations recorded in D-2; root package module type was `commonjs`. No packages were installed, changed or executed to infer a Node-20 result.
- Application runtime, crash recovery, concurrency behavior, fault injection, coverage, performance, cross-platform compatibility and Mermaid rendering have not been verified by this design review.
- Document validation passed: required review sections, five severity-ranked findings with all six evidence/impact/remediation fields, valid requirement IDs, in-range architecture line references, all 32 architecture traceability rows, and explicit pending handoff status. These are document checks, not runtime acceptance.
- `npm audit --json` completed with exit code 0 and reported zero vulnerabilities (0 Critical, 0 High, 0 Moderate, 0 Low). This result describes the current dependency baseline at review time; it does not establish Node-20 compatibility or audit proposed uninstalled parser dependencies. No audit fixes, installations or lockfile updates were performed.

## Known Limitations

| Requirement IDs | Deferred portion | Still required in this timebox |
| --- | --- | --- |
| FR-1, FR-2, FR-3, FR-21, FR-25 | Public/private GitHub classification, URL acceptance/validation, full clone, branch resolution, remote availability and clone lifecycle. | Local input validation/rejection, sanitized diagnostics and no credential echo. |
| FR-3, FR-4, FR-14, FR-20 | --branch, URL-only --out, remote output identity/seeding/reuse, remote state and clone cleanup. | Reject URL-only options locally, preserve local manual content/state and write-free dry runs. |
| FR-23, NFR-6 | Retry/backoff, rate-limit and permanent-HTTP-error behavior and associated tests. | All local error handling and preservation tests. |
| FR-6, FR-7, FR-8, FR-9, FR-13, NFR-6 | Java/Maven/Go stack adapters, manifest-specific extraction/setup/impacts and adapter tests. | Node/Python adapters; generic Java/Go source/structure/environment processing remains in scope. |
| NFR-1, FR-24, NFR-6 | No deferral of performance-fixture composition or generic environment forms. | All four stacks' files remain in the benchmark; System.getenv, os.Getenv, os.LookupEnv and the other literal forms remain required. |
| FR-22, FR-5, FR-12 | No authorized deferral: unresolved recovery/concurrency guarantees are approval blockers, not approved limitations. | Preserve handled-error recovery design and seek explicit resolution rather than declaring compliance. |

## Handoff: Apply Design Review Fixes

The configured reviewer handoff is **Apply Design Review Fixes**, targeting the default `agent` with `send: false`. This review session has no direct handoff-execution tool; user activation is required. Architecture fixes remain pending.

Activate that handoff, or switch to the default agent and submit:

> Read docs/design-review.md and docs/requirements.md. Update only docs/architecture.md and the remediation status in docs/design-review.md to address D-1 through D-5 within the local-path, Node/Python timebox. Preserve all original FR/NFR IDs, the full performance and security gates, and explicit Known Limitations. Apply requirement-grounded corrections, but keep unapproved encoding/marker/newline/failure-contract choices as proposals or blockers; do not silently amend requirements or mark them agreed. Add concrete acceptance checks, rerun document validation, and report which findings remain blocked. Never modify samples/, source code, tests, configuration or lockfiles in this architecture remediation step. Do not claim fixes or runtime verification that were not performed.