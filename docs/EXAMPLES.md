# Examples

**Real, working code from this repository**, annotated. Templates (`docs/TEMPLATES.md`) show the skeleton; this shows how the project actually applies it. Everything below is copied from live files on the `k811-page-migration` branch — study these before writing new blocks.

> **Stack:** AEM Edge Delivery Services (xwalk). The examples are the canonical patterns; imitate them.

---

## Example 1 — A complete, simple k811 block (`blocks/k811-cta`)

### `k811-cta.js` (verbatim, annotated)
```js
import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/**
 * CTA Banner — rounded dark "call us" band.
 * Rows (in model order): image, title. Either may be omitted.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  initK811(block);                                   // (1) k811 runtime first
  const rows = [...block.children];
  const cellOf = (r) => (r ? r.querySelector(':scope > div') || r : null);

  const cells = rows.map(cellOf).filter(Boolean);
  const imageCell = cells.find((c) => c.querySelector('picture, img'));   // (2) classify by CONTENT
  const img = imageCell ? imageCell.querySelector('img') : null;
  const titleCell = cells.find((c) => c !== imageCell && c.textContent.trim());  // (3) defensive: first text cell
  const title = titleCell ? titleCell.textContent.trim() : '';

  const inner = document.createElement('div');
  inner.className = 'k811-cta-inner';

  if (title) {                                        // (4) tolerate missing title
    const text = document.createElement('div');
    text.className = 'k811-cta-text';
    const h = document.createElement('h2');
    h.className = 'k811-cta-title';
    const safe = title.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));  // (5) escape before innerHTML
    h.innerHTML = safe.replace(/(\d{4}\s?\d{4})/, '<span class="k811-cta-highlight">$1</span>');
    text.append(h);
    inner.append(text);
  }

  if (img) {                                          // (6) tolerate missing image
    const media = document.createElement('div');
    media.className = 'k811-cta-media';
    media.append(createOptimizedPicture(img.src, img.getAttribute('alt') || '', false, [{ width: '750' }]));  // (7) optimized picture
    inner.append(media);
  }

  block.textContent = '';                             // (8) idempotent rebuild
  block.append(inner);
  revealOnScroll(inner);                              // (9) transform/opacity reveal
}
```
**What to learn:** (1) `initK811` first for k811 blocks. (2)(3) cells found by content, never `cells[0]`/`cells[1]`. (4)(6) every field guarded — the block renders correctly if the author omits either. (5) authored text is escaped before `innerHTML` (this block builds HTML from a regex, so it hand-escapes; when injecting *rich* authored HTML, use `scripts/dompurify.min.js` instead). (7) images via `createOptimizedPicture`. (8) `block.textContent = ''` then rebuild keeps it idempotent. (9) motion via the shared observer.

### `k811-cta.css` (excerpt, annotated)
```css
/* CTA Banner … all selectors scoped to .k811-cta */
.k811-cta {
  max-width: 1040px;
  margin: 0 auto;
  border-radius: 20px;
  background: #000;
}
.k811-cta .k811-cta-inner {           /* scoped, mobile-first: column by default */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 40px 24px;
}
.k811-cta .k811-cta-title .k811-cta-highlight {
  color: var(--k811-link, #d1101f);   /* uses the design token, not a raw hex */
}
@media (width < 900px) { /* mobile-specific overrides */ }
```
**What to learn:** every rule is prefixed `.k811-cta`; base styles are mobile (column), desktop is the enhancement; brand red comes from the `--k811-link` token.

---

## Example 2 — LCP preload for an art-directed hero (`blocks/k811-hero/k811-hero.js`)
```js
// Emit media-scoped <link rel="preload" as="image"> for the hero's WebP sources
function preloadPicture(picture) {
  const links = [];
  picture.querySelectorAll('source[type="image/webp"][media]').forEach((source) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.setAttribute('imagesrcset', source.getAttribute('srcset'));
    link.setAttribute('media', source.getAttribute('media'));
    link.setAttribute('type', 'image/webp');
    link.setAttribute('fetchpriority', 'high');
    links.push(link);
  });
  if (links.length) document.head.append(...links);
}
```
**What to learn:** the LCP image is preloaded with a **media-scoped** link so the browser fetches exactly one art-directed source; the rendered `<img>` also gets `fetchpriority="high"`. This is the required pattern for any above-the-fold hero image. All *other* images use `loading="lazy"`.

---

## Example 3 — Using a shared service (eligibility modal)
Four blocks (`k811-hero`, `sticky-cta`, `cc-steps`, `cc-hero`) wire a CTA to the shared modal instead of each implementing one:
```js
import openEligibilityModal from '../../scripts/eligibility-modal.js';

link.addEventListener('click', (e) => {
  e.preventDefault();
  openEligibilityModal(link.href);   // shared modal, one implementation
});
```
**What to learn:** reuse shared modules (`scripts/*.js`) for cross-block behavior; don't reimplement a modal per block. See `docs/REVERSE_ENGINEERED.md` §6 for all shared exports.

---

## Example 4 — A real authoring model (`blocks/k811-feature/_k811-feature.json`)
```json
{
  "definitions": [{
    "title": "K811 Feature", "id": "k811-feature",
    "plugins": { "xwalk": { "page": {
      "resourceType": "core/franklin/components/block/v1/block",
      "template": { "name": "K811 Feature", "model": "k811-feature" }
    }}}
  }],
  "models": [{
    "id": "k811-feature",
    "fields": [
      { "component": "reference", "valueType": "string", "name": "image", "label": "Video Thumbnail", "multi": false },
      { "component": "richtext", "name": "text", "value": "", "label": "Text", "valueType": "string" },
      { "component": "text", "valueType": "string", "name": "video", "label": "Video Link (URL)" }
    ]
  }],
  "filters": []
}
```
**What to learn:** author-friendly `label`s ("Video Thumbnail", not "image"); correct `component` per field; `resourceType: core/franklin/components/block/v1/block`; `filters: []` when the block has no child-insertion rules. Edit this, then `npm run build:json`.

---

## Example 5 — Delayed-phase, no-authoring feature (`scripts/delayed.js`)
```js
import initSentry from './sentry.js';

function initBackToTop() {
  if (document.querySelector('.back-to-top')) return;   // idempotent
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');        // accessible
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  // …docks into .help-links when present, else floats and reveals after 400px scroll
}
```
**What to learn:** site-wide chrome that isn't authored and isn't LCP-critical belongs in the **delayed phase** — it never blocks first paint. Note the idempotency guard and the `aria-label`.

---

## Anti-example — what the same CTA would look like done wrong
```js
// ❌ DON'T
export default function decorate(block) {
  const title = block.children[1].children[0].textContent;      // index-based → breaks on field-collapsing
  const img = block.children[0].querySelector('img');           // assumes order → breaks if image omitted
  block.innerHTML = `<div class="inner"><h2>${title}</h2></div>`; // unsanitized + unscoped class + wipes instrumentation
}
```
```css
/* ❌ DON'T */
.inner { display: flex; }          /* bare selector leaks page-wide */
.k811-cta-wrapper { padding: 40px; } /* -wrapper is a section class, off-limits */
h2 { color: #d1101f; }             /* unscoped + magic hex instead of --k811-link */
```
**Why wrong:** index access breaks under Universal Editor field-collapsing; no guards → crashes when a field is omitted; unsanitized `${title}` is an XSS/CSP risk; bare/`-wrapper` selectors leak; magic hex ignores the token system. Compare against Example 1. Full catalog: `docs/COMMON_MISTAKES.md`.
