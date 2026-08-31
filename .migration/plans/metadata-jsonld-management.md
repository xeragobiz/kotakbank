# Head, SEO Metadata, Web Fonts & Sitemap Plan (UE / Repoless Kotak Bank)

## Goal

Head/SEO/performance concerns for this Universal-Editor-only, repoless (config-service) EDS site:
1. **Metadata & JSON-LD** — client manages `<meta>` tags + `application/ld+json` without editing pages (via the `metadata` spreadsheet + a one-time JS helper).
2. **Web fonts** — use fonts (incl. Google Fonts) without regressing Lighthouse/LCP.
3. **Sitemap** — clarify whether per-URL `<priority>`/weightage is possible in EDS.

---

## Part C — Sitemap "weightage" / priority (direct answer)

**Short answer: no — EDS does not generate a per-URL `<priority>` (or `<changefreq>`) in its sitemap, and there is no supported field to set it.**

- The EDS-generated sitemap includes **`loc`** (URL) and optional **`lastmod`** (last modified date), plus **`hreflang`** alternates for multi-language. That's it.
- There is **no `<priority>` and no `<changefreq>`** element, and **no metadata/config field to add one per page.** So you cannot set "weightage" per URL the way the old XML sitemap spec allowed.
- **This is by design and doesn't hurt SEO:** Google has publicly stated it **ignores `<priority>` and `<changefreq>`** in sitemaps. They are effectively dead signals; `lastmod` is the only crawl-scheduling hint Google still uses (and only if it's honest/consistent).

**What you *can* control (repoless / config service):**
- The sitemap is configured via **`sitemap.yaml` in the site configuration** (config service) — **not** a repo file, matching this project's repoless setup. Edit it through the config service (POST to `admin.hlx.page/config …`), not the repo.
- You can control: which paths are included, `lastmod`, `hreflang` language alternates, and **exclude pages** by setting `robots: noindex` in their metadata (which ties back to the `metadata` spreadsheet — a `noindex` row for a URL pattern drops those pages from the sitemap).

**If the client insists on `<priority>`:** the only route is a **custom/hand-authored sitemap** served outside the generated one (e.g. a custom sitemap file + a redirect/route), which is non-standard, must be maintained manually, and delivers **no SEO benefit** since Google ignores the field. Recommendation: **do not** — instead steer crawl via good `lastmod`, internal linking, and `noindex` hygiene.

### Sitemap checklist

- [ ] Confirm current `sitemap.yaml` in the **config service** (paths, lastmod, hreflang) — read via `admin.hlx.page`.
- [ ] Decide language/hreflang scope (`/en/**`, etc.).
- [ ] Use the `metadata` sheet `robots: noindex` rows to exclude pages from the sitemap where needed.
- [ ] Set the client's expectation: **no per-URL priority in EDS; Google ignores priority anyway** — prioritization is achieved via lastmod + internal linking + noindex, not a weightage column.
- [ ] Verify the published `sitemap.xml` contains the expected `loc`/`lastmod`/`hreflang` and excludes noindex pages.

---

## Part B — Google Fonts in EDS (direct answer)

**Yes you can, but self-host — don't hot-link `fonts.googleapis.com`.** This project already self-hosts Manrope (`fonts/` + `styles/fonts.css`).

| Approach | Perf impact | Verdict |
|---|---|---|
| `<link href="fonts.googleapis.com/css2?...">` | 3rd-party DNS/connection + render-blocking CSS → delays LCP, risks CLS, costs Lighthouse points, adds privacy/CSP surface | ❌ Avoid |
| `@import url(googleapis...)` | Serial, blocking, defeats preload — worst case | ❌ Never |
| **Self-host** `.woff2` + `@font-face` in `styles/fonts.css`, served from `/fonts/` | Same-origin, edge-cached, preloadable, no 3rd-party round trip; pair with `font-display: swap` + size-matched fallback | ✅ Recommended |

### Font performance checklist

- [ ] Self-host: download the Google font as subset **`.woff2`** (only needed weights/charsets).
- [ ] Add `@font-face` in `styles/fonts.css` (match Manrope pattern) with **`font-display: swap`**.
- [ ] Size-adjusted fallback (`size-adjust`/`ascent-override` or matched system stack) to minimize CLS.
- [ ] Preload **only** the critical LCP font file in `head.html` (`rel=preload as=font crossorigin`).
- [ ] Commit optimized/subset fonts to `fonts/`.
- [ ] Verify PSI/Lighthouse: no render-blocking font CSS, LCP/CLS unaffected.

---

## Part A — Metadata & JSON-LD

### Key Constraints (confirmed)

- **UE-only.** The `metadata` sheet is authored in AEM author, published via Sidekick.
- **Repoless / config-service.** Content/query/**sitemap** config live in the config service (no `helix-*.yaml` in repo). **But `head.html`, `scripts.js`, `fonts.css` are code** — served from GitHub `main`, changed via PR + Code Sync.
- **Client requirement:** update metatags via spreadsheet only — **zero page edits**. The `metadata` sheet satisfies this.
- **Platform limit:** the metadata sheet / page metadata can **only output `<meta>` tags** — never a `<script type="application/ld+json">`. Sheet holds JSON-LD *values*; a small JS helper assembles the script.
- **View-source vs DOM:** sheet meta tags are server-rendered (view-source ✅). JS-injected JSON-LD is DOM-only — fine for Google rich results; social scrapers use OG/Twitter tags (in view-source).

### Approach Overview

| Content | Managed via | View-source? | No page edit? |
|---|---|---|---|
| Standard + OG + Twitter + FB meta tags | `metadata` spreadsheet (bulk, by URL pattern) | ✅ | ✅ |
| Site-wide JSON-LD (`Organization`, `WebSite`) | `head.html` (once, in repo) | ✅ | ✅ (fixed) |
| Per-page JSON-LD (`WebPage`/`Article`/…) | `schema-*` columns in same sheet → JS helper reads via `getMetadata()` and injects script | ❌ DOM only | ✅ |

### Mapping the current `/en/home` head into the spreadsheet

One row per URL pattern; columns for: `title`, `keywords`, `description`, `og:title`, `og:description`, `og:url`, `og:image`, `og:type`, `og:locale`, `twitter:card`, `twitter:site`, `twitter:title`, `twitter:description`, `twitter:image:src`, `twitter:url`, `fb:app_id`, `fb:pages`, `format-detection`, plus new `schema-*` value columns. **Do not** re-add `viewport` (already emitted). Sheet evaluates top-to-bottom, broadest pattern (`**`) first; specific rows override.

## Checklist

- [ ] **Fonts:** confirm font(s) wanted (existing Manrope vs new Google font); if new, self-host per font checklist.
- [ ] **Sitemap:** confirm client understands no per-URL priority; audit `sitemap.yaml` in config service; wire `noindex` exclusions via the metadata sheet.
- [ ] **Confirm scope of JSON-LD types** (site-wide only vs per-page rich results) — decides whether the JS helper is needed.
- [ ] **Design the `metadata` spreadsheet schema** (`URL` + meta columns + `schema-*` columns).
- [ ] **Author baseline rows**: a `**` site-default row + a `/en/home` row reproducing the current head exactly.
- [ ] **Verify OG/Twitter/canonical parity** against the current live head so nothing regresses.
- [ ] **Decide JSON-LD split**: `Organization` + `WebSite` → `head.html`; per-page types → JS helper fed by `schema-*` columns.
- [ ] **Draft `head.html` addition** (repo PR): static `Organization`/`WebSite` JSON-LD + any critical font preload.
- [ ] **Write one-time helper in `scripts.js`** (`buildStructuredData()`), called from `loadLazy()`: reads `getMetadata('schema-type')` etc., drops empty keys, injects `<script type="application/ld+json">`. Respects CSP.
- [ ] **Confirm repoless flow**: sheet + `sitemap.yaml` via config service/Sidekick (content) vs `head.html`/`scripts.js`/`fonts.css` via branch → PR → Code Sync (code) — separate pipelines.
- [ ] **Preview & publish** the `metadata` sheet; verify meta tags in **view-source**.
- [ ] **Verify JSON-LD** in DOM + Google Rich Results Test on the preview URL.
- [ ] **Regression check** on metadata precedence (page-level UE metadata overrides sheet where intended).
- [ ] **Lint** (`npm run lint`) for `scripts.js`/`head.html`/`fonts.css` changes; PR to `main` with a `{branch}--kotakbank--xeragobiz.aem.page` preview link.
- [ ] **PSI/Lighthouse** on feature preview — target 100; confirm fonts + injected head cause no LCP/CLS regression.
- [ ] **Verify published sitemap** (`loc`/`lastmod`/`hreflang`, noindex excluded).
- [ ] **Document for the client**: no-page-edit `metadata` sheet workflow + sitemap reality (no priority column).

## Open Decisions (needed before execution)

- Exact per-page JSON-LD types, and whether view-source rendering of per-page schema is mandated (if yes, only route is baking JSON-LD into page markup at import time via `tools/importer/` — larger change).
- Whether a new Google-sourced font is required, or existing self-hosted Manrope suffices.
- Whether the client accepts EDS sitemap without `<priority>` (recommended) or insists on a custom sitemap (not recommended — no SEO value).

## Notes

- The optional plugins suggested by the environment (commerce, figma, forms, project-management) are **not relevant** to this task; no need to enable them.
- **Execution requires Execute mode** — this plan makes no file changes yet.
