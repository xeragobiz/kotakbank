# 08 · Grounding & Anti-Hallucination

The failure that most damages an AEM assistant is confident wrongness. This document catalogs the specific hallucinations AEM invites and the mechanisms that prevent them.

## The AEM-specific hallucination taxonomy
| Hallucination | Trigger | Prevention |
|---|---|---|
| **Wrong-stack scaffolding** (Java/HTL in an EDS repo) | AEM training skew toward AEMaaCS | Stack detection ([02](02-domain-knowledge-model.md)) before generation |
| **Invented APIs** (fake `aem.js` exports, fake helpers) | plausible-sounding names | Read the actual export list; cite `file:line`; never import unverified |
| **Index-based cell reads** (`cells[2]`) | demo works, reality breaks | Classify-by-content rule ([07](07-block-generation.md)) |
| **Phantom files/paths** | assuming conventional AEM layout | Glob/read before referencing |
| **Fabricated config keys** (`helix-query.yaml`, dialog fields) | guessing schema | Validate against schema; read an existing example |
| **"It renders correctly" without rendering** | optimism | Mandatory preview verification ([09](09-verification-and-validation.md)) |
| **Stale memory** (file moved/renamed) | trusting durable memory | Re-verify remembered facts against current code |

## The grounding mechanisms (ranked by ROI)
1. **Read before write.** The cheapest, highest-value rule: read the file/markup you're about to change. An assistant that reads `blocks/hero/hero.js` cannot invent its structure.
2. **Delivered-markup inspection.** `curl …plain.html` gives the *actual* backend DOM — the ground truth for decoration.
3. **Citation discipline.** Require `file:line` for any claimed API/behavior. If it can't be cited, it must be verified, not asserted.
4. **Schema validation.** Validate `_{block}.json` and `helix-*.yaml` against real schemas before use.
5. **Reuse retrieval.** Search the block catalog before generating — reuse is inherently grounded.
6. **Structured tool outputs.** Sub-agents return schema-validated JSON, so the orchestrator consumes facts, not prose it might misread.

## The "map, don't invent" rule for unknown requests
When asked for something the current stack lacks, the assistant must **map to the equivalent** (concept table, [02](02-domain-knowledge-model.md)) rather than fabricate the missing construct. Example:
> "Where's the Dispatcher config?" → "This is EDS; there's no Dispatcher. Serving control is `.hlxignore`, headers are in `head.html`. Here's what you likely want…" — grounded redirection, not an invented `dispatcher.any`.

## Calibrated uncertainty
The assistant should distinguish **verified** ("I read it"), **inferred** ("consistent with the pattern, unconfirmed"), and **unknown** ("need to check"). *Why:* miscalibration is what makes hallucination dangerous — a hedged inference is recoverable; a confident fabrication is not. Surfacing the tier lets the human calibrate trust.

## Adversarial self-check
Before claiming a non-trivial result, a second pass (or second agent) asks: *"What would make this wrong? Which claim is unverified? Which file did I not actually read?"* ([09](09-verification-and-validation.md), [12](12-evaluation-and-metrics.md)). *Why:* generation and criticism are different cognitive modes; separating them catches errors the generator is blind to.

## Example: catching a hallucination in flight
```
Model drafts: import { renderBlock } from '../../scripts/aem.js';
Grounding gate: grep "renderBlock" scripts/aem.js → 0 hits
→ reject; re-read the real export list → use loadBlock/decorateBlock instead
```
The import never ships because the citation requirement forced a check.

## Why grounding is architectural, not a prompt afterthought
"Don't hallucinate" as a prompt instruction is nearly useless. What works is *making the correct path the easy path*: tools that read ground truth, gates that reject uncited APIs, pipelines that validate schemas, and a domain model that pre-answers the stack question. Anti-hallucination is the sum of these constraints — engineered, not requested.
