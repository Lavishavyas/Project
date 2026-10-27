---
name: doc-sync
description: Scan local git repositories and deterministically generate or synchronize README sections, environment-variable names, changelog entries, and sync state from repository evidence. Use for implementing or verifying doc-sync behavior.
---

# Doc Sync

## Scope

For this timeboxed run, accept local repository paths only and detect Node and Python stacks. Do not implement GitHub URL cloning, --branch, or network retries. Everything else in docs/requirements.md stays in scope. Record deferred requirements in Known Limitations, not as completed work. Never modify samples/; use a disposable copy for write-mode verification.

## Scan Repository Evidence

1. Read docs/requirements.md and the approved architecture and implementation plan before implementation. Validate paths, CLI arguments, and persisted state with zod.
2. Resolve a local git repository and HEAD. Scan committed tracked content, not dirty working-tree source. Warn about ignored uncommitted changes. Handle invalid paths, non-git directories, empty repositories, and unavailable baselines explicitly.
3. Build a sorted repository-relative folder/file tree from eligible tracked files. Respect committed .gitignore rules and exclude .git, node_modules, dist, tool-generated state/changelog inputs, prohibited secret files, and symlinks. Never traverse outside the repository boundary.
4. Detect Node from package.json and Python from requirements.txt or pyproject.toml, including nested and multi-stack repositories. Use the fixed evidence ordering in the requirements; other stacks are deferred for this run.
5. Extract manifest names, descriptions, approved setup commands, and usage evidence. Do not execute repository scripts or copy script bodies. Preserve the documented fallback order; Python with only pyproject.toml has setup "Not Found".
6. Never read .env or .env.* files except exact-basename .env.example. From .env.example collect assignment names only, never retain or output values. Also collect supported literal source environment references under FR-24; deduplicate and sort names.

## Generate and Synchronize

- Never invent facts. If evidence for a section is absent or unsafe, write "Not Found".
- Generate Project Name, Purpose, Tech Stack, Setup/Install Steps, Usage, Project Structure, and Environment Variables.
- Wrap each owned section in `<!-- docsync:start name -->` and `<!-- docsync:end name -->`. Use canonical names: project-name, purpose, tech-stack, setup, usage, project-structure, environment-variables.
- Preserve manual content and line endings outside markers. Reject malformed or duplicate markers before writing. Append missing generated sections, and update existing generated sections only when their inputs are impacted.
- Track committed changes with git diff <last-sha>..HEAD and store the successful SHA in .docsync.json. Suppress generated-only change loops. Report impacted sections, changes, and "Not Found" results.
- Append dated changelog entries as required, or report "No changes detected". Compute and validate all output first; preserve files on fatal failure, including write-time failure. A dry run previews without writes.

## Security and Verification

- Never output secrets: no API keys, tokens, passwords, private keys, or environment-variable values in docs, diffs, logs, summaries, or errors. Use the required deterministic sanitizer on all emitted evidence. Never echo raw source, raw errors, or manual diff context. Do not claim pattern matching proves a repository is secret-free.
- Use strict TypeScript and small, well-named functions. Every function requires Vitest happy-path and failure or "Not Found" coverage. Verify manual preservation, dirty-tree isolation, dry-run non-modification, missing baseline fallback, and write-failure preservation.
- Keep samples/ untouched. Run mutating integration checks only against a disposable copy, and record actual commands, exit codes, and sanitized results.