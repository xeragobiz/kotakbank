# Templates

Copy-paste **scaffolding templates** for the artifacts you create in this repo. Replace every `{{PLACEHOLDER}}`. These are skeletons; for full rules see `docs/CODING_STANDARDS.md`, for worked examples see `docs/EXAMPLES.md`, and for real APIs see `docs/REVERSE_ENGINEERED.md`.

> **Stack:** AEM Edge Delivery Services (xwalk). Vanilla JS/CSS/JSON. No Java/HTL/OSGi/SCSS/Dispatcher — these templates are the *only* component shapes this repo uses.

---

## 1. Block JavaScript — `blocks/{{name}}/{{name}}.js`
```js
import { createOptimizedPicture } from '../../scripts/aem.js';
import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/**
 * {{Human-readable block name}} — {{one-line description}}.
 * Rows (in model order): {{row1}}, {{row2}}. Any may be omitted.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  initK811(block); // k811 blocks only: marks main.kotak811, loads design guide, registers reveal

  const rows = [...block.children];
  const cellOf = (r) => (r ? r.querySelector(':scope > div') || r : null);
  const cells = rows.map(cellOf).filter(Boolean);

  // Classify by CONTENT, never by index (Universal Editor field-collapsing varies counts).
  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const img = imageCell ? imageCell.querySelector('img') : null;
  const copyCell = cells.find((c) => c !== imageCell && c.textContent.trim() && !c.querySelector('a'));
  const ctaCell = cells.find((c) => c.querySelector('a'));

  const inner = document.createElement('div');
  inner.className = '{{name}}-inner';

  if (copyCell) {
    const copy = document.createElement('div');
    copy.className = '{{name}}-copy';
    copy.append(...copyCell.childNodes);
    inner.append(copy);
  }
  if (img) {
    const media = document.createElement('div');
    media.className = '{{name}}-media';
    media.append(createOptimizedPicture(img.src, img.getAttribute('alt') || '', false, [{ width: '750' }]));
    inner.append(media);
  }
  if (ctaCell) {
    const cta = document.createElement('div');
    cta.className = '{{name}}-cta';
    cta.append(...ctaCell.childNodes);
    inner.append(cta);
  }

  block.textContent = '';
  block.append(inner);
  revealOnScroll(inner); // transform/opacity reveal; respects prefers-reduced-motion
}
```
> Not a k811 block? Drop the k811 imports/`initK811`/`revealOnScroll`. Never read `cells[2]` by index. Never throw on a missing cell.

---

## 2. Block CSS — `blocks/{{name}}/{{name}}.css`
```css
/* {{Block name}} — {{purpose}}. Mobile-first; all selectors scoped to .{{name}}. */

.{{name}} {
    max-width: var(--k811-content-max, 1120px);
    margin: 0 auto;
    padding: var(--k811-section-pad-y, 48px) 24px;
}

.{{name}} .{{name}}-inner {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.{{name}} .{{name}}-copy { color: var(--k811-text, #222); }
.{{name}} .{{name}}-media img { display: block; max-width: 100%; height: auto; }

/* tablet */
@media (min-width: 900px) {
    .{{name}} .{{name}}-inner { flex-direction: row; align-items: center; }
}

/* desktop */
@media (min-width: 1200px) {
    .{{name}} { padding-inline: 0; }
}
```
> Scope every selector to `.{{name}}`. Never use `.{{name}}-container`/`.{{name}}-wrapper`. Animate transform/opacity only. Use `styles/kotak811.css` tokens, not magic numbers.

---

## 3. Universal Editor model — `blocks/{{name}}/_{{name}}.json`
```json
{
  "definitions": [
    {
      "title": "{{Human Title}}",
      "id": "{{name}}",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": { "name": "{{Human Title}}", "model": "{{name}}" }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "{{name}}",
      "fields": [
        { "component": "reference", "valueType": "string", "name": "image", "label": "{{Image label}}", "multi": false },
        { "component": "richtext", "name": "text", "value": "", "label": "{{Text label}}", "valueType": "string" },
        { "component": "aem-content", "name": "ctaLink", "label": "{{CTA link label}}" },
        { "component": "text", "valueType": "string", "name": "ctaText", "label": "{{CTA text label}}" }
      ]
    }
  ],
  "filters": []
}
```
> After saving: `npm run build:json`. Never hand-edit the aggregate `component-*.json`. Field `component` ∈ `reference`, `richtext`, `text`, `select`, `aem-content`.

---

## 4. Block variant (no new block)
Add a `select` field to the model and key CSS off the class the author picks:
```json
{ "component": "select", "name": "layout", "label": "Layout", "valueType": "string",
  "options": [ { "name": "Left", "value": "left" }, { "name": "Right", "value": "right" } ] }
```
```css
.{{name}}.right .{{name}}-inner { flex-direction: row-reverse; }
```
> Prefer a variant over a near-duplicate block. Check the existing 50 blocks first.

---

## 5. Shared ES module — `scripts/{{module}}.js`
```js
/**
 * {{Module}} — shared logic used by multiple blocks.
 * @param {Element} el target element
 */
export function {{fnName}}(el) {
  // small, dependency-free; import with .js extensions from blocks
}

export default function {{defaultFn}}(arg) {
  // default export pattern (cf. openEligibilityModal, initSentry)
}
```

---

## 6. Import page template — entry in `tools/importer/page-templates.json`
```json
{
  "name": "{{template-name}}",
  "urls": ["https://www.example.com/{{path}}"],
  "description": "{{what pages of this shape look like}}",
  "blocks": []
}
```
> `blocks[]` starts empty; the block-mapping step fills DOM selectors. Never hand-author `content/`.

---

## 7. PR description
```md
## What & why
{{summary}}

## Preview
https://{{branch}}--kotakbank--xeragobiz.aem.page/{{path}}

## Validation
- [ ] npm run lint + build:json (aggregates in sync)  - [ ] gh pr checks green
- [ ] preview verified mobile/tablet/desktop           - [ ] a11y + CWV (PSI target 100)
- [ ] security (CSP, sanitize, no secrets)             - [ ] authoring (UE) verified
- [ ] Definition of Done complete (AGENTS.md)
```
> The preview link is **mandatory** — PRs without it are rejected.

---

## 8. Git commit message
```
{{imperative summary, <=72 chars}}

{{why, wrapped}}

Co-Authored-By: {{name}} <{{email}}>
```
