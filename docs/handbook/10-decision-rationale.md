# 10 · Decision Rationale — The "Why" Behind Every EDS Choice

A decision log for EDS engineering. Each entry states the **decision**, the **decision process** (the question you actually ask, the alternatives, the trade-off, the deciding factor), and a **worked example**. Use it when you're about to make a choice and want to make it *deliberately* rather than by habit.

> How to read an entry: **Decision → Alternatives considered → Deciding question → Why this wins → Example → When the answer flips.** The last line matters — most of these are defaults, not absolutes, and knowing when they invert is the real expertise.

---

## 1. Why a block instead of a "component"
**Decision:** express reusable componentry as an EDS **block** (`blocks/{name}/`), not a traditional AEM component (Java/HTL/dialog).

**Decision process:**
- *Alternatives:* (a) EDS block; (b) AEM Sites component (Sling Model + HTL + Granite dialog); (c) inline default content.
- *Deciding question:* what stack am I in, and does the content have a reusable shape?
- *Why block wins here:* this is an EDS project — there is no HTL/Sling/OSGi runtime, so (b) literally cannot execute. A block is the only componentry primitive: delivered semantic HTML transformed by `decorate()`, styled by scoped CSS, modeled by `_{block}.json`. It's code-split, edge-cached, and authored in Universal Editor.
- *When it flips:* if the content is free-form prose with no repeating/composite shape → not a block at all, use **default content** (entry 7-inverse below). If you were genuinely on AEM Sites with deep server-side integration, a component would be right — but that's a different repository.

**Example:**
```
❌ Wrong instinct: create a Java @Model + hero.html + hero dialog.
✅ EDS: blocks/hero/hero.js (decorate) + hero.css (scoped) + _hero.json (UE model).
```

---

## 2. Why a section
**Decision:** group a page's content into **sections** (bands between section breaks), one visual band per section.

**Decision process:**
- *Alternatives:* (a) one giant section; (b) a section per visual band; (c) a section per block.
- *Deciding question:* what is the unit of progressive loading and band-level styling?
- *Why (b) wins:* the platform loads the **first section eagerly** and the rest lazily — sections *are* the progressive-loading boundary. One giant section (a) forfeits that (everything becomes eager-ish or nothing splits cleanly); a section per block (c) over-fragments and complicates band styling. One band = one section aligns the loading model with the visual model.
- *When it flips:* a genuinely single-band page (e.g. a bare landing splash) is legitimately one section.

**Example:** hero (section 1, eager, holds LCP) · intro prose (section 2) · cards (section 3) · FAQ (section 4, `Section Metadata: style=grey`). Putting the hero in section 1 is a deliberate LCP decision (entry 8).

---

## 3. Why (Section) Metadata
**Decision:** apply band-level styling (background, spacing, width, theme) via **Section Metadata**, not per-element CSS; set page-level SEO via **page metadata**.

**Decision process:**
- *Alternatives:* (a) hardcode band styling in block CSS; (b) Section Metadata.
- *Deciding question:* who needs to control this, and is it presentation or content?
- *Why (b) wins:* band styling is a *presentation* choice authors should control without a developer; Section Metadata exposes it as an authorable knob and keeps block CSS focused on the block's internals. Hardcoding (a) couples a reusable block to one page's background and removes author control. For page metadata: `helix-query.yaml` only indexes `<meta>` into `query-index.json`, which feeds the sitemap — so metadata is the *mechanism* by which SEO and listings work, not decoration.
- *When it flips:* styling intrinsic to the block (its own card radius) belongs in block CSS, not metadata.

**Example:**
```
✅ Section Metadata → style: grey   (author toggles the band background)
❌ .k811-faq { background: grey }    (locks every FAQ everywhere to grey)
```

---

## 4. Why a fragment
**Decision:** author content reused across pages **once as a fragment**, referenced via the `fragment` block.

**Decision process:**
- *Alternatives:* (a) copy the content into each page; (b) one fragment referenced everywhere.
- *Deciding question:* is this edited-together content used on more than one page?
- *Why (b) wins:* duplication guarantees drift — the disclaimer updated on 30 pages, forgotten on the 31st. A fragment is a single source of truth; edit once, propagate everywhere. It also shrinks authoring effort.
- *When it flips:* one-off page content should be authored inline — a fragment adds indirection with no reuse payoff.

**Example:** a regulatory disclaimer authored at `/fragments/disclaimer`, referenced by the `fragment` block on every product page. Legal changes it once.

---

## 5. Why Universal Editor
**Decision:** author with **Universal Editor** when content is visually composed and benefits from in-context WYSIWYG editing.

**Decision process:**
- *Alternatives:* (a) Universal Editor; (b) Document Authoring.
- *Deciding question:* is the author arranging *visual blocks with fields*, or writing *long-form text at volume*?
- *Why UE wins for composed pages:* landing/campaign/marketing pages are arrangements of blocks with typed fields (hero image, CTA, layout variant). UE's live preview + property panel (driven by `_{block}.json`) lets marketers arrange and see results immediately. This is why decoration must preserve instrumentation (`moveInstrumentation()`) — it's what keeps those overlays attached.
- *When it flips:* high-volume text (hundreds of articles) → Document Authoring (entry 6). **Delivery is EDS either way** — this is an authoring-ergonomics decision, not a delivery one.

**Example:** a campaign landing page with a hero, a 3-up feature grid, and a CTA band → UE, so the marketer visually tweaks arrangement and copy in context.

---

## 6. Why Document Authoring
**Decision:** author with **Document Authoring** when content is high-volume, text-heavy, and document-shaped.

**Decision process:**
- *Alternatives:* (a) Universal Editor; (b) Document Authoring.
- *Deciding question:* would assembling this in a visual block editor be slower than writing it as a document?
- *Why DA wins for text at volume:* blogs, articles, support KB, and policies are prose with occasional structured blocks (expressed as document tables). Editing 500 articles in a document (Word/gdocs) model is far faster than composing blocks visually. Authors work in a familiar tool at scale.
- *When it flips:* visually-composed marketing pages → UE. Again, **EDS delivers both** — don't conflate authoring surface with delivery platform.

**Example:** a 400-post blog migrated to Document Authoring — authors keep writing in documents; the platform renders prose as default content and any `Cards`/`Table` tables as blocks.

---

## 7. Why split blocks (per-block CSS/JS)
**Decision:** keep each block's CSS/JS in its own `blocks/{name}/` folder and rely on the platform's per-block code-splitting; don't centralize block styles/scripts.

**Decision process:**
- *Alternatives:* (a) one global stylesheet/script for all blocks; (b) per-block files (code-split).
- *Deciding question:* should a page download code for blocks it doesn't use?
- *Why (b) wins:* the platform loads a block's CSS/JS **only when that block appears on the page**. A page with 3 blocks downloads 3 blocks' worth of code, not all 50. Centralizing (a) forces every visitor to download every block's code on every page — directly harming LCP/TBT and defeating the platform's biggest built-in performance feature.
- *When it flips:* genuinely global, LCP-critical rules go in `styles/styles.css`; genuinely shared logic goes in a `scripts/` module (imported only by blocks that need it). The rule is "don't globalize block-specific code," not "never share anything."

**Example:**
```
✅ blocks/cards/cards.css loads only on pages with a cards block.
❌ styles/styles.css holding every block's styles → shipped to every page.
```

---

## 8. Why lazy load
**Decision:** load everything not required for LCP **lazily** (or in the delayed phase); eager-load only the first section and the LCP image.

**Decision process:**
- *Alternatives:* (a) load everything upfront; (b) three-phase (eager LCP-only → lazy → delayed).
- *Deciding question:* does the user need this *for the first meaningful paint*?
- *Why (b) wins:* LCP is decided by how fast the critical path completes. Every byte loaded eagerly that LCP doesn't need (below-the-fold images, header/footer, analytics) *delays* LCP by competing for the network and main thread. Deferring them makes the critical path minimal without removing any functionality — the deferred work simply runs after first paint. This is the single largest performance lever in EDS.
- *When it flips:* the LCP image itself must be **eager + preloaded** (lazy-loading it would be the worst possible choice). "Lazy by default, eager only for LCP."

**Example:**
```
✅ LCP hero: <img loading="eager" fetchpriority="high"> + media-scoped preload.
✅ Below-fold images: loading="lazy".  ✅ Analytics/chat: delayed.js.
❌ loading="lazy" on the hero → LCP tanks.
```

---

## 9. Why `decorate()`
**Decision:** implement all block behavior in a default-exported `decorate(block)` that transforms the delivered DOM in place — not a server template, not a client-side framework component.

**Decision process:**
- *Alternatives:* (a) server-side template (HTL); (b) a JS framework component (React/Vue) that re-renders; (c) `decorate(block)` transforming delivered DOM.
- *Deciding question:* what produces the markup, and what's the lightest way to enhance it?
- *Why (c) wins:* the AEM edge backend already emits semantic HTML — the content exists in the DOM at load. (a) doesn't exist in EDS (no HTL runtime). (b) would discard the delivered DOM and re-render it, shipping a framework runtime (KBs of JS), hurting performance, and often breaking the SEO/a11y of the already-good server markup. `decorate()` *enhances* the existing DOM with the minimum JS — no framework tax, LCP-friendly, and the delivered content is already crawlable before JS runs.
- *When it flips:* genuinely app-like interactivity (a configurator) may justify heavier client logic — but scoped inside a block, loaded lazily, still enhancing not replacing.

**Example:**
```js
// enhance delivered DOM, don't re-render it
export default function decorate(block) {
  const cells = [...block.children].map((r) => r.querySelector(':scope > div') || r);
  const img = cells.find((c) => c.querySelector('picture, img'));
  const cta = cells.find((c) => c.querySelector('a'));
  const inner = document.createElement('div');
  if (img) inner.append(img); if (cta) inner.append(cta);
  block.textContent = ''; block.append(inner); // idempotent
}
```

---

## 10. Why avoid nested divs
**Decision:** produce **flat, semantic** markup in `decorate()`; add a wrapper only when it earns its place (a layout container, a labelled region). Avoid gratuitous `<div>` nesting.

**Decision process:**
- *Alternatives:* (a) wrap everything in nested `<div>`s for styling hooks; (b) minimal semantic structure with wrappers only where needed.
- *Deciding question:* does this element carry meaning or a real layout responsibility — or is it just a hook I could get another way?
- *Why (b) wins:* deep `<div>` nesting bloats the DOM (slower parse/style/paint, worse INP), buries semantics (screen readers and crawlers see structure, not `<div>` soup), and creates brittle CSS descendant chains. Modern CSS (Grid/Flex + scoped classes on semantic elements) removes the need for most wrapper divs. Flatter DOM = faster, more accessible, more maintainable.
- *When it flips:* one wrapper for a flex/grid container, or a `<section>`/`<nav>`/`<figure>` that adds real semantics, is correct — the rule targets *gratuitous* nesting, not all structure.

**Example:**
```html
✅ <figure class="k811-cta-media"><picture>…</picture></figure>
   <div class="k811-cta-inner"> … </div>            <!-- one purposeful layout wrapper -->

❌ <div class="wrap"><div class="outer"><div class="inner"><div class="content">
     <div class="text"><h2>…</h2></div></div></div></div></div>   <!-- 5 divs, 0 meaning -->
```

---

## 11. Why classify cells by content, not index
**Decision:** in `decorate()`, find cells by what they contain (`find(c => c.querySelector('picture'))`), never by position (`cells[1]`).

**Decision process:**
- *Alternatives:* (a) positional access; (b) content classification.
- *Deciding question:* is the cell order/count guaranteed stable?
- *Why (b) wins:* it is **not** stable — Universal Editor **field-collapsing** merges link+text field pairs, so the rendered cell count varies with which optional fields the author filled. Positional access works in the demo (all fields present) and breaks in production (author omits one → indices shift → wrong cell or crash). Content classification is invariant to order and omissions.
- *When it flips:* never, in practice — this is the closest thing to an absolute in block code.

**Example:**
```js
❌ const title = cells[1].textContent;     // shifts when the image field is empty
✅ const title = cells.find((c) => c.querySelector('h1,h2,h3') )?.textContent;
```

---

## 12. Why idempotent decoration
**Decision:** write `decorate()` so running it twice yields the same DOM (rebuild deterministically: `block.textContent=''; block.append(inner)`).

**Decision process:**
- *Alternatives:* (a) mutate incrementally (append/wrap on top of existing); (b) rebuild deterministically.
- *Deciding question:* can `decorate` run more than once on the same block?
- *Why (b) wins:* **yes it can** — Universal Editor re-decorates during in-context editing. Incremental mutation (a) double-wraps or duplicates on the second pass, corrupting the live editing experience. Deterministic rebuild is safe on every pass.
- *When it flips:* never for UE-authored blocks; even otherwise, idempotency is cheap insurance.

**Example:**
```js
✅ block.textContent = ''; block.append(inner);   // same result every run
❌ block.append(inner);                            // second run duplicates content
```

---

## 13. Why `createOptimizedPicture` instead of raw `<img>`
**Decision:** render content images with `createOptimizedPicture` from `aem.js`.

**Decision process:**
- *Alternatives:* (a) raw `<img src>`; (b) `createOptimizedPicture`.
- *Deciding question:* should every device download the same one image?
- *Why (b) wins:* it emits a responsive `<picture>` with WebP sources at multiple widths; the edge serves the smallest suitable variant. Raw `<img>` (a) ships one oversized original to phones and desktops alike — wasted bytes, worse LCP. It's also the platform's supported path (integrates with edge optimization).
- *When it flips:* tiny fixed-size decorative icons/SVGs may not need it — but photographic/content images always do.

**Example:**
```js
✅ createOptimizedPicture(src, alt, false, [{ media:'(min-width:900px)', width:'1200' }, { width:'750' }]);
❌ `<img src="${src}">`  // one 2400px JPEG to every device
```

---

## 14. Why never modify `scripts/aem.js`
**Decision:** treat `scripts/aem.js` as read-only; extend via `scripts/scripts.js` and block/`scripts/` modules.

**Decision process:**
- *Alternatives:* (a) patch `aem.js` for a fix/feature; (b) build on top of it.
- *Deciding question:* is this file *mine* or the *platform's*?
- *Why (b) wins:* `aem.js` is the platform core (decoration engine, `createOptimizedPicture`, `loadSection`), maintained upstream and updated by the boilerplate. Local edits (a) get overwritten on update and can break decoration site-wide — an invisible, expensive failure. The sanctioned extension points (`scripts.js`, shared modules, blocks) are yours to change safely.
- *When it flips:* never in a project repo. (Contributing upstream to the boilerplate is a different context.)

**Example:** need a shared helper? add `scripts/k811/k811-common.js` (as this repo does) — don't add a function to `aem.js`.

---

## 15. Why generate aggregates instead of hand-editing them
**Decision:** edit `_{block}.json` / `models/_*.json` and run `npm run build:json`; never hand-edit `component-definition.json` / `component-models.json` / `component-filters.json`.

**Decision process:**
- *Alternatives:* (a) hand-edit the aggregate; (b) edit the partial + regenerate.
- *Deciding question:* is this file source or build output?
- *Why (b) wins:* the aggregates are *generated* by `merge-json-cli` from the partials; they're build output. CI runs `build:json` then `git diff --exit-code` on the three aggregates — a hand-edit (a) that diverges from the partials fails the build. Editing the source-of-truth partial keeps them in sync.
- *When it flips:* never — the CI gate makes it non-negotiable.

**Example:**
```
✅ edit blocks/hero/_hero.json → npm run build:json → commit all four files.
❌ edit component-models.json directly → CI JSON-sync gate fails.
```

---

## 16. Why scope every CSS selector to the block
**Decision:** prefix every block selector with `.{name}` (`.k811-hero .cta`), never bare (`.cta`), never `-container`/`-wrapper`.

**Decision process:**
- *Alternatives:* (a) bare/global selectors; (b) block-scoped selectors.
- *Deciding question:* where will this CSS be loaded, and what could it hit?
- *Why (b) wins:* block CSS is code-split and loaded whenever the block appears on *any* page. A bare `.cta` (a) then styles every `.cta` site-wide — a cross-block bug that's painful to trace and that couples unrelated blocks. Scoping confines the rule to its block. `-container`/`-wrapper` names are generated for *sections*; targeting them couples the block to section internals.
- *When it flips:* genuinely global rules live in `styles/styles.css`/`lazy-styles.css`, not in a block file.

**Example:**
```css
✅ .k811-hero .cta { … }
❌ .cta { … }              /* leaks to every CTA on the site */
❌ .k811-hero-wrapper { … } /* section-owned class */
```

---

## 17. Why sanitize before `innerHTML`
**Decision:** run authored/remote HTML through `scripts/dompurify.min.js` before assigning `innerHTML`.

**Decision process:**
- *Alternatives:* (a) assign authored HTML directly; (b) sanitize first; (c) build DOM nodes instead.
- *Deciding question:* could this string contain script/unsafe markup, and is it public+CSP-governed?
- *Why (b)/(c) win:* EDS ships public client code under a strict CSP. Direct assignment (a) of authored/remote HTML is an XSS vector and a CSP violation. Sanitizing (b) removes dangerous markup; building nodes (c) avoids the risk entirely and is preferred when practical.
- *When it flips:* if you fully control and construct the string from safe primitives, node-building is cleaner than sanitize-then-inject.

**Example:**
```js
import DOMPurify from '../../scripts/dompurify.min.js';
el.innerHTML = DOMPurify.sanitize(remoteHtml);   // never assign raw authored HTML
```

---

## 18. Why measure on the preview, not localhost
**Decision:** run PSI/verification against the branch **preview URL**, not `localhost:3000`.

**Decision process:**
- *Alternatives:* (a) trust localhost; (b) measure on preview.
- *Deciding question:* does localhost reproduce real edge delivery?
- *Why (b) wins:* the preview reflects the real edge pipeline — optimized image delivery, CSP, caching, and CDN behavior — that localhost approximates but doesn't replicate. A page that scores 100 locally can regress on preview due to real asset delivery. PSI is only meaningful against the delivered artifact.
- *When it flips:* localhost is fine for functional/DOM checks (Playwright `snapshot`/`evaluate`); it's *performance* numbers that require the preview.

**Example:** `snapshot`/`evaluate` on localhost during dev; PSI on `https://{branch}--kotakbank--xeragobiz.aem.page/{path}` before the PR.

---

## How to apply this document
Before committing an EDS decision, find (or reason through) its entry: name the alternatives, ask the deciding question, and check whether you're in the *default* case or the *flipped* one. Writing the "why" down — in code comments, PR descriptions, and reviews — is itself a recommended practice: EDS frequently rewards the non-obvious choice (default content over a block, enhance over re-render, lazy over eager), and an unexplained correct decision reads as a mistake to the next engineer. Make the reasoning visible.
