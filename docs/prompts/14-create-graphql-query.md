# 14 · Create GraphQL Query 🟡

> **Guardrail — this repo has NO AEM GraphQL / persisted queries / CF endpoints.** In this repo the equivalent is `query-index.json` (configured by `helix-query.yaml`) or a published `.json` spreadsheet, fetched and filtered in JS. Use the traditional path only on a real AEMaaCS project with Content Fragments + GraphQL.

## Variables
- `{{DATA_NEED}}` — what to retrieve, e.g. "10 most recent blog posts with title, path, image, date"
- `{{FILTERS}}` — filter/sort criteria
- `{{FIELDS}}` — fields to return
- `{{STACK}}` — `eds` or `aemaacs`

## Prompt
```
I need to query content: {{DATA_NEED}} — filters: {{FILTERS}}, fields: {{FIELDS}}.

FIRST detect the stack (or use STACK={{STACK}}):
- If Edge Delivery Services (THIS repo): do NOT write a GraphQL/persisted query (docs/skills/09-querybuilder.md).
  Map it:
  * Ensure every field in {{FIELDS}} is indexed in helix-query.yaml (add it if missing; keep the index lean); publishing rebuilds query-index.json.
  * In the block, `fetch('/query-index.json')` (off the eager/LCP path), then filter/sort in JS per {{FILTERS}} and slice for paging.
  * Or fetch a purpose-built published .json spreadsheet. Sanitize any HTML fields before inserting into the DOM.
  Provide the helix-query.yaml delta + the JS fetch/filter snippet.
- Only if traditional AEMaaCS: write the GraphQL query (or persisted query) against the relevant CF model returning {{FIELDS}} with {{FILTERS}}.

State the detected stack first.
```

## Validation (EDS path)
- [ ] No GraphQL/persisted-query artifacts.
- [ ] Consumed fields present in `helix-query.yaml`; index kept lean.
- [ ] Index fetched off eager path; filter/sort in JS; HTML sanitized.
