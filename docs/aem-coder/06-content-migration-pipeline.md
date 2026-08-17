# 06 · Content Migration Pipeline

Migration is the highest-value, highest-risk AEM assistant capability. This document details the pipeline that makes it reliable — grounded in this repo's real `tools/importer/` structure.

## The pipeline (stages, each a tool or sub-agent)
```
1 URL discovery        → sitemap/crawl → list of source URLs
2 Scrape               → fetch DOM, metadata, images; write cleaned.html + analysis.json
3 Page analysis        → segment into sections & content sequences; classify block variants
4 Block mapping        → map each section to an existing/new block + DOM selectors (page-templates.json)
5 Infra generation     → per-variant parsers + page transformers (cleanup/sections/DM)
6 Import (scripted)    → run bundled import script → authored HTML in content/
7 Preview & verify     → render, compare to original, iterate
8 PR                   → branch + preview link
```
*Why staged & artifact-driven:* each stage writes a durable artifact the next consumes, so runs are **resumable, auditable, and parallelizable** across pages. This is exactly the shape of `tools/importer/` (`parsers/`, `transformers/`, `page-templates.json`, bundles, `reports/`).

## Stage detail & decisions

### 1–2 Discovery + Scrape
- Prefer the sitemap; fall back to crawling. Persist every source URL.
- Scrape produces: raw+cleaned HTML, metadata (title/description/og), downloaded images, and an `analysis.json` index.
- *Decision:* clean the HTML deterministically (strip scripts/trackers/boilerplate) **before** the model sees it — less noise, cheaper, more reliable segmentation.

### 3 Page analysis (sub-agent)
- Two-level: **sections** (top-level bands), then **sequences within a section** (default content vs a block).
- Output a neutral, structured description — not code yet. Force a JSON schema.
- *Decision:* separate *analysis* from *generation* so the model commits to structure before syntax; mirrors this repo's `page-analysis` / `authoring-analysis` skills.

### 4 Block mapping
- For each section, decide: reuse an existing block, use a variant, or create a new block. Enforce an **80% similarity reuse threshold** before minting a new variant.
- Record DOM selectors per variant in `page-templates.json` (`blocks[]`).
- *Decision:* aggressive reuse keeps the block count and CSS surface small and consistent (this repo has 50 blocks, not 500) — dedupe is a barrier stage across all pages.

### 5 Infra generation (sub-agents)
- **Parsers** (`tools/importer/parsers/{variant}.js`): turn matched source DOM into the block's table structure.
- **Transformers** (`tools/importer/transformers/`): cleanup, section boundaries, Dynamic Media/Scene7 URL rewriting.
- *Decision:* generate one parser per *variant*, validated and iterated until passing — small, testable units beat one giant importer.

### 6 Import (deterministic script)
- A bundled Node script combines page template + parsers + transformers and emits authored HTML. **The model does not hand-write content HTML** — the rule "never hand-edit `content/`" is enforced by making import the only path.
- *Decision:* determinism here is non-negotiable — migrations must reproduce exactly and diff cleanly.

### 7 Verify (sub-agent loop)
- Render the imported page in preview; compare to the original at mobile/tablet/desktop; iterate up to N times ([09](09-verification-and-validation.md)).
- *Decision:* fidelity is the acceptance criterion for migration; a visual critic closes the loop.

## Special cases the pipeline must handle
- **Navigation & footer:** hover-revealed megamenus need per-item Playwright interaction, not static DOM scraping (cf. the navigation/footer orchestrator agents).
- **Forms:** HTML forms → Adaptive Form JSON is a distinct sub-pipeline (a forms plugin).
- **Commerce (PDP/PLP):** product/listing pages route to a commerce implementation, not normal migration — classify first.
- **Dynamic Media images:** rewrite Scene7 URLs in a transformer.
*Decision:* detect these early and route to the right sub-pipeline; a one-size importer produces subtly broken output.

## Example: parser responsibility (conceptual)
A `cards` parser receives the matched source DOM for a "features" grid and emits the block's row/cell table so the importer renders a `cards` block. It classifies each card's image/title/body/CTA — the same content-classification discipline blocks use at runtime ([07](07-block-generation.md)).

## Why migration is scripted, not generated per-page
If the model regenerated import logic for every page, output would drift and be unauditable. Instead the model generates **reusable parsers/transformers once per variant**, then a **deterministic script** applies them across all matching pages. This is the difference between "migrated 200 pages reproducibly" and "hand-crafted 200 snowflakes." The reproducibility is the product.
