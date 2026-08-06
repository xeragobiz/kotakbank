# 07 · Content Fragments → `fragment` block + spreadsheets (mapping skill)

> **This repo has no AEM Content Fragments / CF Models / GraphQL.** There is no `/content/dam/.../cf`, no CF editor, no persisted queries. Structured, reusable content comes from the `fragment` block, authored pages, and spreadsheet-backed data.

## Purpose
Explain how reusable, structured content is modeled and shared in EDS. Instead of CF Models + GraphQL delivery, you reuse authored page fragments (transcluded via the `fragment` block) and use `.json` spreadsheets/`query-index.json` for repeated data.

## When to use
- When asked to "create a Content Fragment / CF Model / GraphQL query" → use the mappings below.
- When you need one piece of content reused across many pages (banners, disclaimers, promos).

## Mapping
| Content Fragment concept | EDS equivalent |
|---|---|
| CF for reusable content | An authored page fragment embedded via the `fragment` block |
| CF Model (structured fields) | A block's `_{block}.json` model (fields authors fill) |
| CF variations | Block variants / model options |
| GraphQL / persisted query delivery | `query-index.json` (via `helix-query.yaml`) or a published `.json` spreadsheet |
| Headless JSON delivery | `.json` resources served by the platform |

## Best practices
- For "author once, use everywhere" content, create an authored fragment page and reference it with the `fragment` block.
- For tabular/repeated data, use a spreadsheet published as `.json`, or the query index — fetch it in a block and render (sanitize any HTML).
- Model structured fields in the block's `_{block}.json` so authors edit in Universal Editor (see [12](12-universal-editor.md)).
- Keep fetched JSON small and cache-friendly; do the fetch in the lazy/delayed phase where possible.

## Anti-patterns
- ❌ Introducing CF Models, the CF editor, or GraphQL endpoints.
- ❌ Hardcoding content that is reused on many pages instead of using a fragment.
- ❌ Fetching large JSON in the eager phase and blocking LCP.
- ❌ Rendering fetched HTML without DOMPurify.

## Examples
```js
// Reusing shared content: the `fragment` block transcludes an authored page.
// Author places a `fragment` block whose link points to /fragments/disclaimer.
// Data-driven content: fetch a published spreadsheet as JSON.
const resp = await fetch('/data/offers.json');
const { data } = await resp.json();
data.forEach((offer) => renderOffer(block, offer)); // build DOM, sanitize any HTML
```

## Validation checklist
- [ ] No CF Model / GraphQL / `/content/dam/**/cf` artifacts.
- [ ] Reusable content shared via the `fragment` block, not duplicated.
- [ ] Structured fields modeled in `_{block}.json` (+ `build:json`).
- [ ] Fetched JSON is small; fetch off the eager/LCP path; HTML sanitized.
