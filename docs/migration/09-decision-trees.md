# 09 · Decision Trees (Consolidated)

Every migration fork in one place, as Mermaid trees. Use this as the quick-reference; the detail lives in the linked documents.

## A. Master migration flow
```mermaid
flowchart TD
  START["Enterprise site to migrate"] --> DISC["Discover URLs + group into templates (01)"]
  DISC --> ING["Pick ingestion per source (02)"]
  ING --> ANA["Two-level analysis: sections + sequences (01)"]
  ANA --> CLS["Classify each sequence (tree B)"]
  CLS --> BLK["Select block or default content (tree C)"]
  BLK --> SEC["Create sections + author model (04)"]
  SEC --> INFRA["Generate parsers/transformers/templates (08)"]
  INFRA --> IMP["Deterministic import (08)"]
  IMP --> VER["Verify: parity, perf, SEO, a11y (07)"]
  VER --> RED["Metadata + redirects (06)"]
  RED --> LAUNCH["Publish + crawl-test + monitor"]
```

## B. Structured vs unstructured
```mermaid
flowchart TD
  S["Content sequence"] --> Q1{"Repeating uniform records?"}
  Q1 -- yes --> STR["Structured → block with item model"]
  Q1 -- no --> Q2{"Composite unit, mixed named fields?"}
  Q2 -- yes --> SEMI["Semi-structured → block with fields"]
  Q2 -- no --> Q3{"Free-form prose/media?"}
  Q3 -- yes --> DC["Unstructured → default content (no block)"]
  Q3 -- unclear --> ASK["Describe neutrally, re-evaluate / ask"]
```

## C. Block selection & reuse
```mermaid
flowchart TD
  T["Classified sequence"] --> M{"Existing block matches shape?"}
  M -- ">=80%" --> REUSE["Reuse block"]
  M -- "close" --> VAR["Reuse via variant / select option"]
  M -- "no + fidelity critical" --> NEW["Create dedicated block"]
  M -- "no + generic" --> GEN["Generic block (cards/columns/table)"]
  REUSE --> DONE["Map in page-templates.json"]
  VAR --> DONE
  NEW --> DONE
  GEN --> DONE
```

## D. Pattern → block
```mermaid
flowchart TD
  P["Pattern"] --> D{"Which?"}
  D -- "data grid" --> TBL["table / published .json"]
  D -- "repeating promos" --> CARDS["cards (+variant)"]
  D -- "inputs+submit" --> FORM["form → Adaptive Form JSON"]
  D -- "expand rows" --> ACC["accordion"]
  D -- "switch panels" --> TABS["tabs"]
  D -- "Q&A" --> FAQ["faq-accordion (+FAQ JSON-LD)"]
  D -- "banner+CTA" --> HERO["hero (LCP-aware)"]
  D -- "slides" --> CAR["carousel (a11y care)"]
  D -- "prose" --> DEF["default content"]
```

## E. Source ingestion
```mermaid
flowchart TD
  SRC["Source"] --> W{"Type?"}
  W -- "live HTML" --> H["Scrape rendered DOM (+interact for hover content)"]
  W -- "CMS w/ API" --> C["Structured export; map content types"]
  W -- "PDF" --> P{"Document or page?"}
  P -- "document" --> KEEP["Keep as linked asset"]
  P -- "page" --> EXT["Extract → rebuild as sections/blocks"]
  W -- "Word .docx" --> DOC["Convert to MD/HTML; clean noise"]
  W -- "tabular data" --> DAT["Publish .json / query-index"]
```

## F. PDF disposition
```mermaid
flowchart TD
  PDF["PDF"] --> Q{"Is it web content in the wrong format?"}
  Q -- "no (report/brochure/form)" --> ASSET["Downloadable asset + metadata + link"]
  Q -- "yes" --> R["Extract text/headings/tables/images"]
  R --> H{"Has data tables?"}
  H -- yes --> T["Tables → table block; prose → default content"]
  H -- no --> D["All → sections + default content"]
```

## G. Navigation
```mermaid
flowchart TD
  NAV["Navigation"] --> Q{"Structure?"}
  Q -- "simple links" --> S["Nav fragment (link list)"]
  Q -- "dropdowns" --> D["Model groups+children; header block"]
  Q -- "megamenu" --> M["Playwright hover to extract full tree; model panels"]
  S --> A["header block + a11y (keyboard/ARIA) + mobile drawer"]
  D --> A
  M --> A
```

## H. Redirects
```mermaid
flowchart TD
  OLD["Old URL"] --> C{"Path changes?"}
  C -- no --> KEEP["No redirect"]
  C -- yes --> E{"Equivalent exists?"}
  E -- yes --> R1["301 → new URL"]
  E -- consolidated --> R2["301 → closest page"]
  E -- no --> H{"Traffic/backlinks?"}
  H -- yes --> R3["301 → parent/category"]
  H -- no --> G["410 / 404"]
```

## I. Block vs default content (the anti-over-engineering check)
```mermaid
flowchart TD
  X["About to make a block"] --> Q1{"Is there a repeating/composite shape?"}
  Q1 -- no --> STOP["STOP → default content"]
  Q1 -- yes --> Q2{"Do authors need to edit it as fields?"}
  Q2 -- no --> STOP
  Q2 -- yes --> Q3{"Existing block covers it?"}
  Q3 -- yes --> REUSE["Reuse/variant"]
  Q3 -- no --> BUILD["Build block (justified)"]
```

## J. Verification gate (before sign-off per page)
```mermaid
flowchart TD
  V["Migrated page"] --> P{"PSI ~100 @ 3 widths?"}
  P -- no --> FIXP["Fix perf (07) → re-check"]
  P -- yes --> A{"a11y: headings/alt/kbd/ARIA/contrast?"}
  A -- no --> FIXA["Fix a11y (07) → re-check"]
  A -- yes --> S{"SEO: metadata/redirects/structured data/crawlable?"}
  S -- no --> FIXS["Fix SEO (06/07) → re-check"]
  S -- yes --> PAR{"Visual + content parity?"}
  PAR -- no --> FIXV["Iterate block/CSS → re-check"]
  PAR -- yes --> OK["Author-check → PR with preview link"]
```

## Why a consolidated tree document
During a live migration, the operator (human or assistant) needs the *fork*, fast, without re-reading prose. These trees are the executable spine; each links back to the document that explains the reasoning. Keep this open while migrating.
