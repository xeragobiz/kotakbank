# 10 · Prompt & Context Engineering

How to shape the assistant's context so it behaves like an AEM expert every turn.

## The system prompt layers (what's always present)
1. **Identity & role:** "AEM Edge Delivery Services specialist assistant."
2. **The governing fact:** the two-stack model + "detect stack, map don't scaffold."
3. **Golden rules:** the short non-negotiable list (never edit `aem.js`; never hand-edit `content/`/aggregates; classify cells by content; scope CSS; no secrets in chat; PR needs preview link).
4. **Tool/skill availability:** what it can call and how to select a skill.
5. **Output & communication norms:** concise, cite files, surface reasoning for non-obvious redirects.

*Why layered:* the identity and governing fact must survive every context truncation; they're the smallest set that prevents the worst failures. Everything else is loaded on demand.

## Context budget management (the scarce resource)
- **Load the relevant skill, not all skills.** Match task → one skill file ([04](04-knowledge-and-skills-system.md)).
- **Read specific files, not the whole repo.** Grep to locate, read the few that matter.
- **Summarize long tool outputs.** Persist full output to disk; keep a pointer + the salient lines in context.
- **Prefer `snapshot` over `screenshot`** — a DOM tree is 1–2k tokens; a screenshot is 20–50k.
*Why:* noisy/overfull context measurably degrades output quality. Curation is a first-class task, not an afterthought.

## Structured context injection
Give the model **tables and schemas**, not prose, for anything it must apply precisely: the concept-mapping table, field-component list, breakpoint values, the golden rules. *Why:* structured facts are retrieved and applied more reliably than the same facts buried in paragraphs.

## Prompt templates for repeatable tasks
Maintain reusable, parameterized prompts (`{{PLACEHOLDER}}`) for common AEM tasks — create block, add field, optimize performance, convert legacy component, migrate page. *Why:* templates encode the correct procedure and the stack-detection guardrail once, so every invocation is consistent and the human can't forget a step. (This repo's `docs/prompts/` is exactly this.)

## Sub-agent prompt design
Each sub-agent gets:
- a **narrow role** ("you segment a page into sections; output JSON matching this schema"),
- **only the context it needs** (the cleaned HTML, not the whole repo),
- a **forced output schema** so its result is machine-consumable,
- **explicit success criteria** it self-checks before returning.
*Why narrow:* focused prompts outperform broad ones; a page-analyzer that also "helps with anything" analyzes worse.

## Communication norms (the human-facing contract)
- Explain non-obvious redirects ("no Dispatcher in EDS; here's the equivalent") — silence reads as failure.
- Report faithfully: if lint failed, say so with the output; if a step was skipped, say that.
- Don't over-narrate routine tool calls; do surface decisions and trade-offs.
*Why:* an AEM assistant does surprising-but-correct things; trust depends on making the reasoning visible.

## Example: a compact, effective turn context
```
[system: identity + two-stack + golden rules]           ~always
[skill: building-blocks]                                  ~loaded for this task
[read: blocks/k811-cta/k811-cta.{js,css}]                 ~the specific files
[tool result: npm run lint output, trimmed to errors]     ~salient only
[memory: "reproduce animations exactly; dedicated blocks"] ~relevant preference
```
Everything needed, nothing extra — the model has an expert's context without drowning.

## Why prompt engineering is leverage, not decoration
The same model, given the two-stack governing fact + the right skill + the specific files, produces expert AEM work; given a generic prompt and the whole repo, it produces confident AEMaaCS mistakes. Context engineering is where most of the assistant's realized quality actually comes from — more than model choice, for this domain.
