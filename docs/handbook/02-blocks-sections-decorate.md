# 02 · Blocks, Sections & the Decorate Pattern

## Sections
A **section** is a group of blocks and default content between section breaks; it carries `.section` and optional Section Metadata (background, spacing, width).

- **Recommendation:** map one visual band to one section; use Section Metadata for band-level styling, not per-element CSS.
  **Why:** sections are the platform's unit of progressive loading (the first section is eager, the rest lazy) and of author-controlled styling. Putting band styling in metadata keeps it authorable and keeps block CSS focused on the block.

## Blocks
A **block** is `blocks/{name}/{name}.js` (default `decorate(block)`), `{name}.css` (scoped), `_{name}.json` (Universal Editor model). It's the reusable component unit.

- **Recommendation:** design the content model (rows/cells/fields) *before* writing code.
  **Why:** the model is the contract between author and code; changing it later breaks already-authored content. Decide the interface first.
- **Recommendation:** check the existing block palette before creating a new block; prefer a variant/model option.
  **Why:** fewer blocks = less code, smaller CSS surface, consistent authoring. This repo has 50 blocks, not 500, because of aggressive reuse.

## The decorate pattern (the heart of EDS)
`decorate(block)` receives the block's delivered DOM and transforms it in place.

```js
export default function decorate(block) {
  const rows = [...block.children];
  const cellOf = (r) => r.querySelector(':scope > div') || r;
  const cells = rows.map(cellOf);

  // classify by CONTENT, not index:
  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const ctaCell   = cells.find((c) => c.querySelector('a'));
  const copyCell  = cells.find((c) => c !== imageCell && c.textContent.trim() && !c.querySelector('a'));

  // build, then replace idempotently
  const inner = document.createElement('div');
  // …append classified content…
  block.textContent = '';
  block.append(inner);
}
```

### Rule 1 — classify cells by content, never by index
- **Why:** Universal Editor **field-collapsing** merges link+text field pairs, so the rendered cell count varies. `cells[1]` works in the demo and breaks the moment an author omits an optional field. Content classification (`find(c => c.querySelector('picture'))`) is stable. This is the single most important block-correctness rule.

### Rule 2 — decorate defensively
- **Why:** authors omit optional fields; guard every one (`if (img) …`) and never throw on a null cell. A block that crashes on missing content breaks the whole page render.

### Rule 3 — decorate idempotently
- **Why:** Universal Editor re-runs decoration during editing. If a second pass corrupts the DOM (double-wraps, duplicates), in-context editing breaks. Rebuild deterministically (`block.textContent = ''; block.append(...)`).

### Rule 4 — preserve instrumentation
- **Recommendation:** use `moveInstrumentation()` (from `scripts.js`) when relocating nodes.
  **Why:** it carries the `data-aue-*` attributes Universal Editor uses to attach editing overlays. Move a node without it and the author can no longer edit that content in place.

### Rule 5 — images via `createOptimizedPicture`
- **Why:** it emits responsive WebP `<picture>` the edge optimizes; hand-written `<img src>` for content images loses that and risks LCP. See [04](04-loading-and-performance.md).

## Block file structure & naming
- Lowercase-hyphenated folder/files; migration blocks use a project prefix (`k811-`).
  **Why:** the platform maps a block's name to its folder to code-split its CSS/JS; the convention is load-bearing, not cosmetic.

## Validation checklist — blocks/sections/decorate
- [ ] One band = one section; band styling via Section Metadata.
- [ ] Content model designed first; reuse checked before new block.
- [ ] Cells classified by content; defensive; idempotent.
- [ ] `moveInstrumentation()` on moved nodes; images via `createOptimizedPicture`.
- [ ] Files lowercase-hyphenated; `_{block}.json` present (+ `build:json`).
