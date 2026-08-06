# Lesson 08 — Universal Editor & Component Models (xwalk)

> Tier 3 · Authoring & UE · Prerequisites: Lessons 02–05

## 1. Theory

**Universal Editor (UE)** is Adobe's WYSIWYG editor that lets authors edit the *real, rendered page* in place. An EDS project wired for UE is called a **crosswalk ("xwalk")** project. Content is authored against an AEM author instance (mounted via `fstab.yaml`) and delivered through the same edge pipeline you already know.

For UE to know *what* is editable and *how*, every block ships a JSON **component definition + model** (`_<name>.json`). This is the EDS answer to "AEM component dialogs," but it is plain JSON, not a Java/XML dialog.

Three JSON concepts:
- **Definition** — declares the block to UE (its title, group, and the `xwalk` plugin `resourceType`). This is what makes it appear in the "add component" list.
- **Model** — the **fields** an author edits (text, richtext, reference/image, select, aem-content, boolean, etc.) and their mapping to the block's cells.
- **Filters** — which components are allowed inside which containers (e.g. what can go in a section or a container block).

## 2. Architecture

### Traditional AEM → EDS mapping (memorize this)

| Traditional AEMaaCS | EDS / xwalk equivalent |
|---|---|
| HTL / Sightly template | JS `decorate()` transforming delivered HTML |
| Sling Model | Block `decorate(block)` function |
| Component dialog (cq:dialog / XML) | `_<name>.json` **model** (fields) |
| Component definition (`.content.xml`) | `_<name>.json` **definition** |
| Allowed components / parsys policy | `_<name>.json` **filters** |
| OSGi service/config | ES module in `scripts/` + `*.yaml`/`head.html` |
| Dispatcher/cache | Edge CDN + `.hlxignore` + `head.html` CSP |

### The JSON build/merge flow

```
blocks/hero/_hero.json          ┐
blocks/cards/_cards.json        │  merge-json-cli
models/_component-text.json     ├─ npm run build:json ─►  component-definition.json
…every partial…                 │                          component-models.json
                                ┘                          component-filters.json  (AGGREGATES)
```

CI (`main.yaml`) regenerates the aggregates and runs `git diff --exit-code` on them — a stale aggregate **fails the build**. Husky pre-commit does the same locally for staged partials.

## 3. Engineering rationale

**Why JSON models instead of Java dialogs?** No JVM, no build. JSON is declarative, diffable, reviewable in a PR, and consumable directly by UE. It keeps the "authoring contract" in the same repo as the code that honors it, co-located per block.

**Why partials + generated aggregates?** UE wants one big file; humans want small local files. Partials give co-location and clean diffs; the merge step produces what UE needs; the CI gate guarantees they never drift. This is the same rationale as any codegen-with-a-freshness-check.

**Why `moveInstrumentation`?** UE injects data attributes tying DOM nodes to author fields. Your `decorate` moves nodes around; without carrying those attributes, the WYSIWYG overlay detaches and the author can no longer click-to-edit that element. `moveInstrumentation(src, dest)` transfers them.

**Why filters?** To keep authoring sane: authors should only be offered components that make sense in a given container. Filters encode that policy declaratively.

## 4. Examples

**A minimal `_promo.json`:**
```json
{
  "definitions": [
    {
      "title": "Promo",
      "id": "promo",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": { "name": "Promo", "model": "promo" }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "promo",
      "fields": [
        { "component": "reference", "name": "image", "label": "Image", "valueType": "string" },
        { "component": "richtext", "name": "text", "label": "Body", "valueType": "string" },
        { "component": "text", "name": "ctaText", "label": "CTA label", "valueType": "string" },
        { "component": "aem-content", "name": "ctaLink", "label": "CTA link", "valueType": "string" }
      ]
    }
  ],
  "filters": []
}
```

**Preserving instrumentation in the matching `promo.js`:**
```js
import { moveInstrumentation } from '../../scripts/scripts.js';
export default function decorate(block) {
  const figure = document.createElement('figure');
  const imgCell = block.querySelector(':scope > div > div');
  if (imgCell) { moveInstrumentation(imgCell, figure); figure.append(...imgCell.childNodes); }
  block.prepend(figure);
}
```

## 5. Hands-on exercises

1. **Map the concepts.** Without looking, fill in the EDS equivalent for: HTL template, Sling Model, component dialog, allowed-components policy, OSGi config.
2. **Author a model.** Write `_testimonial.json` with fields: author photo (reference), quote (richtext), name (text), role (text). Include a definition and empty filters.
3. **Regenerate.** Run `npm run build:json`; confirm the three aggregates changed and would be committed. Explain what CI checks.
4. **Instrumentation test.** In a block that wraps a cell in new markup, add `moveInstrumentation` and describe how you'd verify editability in UE.
5. **Filter design.** For a `carousel` container, write a filter allowing only `carousel-slide` children.

## 6. Common mistakes

- **Hand-editing the aggregate `component-*.json`** — overwritten and flagged by CI.
- **Forgetting `npm run build:json`** after a partial change — CI fails.
- **Omitting `moveInstrumentation`** when moving nodes — breaks click-to-edit.
- **Wrong `resourceType`** in the definition — block won't register in UE.
- **valueType/component mismatches** — field won't bind correctly.

## 7. Review questions

1. What are the three roles of a `_<name>.json` file (definition / model / filters)?
2. Give the EDS equivalent of a Sling Model, an HTL template, and a component dialog.
3. Why partials + generated aggregates, and what enforces their freshness?
4. What does `moveInstrumentation` do and why is it essential in UE projects?
5. What is the purpose of filters?

## 8. Best practices

- **Co-locate** `_<name>.json` with the block; keep fields minimal and clearly labeled.
- **Always `npm run build:json`** and commit aggregates in the same PR.
- **Use `moveInstrumentation`** for every node move.
- **Lint models** (`plugin:xwalk/recommended`) — CI runs it.
- **Design fields for authors**, not for the DOM (Lesson 09).

## 9. Anti-patterns

- **Editing generated aggregates** or committing stale ones.
- **Reintroducing Java/XML dialogs / HTL** — wrong stack.
- **Rebuilding block innerHTML** and losing instrumentation.
- **Over-modeling**: dozens of fields where a variant + two fields would do.

---

**Next:** [Lesson 09 — Content Modeling for Authors →](lesson-09-content-modeling.md)
