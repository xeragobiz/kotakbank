# 19 · AEMaaCS → content source + Edge delivery (mapping skill)

> **This is not a traditional AEMaaCS (AEM-as-a-Cloud-Service) codebase.** There is no Java app you deploy to an AEMaaCS runtime, no OSGi/Sling/HTL, no `ui.apps`/`ui.content` packages, no `.content.xml`. AEMaaCS appears here only as the **content source** authored in Universal Editor and mounted by `fstab.yaml`.

## Purpose
Clarify the (limited) role AEMaaCS plays in this EDS project and where each traditional AEMaaCS concern actually lives, so you don't try to deploy Java or manage a Cloud Service runtime.

## When to use
- When a task assumes a full AEMaaCS stack ("deploy the bundle", "add a `ui.apps` package", "write an OSGi config").
- Understanding the boundary between the authoring backend and Edge delivery.

## Mapping
| AEMaaCS concept | Reality in this repo |
|---|---|
| AEM author instance | Content source (`author-p165370-e1760075…`) mounted via `fstab.yaml`, authored in Universal Editor |
| AEM publish / dispatcher | Edge Delivery CDN (`*.aem.page` preview / `*.aem.live` live) — see [05](05-dispatcher.md) |
| `ui.apps` / `ui.content` / packages | Blocks, scripts, styles, JSON in this git repo (no packages) |
| HTL / Sling Models / OSGi | JS `decorate()` / ES modules / YAML config — see [02](02-sling-models.md), [03](03-htl.md), [11](11-osgi-services.md) |
| Cloud Manager pipelines | GitHub Actions + Code Sync — see [18](18-cloud-manager.md) |
| Maven build & deploy | No build/deploy; code ships as authored; only `build:json` aggregation |

## Best practices
- Treat AEMaaCS purely as the headless content source; edit content in Universal Editor, not by deploying code to it.
- Keep all code (blocks/scripts/styles/models) in this repo; publish via push → Code Sync.
- Don't repoint `fstab.yaml` casually; that mount is the only AEMaaCS link.
- For every "AEMaaCS" sub-task, follow the mapping to the correct EDS skill.

## Anti-patterns
- ❌ Adding `ui.apps`/`ui.content` packages, `.content.xml`, `pom.xml`, Java, or OSGi config.
- ❌ Trying to "deploy" code to the AEMaaCS runtime — code is served from git via Code Sync.
- ❌ Managing dispatcher/publish tiers — that's the Edge platform.

## Examples
```yaml
# fstab.yaml — the only tie to AEMaaCS (content mount)
mountpoints:
  /: https://author-p165370-e1760075.adobeaemcloud.com/...
```

## Validation checklist
- [ ] No AEMaaCS app artifacts (packages, `.content.xml`, Java, `pom.xml`, OSGi config).
- [ ] AEMaaCS treated as content source only; `fstab.yaml` mount unchanged unless intended.
- [ ] Each sub-concern routed to its EDS-native skill.
- [ ] Publishing via push → Code Sync, not runtime deploy.
