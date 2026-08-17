# Lesson 14 — Migration Engineering (Import Pipeline)

> Tier 5 · Advanced & Architecture · Prerequisites: Lessons 02–09

## 1. Theory

Most real EDS work is **migration**: taking an existing site (built on WordPress, AEMaaCS, a custom stack, whatever) and reproducing it as EDS content + blocks. The challenge is turning arbitrary, messy source HTML into **clean, block-structured EDS content** that authors can then own.

The pipeline is a **transform**: `source HTML → cleaned DOM → sectioned/blockified DOM → EDS content (docs/DA) + block code`. It is scripted (Node under `tools/importer/`), repeatable, and **never hand-authored** — because a migration touches hundreds of pages and must be re-runnable as source or mapping evolves.

Core stages:
1. **Scrape/collect** source pages (and their assets/metadata).
2. **Analyze** page structure — identify sections and, within each, the content sequences that map to blocks vs default content.
3. **Map** each recognized pattern to an EDS block (existing or new) — the **page template** records these mappings.
4. **Parse** — per-block **parser** functions extract the right cells from source DOM into the block's table structure.
5. **Transform** — page-level **transformers** clean junk, build sections, handle images (e.g. Dynamic Media/Scene7).
6. **Import** — a bundled import script emits EDS content files (into `content/`, via tooling — not by hand).
7. **Verify** — preview and compare against the original for parity.

## 2. Architecture

```
tools/importer/
├── parsers/<variant>.js        # extract block cells from source DOM  (one per block variant)
├── transformers/*.js           # page cleanup, section building, DM/Scene7 image handling
├── page-templates.json         # template skeletons: name, URLs, description, blocks[] + DOM selectors
├── reports/                    # analysis artifacts
└── <bundle>.js                 # bundled import script (combines template + parsers + transformers)
```

```
 source URL ──scrape──► cleaned.html ──analyze──► page-templates.json (sections, block mappings)
                                                        │
                                     parsers + transformers apply per template
                                                        ▼
                                run-bulk-import ──► EDS content (content/*, images)
                                                        ▼
                                     preview on localhost:3000 ──► compare to original
```

**Roles:** *page analysis* identifies structure and block variants; *block mapping* records DOM selectors per variant in `page-templates.json`; *import infrastructure* generates parsers/transformers; *import script* runs them in bulk. Each is a discrete, verifiable step.

## 3. Engineering rationale

**Why script the migration instead of hand-authoring?** Scale and repeatability. A hand-migrated page can't be regenerated when you fix a block or the source changes; a scripted pipeline re-runs across the whole site deterministically. It also forces *consistency* — the same source pattern maps to the same block everywhere.

**Why separate parsers (per block) from transformers (per page)?** Separation of concerns. A parser answers "given this block's source DOM, which cells go where?"; a transformer answers "how do I clean this page, split sections, and fix images?" Keeping them apart lets you reuse a parser across templates and a transformer across blocks.

**Why "content-first" still applies?** You migrate *content into blocks*, then let authors own it. The output must be authorable EDS content, not a frozen HTML dump — otherwise you've just moved the maintenance problem.

**Why fidelity via dedicated blocks (the k811 rationale)?** When a source page has bespoke design/animation that would pollute a shared block if force-fit, build a **dedicated block** (e.g. `k811-hero`, `k811-story`) rather than overloading `hero`. This trades a few extra blocks for faithful reproduction and a clean shared-block surface — a deliberate architectural call (Lesson 16).

**Why never hand-edit `content/`?** It's generated. A manual fix is silently lost on the next import run; the fix belongs in the parser/transformer/template.

## 4. Examples

**A block parser (extracts cells from source DOM):**
```js
// tools/importer/parsers/heroCentered.js
export default function parse(el, { document }) {
  const img = el.querySelector('img');
  const heading = el.querySelector('h1, h2');
  const cta = el.querySelector('a.btn');
  // return rows→cells matching the block's table contract
  return [
    [img ? img.cloneNode(true) : ''],
    [heading ? heading.textContent : ''],
    [cta ? cta.cloneNode(true) : ''],
  ];
}
```

**A transformer (page cleanup + sectioning):**
```js
// tools/importer/transformers/cleanup.js
export default function transform({ document }) {
  document.querySelectorAll('script, style, .cookie-banner, .ads').forEach((n) => n.remove());
  // insert <hr> between top-level regions to create EDS sections
}
```

**Page template mapping (`page-templates.json`, shape):**
```json
{
  "name": "landing",
  "urls": ["/811", "/save"],
  "description": "Marketing landing with hero + pillars + offers",
  "blocks": [
    { "name": "k811-hero",   "selector": "section.hero" },
    { "name": "k811-pillars","selector": "section.pillars" }
  ]
}
```

## 5. Hands-on exercises

1. **Stage the pipeline.** List the seven stages from source URL to verified page, one sentence each.
2. **Write a parser.** For a source testimonial (`<figure><img><blockquote><figcaption>`), write a parser returning the cells for a `testimonial` block.
3. **Parser vs transformer.** Classify each task: remove tracking scripts; extract card cells; split the page into sections; map an image to Dynamic Media. Which file type owns it?
4. **Dedicated vs shared.** A source hero has a Lottie animation and art-directed images. Argue for a dedicated `k811-hero` vs extending `hero`.
5. **Re-run safety.** Explain what happens if someone hand-edits a migrated `content/` page and the import is re-run.

## 6. Common mistakes

- **Hand-editing `content/`** — lost on re-import.
- **Position-based parsers** that break on source variation (classify by content).
- **One giant transformer** doing parsing too — mixing concerns.
- **Force-fitting a shared block** for a bespoke design, polluting it for every other page.
- **Skipping parity verification** against the original.
- **Not handling images/DM/Scene7**, shipping broken or huge assets.

## 7. Review questions

1. Why is migration scripted rather than hand-authored?
2. What's the difference in responsibility between a parser and a transformer?
3. What does `page-templates.json` record, and who consumes it?
4. When is a dedicated block the right call over extending a shared one?
5. Why must `content/` never be hand-edited?

## 8. Best practices

- **Analyze → map → generate infra → import → verify**, as discrete steps.
- **One parser per block variant; page-level cleanup in transformers.**
- **Classify source DOM by content**, tolerate variation.
- **Reuse blocks via similarity matching**; create dedicated blocks only for fidelity that would pollute shared ones.
- **Verify parity** on preview at mobile/tablet/desktop.
- **Keep the pipeline re-runnable**; put every fix in the scripts, never in `content/`.

## 9. Anti-patterns

- **Manual, one-off page conversion** that can't be regenerated.
- **Hand-edited generated content.**
- **Monolithic import script** with no parser/transformer separation.
- **Block explosion** from mapping every source quirk to a new block instead of variants.
- **Ignoring assets/metadata**, producing incomplete pages.

---

**Next:** [Lesson 15 — Integrations, Personalization & Martech →](lesson-15-integrations.md)
