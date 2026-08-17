# 03 · Agent Architecture

How the assistant is structured as a running system.

## The control loop (the spine)
A standard tool-calling agent loop, tuned for AEM:
```
observe (read repo state / user goal)
  → plan (decompose; pick stack; pick tools)
    → act (call a tool: read, edit, run, preview)
      → verify (lint / render / compare)
        → reflect (done? or iterate?)
```
*Why this shape:* AEM work is iterative and feedback-rich (lint output, rendered DOM, PSI scores). A loop that acts then **consumes real feedback** before continuing is what separates a reliable assistant from a one-shot generator.

## Orchestrator + specialized sub-agents
A single monolithic prompt cannot hold all AEM knowledge without degrading. Decompose into an **orchestrator** that routes to **specialized sub-agents**, each with a narrow system prompt and toolset:

| Sub-agent | Responsibility | Analogue in this repo's tooling |
|---|---|---|
| **Stack Detector** | classify EDS vs AEMaaCS; refuse/redirect | (the `AGENTS.md` reality check) |
| **Page Analyzer** | scrape + segment a source page into sections/blocks | `excat:page-analysis` |
| **Block Designer** | design a block's content model + CSS from a reference | `excat:excat-block-design-expert` |
| **Import Parser Gen** | generate per-variant parsers | `excat:import-parser` |
| **Import Transformer Gen** | generate cleanup/section/DM transformers | `excat:import-transformer` |
| **Block Developer** | write/modify `decorate()` + CSS + model | `excat:excat-eds-developer` |
| **Visual Critic** | compare rendered EDS vs original, iterate | `excat:excat-visual-critique` |
| **Debugger** | diagnose EDS issues (blocks, images, sync) | `excat:excat-eds-debugger` |
| **Reviewer** | run the review checklist before PR | (`docs/REVIEW_CHECKLIST.md`) |

*Why sub-agents:* (1) each gets a focused prompt → higher accuracy; (2) they can run in parallel (analyze 10 pages at once); (3) failures are isolated and retryable; (4) the orchestrator's context stays small. This mirrors how this repo's migration is actually organized (the `excat-*` agents listed in the environment).

## Orchestration patterns (when to use which)
- **Pipeline** (default): each work item flows through stages independently — e.g. per-page: analyze → map blocks → generate infra → import → verify. No barrier between stages; item A can be importing while item B is still analyzing.
- **Parallel fan-out with barrier:** when a later stage needs *all* prior results — e.g. dedupe block variants across all pages before generating CSS once.
- **Loop-until-clean:** run generate→lint→fix until lint passes (bounded retries).
- **Adversarial verify:** a second agent tries to *refute* "this renders correctly" before accepting it ([09](09-verification-and-validation.md)).

*Why name these explicitly:* choosing the wrong pattern wastes tokens (barriers stall fast items) or misses cross-item context (dedupe needs a barrier). The orchestrator should pick deliberately.

## State & memory
- **Working state:** the repo itself (files, git) + a task list. The repo is the source of truth, not chat history.
- **Durable memory:** project facts that aren't in the code (fidelity preferences, non-obvious constraints) — see [04](04-knowledge-and-skills-system.md).
- **Artifacts:** migration intermediates (`analysis.json`, `cleaned.html`, screenshots, `page-templates.json`) persisted to disk so stages are resumable and auditable.

## Failure handling
- **Tool error →** read the error, adjust, retry with backoff; don't repeat verbatim.
- **Denied permission →** the user declined; propose an alternative, don't force.
- **Stuck loop →** bounded retries, then surface the blocker to the human with the exact error.
- **Ambiguity →** ask a targeted question rather than guessing (esp. stack detection, destructive ops).

## Example: orchestrator trace for "migrate /about-us to EDS"
```
1 Stack Detector      → EDS repo confirmed
2 Page Analyzer       → sections=[hero, pillars, team, cta]; artifacts written
3 Block Designer ×4   → (parallel) model+CSS per section, dedupe vs existing 50 blocks
4 Import Infra Gen    → parsers + transformers + page-templates.json entry
5 Import (scripted)   → run bundled import script → content HTML produced
6 Preview + Visual Critic → render at 3 widths, diff vs original, iterate ≤3×
7 Reviewer            → run REVIEW_CHECKLIST; open PR with preview link
```
Each numbered step is a sub-agent invocation with a scoped prompt and its own verification.

## Why this architecture, not a single prompt
A single mega-prompt would (a) exceed useful context, (b) blur the stack boundary, (c) make failures global, and (d) prevent parallelism. Decomposition trades a little orchestration complexity for large gains in accuracy, resumability, and throughput — the properties an AEM migration actually needs.
