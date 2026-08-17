# Repository Map

Where everything lives, and — critically — what to touch vs never touch. Verified against the repo.

## Top-level
```
blocks/                 50 blocks (shared + k811-*)          ← edit
scripts/                aem.js (core), scripts.js, delayed.js, k811/, shared modules
styles/                 styles.css, lazy-styles.css, fonts.css, kotak811.css, eligibility-modal.css  ← edit
models/                 _component-*.json (aggregation inputs) + _page/_section/_text/_title/_image/_button.json  ← edit + build:json
icons/  fonts/          optimized assets only                ← edit (optimized)
content/                authored HTML snapshots               ← DO NOT hand-edit (use tools/importer/)
drafts/                 static HTML for local testing         ← edit
data/                   data resources
tools/importer/         parsers/, transformers/, page-templates.json, bundles, dist/  ← edit (migration)
docs/                   skills/, prompts/, guides             ← edit (internal; not served)
head.html               CSP + eager asset loads               ← edit carefully
404.html                custom 404
fstab.yaml              content mountpoint                    ← edit carefully
helix-query.yaml        query-index config                    ← edit
helix-sitemap.yaml      sitemap config                        ← edit
.hlxignore              non-served files                      ← edit
component-definition.json / component-models.json / component-filters.json  ← GENERATED, never hand-edit
xwalk.json
.github/workflows/      main.yaml, cleanup-on-create.yaml
```

## Touch matrix
| Path | Action |
|---|---|
| `blocks/{name}/*` | ✅ Edit — your main work surface |
| `styles/*.css` | ✅ Edit (respect global vs lazy split) |
| `models/_*.json`, `blocks/**/_*.json` | ✅ Edit → then `npm run build:json` |
| `scripts/scripts.js`, `scripts/delayed.js`, `scripts/k811/*`, shared modules | ✅ Edit with care |
| `tools/importer/*` | ✅ Edit for migration/content |
| `head.html`, `fstab.yaml`, `helix-*.yaml`, `.hlxignore` | ⚠️ Edit deliberately (config surface) |
| `scripts/aem.js` | ⛔ Never modify (platform core) |
| `content/*` | ⛔ Never hand-edit (use import tooling) |
| `component-*.json` (root aggregates) | ⛔ Never hand-edit (generated) |
| `node_modules/`, `*.min.js` vendored libs | ⛔ Don't edit |

## The 50 blocks
**Shared / boilerplate (24):** `api-demo`, `apply-form`, `back-link`, `breadcrumb`, `cards`, `cards-benefits`, `cards-featured`, `cards-lifestyle`, `cards-product`, `cards-quicklink`, `cards-story`, `carousel-hero`, `carousel-icons`, `columns`, `columns-feature`, `cta-banner`, `faq-accordion`, `footer`, `fragment`, `header`, `help-links`, `hero`, `search`, `sub-nav`.

**Feature / product (9):** `cc-hero`, `cc-steps`, `eligibility-checker`, `rates-charges`, `resume-application`, `savings-calculator`, `sticky-cta`, `testimonials`, `help-links`.

**Dedicated k811-* migration (17):** `k811-about-hero`, `k811-app-cta`, `k811-benefits-story`, `k811-card-selector`, `k811-cta`, `k811-faq`, `k811-feature`, `k811-feature-grid`, `k811-hero`, `k811-offers`, `k811-offers-overlap`, `k811-pillars`, `k811-promo-band`, `k811-steps`, `k811-story`, `k811-team`, `k811-video-hero`.

> Note: `testk811-feature` exists as a scratch/test variant — treat it as throwaway, not a canonical block. Before creating a new block, check this list to avoid duplication; prefer a variant/model option unless dedicated fidelity is warranted.

## Scripts
```
scripts/
  aem.js                 ⛔ core, never modify
  scripts.js             entry point (loadPage: eager→lazy→delayed)
  delayed.js             delayed-phase work
  editor-support.js      Universal Editor WYSIWYG
  editor-support-rte.js  RTE editor support
  sentry.js              error monitoring
  dompurify.min.js       HTML sanitization (vendored)
  eligibility-modal.js   shared modal (used by several blocks)
  compare-modal.js       shared compare modal
  credit-card.js         feature logic
  k811/
    k811-common.js       k811 runtime (initK811, revealOnScroll)
    aos.min.js / aos.css vendored AOS (prefer k811-common's observer)
    lottie-player.min.js vendored Lottie
```

## Config surface (the "OSGi config" equivalent)
`fstab.yaml` (mount) · `helix-query.yaml` (index) · `helix-sitemap.yaml` (sitemap) · `head.html` (CSP + eager loads) · `.hlxignore` (non-served).

## Documentation set (all under docs/, not served)
`AI_ASSISTANT_GUIDE.md` (index) · `KNOWLEDGE_BASE.md` · `ARCHITECTURE.md` · `CODING_STANDARDS.md` · `BEST_PRACTICES.md` · `COMMON_MISTAKES.md` · `REVIEW_CHECKLIST.md` · `PR_CHECKLIST.md` · `REPOSITORY_MAP.md` · `skills/` (20) · `prompts/` (14). Plus `.cursor/rules/` (8). Root `AGENTS.md` is the authoritative source.

## Why the map is structured as a touch matrix
The single highest-value fact for an assistant editing this repo is **which files are off-limits** — editing `aem.js`, hand-editing `content/`, or hand-editing the generated aggregates are the three mistakes that most reliably break the build or the platform. Leading with an explicit ✅/⚠️/⛔ matrix front-loads that safety information before any file listing. The block inventory is enumerated in full (not summarized) so the assistant can check for an existing block before creating a duplicate — the project's stated anti-duplication rule.
