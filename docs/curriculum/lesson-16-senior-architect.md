# Lesson 16 — Senior Architect: System Design, Governance & Trade-offs

> Tier 5 · Advanced & Architecture · Prerequisites: Lessons 01–15 (all)

## 1. Theory

A senior EDS architect is judged not by writing a block, but by the **decisions that shape a whole program**: block taxonomy, shared vs dedicated components, performance budgets, governance of a multi-team/multi-brand codebase, and knowing when EDS is the *wrong* tool. This capstone lesson is about **judgment and trade-offs**, not new APIs.

The architect's mandate in EDS:
- **Protect the content-first, fast-by-default guarantees** as the site scales to hundreds of pages and many contributors.
- **Curate the block library** so it stays small, composable, and authorable — resisting both block explosion and god-blocks.
- **Set and defend budgets** (performance, JS payload, dependency count, accessibility).
- **Design the authoring model** so non-technical teams can move fast without breaking things.
- **Decide the boundaries**: what's a variant, what's a dedicated block, what's a separate app, what doesn't belong in EDS at all.

## 2. Architecture — decisions at the system level

### The block taxonomy decision (the central architectural tension)

```
                     Need a component look/behavior
                                │
                 ┌──────────────┼───────────────────────┐
                 ▼              ▼                         ▼
        Existing block   Existing block + variant   Genuinely new need
        fits as-is?      (select / class) covers?    │
             │                  │             ┌───────┴────────┐
            USE IT           ADD VARIANT       ▼                ▼
                                        Shared block      Dedicated block
                                        (broad reuse,     (bespoke fidelity that
                                         low fidelity      would pollute a shared
                                         risk)             block — the k811 rule)
```

**The rule this project encodes:** prefer reuse → variant → shared block; create a **dedicated `k811-*` block** only when force-fitting would pollute a shared block used across many pages. A change to `hero`/`cards`/`columns` can break every page that uses them, so shared blocks get **additive, backward-compatible changes only**.

### Governance surfaces

| Surface | Architect's responsibility |
|---|---|
| Shared blocks (`hero`, `cards`, `columns`…) | Backward-compat contract; regression-test all consumers on change |
| Dedicated block family (`k811-*`) | Shared runtime + scoped design guide; consistent motion/tokens |
| `scripts/aem.js` | Never modified; the platform boundary |
| Global files (`scripts.js`, `styles.css`, `head.html`, CSP) | Change with system-wide impact review |
| Component models (`_*.json`) | Long-lived author contract; schema-grade review |
| Performance budget | LCP/CLS/INP + JS-KB ceiling enforced per PR (PSI) |
| CI gates | Lint + JSON-sync as non-negotiable quality floor |

### Multi-brand / multi-team scaling

- **Theme/template metadata** (Lesson 10) scopes design under a body/main class → one repo, many brands.
- **Scoped design guides** (`main.kotak811`) + a **shared runtime** (`k811-common.js`) keep a family consistent without leaking into others.
- **Ownership boundaries**: who owns shared blocks vs a brand's dedicated family; PR review routing follows those lines.

## 3. Engineering rationale (the trade-offs a senior owns)

**Reuse vs fidelity.** Maximal reuse minimizes code but risks either a god-block (many flags) or infidelity (design compromised to fit). Maximal dedication maximizes fidelity but risks block explosion and duplicated maintenance. The senior call is *where the line sits per component*: broad, low-risk patterns → shared + variants; hero/brand-defining, animation-heavy, per-campaign pieces → dedicated. The k811 family is the codified answer for this project.

**Shared-block change risk.** Because shared blocks are used everywhere, every change is a potential site-wide regression. The discipline: additive/backward-compatible only, feature-flag via variant, smoke-test consumers. When a change *can't* be backward-compatible, it's often a signal to fork a dedicated block instead.

**Performance budget vs feature richness.** Each dependency, animation library, and eager-phase addition spends the LCP/INP budget. The architect sets a ceiling (e.g. "no eager third-party JS; prefer the ~2KB IntersectionObserver over animation libs; justify every runtime dependency in KB") and enforces it at PR time via PSI. Saying *no* to a heavy library is core to the role.

**Authoring ergonomics vs engineering convenience.** A model that's easy to code against may be miserable to author (layout-encoded fields), and vice versa. The architect optimizes for the *author* (the model is their UI and a long-lived contract), accepting more decoration complexity in code.

**When EDS is the wrong tool.** EDS excels at content/marketing sites with mostly-static, cacheable pages. It is a poor fit for a heavy per-user application shell (a trading terminal, a logged-in dashboard with dense real-time state). The senior recognizes this boundary and isolates such an app *behind* or *beside* EDS rather than forcing EDS to be a SPA platform — protecting the fast content site from the app's weight.

**Build/no-build discipline.** Reintroducing a bundler/transpiler "for DX" trades away the platform's simplicity and reviewability and invites drift. The architect defends the no-build model unless there is an overwhelming, quantified reason.

## 4. Examples

**A backward-compatible shared-block change (safe):**
```js
// hero.js — add an OPTIONAL variant; existing pages unaffected
export default function decorate(block) {
  const isSplit = block.classList.contains('split');   // new, opt-in via variant
  // …existing behavior unchanged when the class is absent…
}
```

**A change that should become a dedicated block instead (unsafe to force):**
```
Request: "hero must support a Lottie animation, art-directed portrait images,
          scroll-reveal, and campaign-specific copy anchoring."
Decision: build k811-hero (dedicated) — force-fitting these into shared `hero`
          would add 6+ flags and risk every page using `hero`.
```

**A performance budget statement (architect-authored, enforced in PR review):**
```
- LCP < 2.5s, CLS < 0.1, INP < 200ms on the *.aem.page preview (PSI).
- No third-party JS in eager/lazy; all martech in delayed.js.
- New runtime dependency requires KB justification + review.
- Animations: transform/opacity only; prefers-reduced-motion mandatory.
```

## 5. Hands-on exercises

1. **Taxonomy review.** Given ten requested "components," classify each as reuse / variant / shared-block / dedicated-block, and defend three of the hard calls.
2. **Regression plan.** You must add a required field to a shared `cards` block used on 40 pages. Write the plan to do it without breaking existing content (hint: it probably shouldn't be *required*, or shouldn't be `cards`).
3. **Budget enforcement.** A team wants a 90KB carousel library for one campaign page. Write your decision and the alternative you'd propose.
4. **Boundary call.** Product asks to build a logged-in, real-time portfolio dashboard "in EDS." Write a one-page recommendation on whether/how it belongs, and where the boundary goes.
5. **Governance doc.** Draft ownership + review routing for a repo with shared blocks, a `k811-*` family, and a second brand family.
6. **Migration architecture.** For a 500-page migration, design the template/block strategy that maximizes reuse while preserving fidelity on the top 10 marketing pages.

## 6. Common mistakes (senior-level)

- **Letting the block library sprawl** (dozens of near-duplicates) — no curation.
- **God-blocks** with a dozen boolean flags instead of dedicated blocks.
- **Breaking shared blocks** with non-backward-compatible changes.
- **No performance budget**, so scores erode PR by PR.
- **Optimizing the model for coders, not authors.**
- **Forcing EDS to be a SPA platform** for an app that doesn't belong.
- **Reintroducing a build pipeline** without quantified justification.

## 7. Review questions

1. State the reuse → variant → shared → dedicated decision ladder and the rule for the last step.
2. Why are shared-block changes uniquely risky, and what discipline mitigates it?
3. How does one repo serve multiple brands while keeping families isolated?
4. What performance and dependency budgets would you set and enforce, and how?
5. Describe a scenario where EDS is the wrong tool and how you'd architect around it.
6. Why optimize the content model for authors over engineering convenience?

## 8. Best practices (architect)

- **Curate a small, composable block library**; reuse and variants before new blocks.
- **Dedicated blocks for bespoke fidelity** (the k811 rule); shared blocks change additively only.
- **Set explicit budgets** (CWV, JS-KB, deps, a11y) and enforce them at PR via PSI + review.
- **Treat models as schemas** and optimize for authors.
- **Defend the platform guarantees**: no-build, content-first, fast-by-default, `aem.js` untouched, CSP intact.
- **Know EDS's edges** and isolate non-fitting apps rather than bending EDS.
- **Document ownership and review routing**; regression-test shared-block consumers.

## 9. Anti-patterns (architect)

- **Block explosion or god-blocks** — both signal a missing taxonomy.
- **Site-wide-breaking changes** to shared blocks.
- **Score erosion** from an unmanaged performance budget.
- **Turning EDS into a framework SPA** or reintroducing heavy build tooling.
- **Author-hostile models** that require re-authoring on every redesign.
- **Fragmented, undocumented governance** across teams/brands.

---

## Congratulations — curriculum complete

You now have the full arc: from *what EDS is* (Lesson 01) through building blocks, authoring, performance, accessibility, quality gates, migration, integrations, and finally **architectural judgment**. A senior EDS architect's edge is not memorized APIs but the ability to **defend the platform's guarantees while making the right reuse/fidelity/performance trade-offs at scale.**

**Continue with:** [Appendix — Glossary & Command Reference →](appendix-glossary.md)
