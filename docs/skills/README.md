# Skill Library — kotakbank (AEM Edge Delivery Services)

A focused set of skills for working in this repository. Each file covers **one area** and has the same shape: **Purpose · When to use · Best practices · Anti-patterns · Examples · Validation checklist**.

## ⚠️ Read this first

This is an **AEM Edge Delivery Services (EDS)** project (xwalk / Universal Editor), built on `aem-boilerplate-xwalk`. It is **vanilla JavaScript (ES6+), CSS3, and JSON** — served from GitHub via AEM Code Sync. There is **no Java, Maven, OSGi, Sling, HTL, Dispatcher, or Cloud Manager**.

Several requested topics belong to the *traditional* AEM-as-a-Cloud-Service stack. Rather than introduce constructs that do not exist here (and that `AGENTS.md` forbids), those skills are written as **mapping skills**: they explain the traditional concept, state plainly that it does not exist in this repo, and point to the EDS-native equivalent you should use instead. This mirrors the mapping table in `AGENTS.md`.

## Skills

### EDS-native (first-class in this repo)
| # | Skill | Area |
|---|---|---|
| 01 | [Component (Block) Development](01-component-development.md) | Building `blocks/{name}/` |
| 12 | [Universal Editor](12-universal-editor.md) | `_{block}.json` models, authoring |
| 13 | [Edge Delivery Services](13-edge-delivery-services.md) | Runtime, config, publish |
| 14 | [Performance](14-performance.md) | Lighthouse 100, three-phase loading |
| 15 | [Accessibility](15-accessibility.md) | WCAG 2.1 AA |
| 16 | [Security](16-security.md) | CSP, sanitization, secrets |
| 17 | [Testing](17-testing.md) | Lint, Playwright, parity |

### Mapping skills (traditional AEM → EDS equivalent)
| # | Skill | Traditional concept | EDS equivalent |
|---|---|---|---|
| 02 | [Sling Models](02-sling-models.md) | Sling Models | Block `decorate(block)` |
| 03 | [HTL](03-htl.md) | HTL / Sightly | JS DOM decoration |
| 04 | [Client Libraries](04-client-libraries.md) | clientlibs | Per-block CSS/JS + `styles/` |
| 05 | [Dispatcher](05-dispatcher.md) | Dispatcher cache | Edge CDN + `.hlxignore` |
| 06 | [Workflow](06-workflow.md) | AEM Workflows | GitHub Actions + Code Sync |
| 07 | [Content Fragments](07-content-fragments.md) | Content Fragments | `fragment` block + spreadsheets |
| 08 | [Assets](08-assets.md) | DAM / Assets | `reference` field + `createOptimizedPicture` |
| 09 | [QueryBuilder](09-querybuilder.md) | QueryBuilder API | `query-index.json` + `helix-query.yaml` |
| 10 | [Servlets](10-servlets.md) | Sling Servlets | Static JSON / external APIs |
| 11 | [OSGi Services](11-osgi-services.md) | OSGi services/config | ES modules + YAML config |
| 18 | [Cloud Manager](18-cloud-manager.md) | CI/CD pipelines | GitHub Actions + PSI gate |
| 19 | [AEMaaCS](19-aemaacs.md) | AEMaaCS author/publish | Author (content source) + Edge delivery |

## How to use

1. Identify the area your task touches.
2. Open that skill; if it is a mapping skill, follow the pointer to the EDS-native skill.
3. Run the **Validation checklist** before you commit — it is a subset of the project **Definition of Done** in `AGENTS.md`.
