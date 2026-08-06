# EDS Expert Skill Library (Operational)

A task-executable skill library covering the knowledge of an **AEM Edge Delivery Services** expert. Distinct from `docs/skills/` (which is topic *reference*): every file here follows one **operational template** so it can drive a task end-to-end.

> **Stack:** EDS (xwalk / Universal Editor). Vanilla JS/CSS/JSON, no Java/HTL/OSGi/Dispatcher. Grounded in this repo's real code (`scripts/aem.js`, `scripts/scripts.js`, 50 blocks, `helix-*.yaml`, `head.html`).

## The operational template (every file)
`Purpose · When to use · When NOT to use · Inputs · Outputs · Decision logic · Validation · Performance · SEO · Accessibility · Examples · Anti-patterns · Troubleshooting`

## Skills
| # | Skill | Engineering topic |
|---|---|---|
| 01 | [Block Development](01-block-development.md) | create/modify a block |
| 02 | [Decorate Pattern](02-decorate-pattern.md) | DOM transformation logic |
| 03 | [CSS & Styling](03-css-styling.md) | scoped, responsive block CSS |
| 04 | [Sections & Section Metadata](04-sections-and-metadata.md) | section boundaries + styling |
| 05 | [Content Modeling (UE)](05-content-modeling.md) | `_{block}.json` models |
| 06 | [Universal Editor Instrumentation](06-universal-editor-instrumentation.md) | editable overlays |
| 07 | [Document Authoring](07-document-authoring.md) | doc-based authoring |
| 08 | [Three-Phase Loading](08-three-phase-loading.md) | eager/lazy/delayed |
| 09 | [LCP & Image Optimization](09-lcp-and-images.md) | LCP element + `createOptimizedPicture` |
| 10 | [Performance Engineering](10-performance-engineering.md) | PSI 100, CWV |
| 11 | [Accessibility Engineering](11-accessibility-engineering.md) | WCAG 2.1 AA |
| 12 | [Metadata & Indexing](12-metadata-and-indexing.md) | `helix-query.yaml`, query-index |
| 13 | [SEO & Redirects](13-seo-and-redirects.md) | ranking preservation |
| 14 | [Dynamic Content & Data](14-dynamic-content.md) | client-side fetch |
| 15 | [Forms](15-forms.md) | Adaptive Forms |
| 16 | [Search](16-search.md) | query-index / external |
| 17 | [Navigation (Header/Footer)](17-navigation.md) | site chrome |
| 18 | [Fragments & Reuse](18-fragments-and-reuse.md) | shared content |
| 19 | [Preview, Publish & Code Sync](19-preview-publish.md) | delivery pipeline |
| 20 | [Debugging & Troubleshooting](20-debugging.md) | diagnosing EDS issues |

## How to use
Match your task to a skill by its **When to use / When NOT to use**. Run its **Decision logic**, produce its **Outputs**, then walk its **Validation** + the three non-functional sections (Performance/SEO/Accessibility) before shipping. **Troubleshooting** is the first stop when something's wrong.
