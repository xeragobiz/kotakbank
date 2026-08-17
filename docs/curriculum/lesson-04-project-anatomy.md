# Lesson 04 — Project Anatomy & the Boilerplate

> Tier 2 · Core Engineering · Prerequisites: Lessons 01–03

## 1. Theory

Every EDS project starts from a **boilerplate** — for document projects `aem-boilerplate`, for Universal Editor projects `aem-boilerplate-xwalk`. The boilerplate is intentionally tiny: a handful of scripts, a global stylesheet, a starter set of blocks, and configuration files. There is **no application scaffold**, because there is no application server.

Your job as an engineer is to understand which files are **platform core (never touch)**, which are **the global surface you extend carefully**, and which are **yours to add freely** (blocks, styles, models).

## 2. Architecture — the file map

```
├── blocks/                    # every component: <name>/<name>.{js,css} (+ _<name>.json for xwalk)
├── scripts/
│   ├── aem.js                 # PLATFORM CORE — never modify
│   ├── scripts.js             # global entry: three-phase decoration (extend carefully)
│   ├── delayed.js             # delayed-phase work (martech)
│   ├── editor-support*.js      # Universal Editor WYSIWYG support
│   └── <project runtime>/     # shared modules for your block family
├── styles/
│   ├── styles.css             # global + LCP-critical (eager)
│   ├── lazy-styles.css        # below-the-fold (lazy)
│   ├── fonts.css              # @font-face
│   └── <design-guide>.css     # scoped design tokens for a page family
├── models/                    # default-content component models (_component-*.json)
├── head.html                  # <head>: CSP, viewport, eager loads of aem.js/scripts.js/styles.css
├── 404.html
├── fstab.yaml                 # content mountpoint
├── helix-query.yaml           # query-index.json config (indexing)
├── helix-sitemap.yaml         # sitemap config
├── .hlxignore                 # files the platform must NOT serve
├── component-definition.json  # AGGREGATE (generated) — never hand-edit
├── component-models.json      # AGGREGATE (generated) — never hand-edit
├── component-filters.json     # AGGREGATE (generated) — never hand-edit
├── .eslintrc.js / .stylelintrc.json / .editorconfig
└── .github/workflows/         # CI: lint + JSON-sync gate
```

### Three tiers of ownership

| Tier | Files | Rule |
|---|---|---|
| **Platform core** | `scripts/aem.js` | **Never modify.** It's the closest thing to a system bundle. |
| **Global surface** | `scripts.js`, `styles.css`, `head.html`, `fstab.yaml`, `helix-*.yaml`, `.hlxignore` | Extend **carefully & backward-compatibly**; changes affect every page. |
| **Yours** | `blocks/*`, project `styles/*.css`, `models/*`, project `scripts/<runtime>/*` | Add freely, following conventions. |
| **Generated** | `component-*.json` aggregates, `content/*` | **Never hand-edit** — regenerate via tooling. |

## 3. Engineering rationale

**Why keep `aem.js` untouchable?** It is upstream platform code. Modifying it forks you off the platform's maintenance path and breaks the guarantees the edge relies on. Everything you need is achievable in your own modules and blocks.

**Why aggregate JSON files that you can't edit?** Universal Editor needs a *single* `component-definition.json` / `component-models.json` / `component-filters.json`. But maintaining giant merged files by hand is error-prone, so each block ships a small `_<name>.json` partial and a build step (`npm run build:json`, using `merge-json-cli`) merges them. CI fails if the aggregates are stale — guaranteeing partials and aggregates never drift.

**Why `.hlxignore`?** The edge serves *everything* in the repo by default. `.hlxignore` keeps private/build files (dotfiles, `*.md`, `package*.json`, `_*` partials, tests) off the public edge.

**Why a separate `lazy-styles.css`?** To keep `styles.css` limited to global + LCP-critical rules, protecting the critical path.

## 4. Examples

**A block is three co-located files:**
```
blocks/hero/
  hero.js      → export default function decorate(block) { … }
  hero.css     → .hero { … }   (scoped to the block)
  _hero.json   → Universal Editor definition + model (xwalk only)
```

**The JSON build pipeline** (from `package.json`):
```bash
npm run build:json          # merges all partials → 3 aggregates
# runs: build:json:models, build:json:definitions, build:json:filters
```
Husky pre-commit runs this automatically for staged `_*.json` and re-stages the aggregates.

**`.hlxignore` excerpt:**
```
*.md
package*.json
_*.json
test/*
```

## 5. Hands-on exercises

1. **Ownership sort.** For each file — `scripts/aem.js`, `blocks/cards/cards.css`, `component-models.json`, `head.html`, `content/index.html` — label it core / global / yours / generated, and state the rule.
2. **Trace a new block's footprint.** List every file you'd create/modify to add a block named `promo` to an xwalk project (hint: 3 new files + 1 build command + 3 regenerated aggregates).
3. **Read the CI gate.** Open `.github/workflows/main.yaml` and describe, in order, what it runs and which condition fails the build for stale JSON.
4. **`.hlxignore` audit.** Add a hypothetical `snapshots/` folder of private QA HTML and decide whether it belongs in `.hlxignore`.

## 6. Common mistakes

- **Editing an aggregate `component-*.json` directly** — it's overwritten on the next build and CI will flag drift.
- **Forgetting `npm run build:json`** after changing a `_<name>.json` — CI fails the "JSON in sync" check.
- **Modifying `aem.js`** to "fix" something — the fix belongs in your own module.
- **Committing unignored private files** that then get served publicly.

## 7. Review questions

1. Which single file must you never modify, and why?
2. Why do block model partials exist alongside aggregate JSON files, and what keeps them in sync?
3. What is `.hlxignore` for, and name three things it typically excludes.
4. Why is `lazy-styles.css` separate from `styles.css`?
5. What does the CI JSON-sync gate actually check?

## 8. Best practices

- **Co-locate** a block's JS, CSS, and JSON in `blocks/<name>/`.
- **Run `npm run build:json`** after any model change and commit the aggregates in the same PR.
- **Make additive, backward-compatible changes** to global files; a change to `hero`/`cards` can break every page that uses them.
- **Keep the global stylesheet lean**; push non-critical CSS to `lazy-styles.css` and block CSS.

## 9. Anti-patterns

- **Hand-editing generated aggregates or `content/`.**
- **A "utils dump":** a giant shared script that every block imports, defeating code-splitting.
- **Global CSS creep** into `styles.css` for one block's needs.
- **Forking `aem.js`** or pinning a patched copy.

---

**Next:** [Lesson 05 — Block Development: the `decorate()` Function →](lesson-05-block-development.md)
