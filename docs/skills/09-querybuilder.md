# 09 · QueryBuilder → `query-index.json` + `helix-query.yaml` (mapping skill)

> **This repo has no QueryBuilder / JCR / SQL2 / `/bin/querybuilder.json`.** There is no JCR repository to query at runtime. Content listing/search is served from a generated index (`query-index.json`) configured by `helix-query.yaml`.

## Purpose
Explain how to query/list content in EDS. Instead of QueryBuilder predicates against the JCR, you configure which page properties get indexed in `helix-query.yaml`, then fetch and filter the resulting `query-index.json` on the client.

## When to use
- When asked to "write a QueryBuilder query" / "search the repository" → use the index below.
- Building a listing, filter, or search over pages (e.g. cards driven by the index).

## Mapping
| QueryBuilder concept | EDS equivalent |
|---|---|
| `path` / `type` predicates | Index scope defined in `helix-query.yaml` |
| Property predicates | Indexed fields (title, description, image, lastModified, robots, …) |
| Query execution (`/bin/querybuilder.json`) | `fetch('/query-index.json')` then JS filter/sort |
| Result paging | Client-side slicing of the index array |
| Custom facets | Add fields to `helix-query.yaml`, rebuild index (publish) |

## Best practices
- Add any new field a block needs to `helix-query.yaml` so it appears in `query-index.json`; update the index config alongside the block.
- Fetch the index off the eager path; cache the parsed result; filter/sort in JS.
- Keep the index lean — only index fields you actually consume.
- Sanitize any HTML fields from the index before inserting into the DOM.

## Anti-patterns
- ❌ Attempting JCR/SQL2/QueryBuilder calls — there is no such endpoint.
- ❌ Depending on an index field you never added to `helix-query.yaml`.
- ❌ Fetching/parsing the full index in the eager phase and blocking LCP.
- ❌ Over-indexing (bloats `query-index.json`, slows every consumer).

## Examples
```yaml
# helix-query.yaml — define what gets indexed
indices:
  pages:
    include: [ '/content/**' ]
    target: /query-index.json
    properties:
      title: { select: head > meta[property="og:title"], value: attribute(el, "content") }
      lastModified: { select: none, value: parseTimestamp(headers("last-modified"), "ddd, DD MMM YYYY hh:mm:ss GMT") }
```
```js
const { data } = await (await fetch('/query-index.json')).json();
const recent = data
  .filter((p) => p.path.startsWith('/blog/'))
  .sort((a, b) => b.lastModified - a.lastModified)
  .slice(0, 10);
```

## Validation checklist
- [ ] No JCR/QueryBuilder/SQL2 usage.
- [ ] New consumed fields added to `helix-query.yaml`; index kept lean.
- [ ] Index fetched off the eager path; filter/sort in JS.
- [ ] Any HTML from the index sanitized before DOM insertion.
