# 02 · Domain Knowledge Model (AEM / EDS)

The assistant's competence is bounded by the accuracy of its mental model of AEM. This document defines the model it must hold.

## The two stacks (the central abstraction)
AEM is not one thing. The assistant must model **two distinct stacks** and never conflate them:

### Stack A — Traditional AEM as a Cloud Service (AEMaaCS)
Java/Maven project deployed to an AEM runtime.
- **Primitives:** Sling Models (`@Model`), HTL/Sightly templates, OSGi components/config, Sling Servlets, Content Fragments + GraphQL, QueryBuilder, editable templates, Granite/Coral dialogs, clientlibs, `ui.apps`/`ui.content` packages, Dispatcher, Cloud Manager pipelines.
- **Delivery:** author → publish → Dispatcher → CDN.

### Stack B — Edge Delivery Services (EDS / "Helix"/"Franklin"/xwalk)
Vanilla JS/CSS/JSON served from GitHub via AEM Code Sync; authored in Universal Editor or Document Authoring.
- **Primitives:** blocks (`blocks/{name}/{name}.js|.css|_{name}.json`), `decorate(block)`, sections, `scripts/aem.js` core, three-phase loading, `query-index.json`, `helix-*.yaml`, `head.html` CSP, `.hlxignore`, Code Sync.
- **Delivery:** git push → Code Sync → `*.aem.page`/`*.aem.live` edge.

## The concept-mapping table (the assistant's most-used knowledge)
When a user speaks in Stack A terms about a Stack B repo, map — don't scaffold:

| Stack A concept | Stack B equivalent |
|---|---|
| Sling Model | `decorate(block)` reading delivered DOM |
| HTL template | JS DOM decoration (+ DOMPurify for injected HTML) |
| OSGi service | ES module in `scripts/` |
| OSGi config | `fstab.yaml` / `helix-*.yaml` / `head.html` / `.hlxignore` |
| Sling Servlet | published `.json` / `query-index.json` fetch, or external API |
| QueryBuilder / GraphQL | `query-index.json` (via `helix-query.yaml`), filtered in JS |
| Content Fragment | `fragment` block + authored fragment page / spreadsheet |
| Editable template | authored page structure + `page-templates.json` (import) |
| Granite dialog | `_{block}.json` Universal Editor model |
| Clientlib | per-block CSS/JS (auto code-split) + `styles/` |
| Dispatcher | Edge CDN + `.hlxignore` + `head.html` |
| Content package | git + Code Sync (no CRX packages) |
| Cloud Manager pipeline | GitHub Actions + Code Sync + PSI |

*Why a table and not prose:* the mapping must be **retrievable and unambiguous** at inference time. A lookup table is easy to embed in the system prompt, easy to RAG against, and leaves no room for creative misinterpretation.

## Stack detection heuristics (how the assistant decides A vs B)
Cheap, deterministic signals, checked before any generation:
- **Stack B (EDS) if:** `blocks/` dir exists, `scripts/aem.js` present, `fstab.yaml`/`helix-query.yaml` present, `head.html` with `nonce-aem` CSP, no `pom.xml`.
- **Stack A (AEMaaCS) if:** `pom.xml`, `ui.apps`/`ui.content` modules, `.content.xml`, HTL `.html` files, `core/` Java bundle.
- **Ambiguous/empty:** ask, or inspect the content source. Never guess silently.

## EDS-specific facts the model must encode (the hallucination-prone bits)
- **Field-collapsing:** Universal Editor merges link+text field pairs, so a block's rendered **cell count varies** → classify cells by content, never index.
- **Three-phase loading:** eager (LCP only) → lazy (rest) → delayed (martech). Work misplaced into eager hurts LCP.
- **`.plain.html` / `.md`:** the delivered block markup / markdown source — the ground truth to read before decorating.
- **Generated aggregates:** `component-*.json` are built by `npm run build:json` from `_*.json`; hand-editing them fails CI.
- **Platform core:** `scripts/aem.js` is off-limits.
- **Publishing:** push-driven; no manual deploy.

## Glossary the assistant must speak fluently
block, decorate, section, field-collapsing, three-phase loading, Code Sync, `createOptimizedPicture`, `moveInstrumentation`, xwalk, Universal Editor, Document Authoring, preview vs live, RUM.

## Example of the model preventing a hallucination
> User: "Add a QueryBuilder query to list the 10 latest articles."
- **Without the model:** the assistant writes `/bin/querybuilder.json?path=...&type=...` — which 404s in EDS.
- **With the model:** detects Stack B → maps QueryBuilder → `query-index.json`; adds the needed fields to `helix-query.yaml`; writes a JS `fetch('/query-index.json')` + filter/sort/slice. Correct on the first try.

## Why the domain model is documented before the architecture
The agent architecture ([03](03-agent-architecture.md)) is generic; what makes the assistant *good at AEM* is this knowledge. Encoding it explicitly — as tables and heuristics, not vibes — is what lets a smaller/cheaper model behave like an expert, and what makes the behavior testable ([12](12-evaluation-and-metrics.md)).
