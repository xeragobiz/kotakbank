# 01 · Architecture & Runtime

## What EDS is (architecturally)
Content authored in AEM (Universal Editor) or documents (Document Authoring) is delivered as **semantic HTML** from an edge pipeline; a small vanilla-JS runtime **decorates** that HTML in the browser. Code lives in a GitHub repo and is published by **AEM Code Sync**. There is no application server you deploy to.

**Why this architecture:** decoupling content (backend/edge) from code (git) means content changes need no deploy and code changes need no content migration. The edge CDN + minimal JS is what makes EDS fast by default. Understanding this decoupling explains most other rules (e.g. why you never hand-edit `content/` — it's the content plane, not the code plane).

## The content vs code planes
- **Content plane:** authored in UE/Doc Authoring → delivered via `fstab.yaml` mount → edge.
- **Code plane:** `blocks/`, `scripts/`, `styles/`, `models/`, config → GitHub → Code Sync → edge.
- They meet at the edge and again in the browser (decoration).

**Why keep them separate in your head:** most confusion (and most mistakes) come from treating authored content like code or vice-versa. Blocks are code; page content is authored.

## The runtime: three-phase loading
`scripts/scripts.js` runs `loadPage()` = `loadEager()` → `loadLazy()` → `loadDelayed()`:
- **Eager:** decorate `main`, load the **first section** and its LCP image, load fonts. Only what LCP needs.
- **Lazy:** the remaining sections, header, footer, `lazy-styles.css`.
- **Delayed:** martech/analytics and other deferrable work (`delayed.js`).

**Why three phases:** LCP is decided by how fast the first meaningful paint completes. By loading *only* the first section eagerly and deferring everything else, the platform makes the critical path minimal. Every performance rule in [04](04-loading-and-performance.md) is a corollary of "don't put non-critical work in the eager phase."

## The platform core: `scripts/aem.js`
Provides the decoration primitives (`decorateSections`, `decorateBlocks`, `loadBlock`, `loadSection`, `createOptimizedPicture`, `loadCSS`, `sampleRUM`, `toClassName`, …).

**Why never modify it:** it's the platform contract, updated upstream; local edits break decoration and are overwritten. Treat it as a read-only dependency and build on top via `scripts/scripts.js` and blocks.

## The config surface
`fstab.yaml` (content mount), `helix-query.yaml` (index), `helix-sitemap.yaml` (sitemap), `head.html` (CSP + eager asset loads), `.hlxignore` (non-served files).

**Why these are "the config":** with no OSGi/Dispatcher, these YAML/HTML files *are* the entire configurable surface. Changes here have site-wide effect, so change them deliberately.

## Validation checklist — architecture
- [ ] Work is placed in the correct plane (code in the repo; content via authoring/import, never hand-edited in `content/`).
- [ ] Eager phase contains only LCP-critical work.
- [ ] `scripts/aem.js` untouched.
- [ ] Config changes confined to the intended YAML/HTML file.
