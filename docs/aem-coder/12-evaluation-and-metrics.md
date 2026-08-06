# 12 · Evaluation & Quality Metrics

You cannot improve an AEM assistant you can't measure. This document defines how to evaluate it.

## What to measure (the metric families)
1. **Stack-routing accuracy** — % of requests correctly classified EDS vs AEMaaCS and routed. *Why first:* it's the dominant failure mode; a regression here poisons everything downstream.
2. **Task success rate** — % of tasks that reach a verified "done" (lint green, renders, PSI OK) without human code fixes.
3. **Hallucination rate** — invented APIs/paths/config per N tasks. Target near-zero; each occurrence becomes a grounding-rule or skill update.
4. **First-try correctness** — % of blocks that render correctly before any fix iteration. Measures generation quality.
5. **Fidelity score (migration)** — visual/content parity vs original, per width.
6. **Efficiency** — tokens/tool-calls per task; screenshot usage (should be rare).
7. **Safety adherence** — zero occurrences of the hard-block list ([11](11-guardrails-safety-security.md)); any occurrence is a P0.

## Evaluation methods
- **Golden-task suite:** a fixed set of AEM tasks with known-good outcomes (create block X, add field Y, migrate page Z, "add a Dispatcher rule" → expect redirect). Run on every change to prompts/skills/model. *Why:* regression detection; prompts and skills drift.
- **Trap tasks:** requests engineered to bait the wrong stack ("write the Sling Model", "QueryBuilder query") — pass = correct redirect, fail = scaffolded Java. *Why:* directly measures the #1 risk.
- **Held-out migration pages:** migrate a page not in any example; score fidelity. *Why:* tests generalization, not memorization.
- **Adversarial review:** a critic agent scores outputs against the review checklist. *Why:* scalable, consistent grading.
- **Human spot-check:** periodic expert review of a sample. *Why:* catches issues the automated graders share a blind spot on.

## The rubric (per task)
| Dimension | Pass criteria |
|---|---|
| Correct stack | detected + stated |
| Grounded | read real files/markup; APIs cited/verified |
| Standards | lint clean; CSS scoped; cells classified by content |
| Verified | rendered at 3 widths; checklist walked |
| Safe | no hard-block violation; no in-band secret |
| Communicated | reasoning surfaced for non-obvious choices |

## Regression testing the *knowledge*, not just the model
When a new failure is found in production, add: (a) a golden/trap task reproducing it, (b) a skill/anti-pattern entry fixing it. *Why:* this turns the eval suite into a ratchet — the assistant can't regress on a class of error once it's captured. The skills library and the eval suite co-evolve.

## Leading vs lagging indicators
- **Leading:** first-try correctness, hallucination rate, screenshot usage — predict quality before shipping.
- **Lagging:** human-fix rate, PR rejection rate, PSI regressions in prod — confirm real-world quality.
*Why track both:* leading indicators let you catch a bad prompt change before it ships; lagging ones validate that the leading metrics correlate with real outcomes.

## Example: a trap-task eval entry
```yaml
id: trap-querybuilder-in-eds
repo_fixture: eds-sample
prompt: "Add a QueryBuilder query to list the 10 latest articles."
pass_if:
  - response detects EDS stack
  - response maps QueryBuilder → query-index.json / helix-query.yaml
  - no /bin/querybuilder.json usage generated
fail_if:
  - generates a Java/servlet/JCR query
```

## Why evaluation is part of the product, not QA afterthought
An AEM assistant operates in a domain where the *right* answer is often the counterintuitive one (don't write the Java). Without trap tasks and a golden suite, prompt/skill/model changes silently regress the exact behaviors that make it valuable. Measurement is how the reliability claimed in [01](01-system-overview.md) is kept true over time.
