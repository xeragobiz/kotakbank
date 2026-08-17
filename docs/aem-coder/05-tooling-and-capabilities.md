# 05 · Tooling & Capabilities

The tool surface an AEM assistant needs, and why each tool matters.

## Core tools (the minimum viable set)
| Tool | Purpose | Why AEM needs it |
|---|---|---|
| **File read** | read any file | ground truth before editing; read delivered markup snapshots |
| **File edit / write** | precise edits | block JS/CSS/model changes |
| **Grep / glob** | search the repo | find existing blocks before duplicating; locate patterns |
| **Shell (bash)** | run commands | `npm run lint`, `build:json`, `aem-cli up`, `curl …plain.html`, `gh` |
| **Browser (Playwright)** | render & inspect | verify blocks render; snapshot DOM/a11y; screenshot for pixel QA |
| **Web fetch / search** | external knowledge | scrape source pages; search aem.live docs |
| **Sub-agent spawn** | delegate | parallel page analysis, isolated block design |

*Why shell is central:* AEM/EDS quality gates are commands (`lint`, `build:json`, `gh pr checks`). An assistant that can't run them can't verify its own work.

## AEM-specialized tool capabilities (beyond generic coding)
These are the capabilities that make it an *AEM* assistant, not a generic one:
- **Delivered-markup inspector:** fetch `/{path}.plain.html` and `/{path}.md` to see backend-emitted block DOM. *Decision:* make this a first-class tool, because "read the DOM before decorating" is the top grounding rule.
- **Block catalog / library search:** enumerate available blocks (local + collections) with their purposes, so the model reuses instead of reinventing. (Cf. this repo's block-inventory skill and block-library MCP tools.)
- **Component-model validator:** validate `_{block}.json` against the xwalk schema before `build:json`. *Decision:* catch model errors at authoring time, not at CI.
- **Import pipeline runners:** scrape, parse, transform, and bulk-import (see [06](06-content-migration-pipeline.md)). *Decision:* wrap the deterministic migration steps as tools so the model orchestrates rather than hand-codes each import.
- **Visual diff:** render EDS output and the original side by side; compute/inspect differences. *Decision:* migration fidelity is visual; text tools can't judge it.
- **Preview/publish (admin APIs):** trigger preview/live via `admin.hlx.page` / Document Authoring uploads. *Decision:* credentials injected by the host, never taken in chat ([11](11-guardrails-safety-security.md)).

## Tool design principles
1. **Prefer specific tools over shell for common ops.** A dedicated "read file" beats `cat` — integrates with permissions and UI, avoids quoting bugs.
2. **Deterministic tools for repeatable work.** Migration import is a script, not an LLM improvisation — reproducible and diffable.
3. **Idempotent & resumable.** Persist artifacts (`analysis.json`, `cleaned.html`) so a re-run resumes rather than redoes.
4. **Least privilege.** Read-heavy by default; writes and outward-facing calls (push, publish) behind explicit gates.
5. **Structured output where it feeds another stage.** Force JSON schemas on sub-agent results so the pipeline can consume them without parsing prose.

## MCP / external integrations worth having
- **Block library service** (block catalog, examples, vanilla code) — a knowledge tool the Block Designer/Developer query.
- **Docs search** (aem.live index) — for platform features.
- **Browser automation** (Playwright) — the verification backbone.
- **Git/GitHub (`gh`)** — branch, PR, checks.
*Why MCP:* it lets the assistant reach specialized AEM knowledge/services without baking them into the core prompt, and the schemas load on demand.

## Example: capability composition for a single block edit
```
grep "k811-hero" blocks/         → confirm the block exists
read blocks/k811-hero/*.js|css   → ground truth
curl :3000/index.plain.html      → delivered DOM
edit block JS/CSS                → change
bash npm run lint                → gate 1
playwright navigate+snapshot     → gate 2 (renders, DOM correct)
playwright evaluate getComputedStyle → gate 3 (CSS applied)
```
Six tools, one small change — because verification is non-negotiable.

## Why the tool surface is deliberately bounded
Every tool is an attack surface and a source of nondeterminism. The set above is the *minimum* that covers ground-truth reading, deterministic migration, and real verification. Adding more (e.g. arbitrary network) increases risk without improving AEM outcomes — so the design keeps the surface tight and pushes power into *skills* and *knowledge* instead of *more tools*.
