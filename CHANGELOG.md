# Changelog

## 2026-10-27 - Initial release
- Local repository scanning with Node and Python stack detection
- Evidence extraction: name, purpose, setup, usage, structure, environment variable names
- README generation inside docsync markers; manual content preserved
- Committed-change tracking with a saved baseline SHA and section impact mapping
- Dated changelog entries
- Transactional writes with rollback; dry-run mode
- Secret-safe output and input validation
- CLI: npx tsx src/cli.ts <path> [--dry-run]
