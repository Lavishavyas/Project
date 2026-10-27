# US-101: Auto-generate and sync a project README from the repo

**As a** developer on a team with many repositories,
**I want** a tool that scans a git repo, generates or updates its README.md, and tracks code changes since the last sync,
**so that** documentation stays accurate as the code changes without manual effort.

## Acceptance criteria
1. Given a repo (local path or GitHub URL), the tool reads the source tree, manifest files (package.json, requirements.txt, pom.xml, go.mod, etc.), config files and any existing README.
2. It detects the repo's tech stack from manifest files; unknown stacks are reported as "Not Found".
3. It generates a README with: Project Name, Purpose, Tech Stack, Setup/Install Steps, Usage, Project Structure, Environment Variables.
4. Any section whose information is not in the repo says "Not Found". The tool never guesses.
5. Secrets (API keys, tokens, passwords, .env values) never appear in output. Environment variables are listed by name only.
6. If a README exists, only sections affected by code changes since the last sync are updated. Manual sections are left untouched.
7. The tool records the last-synced commit SHA and uses it as the baseline for the next run.
8. On each run it detects changed files via git diff and lists which doc sections were impacted.
9. It appends a dated entry to CHANGELOG.md summarising changes and doc updates, or reports "No changes detected".
10. It handles: empty repo, missing/invalid path, not a git repo, missing baseline commit (falls back to full scan with a warning), and GitHub API failures (rate limit, 404, network error), with clear messages and no crash.
11. It outputs a summary of what was added, changed, or marked "Not Found".

## Non-functional requirements
- Completes in under 30 seconds for repos up to 500 files.
- All input (paths, URLs, CLI args) is validated.
- Unit test coverage of at least 80%.
- Runs from the CLI.

## Out of scope
Multi-repo batch runs, web UI, API reference generation from code comments.