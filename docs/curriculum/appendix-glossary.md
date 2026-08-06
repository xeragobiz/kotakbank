# Appendix — Glossary & Command Reference

> Companion to the [EDS Training Curriculum](README.md)

## Glossary

| Term | Meaning |
|---|---|
| **EDS** | Edge Delivery Services — Adobe's document/repo-driven, edge-served web platform. |
| **Helix / Franklin** | Older engineering/community names for EDS (still in file/host names). |
| **`aem.page` / `aem.live`** | Preview (per-branch) / live (from `main`) delivery hosts. |
| **Block** | Reusable component: `blocks/<name>/<name>.{js,css}` (+ `_<name>.json` in xwalk). |
| **Section** | Top-level content grouping (`<div class="section">`), created by a document HR. |
| **Default content** | Loose content (headings/paragraphs/images) not inside a block; wrapped in `.default-content-wrapper`. |
| **`decorate(block)`** | The default-exported function that transforms a block's DOM in place. |
| **DOM contract** | The guaranteed row/cell `<div>` structure the platform produces from a block table. |
| **E-L-D** | Eager / Lazy / Delayed — the three-phase loading model in `scripts.js`. |
| **LCP / CLS / INP** | Core Web Vitals: paint of largest element / layout stability / input responsiveness. |
| **Universal Editor (UE)** | Adobe's in-context WYSIWYG editor for xwalk projects. |
| **xwalk / crosswalk** | An EDS project wired for Universal Editor authoring. |
| **DA** | Document Authoring (`da.live`) — web document editor content source. |
| **Component model** | `_<name>.json` — definition + fields (+ filters) that tell UE how to edit a block. |
| **Aggregates** | Generated `component-definition/models/filters.json` — never hand-edited. |
| **`fstab.yaml`** | Mounts the content source. |
| **`helix-query.yaml`** | Configures `query-index.json` (indexing). |
| **`query-index.json`** | Edge-cached JSON feed of indexed pages; powers listing blocks. |
| **`.hlxignore`** | Files the platform must NOT serve. |
| **AEM Code Sync** | GitHub App that publishes pushes to the edge (no manual deploy). |
| **`moveInstrumentation`** | Transfers UE editing attributes when moving DOM nodes. |
| **`createOptimizedPicture`** | `aem.js` helper producing responsive, edge-optimized `<picture>`. |
| **Dedicated block** | A bespoke block (e.g. `k811-*`) built for fidelity rather than reusing a shared one. |
| **Keeping it 100** | Adobe's doctrine of starting at Lighthouse 100 and defending it. |

## Traditional AEM → EDS mapping (quick recall)

| Traditional AEMaaCS | EDS equivalent |
|---|---|
| HTL / Sightly template | JS `decorate()` transforming delivered HTML |
| Sling Model | Block `decorate(block)` |
| Component dialog | `_<name>.json` model (fields) |
| Component `.content.xml` | `_<name>.json` definition |
| Allowed-components policy | `_<name>.json` filters |
| OSGi service / config | ES module in `scripts/` + `*.yaml` / `head.html` |
| Dispatcher / cache config | Edge CDN + `.hlxignore` + `head.html` CSP |
| Maven build / Cloud Manager | No build; `git push` → AEM Code Sync; GitHub Actions + PSI |

## Command reference

```bash
# Setup & local dev
npm install
npx -y @adobe/aem-cli up --no-open --forward-browser-logs   # dev server on :3000
#   for pages with no authored content yet:
npx -y @adobe/aem-cli up --html-folder drafts

# Quality
npm run lint            # ESLint (JS) + Stylelint (CSS) — mandatory before commit/PR
npm run lint:fix        # auto-fix
npm run build:json      # regenerate the 3 aggregate component JSONs after any _*.json change

# Inspect delivered markup (never assume the DOM)
curl http://localhost:3000/path            # decorated
curl http://localhost:3000/path.plain.html # semantic HTML before decoration
curl http://localhost:3000/path.md         # markdown-ish source

# Docs search
curl -s https://www.aem.live/docpages-index.json \
  | jq -r '.data[] | select(.content|test("KEYWORD";"i")) | "\(.path): \(.title)"'

# CI / PR
gh pr checks            # watch lint + JSON-sync gate status
```

## Environments

- **Feature preview:** `https://{branch}--{repo}--{owner}.aem.page/`
- **Production preview:** `https://main--{repo}--{owner}.aem.page/`
- **Production live:** `https://main--{repo}--{owner}.aem.live/`

## The definition-of-done checklist (condensed)

- [ ] Feature branch; focused commits.
- [ ] Style matches (Airbnb JS / Stylelint CSS, 2-space JS / 4-space CSS, Unix LF, `.js` import extensions, JSDoc on `decorate`).
- [ ] CSS scoped to the block; no `-container`/`-wrapper`; mobile-first 600/900/1200.
- [ ] Defensive, idempotent decoration; instrumentation preserved.
- [ ] `_*.json` change → `npm run build:json`; aggregates committed & in sync.
- [ ] `npm run lint` passes locally and in CI.
- [ ] Verified in preview via Playwright at mobile/tablet/desktop; parity for migration.
- [ ] Accessibility checked (headings, alt, ARIA, keyboard, reduced-motion).
- [ ] PSI on preview URL targeting 100; LCP/eager discipline; assets optimized.
- [ ] No secrets; CSP respected; injected HTML sanitized; `aem.js` untouched.
- [ ] No hand-edited `content/`; no Java/Maven/HTL/OSGi/Dispatcher artifacts.
- [ ] Pushed; Code Sync published; `gh pr checks` green.
- [ ] PR to `main` **with a preview-URL link** to a page demonstrating the change.

## Recommended reading order for revision

1. Lessons 01–03 — the mental model (content-first, sections/blocks, DOM contract).
2. Lessons 04–07 — core engineering (anatomy, `decorate`, CSS, E-L-D).
3. Lessons 08–10 — authoring (UE, models, config/indexing).
4. Lessons 11–13 — quality (performance, a11y, CI).
5. Lessons 14–16 — advanced (migration, integrations, architecture).

## External references

- Platform docs: <https://www.aem.live/>
- Keeping it 100 (performance): <https://www.aem.live/developer/keeping-it-100>
- Markup, sections & blocks: <https://www.aem.live/developer/markup-sections-blocks>
- Component model definitions: <https://www.aem.live/developer/component-model-definitions>
- Boilerplate (xwalk): <https://github.com/adobe-rnd/aem-boilerplate-xwalk/>
