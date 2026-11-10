# Source-tree cache reference (section 5)

Loaded on demand. Section numbers refer to `SKILL.md`.

## 5. Source-tree cache

On first use, copy the skill's `scripts/scan.mjs` into the project's `.qa-agent/bin/scan.mjs` (needs Node ≥ 18; if the project has no Node, write an equivalent Python version). Run: `node .qa-agent/bin/scan.mjs`. It prints JSON: `added`, `changed`, `removed`, `staleSummary`, `unchanged`, `total`, `impacted`, `impactedTests`. `impacted`/`impactedTests` = source/test files that import (directly or indirectly) a file just added/changed, from the import graph (JS/TS/Vue/Svelte; relative imports and `@/`, `~/`, `#/` aliases). Other languages or unusual aliases: fall back to Grep. The script also deletes summaries of removed files, writes the cache atomically, and uses `scan.lock` to block concurrent runs (a lock older than 5 minutes is treated as stale). It skips secret files (see rule 8).

How to use the cache:
- Run the script at the start of every run. **Rely on `staleSummary`, not on `changed`** (the cache is written at scan time, so an interrupted run loses `changed`). A summary of a file in `impacted` can be outdated even though its hash is unchanged (something it imports changed): re-read the relevant import/export part before trusting it. Read only files that are in `staleSummary` **and** within the mode's scope.
- After reading a source file, write its summary to `cache/summaries/<path with / replaced by __>.json`:
```json
{ "path": "src/components/LoginForm.vue", "hash": "<sha1 from source-tree.json>", "kind": "component|page|hook|composable|store|util|service|api|route|other",
  "exports": ["LoginForm"], "inputs": ["props: redirectTo?: string"], "outputs": ["emit: success"],
  "branches": ["L42 if !email -> error 'required'"], "sideEffects": ["POST /api/auth/login (L58)"],
  "selectors": ["role=button name=Log in", "data-testid=login-email"], "deps": ["@/services/auth"], "hasTests": ["src/components/__tests__/LoginForm.spec.ts"] }
```
- A summary records only what is **in the code**, with line numbers. No guessing.
- Update `lastRunCommit` (= `git rev-parse HEAD`) in `source-tree.json` only when the run has finished step 11.
