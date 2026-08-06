# Adobe Edge Delivery Services — Complete Training Curriculum

A structured, ground-up curriculum for an engineer (human or AI) who knows **nothing** about Adobe Edge Delivery Services (EDS, also known as Adobe Helix / "Franklin" / `aem.live`). It begins at first principles and ends at **senior-architect** level: system design, governance, and trade-off reasoning.

## How to use this curriculum

- Lessons are **sequential** — each builds on the last. Do not skip.
- Every lesson follows the **same nine-part structure**:
  1. **Theory** — the concepts and mental model.
  2. **Architecture** — where this fits in the system and how data/control flows.
  3. **Engineering rationale** — *why* it was designed this way (the trade-offs).
  4. **Examples** — concrete, runnable code/markup.
  5. **Hands-on exercises** — do-it-yourself tasks.
  6. **Common mistakes** — what learners get wrong.
  7. **Review questions** — self-check (answers in the appendix files where provided).
  8. **Best practices** — what expert teams actually do.
  9. **Anti-patterns** — what to never do, and why.
- Code examples use **vanilla JS (ES6+), CSS3, and JSON** — the only languages EDS uses. There is no Java, no build/transpile step, no framework.

## Curriculum map

### Tier 1 — Foundations (mental model)
- **Lesson 01** — [What EDS Is and Why It Exists](lesson-01-what-is-eds.md)
- **Lesson 02** — [The Content-First Authoring Model (Documents & DA)](lesson-02-content-authoring.md)
- **Lesson 03** — [Sections, Blocks, and the DOM Contract](lesson-03-sections-blocks-dom.md)

### Tier 2 — Core Engineering
- **Lesson 04** — [Project Anatomy & the Boilerplate](lesson-04-project-anatomy.md)
- **Lesson 05** — [Block Development: the `decorate()` Function](lesson-05-block-development.md)
- **Lesson 06** — [CSS Architecture & Responsive Design](lesson-06-css-architecture.md)
- **Lesson 07** — [The Three-Phase Loading Model (E-L-D)](lesson-07-three-phase-loading.md)

### Tier 3 — Authoring & Universal Editor (xwalk)
- **Lesson 08** — [Universal Editor & Component Models](lesson-08-universal-editor.md)
- **Lesson 09** — [Content Modeling for Authors](lesson-09-content-modeling.md)
- **Lesson 10** — [Metadata, Indexing, Sitemaps & Configuration](lesson-10-metadata-indexing.md)

### Tier 4 — Performance, Quality & Delivery
- **Lesson 11** — [Performance Engineering — "Keeping it 100"](lesson-11-performance.md)
- **Lesson 12** — [Accessibility & Progressive Enhancement](lesson-12-accessibility.md)
- **Lesson 13** — [Testing, Linting & CI/CD](lesson-13-testing-cicd.md)

### Tier 5 — Advanced & Architecture
- **Lesson 14** — [Migration Engineering (Import Pipeline)](lesson-14-migration.md)
- **Lesson 15** — [Integrations, Personalization & Martech](lesson-15-integrations.md)
- **Lesson 16** — [Senior Architect: System Design, Governance & Trade-offs](lesson-16-senior-architect.md)

### Appendix
- [Glossary & Command Reference](appendix-glossary.md)

## Prerequisites

- Comfortable with **HTML, CSS, and JavaScript**.
- Basic **Git** and command line.
- **Node.js 20** installed for local development.
- No prior AEM knowledge required (in fact, traditional AEMaaCS knowledge can *mislead* you — see Lesson 01).

---

*This curriculum reflects EDS as practiced on real migration projects. Where a topic maps to a traditional AEM concept that does **not** exist in EDS, the lesson says so explicitly.*
