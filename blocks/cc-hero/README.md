# CC Hero

Full-bleed banner with a background image and overlaid heading, subtext, and up to two CTAs (primary + secondary). Used as the top section of the Credit Cards page.

## Authoring fields (Universal Editor)

| Field | Type | Notes |
|-------|------|-------|
| Background Image | reference | LCP image; loaded eagerly with `fetchpriority="high"` |
| Background Image Alt Text | text | Accessible alt for the background image |
| Heading & Text | richtext | `<h1>` red heading + subtext paragraph |
| Primary CTA Link | aem-content | Target for the primary (red, filled) button |
| Primary CTA Text | text | Label for the primary button |
| Secondary CTA Link | aem-content | Target for the secondary (outline) button |
| Secondary CTA Text | text | Label for the secondary button |

## Variations

None yet. Future light/dark overlay variants would be added as space-separated
class modifiers (e.g. `cc-hero cc-hero-dark`) rather than a new block.

## Responsive behaviour

- **Mobile (base):** content padded over the image; image aspect-ratio `390/300`; title at `--heading-font-size-l`.
- **Desktop (≥900px):** wide banner aspect-ratio `1440/444`; content constrained to the left (max 620px); title at `--heading-font-size-xl` (44px).

## da.live authoring sample

Author as a single-row block table. First cell = background image; the body
holds heading/subtext; CTAs are authored as links.

```
+-----------------------------------------------------------+
| CC Hero                                                   |
+-----------------------------------------------------------+
| ![Credit cards](/content/dam/kotak/credit-cards/hero/credit-cards-hero.jpg) |
+-----------------------------------------------------------+
| # Enjoy Travel, Cashback, and Zero Joining Fee            |
| with Kotak Credit Cards                                   |
+-----------------------------------------------------------+
| [Find My Card](/en/personal-banking/cards/credit-cards/apply) |
+-----------------------------------------------------------+
| Find My Card                                              |
+-----------------------------------------------------------+
| [Check Eligibility](/en/personal-banking/cards/credit-cards/eligibility) |
+-----------------------------------------------------------+
| Check Eligibility                                         |
+-----------------------------------------------------------+
```

## DAM assets required

| Asset | Proposed DAM path | Alt text |
|-------|-------------------|----------|
| Hero background (card fan on scene) | `/content/dam/kotak/credit-cards/hero/credit-cards-hero.jpg` | Enjoy Travel, Cashback and Zero Joining Fee with Kotak Credit Cards |
