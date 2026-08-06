# 04 · Fix Build Errors 🟢

**Purpose:** Diagnose and fix failing lint / JSON-sync / CI in this EDS repo (there is no app build/compile step — the "build" is lint + JSON aggregation).

## Variables
- `{{ERROR_OUTPUT}}` — paste the failing command output (from `npm run lint`, `gh pr checks`, CI log)
- `{{COMMAND}}` — the command that failed (optional)
- `{{FILES}}` — files you recently changed (optional)

## Prompt
```
Fix these build/CI errors in this Edge Delivery Services repo.

Failing command: {{COMMAND}}
Recently changed files: {{FILES}}
Error output:
---
{{ERROR_OUTPUT}}
---

Context (AGENTS.md): there is NO app build/transpile step. The only "build" is:
- `npm run lint` (ESLint Airbnb + plugin:xwalk + plugin:json, and Stylelint standard)
- `npm run build:json` (aggregates component-definition/models/filters via merge-json-cli)
- CI (main.yaml): `npm ci` → `npm run lint` → regenerate JSON and `git diff --exit-code` the 3 aggregates (fails if stale).

Steps:
1. Classify the failure: ESLint JS, Stylelint CSS, xwalk model lint, or the JSON-sync freshness gate.
2. If JSON-sync failed: run `npm run build:json` and commit the regenerated aggregates. Never hand-edit them.
3. If lint failed: fix root cause (respect `.js` import extensions, Unix LF, no-param-reassign nuance, 2-space JS / 4-space CSS, block-scoped selectors). Use `npm run lint:fix` for autofixable issues, but review the diff.
4. Do NOT modify scripts/aem.js to silence an error. Do NOT disable rules to mask a real problem.
5. Re-run the failing command and confirm it passes; then `gh pr checks`.

Explain each fix briefly.
```

## Validation
- [ ] Root cause identified (not masked with rule disables).
- [ ] `build:json` run if it was the JSON-sync gate; aggregates committed.
- [ ] Failing command now passes; `gh pr checks` green; `aem.js` untouched.
