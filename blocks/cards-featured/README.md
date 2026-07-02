# Cards Featured

"Popular Kotak Credit Cards" — a section header plus a grid of featured card
tiles. Each tile: card image, highlight banner, card name, feature/fee list,
a Compare link and an Apply button. Container + repeatable card items.

## Authoring fields (Universal Editor)

**Cards Featured (container)**

| Field | Type | Notes |
|-------|------|-------|
| Eyebrow | text | Small label above heading (e.g. "Popular Picks") |
| Heading | text | Section title |
| Description | text | Supporting line |
| Bottom CTA Link | aem-content | "Explore All Cards" target |
| Bottom CTA Text | text | Button label |

**Featured Card (item)**

| Field | Type | Notes |
|-------|------|-------|
| Card Image | reference | Card artwork (DAM); collapses with alt |
| Card Image Alt Text | text | Accessible alt |
| Highlight | text | Big benefit (e.g. "5% cashback"); part of the content group |
| Highlight Sub-text | text | Supporting line; content group |
| Card Name | text | e.g. "Kotak Cashback+ Card"; content group |
| Features & Fees | richtext | Bulleted feature list + fees; content group |
| Compare Link / Text | aem-content / text | Collapsed to one `<a>` |
| Apply Link / Text | aem-content / text | Collapsed to one `<a>` (red button) |

> Fields are grouped/collapsed to stay within the 4-cell block limit:
> image(+alt), a `content_*` group (highlight/sub/name/features), and the two
> links each collapsed with their text.

## Variations

None. Alternate emphasis (e.g. a "best value" ribbon) would be a
space-separated modifier on the item rather than a new block.

## Responsive behaviour

- **Mobile (base):** 1 card per row.
- **Tablet (≥600px):** 2 per row.
- **Desktop (≥900px):** 3 per row.

## da.live authoring sample

```
+-----------------------------------------------+
| Cards Featured                                |
+-----------------------------------------------+
| Popular Picks                                 |
+-----------------------------------------------+
| Popular Kotak Credit Cards                    |
+-----------------------------------------------+
| Curated based on popularity, benefits...      |
+-----------------------------------------------+
| [Explore All Cards](/en/.../all-cards)        |
+-----------------------------------------------+
| Explore All Cards                             |
+-----------------------------------------------+

+-----------------------------------------------+
| Featured Card                                 |
+-----------------------------------------------+
| ![Cashback+](/content/dam/kotak/credit-cards/featured/cashback-plus.png) |
+-----------------------------------------------+
| 5% cashback                                   |
+-----------------------------------------------+
| on all online spends — uncapped               |
+-----------------------------------------------+
| Kotak Cashback+ Card                          |
+-----------------------------------------------+
| - 5% cashback on online spends                |
| - 1% cashback on all other purchases          |
| - Fuel surcharge waiver up to ₹100/month      |
| - Joining fee: ₹500 · Annual fee: ₹500        |
+-----------------------------------------------+
| [Compare this card](/en/.../compare)          |
+-----------------------------------------------+
| Compare this card                             |
+-----------------------------------------------+
| [Apply Now](/en/.../apply)                    |
+-----------------------------------------------+
| Apply Now                                     |
+-----------------------------------------------+
```
(Repeat the Featured Card table for each card: Cashback+, League, Air.)

## DAM assets required

| Asset | Proposed DAM path | Alt text |
|-------|-------------------|----------|
| Cashback+ card | `/content/dam/kotak/credit-cards/featured/cashback-plus.png` | Kotak Cashback+ Credit Card |
| League card | `/content/dam/kotak/credit-cards/featured/league.png` | Kotak League Credit Card |
| Air card | `/content/dam/kotak/credit-cards/featured/air.png` | Kotak Air Credit Card |
