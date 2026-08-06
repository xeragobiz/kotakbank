# Lesson 10 — Metadata, Indexing, Sitemaps & Configuration

> Tier 3 · Authoring & UE · Prerequisites: Lessons 02, 04

## 1. Theory

Beyond blocks, an EDS site is steered by a small set of **configuration files** and **metadata**. These are the "config surface" — the EDS equivalent of OSGi config, but as YAML/HTML in the repo, plus per-page metadata authored in documents.

Four things to master:
1. **Page metadata** — per-page key/values (title, description, OG image, `robots`, template, theme) authored in a document's *Metadata* table (or bulk in a `metadata.xlsx`/spreadsheet).
2. **`helix-query.yaml`** — defines `query-index.json`: which pages get indexed and which properties are captured. This powers listing/card blocks that read the index.
3. **`helix-sitemap.yaml`** — defines the generated sitemap(s).
4. **`head.html` + `fstab.yaml` + `.hlxignore`** — global head/CSP, content mount, and non-served files (Lesson 04).

## 2. Architecture

### Metadata flow
```
Document "Metadata" table            Delivered <head>                Behavior
────────────────────────             ────────────────                ────────
title       | Kotak811     ─────►    <title>, og:title              SEO/social
description | Open in 5 min ─────►    <meta name=description>        SEO
image       | /hero.png     ─────►    <meta property=og:image>       social preview
robots      | noindex       ─────►    <meta name=robots>             crawl control
template    | landing       ─────►    <body class="landing">         template styling
theme       | kotak811      ─────►    <body class="kotak811">        theme styling
```

`decorateTemplateAndTheme()` in `scripts.js` reads `template`/`theme` metadata and applies body classes, which your scoped stylesheets key off (e.g. `main.kotak811`).

### Query index
```yaml
# helix-query.yaml
version: 1
indices:
  default:
    include: [ '/**' ]
    exclude: [ '/drafts/**' ]
    target: /query-index.json
    properties:
      title:       { select: head > meta[property="og:title"], value: attribute(el, "content") }
      description: { select: head > meta[name="description"],   value: attribute(el, "content") }
      image:       { select: head > meta[property="og:image"],  value: attribute(el, "content") }
      lastModified:{ select: none, value: parseTimestamp(headers("last-modified"), "…") }
      robots:      { select: head > meta[name="robots"],        value: attribute(el, "content") }
```
`query-index.json` becomes a queryable JSON feed. Listing blocks `fetch('/query-index.json')`, filter/sort client-side, and render cards — the EDS way to build dynamic-feeling index pages without a server.

## 3. Engineering rationale

**Why author metadata in documents?** So the same content owner who writes the page controls its SEO/social/indexing, with no developer or deploy. It keeps content and its metadata together.

**Why a static `query-index.json` instead of a query server?** Because it caches at the edge like everything else — infinitely scalable, no backend to run. Listing pages read a pre-built JSON. The trade-off: it updates on publish, not per-request, and queries run client-side. For content sites that's ideal.

**Why config as YAML in the repo?** Versioned, reviewable, diffable, and deployed by the same push→Code Sync flow. No separate admin console to drift from the code.

**Why `template`/`theme` body classes?** They let one codebase host multiple page families/brands, each scoping its CSS under a body/main class (as this project does with `main.kotak811`). It's the mechanism behind scoped design guides.

## 4. Examples

**A listing block reading the index:**
```js
export default async function decorate(block) {
  const resp = await fetch('/query-index.json');
  const { data } = await resp.json();
  const posts = data
    .filter((p) => p.path.startsWith('/blog/') && p.robots !== 'noindex')
    .sort((a, b) => b.lastModified - a.lastModified)
    .slice(0, 9);
  block.innerHTML = '';
  posts.forEach((p) => {
    const card = document.createElement('a');
    card.href = p.path;
    card.className = 'post-card';
    card.textContent = p.title;   // extend with image/description as needed
    block.append(card);
  });
}
```

**Excluding drafts from indexing and sitemap** — `exclude: ['/drafts/**']` in both `helix-query.yaml` and (implicitly, via the index) the sitemap.

## 5. Hands-on exercises

1. **Author metadata.** Write the Metadata table (as key/value rows) for a landing page that should be `noindex`, use theme `kotak811`, and set a social image.
2. **Add an indexed property.** Extend `helix-query.yaml` to capture an `author` meta tag into the query index. What else must change for a block to use it?
3. **Build a listing.** Write a `decorate` that fetches `/query-index.json`, filters to `/press/`, and renders the five most recent items with title + description.
4. **Sitemap scope.** Configure `helix-sitemap.yaml` conceptually to exclude `/drafts/` and include only `/**` under the site root.
5. **Theme routing.** Explain how a single repo serves two brands with different fonts/colors using `theme` metadata + scoped CSS.

## 6. Common mistakes

- **Expecting `query-index.json` to update instantly** — it reflects *published* pages.
- **Not excluding `/drafts/`** from the index/sitemap, leaking WIP pages.
- **Adding a block that needs a property the index doesn't capture** — update `helix-query.yaml` first.
- **Hardcoding SEO in code** instead of authorable metadata.
- **Heavy client-side querying** over a huge index on the eager path (do it lazily, paginate).

## 7. Review questions

1. Where do authors set a page's title/description/robots, and how does it reach the `<head>`?
2. What is `query-index.json`, how is it built, and how do listing blocks use it?
3. Why is a static, edge-cached index preferable to a query server for content sites — and what's the trade-off?
4. What do `template` and `theme` metadata do, and which function applies them?
5. Why keep site config as YAML in the repo?

## 8. Best practices

- **Author all SEO/social metadata** in documents; keep it out of code.
- **Update `helix-query.yaml`** whenever a block depends on a new indexed property; commit alongside the block.
- **Exclude drafts/WIP** from index and sitemap.
- **Query the index lazily**, filter/paginate client-side, cache the fetch.
- **Use `theme`/`template`** to scope multi-brand CSS rather than forking the repo.

## 9. Anti-patterns

- **A backend/query server** to do what the static index already does.
- **Per-request dynamic index queries** that assume a server.
- **Metadata hardcoded in JS**, unauthorable by content owners.
- **Indexing everything** including drafts and utility pages.

---

**Next:** [Lesson 11 — Performance Engineering ("Keeping it 100") →](lesson-11-performance.md)
