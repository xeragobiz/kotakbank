# 01 · Component (Block) Development

## Purpose
Build and modify EDS **blocks** — the unit of componentry in this repo. A block is a folder `blocks/{name}/` containing `{name}.js` (a default-exported `decorate(block)`), `{name}.css` (styles scoped to `.{name}`), and `_{name}.json` (the Universal Editor definition/model). This is the EDS equivalent of "component development" — there are no Java components here.

## When to use
- Creating a new content component (shared or a migration-specific `k811-*` block).
- Changing the DOM transformation, styling, or authoring model of an existing block.
- Adding a variant to an existing block.

## Best practices
- **Design the content structure first** — the rows/cells/fields are the contract between author and code. Decide them before writing JS.
- **Verify the delivered DOM** before coding: `curl http://localhost:3000/path.plain.html`. Never assume the markup.
- **Classify cells by content, not fixed position.** Universal Editor field-collapsing merges link+text pairs, so cell counts vary. Classify (picture-only → image, rich-text → copy, `<a>` → CTA) as `k811-hero.js` does.
- **Decorate defensively and idempotently** — tolerate omitted/extra/reordered cells; never throw on a null cell.
- **Scope every CSS selector to the block** (`.k811-hero .cta`), never bare (`.cta`). Never use `.{name}-container`/`.{name}-wrapper` (those are section classes).
- **Mobile-first CSS** with `min-width` breakpoints at 600 / 900 / 1200px. 2-space JS indent, 4-space CSS indent, Unix LF, `.js` import extensions, JSDoc on `decorate`.
- **Use `createOptimizedPicture`** from `aem.js` for images; `moveInstrumentation()` when moving nodes so UE overlays stay attached.
- **k811-* blocks:** call `initK811(block)` from `scripts/k811/k811-common.js` first — it marks `main.kotak811`, loads the design guide + Manrope once, and registers scroll-reveal. Reuse the shared IntersectionObserver instead of adding animation libraries.
- **Don't duplicate** near-identical blocks — check the existing 50 first; prefer a variant/model option unless dedicated fidelity is warranted (the k811 rationale).

## Anti-patterns
- ❌ Reading cells by index (`cells[2]`) instead of classifying by content.
- ❌ Bare or `-container`/`-wrapper` CSS selectors leaking styles page-wide.
- ❌ Non-idempotent decoration that breaks on re-run (Universal Editor re-decorates).
- ❌ Forking a shared block for one page's needs instead of a `k811-*` block or a variant.
- ❌ Adding an animation library when the ~2KB shared IntersectionObserver suffices.
- ❌ Editing `scripts/aem.js`, or hand-editing files under `content/`.

## Examples
```js
// blocks/k811-example/k811-example.js
import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811 } from '../../scripts/k811/k811-common.js';

/**
 * Decorates the k811-example block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  initK811(block); // marks main.kotak811, loads design guide, registers reveal

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    cells.forEach((cell) => {
      if (cell.querySelector('picture') && !cell.textContent.trim()) {
        cell.classList.add('k811-example-media');
      } else if (cell.querySelector('a')) {
        cell.classList.add('k811-example-cta');
      } else {
        cell.classList.add('k811-example-copy');
      }
    });
  });
}
```
```css
/* blocks/k811-example/k811-example.css — mobile-first, scoped */
.k811-example { display: grid; gap: 1rem; }
.k811-example .k811-example-cta a { display: inline-block; }
@media (min-width: 900px) {
    .k811-example { grid-template-columns: 1fr 1fr; }
}
```

## Validation checklist
- [ ] `blocks/{name}/{name}.js`, `.css`, `_{name}.json` present; lowercase-hyphenated name.
- [ ] Delivered DOM inspected via `…plain.html` before coding.
- [ ] Cells classified by content; missing/extra/reordered cells handled; idempotent.
- [ ] All CSS scoped to `.{name}`; no bare / `-container` / `-wrapper` selectors; mobile-first 600/900/1200.
- [ ] `createOptimizedPicture` for images; `moveInstrumentation()` on moved nodes; k811-* calls `initK811`.
- [ ] JSDoc on `decorate`; `.js` import extensions; `npm run lint` passes.
- [ ] Rendering verified in preview at mobile/tablet/desktop.
- [ ] If `_{name}.json` changed → `npm run build:json` run and aggregates committed.
