# 15 · SCSS Compiler (block styles & brand palettes)

How this project authors **optional block SCSS**, compiles it to the CSS Edge Delivery Services actually serves, and switches **brand colors at compile time**. Grounded in `tools/build-scss.mjs`, `styles/scss/`, and the `npm run build:css` pipeline.

> **EDS still serves CSS, not Sass.** There is no Sass runtime on `*.aem.page` / `*.aem.live`. Authors write `.scss`; the compiler writes `blocks/{name}/{name}.css`; AEM Code Sync publishes that CSS. `*.scss` is listed in `.hlxignore` so the CDN never serves it.

See also [03](03-markup-css-javascript.md) (CSS rules that still apply to the compiled output) and [04](04-loading-and-performance.md) (block CSS is code-split by `loadBlock`).

---

## The one idea: SCSS is a source format, CSS is the artifact

EDS has no application build on the edge. The only CSS build is **local** (and CI-checked), same idea as `npm run build:json` for Universal Editor aggregates.

```
styles/scss/_config.scss          $brand: kotak811
styles/scss/_brand.scss           palettes + brand.color()
styles/scss/_breakpoints.scss     600 / 900 / 1200 mixins
styles/scss/_mixins.scss          optional @include mixins.block()
styles/scss/block/{name}.scss     block source  ──►  npm run build:css
                                                      │
                                                      ▼
                              blocks/{name}/{name}.css   (committed, served)
```

- **Recommendation:** author SCSS-backed blocks at `styles/scss/block/{name}.scss`. The filename **must** match the block folder (`cc-hero.scss` → `blocks/cc-hero/cc-hero.css`).
  **Why:** `cssPathFor()` in `tools/build-scss.mjs` maps by basename only. A mismatch silently writes CSS to the wrong block (or fails to update the one you meant).
- **Recommendation:** never hand-edit a `.css` file that has a matching SCSS source. The generated file starts with `/* Generated from … — do not edit. Run \`npm run build:css\`. */`.
  **Why:** the next compile overwrites it. Hand edits look like they stuck until CI `--check` or the next `build:css` wipes them.
- **Recommendation:** leave blocks **without** an SCSS file as hand-written CSS. Do not mass-migrate.
  **Why:** compilation is opt-in. Existing CSS is already served; converting fifty files in one pass is a noisy, regression-prone diff.

---

## Commands

Run from the **repository root** (the folder that contains `package.json`):

| Command | What it does |
|---|---|
| `npm run build:css` | Compile every non-partial `styles/scss/block/*.scss` → `blocks/{name}/{name}.css` |
| `npm run watch:css` | Rebuild when anything under `styles/scss/` changes |
| `npm run build:css -- --check` | Compile in memory and **fail** if committed CSS is stale (CI) |
| `npm run build:css -- --brand=kotak` | Override `$brand` for this run without editing `_config.scss` |

`BRAND=kotak npm run build:css` is equivalent to `--brand=kotak`.

---

## Shared tokens (`styles/scss/`)

Partials (files starting with `_`) are **not** compiled on their own. Block files `@use` them via the Sass load path `styles/scss` (so `@use "brand";` resolves to `_brand.scss`).

### Brand (`_config.scss` + `_brand.scss`)

`_config.scss` holds the active palette name:

```scss
$brand: kotak811;  // or kotak
```

`_brand.scss` defines two maps (`kotak811`, `kotak`) and:

- `brand.color(primary)` — compile-time hex from the active map
- `@include brand.css-vars` — emits `--brand-primary`, `--brand-navy`, … on the current selector

**kotak811 keys** (defaults): `primary` `#fa1432`, `primary-text`, `primary-hover`, `primary-panel`, `navy`, `violet`, `violet-hover`, `orange`, `accent`, `brand-band`, `text`, `text-muted`, `bg`, `dark-bg`, `dark-text`, `card-bg`, `link`, `link-alt`, `link-alt-hover`.

- **Recommendation:** use `brand.color(…)` (or `var(--brand-…)` after `css-vars`) instead of a raw `#fa1432` in block SCSS.
  **Why:** switching `$brand` (or `--brand=`) and rebuilding retints every SCSS-backed block. Scattered hexes do not.
- **Recommendation:** add a new color as a **named key** on **both** palettes, then call `brand.color(that-key)`.
  **Why:** `brand.color()` errors if the key is missing. A one-palette-only key breaks `--brand=` compiles.

Example:

```scss
@use "brand";

.cc-hero #abc {
  background-color: brand.color(primary); // kotak811 → #fa1432
}
```

Compiled CSS:

```css
.cc-hero #abc {
    background-color: #fa1432;
}
```

Sass will rewrite modern `rgb(r g b / 15%)` into legacy `rgba()` unless you interpolate a string: `#{'rgb(179 18 31 / 15%)'}`. Stylelint requires the modern form in the **output** CSS.

### Breakpoints (`_breakpoints.scss`)

Matches the project’s mobile-first 600 / 900 / 1200 grid:

| Mixin | Media query |
|---|---|
| `bp.tablet` | `width >= 600px` |
| `bp.desktop` | `width >= 900px` |
| `bp.wide` | `width >= 1200px` |
| `bp.down(bp.$desktop)` | `width < 900px` |
| `bp.reduced-motion` | `prefers-reduced-motion: reduce` |

```scss
@use "breakpoints" as bp;

@include bp.desktop {
  .cta-banner .cta-banner-inner {
    flex-direction: row;
  }
}
```

### Mixins (`_mixins.scss`)

`@include mixins.block("cta-banner") { … }` wraps content in `.cta-banner { }` so nested `&-title` becomes `.cta-banner-title`. Optional — most blocks keep explicit `.cta-banner .cta-banner-title` selectors to control specificity.

---

## How the compiler works (`tools/build-scss.mjs`)

Dart Sass (`sass` 1.93.x, **devDependency** — never shipped to the browser).

1. **Discover** non-partial `*.scss` under `styles/scss/block/` (recursive; `_*.scss` skipped).
2. **Compile** each file with `loadPaths: [styles/scss]`, `style: expanded`, no source map, no `@charset`.
3. **Format** for this repo: 2-space Sass indent → 4-space CSS; blank lines between rules / after custom properties so Stylelint standard passes.
4. **Banner** the output with the source path.
5. **Write** `blocks/{name}/{name}.css` only when the content changed.

`--check` compiles the same way but does not write; it exits `1` if any target CSS would change. That is the CI freshness gate (same pattern as `build:json` + `git diff`).

`--watch` `fs.watch`es `styles/scss/` (tokens **and** block files) and rebuilds after 150ms debounce.

`--brand=` installs a virtual Sass importer for `config` so `$brand` is overridden without touching `_config.scss`.

---

## Add SCSS to a block (checklist)

1. Create `styles/scss/block/{name}.scss` (2-space indent, Unix LF).
2. Start with `@use "brand";` and `@use "breakpoints" as bp;` as needed.
3. Scope selectors to `.{name}`. CSS rules in [03](03-markup-css-javascript.md) still apply to the compiled output.
4. From the repo root: `npm run build:css`.
5. Confirm `blocks/{name}/{name}.css` updated; run `npm run lint` (Stylelint lints the **CSS**, not the SCSS).
6. Commit **both** the `.scss` and the generated `.css`.

Blocks already on this path: `cc-hero`, `cta-banner`.

---

## Git hooks, CI, and what is served

| Gate | Behavior |
|---|---|
| **Husky pre-commit** | If any staged file ends in `.scss`, runs `npm run build:css` and `git add`s `blocks/**/*.css`. |
| **GitHub Actions** (`main.yaml`) | After `npm run lint`, runs `npm run build:css -- --check`. Stale CSS fails the build. |
| **`.hlxignore`** | `*.scss` — Code Sync does not publish Sass. EDS loads `blocks/{name}/{name}.css` via `loadBlock()` as before. |

- **Recommendation:** commit the compiled CSS on the same change as the SCSS.
  **Why:** preview/live have no `npm run build:css`. If only `.scss` is committed, production keeps the old CSS (or none).

---

## What this is not

- Not a bundler, not a Tailwind pipeline, not a replacement for `styles/styles.css` / `lazy-styles.css` / `kotak811.css`.
- Not runtime theming. `brand.color()` is baked into hex at compile time. For runtime tokens, keep using CSS custom properties (`var(--k811-link)` on `main.kotak811`, or `@include brand.css-vars` then `var(--brand-primary)`).
- Not an excuse to skip scoping, mobile-first breakpoints, or `prefers-reduced-motion`. Those rules apply to the CSS that ships.

---

## Validation checklist — SCSS compiler

- [ ] Source is `styles/scss/block/{name}.scss`; output is `blocks/{name}/{name}.css`.
- [ ] Colors come from `brand.color(…)` / `--brand-*`, not one-off hexes (unless they are truly unique, e.g. a gradient stop).
- [ ] Selectors scoped to the block; no new `.{name}-wrapper` / `.{name}-container` rules.
- [ ] `npm run build:css` run; generated CSS committed; `npm run lint` passes.
- [ ] CI `--check` would be green (`npm run build:css -- --check`).
- [ ] No `.scss` expected on the CDN (`.hlxignore`); `aem.js` untouched; `sass` stays a **dev** dependency.
