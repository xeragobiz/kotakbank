# 18 · Cloud Manager → GitHub Actions + Code Sync + PSI (mapping skill)

> **This repo has no Cloud Manager.** There are no CM pipelines, quality gates UI, environments, or Cloud Manager deployments. CI/CD is GitHub Actions + AEM Code Sync, and quality gates are lint, the JSON-sync check, PSI, and PR review.

## Purpose
Explain the CI/CD and quality-gate model. Instead of Cloud Manager pipelines and its code-quality/performance gates, this project uses GitHub Actions for validation and Code Sync for publishing.

## When to use
- When asked about "the pipeline / Cloud Manager / quality gates / deployment".
- Diagnosing why a PR is blocked.

## Mapping
| Cloud Manager concept | EDS equivalent |
|---|---|
| CI/CD pipeline | `.github/workflows/main.yaml` (on push) + AEM Code Sync |
| Build step | `npm ci` (no app build; JSON aggregation via `build:json`) |
| Code-quality gate | `npm run lint` + component-JSON freshness `git diff --exit-code` |
| Performance gate | PageSpeed Insights on the feature preview URL (target 100) |
| Deployment to env | Push → AEM Code Sync → preview/live (no manual deploy) |
| Approval gate | PR review with mandatory preview-URL link |
| Scheduled/dependency mgmt | Renovate (`.renovaterc.json`); `cleanup-on-create.yaml` |

## Best practices
- Keep CI green: lint + JSON-sync must pass. Check with `gh pr checks`.
- Run PSI on `https://{branch}--kotakbank--xeragobiz.aem.page/{path}` and fix regressions before merge.
- Ensure AEM Code Sync successfully published the branch before requesting review.
- Every PR to `main` must include the preview-URL link, or it is rejected.

## Anti-patterns
- ❌ Looking for / adding Cloud Manager pipeline config.
- ❌ Merging with red `gh pr checks` or a stale aggregate JSON.
- ❌ Opening a PR without the preview link, or before Code Sync publishes.
- ❌ Expecting a manual deploy — publish is push-driven.

## Examples
```bash
gh pr checks   # GitHub Actions: lint + JSON-sync must be green
# PSI: run against https://{branch}--kotakbank--xeragobiz.aem.page/{path}
```

## Validation checklist
- [ ] No Cloud Manager artifacts introduced.
- [ ] `gh pr checks` green (lint + JSON-sync).
- [ ] AEM Code Sync published the branch to preview.
- [ ] PSI run on the preview URL, target 100.
- [ ] PR to `main` includes the mandatory preview-URL link.
