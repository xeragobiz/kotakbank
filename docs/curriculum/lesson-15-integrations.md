# Lesson 15 — Integrations, Personalization & Martech

> Tier 5 · Advanced & Architecture · Prerequisites: Lessons 07, 10, 11

## 1. Theory

Real sites aren't static brochures — they call APIs, embed forms, run experiments, personalize, and feed analytics. EDS handles all of this **without a server-side application**, using three mechanisms:

1. **Client-side fetch + progressive enhancement** — blocks `fetch()` JSON/HTML at the right phase and enhance the DOM.
2. **The delayed phase** — the correct home for analytics, tag managers, chat, consent, and experimentation tooling (Lesson 07).
3. **Edge/platform features** — the query index (Lesson 10), spreadsheets-as-data, forms, redirects, and (where needed) small edge functions.

The organizing principle: **push dynamic behavior to the client or the edge, keep the content path static and fast.** Integrations must never compromise LCP or the CSP.

## 2. Architecture

```
                 EAGER (never here for 3rd-party)
                 │
 content path ── LAZY ──► fetch data for below-fold blocks (query-index.json, /data.json, APIs)
                 │
                 DELAYED ─► analytics, tag manager, chat, consent, A/B & personalization SDKs
```

**Data sources EDS blocks commonly read:**
- **`query-index.json`** — the site's own indexed content (listings).
- **Spreadsheets** published as JSON (`/data.json`) — authorable tabular data (locations, rates, FAQs).
- **External APIs** — product/pricing/availability, via CORS-enabled endpoints.
- **Forms** — EDS form blocks (or Adaptive Forms) posting to a handler.

**Security surface:** every external origin your page contacts (scripts, fetch, images, frames) must be allowed by the **CSP in `head.html`** (`script-src 'nonce-aem' 'strict-dynamic' …`, `connect-src`, etc.). Any injected HTML from a remote/authored source must be **DOMPurify-sanitized**.

## 3. Engineering rationale

**Why client/edge instead of server rendering for dynamic bits?** To preserve the fast-by-default, infinitely-cacheable content path. A per-request server tier would reintroduce the scaling, latency, and operational burden EDS exists to avoid. Fetching data client-side (lazily) keeps the cached HTML shell instant and enriches it after paint.

**Why is martech strictly delayed?** These scripts are large, third-party, and irrelevant to reading the page. In the critical path they wreck LCP/INP; in the delayed phase they still capture the session ~3s in. This is the single most common place teams sabotage their score (Lesson 11).

**Why personalization at the edge/client, not in the CMS?** Server-side personalization implies a render tier per request. EDS personalizes via client-side SDKs (in delayed) or edge decisions that swap content variants, keeping the base document cacheable. The trade-off — a brief moment before personalization applies — is managed with sensible defaults and, for critical cases, edge-side selection.

**Why the CSP discipline?** A bank site is a high-value target. `strict-dynamic` + nonce means only trusted, explicitly-allowed code runs. Every integration must be *declared*, which is a feature: it forces a security review of each third party.

**Why sanitize?** Injecting authored/remote HTML without sanitizing is the classic XSS vector. `dompurify` is bundled specifically for this.

## 4. Examples

**Lazy data-driven block (spreadsheet as JSON):**
```js
export default async function decorate(block) {
  const resp = await fetch('/data/branches.json');   // published spreadsheet
  if (!resp.ok) return;                               // defensive
  const { data } = await resp.json();
  block.innerHTML = '';
  data.forEach((b) => {
    const row = document.createElement('div');
    row.textContent = `${b.city} — ${b.phone}`;
    block.append(row);
  });
}
```

**Martech in the delayed phase only:**
```js
// scripts/delayed.js
export default function loadDelayed() {
  import('./analytics.js');            // your wrapper around GA/Adobe Analytics
  loadConsentManager();
  loadChatWidget();
}
```

**Sanitizing remote HTML:**
```js
const html = await (await fetch(`${path}.plain.html`)).text();
block.innerHTML = window.DOMPurify.sanitize(html);
```

**CSP awareness (`head.html`)** — a new analytics domain needs an entry:
```
connect-src 'self' https://analytics.example.com;
script-src 'nonce-aem' 'strict-dynamic';
```

## 5. Hands-on exercises

1. **Phase the integrations.** For GA4, a pricing API call feeding an above-the-fold hero, a footer newsletter form, and a chat widget — assign each to eager/lazy/delayed and justify.
2. **Data block.** Build a `rates` block that fetches `/data/rates.json` lazily and renders a table; handle fetch failure gracefully.
3. **CSP change.** You add a Typeform embed. List the CSP directives you must update in `head.html` and why.
4. **Sanitize.** Given a block that injects author-supplied HTML, add DOMPurify and explain the risk it removes.
5. **Personalization trade-off.** Describe how you'd show a returning-user variant without breaking edge caching, and the UX trade-off involved.

## 6. Common mistakes

- **Third-party SDKs in eager/lazy** instead of delayed.
- **Fetching above-the-fold data on the eager path**, delaying LCP.
- **Forgetting CSP entries** for a new origin — the integration silently fails.
- **Injecting unsanitized HTML** (XSS).
- **No failure handling** on fetch — a dead API blanks the block.
- **Server-rendering personalization**, breaking cacheability.

## 7. Review questions

1. What are the three mechanisms EDS uses to be dynamic without a server?
2. Why is martech placed in the delayed phase specifically?
3. How does EDS personalize without breaking edge caching, and what's the trade-off?
4. What must you update when a block talks to a new external origin, and where?
5. When and why do you use DOMPurify?

## 8. Best practices

- **Martech/experiments/chat → `delayed.js`, always.**
- **Fetch lazily**, with defensive failure handling and caching.
- **Declare every origin in the CSP**; treat it as a security review gate.
- **Sanitize all injected HTML.**
- **Prefer authorable data** (spreadsheets/query-index) over hardcoding.
- **Keep the content path cacheable**; personalize at client/edge with good defaults.

## 9. Anti-patterns

- **A server/API tier** to render pages EDS can serve statically.
- **Third-party tags on the critical path.**
- **`innerHTML` from remote/authored sources without sanitizing.**
- **Ignoring/loosening the CSP** (`unsafe-inline`) to make an integration "just work."
- **Blocking LCP on a network call.**

---

**Next:** [Lesson 16 — Senior Architect: System Design, Governance & Trade-offs →](lesson-16-senior-architect.md)
