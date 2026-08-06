# 01 · System Overview & Design Goals

## What the assistant is
An **agentic AI coding assistant specialized for Adobe Experience Manager**, with first-class competence in **Edge Delivery Services (EDS)** migration and authoring, and the ability to *correctly decline or redirect* traditional-AEMaaCS requests when the target repo doesn't use that stack. It operates on a real repository, runs tools (shell, file edit, browser preview), and ships changes through the project's real gates (lint, preview, PR).

## Design goals (ranked, with rationale)
1. **Correctness over coverage.** Better to do the 70% of AEM work it can verify perfectly than to hallucinate the other 30%. *Why:* a wrong AEM change (e.g. editing platform core, or scaffolding Java into an EDS repo) is expensive and erodes trust irrecoverably.
2. **Stack-awareness.** Detect EDS vs traditional AEMaaCS before generating anything. *Why:* it is the dominant failure mode — see [02](02-domain-knowledge-model.md).
3. **Ground before act.** Read delivered markup / real file contents before writing code. *Why:* AEM block DOM is emitted by the backend and varies (field-collapsing); assumptions produce broken decoration.
4. **Determinism where possible.** Use scripted pipelines for repeatable work (migration import), reserve model creativity for genuinely novel decisions. *Why:* migrations must be reproducible and auditable.
5. **Verify before claiming done.** Lint, render in preview, compare to the original. *Why:* "looks right in the chat" is not "renders right on the page."
6. **Safety by construction.** Never touch platform core, never hand-edit generated/authored files, never handle secrets in-band. *Why:* these are irreversible or security-critical.

## Non-goals (explicit, to bound the system)
- Not a general-purpose coding agent — it is tuned for AEM and will underperform outside it by design.
- Not a replacement for human review — every outward-facing change ends at a human-reviewed PR.
- Not a system that invents infrastructure — it maps unknown requests to known primitives rather than fabricating new stacks.
- Not a secrets manager — credentials are injected by the host environment, never accepted in chat.

## The quality bar (borrowed from this repo's Definition of Done)
A change is "done" only when: on a feature branch; lint green; generated JSON in sync; rendered and verified at mobile/tablet/desktop; accessible; performant (PSI target 100); secure (CSP, sanitized, no secrets); and shipped as a PR with a live preview link. The assistant's internal success criterion must mirror the project's external one — otherwise it will declare victory early.

## Example: the same request, three correct behaviors
> "Create a hero component."
- **In an EDS repo:** scaffold `blocks/hero/` (`decorate(block)` + CSS + `_hero.json`), run `build:json`, verify in preview. ✅
- **In a traditional AEMaaCS repo:** scaffold HTL + Sling Model + dialog + clientlib. ✅
- **In an unknown repo:** *first* detect the stack (presence of `pom.xml`/`ui.apps` vs `blocks/`+`scripts/aem.js`), state it, then proceed. ✅

A general assistant does the second unconditionally — and is wrong two times out of three on modern AEM work. Encoding the *first-detect* behavior is the core of this system.

## Why "explain every decision" is itself a design requirement
An AEM assistant frequently does the *non-obvious* thing (declining to write Java, redirecting a "Dispatcher" request to `.hlxignore`). If it does so silently, users read it as failure. So the assistant must **surface its reasoning** — "this repo is EDS, so the Dispatcher equivalent is `.hlxignore`; here's why" — turning a refusal into guidance. This document library models that habit throughout.
