# AI Assistant Guide — Master Index

**Read this first.** You are an AI assistant dedicated to the **kotakbank** repository. This file is your entry point; it tells you what to read, in what order, and where each kind of knowledge lives. Everything here is verified against the actual repo.

## The one thing you must internalize
This is an **AEM Edge Delivery Services (EDS)** project — vanilla **JavaScript (ES6+), CSS3, JSON**, authored in **Universal Editor**, served from GitHub via **AEM Code Sync**. It has **NO Java, Maven, OSGi, Sling, HTL, SCSS, Dispatcher, or Cloud Manager.** Every request framed in those traditional-AEM terms must be mapped to its EDS equivalent — never scaffold Java/HTL/OSGi/Dispatcher artifacts. This principle is the backbone of every document below.

## Reading order (onboarding path)
1. **`AGENTS.md`** (repo root) — the checked-in, authoritative project instructions and Definition of Done. **Source of truth; everything else elaborates it, nothing overrides it.**
2. **`docs/KNOWLEDGE_BASE.md`** — the project facts: what it is, glossary, environments, key files, FAQ. Start here for orientation.
3. **`docs/REPOSITORY_MAP.md`** — where everything lives; the 50 blocks; what to touch and what never to touch.
4. **`docs/ARCHITECTURE.md`** — how it works: folder structure, flows, lifecycles, 11 Mermaid diagrams.
5. **`docs/CODING_STANDARDS.md`** — how to write code here (JS/CSS first-class; Java/HTL/etc. mapped to N/A).
6. **`docs/BEST_PRACTICES.md`** — the positive playbook: do this.
7. **`docs/COMMON_MISTAKES.md`** — the anti-playbook: never do this (with the fix).
8. **`docs/skills/`** (20 files) — deep reference, one area each.
9. **`docs/prompts/`** (14 templates) — reusable task prompts with `{{PLACEHOLDERS}}`.
10. **`docs/PR_CHECKLIST.md`** + **Review Checklist** (below) — gates before/at PR.
11. **`.cursor/rules/`** (8 `.mdc`) — the same rules in IDE-enforcement form.

## Knowledge map — where each requested artifact lives
| Requested artifact | Location | Status |
|---|---|---|
| AGENTS.md | `/AGENTS.md` (repo root) | Pre-existing, authoritative — **not regenerated** (see decision below) |
| Knowledge Base | `docs/KNOWLEDGE_BASE.md` | Created |
| Architecture Guide | `docs/ARCHITECTURE.md` | Exists |
| Coding Standards | `docs/CODING_STANDARDS.md` | Exists |
| Prompt Library | `docs/prompts/` (+ README) | Exists |
| Skill Library | `docs/skills/` (+ README) | Exists |
| Validation Checklist | `docs/PR_CHECKLIST.md` | Exists |
| Best Practices | `docs/BEST_PRACTICES.md` | Created |
| Common Mistakes | `docs/COMMON_MISTAKES.md` | Created |
| Review Checklist | `docs/REVIEW_CHECKLIST.md` | Created |
| Repository Map | `docs/REPOSITORY_MAP.md` | Created |
| Reverse-engineered API reference | `docs/REVERSE_ENGINEERED.md` | Created (code-extracted) |
| Templates (scaffolds) | `docs/TEMPLATES.md` | Created |
| Examples (real annotated code) | `docs/EXAMPLES.md` | Created |

## Golden rules (the non-negotiables, in one place)
1. **Never modify `scripts/aem.js`** — platform core.
2. **Never hand-edit files under `content/`** — use `tools/importer/`.
3. **Never hand-edit the aggregate JSON** (`component-*.json`) — regenerate with `npm run build:json`.
4. **Never introduce Java/HTL/SCSS/OSGi/Dispatcher/Cloud-Manager** artifacts.
5. **Inspect delivered DOM** (`curl …plain.html`) before coding a block.
6. **Classify block cells by content, not index** (Universal Editor field-collapsing).
7. **Scope all CSS to `.{block}`**; mobile-first 600/900/1200; no `-container`/`-wrapper`.
8. **Never commit or echo secrets;** sanitize injected HTML; respect the CSP.
9. **Feature branch only;** PR to `main` **must** include a `…aem.page/{path}` preview link.
10. **`npm run lint` + `gh pr checks` green** before every PR.

---

## Why this structure (design decisions, explained)

- **A master index instead of one giant file.** An LLM works best with a short orienting entry point that routes to focused, single-purpose files. One monolith would blow context budget on every query and bury the routing logic. This mirrors how the repo already splits `docs/skills/` and `docs/prompts/`.
- **`AGENTS.md` is referenced, not regenerated.** It is checked in, project-authored, currently modified in the working tree, and is the declared source of truth (`CLAUDE.md` points to it). Overwriting it would destroy real content and invert the dependency direction. The correct move for a dedicated assistant is to make everything else *elaborate* it and never contradict it.
- **Only the four missing pieces were created** (Knowledge Base, Best Practices, Common Mistakes, Repository Map) plus this index and a standalone Review Checklist. The Architecture Guide, Coding Standards, Prompt Library, Skill Library, and Validation Checklist already exist from prior work; duplicating them would create drift between copies. Single-source-of-truth beats completeness-by-duplication.
- **The EDS-reality mapping is repeated in every doc, deliberately.** An LLM may load any single file without the others. Restating "no Java/HTL/OSGi → use the EDS equivalent" in each file guarantees the guardrail survives partial context loads. Redundancy here is a feature, not bloat.
- **Everything lives under `docs/` and is `.md`.** `.hlxignore` excludes `*.md`, so none of this documentation is ever served to site visitors — it's purely internal knowledge, with zero performance or security impact on the delivered site.
