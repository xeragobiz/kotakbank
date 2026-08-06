# 12 · Universal Editor

## Purpose
Define the authoring model for each block so content authors can edit it in **Universal Editor** (the xwalk authoring surface). Each block ships a partial `_{block}.json` with `definitions`, `models`, and optionally `filters`; these merge into the aggregate component JSON at the repo root.

## When to use
- Creating/changing a block's authored fields, groupings, or where it can be inserted.
- Adding a variant option authors can pick.
- Any time you touch a `_{block}.json` or `models/_component-*.json`.

## Best practices
- Design a **semantically meaningful model**: labels authors understand, sensible field grouping, optionals clearly marked.
- Use the right field components: `reference` (images/assets), `text`, `richtext`, `select`, `aem-content`, etc. Follow aem.live component-model-definitions guidance.
- The `definitions` block uses the xwalk plugin `resourceType: core/franklin/components/block/v1/block`.
- **After editing any partial, run `npm run build:json`** to regenerate `component-definition.json`, `component-models.json`, `component-filters.json`. Husky pre-commit does this for staged `_*.json` and re-stages outputs; **CI fails if the aggregates are stale**.
- Lint models: `npm run lint` runs `plugin:xwalk/recommended`.
- In the block JS, classify cells by content (fields collapse) and call `moveInstrumentation()` when moving nodes so editing overlays stay attached.
- Default-content models (page, section, text, title, image, button) live in `models/_component-*.json`.

## Anti-patterns
- ❌ Hand-editing the aggregate JSON files (`component-definition.json`, etc.) — always regenerate.
- ❌ Forgetting `npm run build:json` after a model change (CI JSON-sync gate fails).
- ❌ Reading cells by fixed index in JS when UE field-collapsing changes cell counts.
- ❌ Cryptic field names/no grouping; unmarked required vs optional fields.
- ❌ Moving DOM nodes without `moveInstrumentation()` (breaks in-place editing).

## Examples
```json
// blocks/k811-example/_k811-example.json (shape)
{
  "definitions": [{
    "title": "K811 Example",
    "id": "k811-example",
    "plugins": { "xwalk": { "page": {
      "resourceType": "core/franklin/components/block/v1/block",
      "template": { "name": "K811 Example", "model": "k811-example" }
    }}}
  }],
  "models": [{
    "id": "k811-example",
    "fields": [
      { "component": "reference", "name": "image", "label": "Image" },
      { "component": "richtext", "name": "copy", "label": "Copy" },
      { "component": "aem-content", "name": "ctaLink", "label": "CTA Link" },
      { "component": "text", "name": "ctaText", "label": "CTA Text" }
    ]
  }]
}
```
```bash
npm run build:json   # regenerate aggregates after editing any _*.json
```

## Validation checklist
- [ ] `_{block}.json` has meaningful labels, grouping, correct field components; optionals marked.
- [ ] `resourceType: core/franklin/components/block/v1/block` in definitions.
- [ ] `npm run build:json` run; three aggregate JSONs committed and in sync.
- [ ] `npm run lint` passes (`plugin:xwalk/recommended`).
- [ ] Block JS classifies cells by content; `moveInstrumentation()` on moved nodes.
- [ ] Verified the block is insertable/editable in the editor.
