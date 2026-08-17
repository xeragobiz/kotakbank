# Building an AEM-Specialized AI Coding Assistant — Design Library

> **Scope & disclaimer.** This library documents, from engineering first principles and the observable patterns in this repository, **how to design and build an AI coding assistant specialized for AEM (Edge Delivery Services)**. It is a *buildable design guide* — not a reproduction of any vendor's confidential system prompts or proprietary internals, which are neither required nor included. Everything here is derived from public AEM/EDS mechanics, standard LLM-agent engineering, and the concrete conventions visible in the `kotakbank` repo.

## Who this is for
An engineer who wants to build an assistant that can migrate, author, and maintain AEM Edge Delivery Services projects with the reliability this repo's tooling demonstrates. It assumes familiarity with LLMs, tool-calling agents, and web development.

## The thesis (why a *specialized* assistant beats a general one for AEM)
A general coding model, when pointed at an AEM repo, defaults to **traditional AEMaaCS instincts** — Java components, Sling Models, HTL, OSGi, Dispatcher, Cloud Manager. But a large and growing share of AEM work is **Edge Delivery Services**, where none of those exist. The single highest-leverage design decision for an AEM assistant is a **stack-detection + concept-mapping layer** that routes every request to the correct stack's primitives. Everything else in this library serves that reliability goal: grounding in delivered markup, deterministic tool pipelines, verification loops, and a skills/knowledge system that keeps the model on-rails.

## Reading order
| # | Document | Topic |
|---|---|---|
| 01 | [System Overview & Design Goals](01-system-overview.md) | what the assistant is, quality bar, non-goals |
| 02 | [Domain Knowledge Model (AEM/EDS)](02-domain-knowledge-model.md) | the two-stack mental model the assistant needs |
| 03 | [Agent Architecture](03-agent-architecture.md) | orchestrator, sub-agents, control loop |
| 04 | [Knowledge & Skills System](04-knowledge-and-skills-system.md) | skills, RAG, grounding, memory |
| 05 | [Tooling & Capabilities](05-tooling-and-capabilities.md) | the tool surface an AEM assistant needs |
| 06 | [Content Migration Pipeline](06-content-migration-pipeline.md) | scrape → analyze → parse → transform → import |
| 07 | [Block/Component Generation](07-block-generation.md) | generating EDS blocks reliably |
| 08 | [Grounding & Anti-Hallucination](08-grounding-and-anti-hallucination.md) | how to keep it truthful |
| 09 | [Verification & Validation Loops](09-verification-and-validation.md) | lint, preview, visual parity, self-check |
| 10 | [Prompt & Context Engineering](10-prompt-and-context-engineering.md) | system prompt, context budget, templates |
| 11 | [Guardrails, Safety & Security](11-guardrails-safety-security.md) | secrets, destructive ops, CSP, authorization |
| 12 | [Evaluation & Quality Metrics](12-evaluation-and-metrics.md) | how to measure and regression-test the assistant |
| 13 | [UX & Human-in-the-Loop](13-ux-and-human-in-the-loop.md) | interaction design, clarification, approvals |
| 14 | [Reference Implementation Blueprint](14-reference-implementation-blueprint.md) | putting it together, build order, examples |

## The one principle that unifies the library
**Reliability comes from constraint, not cleverness.** An AEM assistant is trustworthy to the degree that it (a) knows which stack it's in, (b) reads ground truth before acting, (c) runs deterministic pipelines for repeatable work, and (d) verifies its output against real feedback before claiming done. Each document below explains how to engineer one of those constraints, and *why* that decision was made.
