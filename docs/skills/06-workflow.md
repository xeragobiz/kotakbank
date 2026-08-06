# 06 · AEM Workflows → GitHub Actions + Code Sync (mapping skill)

> **This repo has no AEM Workflow engine.** There are no workflow models, launchers, `WorkflowProcess` steps, or `/var/workflow`. "Workflow" here means the **development + publish pipeline**: git → GitHub Actions → AEM Code Sync → preview/live.

## Purpose
Explain the automation/process layer of this project. Instead of author-side content workflows, automation is CI (lint + JSON-sync gate) plus the Code Sync publish flow, plus the local dev loop.

## When to use
- When asked to "create a workflow" → clarify whether it means CI automation (GitHub Actions) or the dev/publish process below.
- When onboarding to how changes reach preview/production.

## Mapping
| AEM Workflow concept | EDS equivalent |
|---|---|
| Workflow model / launcher | `.github/workflows/main.yaml` (runs on push) |
| `WorkflowProcess` step | A CI step (`npm ci`, `npm run lint`, JSON-sync diff) |
| Activation/replication step | AEM Code Sync publishing the branch on push |
| Approval / review step | Pull request review (mandatory preview URL) |
| Scheduled maintenance workflow | Renovate (`.renovaterc.json`), `cleanup-on-create.yaml` |

## Best practices
- Follow the dev workflow: install → `aem-cli up` → inspect delivered markup → edit → `build:json` (if models changed) → `lint` → commit on a feature branch → push → PSI on the preview → PR to `main` with a preview link.
- Keep CI green: `npm run lint` and the component-JSON freshness gate must pass (`gh pr checks`).
- Never commit directly to `main`; use focused feature branches.
- After editing any `_*.json`, run `npm run build:json` (Husky pre-commit also does this and re-stages aggregates).

## Anti-patterns
- ❌ Adding AEM workflow models / launchers / `/var/workflow` content.
- ❌ Committing to `main` or opening a PR without the mandatory `…aem.page/{path}` preview link.
- ❌ Hand-editing the aggregate JSON files (CI's diff gate will fail).
- ❌ Skipping lint locally and relying on CI to catch it.

## Examples
```bash
npm install
npx -y @adobe/aem-cli up --no-open --forward-browser-logs   # dev server :3000
# ...edit blocks/scripts/styles/models...
npm run build:json      # only if a _*.json model changed
npm run lint            # must pass
git checkout -b my-feature && git commit -m "..." && git push
gh pr checks            # CI (lint + JSON-sync) must be green
```

## Validation checklist
- [ ] No AEM workflow-engine artifacts introduced.
- [ ] Work done on a feature branch, not `main`.
- [ ] `_*.json` changes followed by `npm run build:json`; aggregates committed and in sync.
- [ ] `npm run lint` passes locally; `gh pr checks` green.
- [ ] PR includes a `https://{branch}--kotakbank--xeragobiz.aem.page/{path}` link.
