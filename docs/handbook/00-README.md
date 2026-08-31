# AEM Edge Delivery Services — Engineering Handbook

The complete engineering handbook for building on **AEM Edge Delivery Services (EDS)**. Every recommendation carries its **reasoning** — the *why*, not just the *what* — because a rule you understand is one you apply correctly in the cases the rule didn't foresee. Grounded in this repository's real code (`scripts/aem.js`, `scripts/scripts.js`, the 50 blocks, `head.html`, `helix-*.yaml`).

> **Stack:** EDS (xwalk / Universal Editor). Vanilla **JavaScript (ES6+), CSS3, JSON**. No Java/HTL/OSGi/Dispatcher/Cloud-Manager — presentation logic is JS `decorate()`, config is YAML/HTML, delivery is the Edge CDN via AEM Code Sync.

## Chapters (29 topics, 16 chapters)
| # | Chapter | Topics covered |
|---|---|---|
| 01 | [Architecture & Runtime](01-architecture-and-runtime.md) | Architecture · three-phase runtime |
| 02 | [Blocks, Sections & the Decorate Pattern](02-blocks-sections-decorate.md) | Blocks · Sections · Decorate pattern |
| 03 | [Markup, CSS & JavaScript](03-markup-css-javascript.md) | Semantic HTML · CSS · JavaScript |
| 04 | [Loading & Performance](04-loading-and-performance.md) | Lazy loading · Performance · Caching · Image optimization |
| 05 | [Accessibility](05-accessibility.md) | Accessibility |
| 06 | [Authoring & Content Modeling](06-authoring-and-content-modeling.md) | Authoring · Universal Editor · Document Authoring · Content modeling · Metadata |
| 07 | [Preview, Publish & Delivery](07-preview-publish-delivery.md) | Preview · Publish · (caching cross-ref) |
| 08 | [Forms, Search & Dynamic Content](08-forms-search-dynamic.md) | Forms · Search · Dynamic content |
| 09 | [Anti-patterns, Mistakes & Validation](09-antipatterns-mistakes-validation.md) | Anti-patterns · Best practices · Common mistakes · Validation checklist |
| 10 | [Decision Rationale](10-decision-rationale.md) | the "why" behind every EDS choice (block vs component, section, metadata, fragment, UE vs DA, split, lazy, decorate, flat DOM, …) with alternatives + when-it-flips |
| 11 | [Knowledge Graph](11-knowledge-graph.md) | Mermaid graph of how every EDS concept relates (master + 7 sub-graphs + edge dictionary); adjacent/replaced systems labeled precisely |
| 12 | [Environments & Promotion](12-environments-and-promotion.md) | Dev/UAT/Stage/Prod on EDS · branch = environment · Azure Git → GitHub mirror · Universal Editor content per tier · env config matrix · promotion & rollback |
| 13 | [Global Values & Placeholders](13-global-values-placeholders.md) | Placeholders sheet · Key/Value global values · consuming in blocks · localisation (/en, /hi) · SEO caveat (JS DOM vs server-rendered metadata) · sheet models |
| 14 | [Configuration Service](14-config-service.md) | Repoless config · query/sitemap/fstab/robots via config service (tools.aem.live) not repo YAML · POST-not-PUT API · regenerate after change · en/hi config reference · gotchas |
| 15 | [SCSS Compiler](15-scss-compiler.md) | Optional block SCSS · `styles/scss/block/{name}.scss` → `blocks/{name}/{name}.css` · brand palettes · `npm run build:css` · CI `--check` |
| 16 | [Adding ESLint Rules](16-adding-eslint-rules.md) | `.eslintrc.js` · Airbnb + xwalk · adding a rule · smoke test · editor squiggles · CI |

## How to read this handbook
Each chapter states a recommendation, then a **Why:** line. When two chapters seem to conflict, the reasoning tells you which constraint dominates in your case. The validation checklist ([09](09-antipatterns-mistakes-validation.md)) is the executable summary — walk it before every PR.

## The five principles that generate every recommendation
1. **The platform is fast by default; your job is to not slow it down.** *Why:* EDS ships minimal, code-split, edge-cached assets. Most performance work is *avoiding* regressions (heavy deps, eager-loaded junk), not adding optimizations.
2. **Read the delivered markup before you decorate it.** *Why:* the backend emits the DOM and it varies (field-collapsing); assumptions produce broken blocks.
3. **Decoration is transformation, not templating.** *Why:* there's no HTL; JS reshapes real DOM, so it must be idempotent and defensive.
4. **The content model is the author's interface.** *Why:* a migration/build that renders but can't be edited has failed its actual purpose.
5. **Everything shipped is public and client-side.** *Why:* no server to hide logic or secrets; security and performance are properties of the bytes you commit.
