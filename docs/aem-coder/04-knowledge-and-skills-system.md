# 04 · Knowledge & Skills System

How the assistant *knows things* — the layer that turns a general model into an AEM expert.

## Four knowledge tiers (and why each exists)
1. **Baked-in system knowledge** — the domain model ([02](02-domain-knowledge-model.md)) and golden rules, embedded in the system prompt. *Why:* must always be present, cheap to include, governs every turn.
2. **Skills** — on-demand, single-topic procedure files loaded when relevant. *Why:* too much to fit in the prompt; load the block-development skill only when building a block.
3. **Retrieved context (RAG + live reads)** — the actual repo files, delivered markup, and docs pulled just-in-time. *Why:* ground truth changes per repo; never rely on memory of a file — read it.
4. **Durable memory** — project-specific facts learned over time. *Why:* preferences and constraints not derivable from code (e.g. "reproduce animations exactly; build dedicated blocks over reusing shared ones").

## The skills system (the workhorse)
A **skill** is a packaged instruction set for one kind of task: purpose, when-to-use, best practices, anti-patterns, examples, validation checklist. The assistant matches the task to a skill and loads it in place of improvising.

*Design decisions:*
- **One area per skill.** Keeps each focused and independently maintainable (this repo's `docs/skills/` has 20, one topic each).
- **Discoverable by description.** Each skill has a one-line "when to use" the router matches against — the selection must be reliable without reading the whole skill.
- **Mapping skills for absent stacks.** Topics that don't exist in EDS (Sling Models, Dispatcher…) are written as *guardrail skills* that redirect to the equivalent — so the assistant has an answer for every AEM term, right or redirected.
- **Skills carry examples + a checklist.** The example shows the shape; the checklist is the self-verification hook ([09](09-verification-and-validation.md)).

Example skill selection:
> Task "add an author field to the hero block" → router matches `universal-editor` skill (when-to-use: "editing a block's authored fields/model") → loads it → follows its `build:json` + validation steps.

## RAG & grounding sources for AEM
The retrieval corpus an AEM assistant needs:
- **The repo** (highest priority): block code, `scripts/`, `styles/`, models, config.
- **Delivered markup:** `curl …plain.html` / `.md` — read before decorating.
- **aem.live docs:** searchable index (`https://www.aem.live/docpages-index.json`) for platform features.
- **The original site** (for migration): scraped DOM + screenshots.
- **Block collections:** existing block libraries as starting points.

*Why live reads beat memorized knowledge:* AEM block DOM is backend-emitted and repo-specific; a memorized "hero looks like X" is a hallucination risk. The rule "read the file/markup you're about to change" is the cheapest, highest-value grounding tactic.

## Durable memory design
- **What to store:** user identity/preferences, feedback (with the *why*), project constraints, external references. **Not** code structure or git history (the repo already has those).
- **Format:** small, single-fact files with a description for relevance matching; an index loaded each session.
- **Discipline:** verify a remembered fact against current code before acting on it (files move); update/delete stale memories.

Example memory: *"Reproduce Kotak811 pages as-is including animations; build dedicated `k811-*` blocks + a scoped design guide rather than force-reusing shared blocks."* — a preference no amount of code-reading reveals, but which shapes every block decision.

## How the tiers compose on one turn
```
system prompt (tier 1) + matched skill (tier 2) + freshly-read files & markup (tier 3) + relevant memories (tier 4)
→ the model now has exactly what it needs, and no more
```
*Why "and no more" matters:* context is finite and noisy context degrades output. The art is loading the *relevant* skill and the *specific* files, not everything.

## Why the skills system is the highest-ROI investment
Model capability is a moving target; the skills library is durable, inspectable, and improvable by humans. A good skills system lets a mid-tier model perform expert AEM work, makes behavior auditable ("which skill fired?"), and turns every production mistake into a one-line skill/anti-pattern update rather than a retrain.
