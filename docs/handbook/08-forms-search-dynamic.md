# 08 · Forms, Search & Dynamic Content

The three cases where EDS reaches beyond static-decorated content. The unifying principle: **fetch published data or call external services from the client; there is no server tier of your own.**

## Forms
- **Recommendation:** for anything beyond a trivial contact form, use the **Adaptive Forms** capability — model fields as JSON, render via the forms runtime; submit to the designated forms/external service.
  **Why:** validation, conditional logic, multi-step, and accessibility are solved problems in the forms runtime; hand-rolling them per block reinvents (and usually breaks) them. There is no Sling servlet to POST to — submission goes to an external/forms endpoint.
- **Recommendation:** never embed secrets or keyed endpoints in the form's client code; ensure the submit origin is allowed by the CSP `connect-src`.
  **Why:** it's public client code (secrets leak) and CSP-governed (a disallowed origin silently fails the request).
- **Recommendation:** preserve label/field association and error announcement.
  **Why:** forms are the highest-stakes accessibility surface — an inaccessible form blocks the conversion entirely. (See [05](05-accessibility.md).)

## Search
- **Recommendation:** build search on `query-index.json` (configured by `helix-query.yaml`) — fetch the index, filter/rank in JS; for larger corpora, use a dedicated search service/index.
  **Why:** the query index is the platform-native, edge-cached content list. For a modest site it's a zero-infrastructure search source. There is no QueryBuilder/JCR to query at runtime — the index is the substitute.
- **Recommendation:** add only the fields search needs to `helix-query.yaml`; fetch off the eager path.
  **Why:** a bloated index slows every consumer; fetching it eagerly would block LCP.
- **Recommendation:** for large/faceted search, integrate an external search service.
  **Why:** client-side filtering of a huge index doesn't scale; delegate ranking/facets to a purpose-built service.

## Dynamic content
- **Recommendation:** deliver dynamic/personalized data as published `.json` (spreadsheets or index) fetched client-side, or via an external API; render in the block off the critical path; sanitize any HTML.
  **Why:** EDS caches static content at the edge; dynamic behavior lives in the client fetching data, not in server-side rendering (there is none). Keeping fetches off the eager path protects LCP; sanitizing protects against injection.
- **Recommendation:** degrade gracefully if the fetch fails (hide the sub-part, keep the page working).
  **Why:** a failed dynamic fetch must not break the statically-delivered page around it.
- **Recommendation:** for personalization/experimentation, use the platform's experimentation/martech in the **delayed** phase.
  **Why:** personalization logic is non-critical to first paint; running it delayed protects LCP while still personalizing.

## Commerce (special case)
- **Recommendation:** classify PDP/PLP (product/listing) pages early and route them to a commerce implementation, not the normal content path.
  **Why:** commerce pages have data/interaction patterns (catalog, cart, price) that generic content blocks don't model; forcing them through normal migration produces broken pages.

## Validation checklist — forms/search/dynamic
- [ ] Non-trivial forms use Adaptive Forms; submit to external service; no secrets in client; CSP `connect-src` allows the origin; labels/errors accessible.
- [ ] Search uses `query-index.json` (lean fields) or an external service; fetched off eager path.
- [ ] Dynamic data via published `.json`/external API; rendered off critical path; HTML sanitized; graceful degradation.
- [ ] Personalization/martech in the delayed phase.
- [ ] Commerce pages classified and routed appropriately.
