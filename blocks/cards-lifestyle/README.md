# Cards Lifestyle

"A Credit Card for every need" — a filterable card grid. A row of filter tabs
lets users narrow cards by reward type / spend category. Each card carries
comma-separated tags; clicking a tab shows only matching cards ("All" shows
everything). Container + repeatable card items.

## Authoring fields (Universal Editor)

**Cards Lifestyle (container)**

| Field | Type | Notes |
|-------|------|-------|
| Heading | text | Section title |
| Sub-heading | text | Supporting line |
| Filter Tabs | text | Comma-separated labels; first is the default (e.g. `All, Cashback, Points, Miles, Business, Lifetime Free`) |

**Lifestyle Card (item)** — grouped/collapsed to 3 cells

| Field | Type | Notes |
|-------|------|-------|
| Card Image / Alt | reference / text | Collapsed to one image |
| Card Name | text | content group |
| Badge | text | e.g. "Best for Cashback"; content group |
| Fees | text | e.g. "Joining: ₹500 \| Annual: ₹500"; content group |
| Features | richtext | Bulleted list; content group |
| Filter Tags | text | Comma-separated; **must match tab labels** so filtering works; content group |
| Apply Link / Text | aem-content / text | Collapsed to the red Apply button |

## Behaviour

Client-side filtering only (show/hide) — no network calls. Tab `aria-selected`
reflects the active filter. Tags are matched case-insensitively.

## Variations

None. A "grid vs. list" density toggle would be a space-separated modifier.

## Responsive behaviour

- **Mobile (base):** 1 card per row; filter tabs scroll horizontally.
- **Tablet (≥600px):** 2 per row.
- **Desktop (≥900px):** 4 per row.

## da.live authoring sample

```
+-----------------------------------------------+
| Cards Lifestyle                               |
+-----------------------------------------------+
| A Credit Card for every need                  |
+-----------------------------------------------+
| Browse by lifestyle — find exactly what works |
+-----------------------------------------------+
| All, Cashback, Points, Miles, Business, Lifetime Free |
+-----------------------------------------------+

+-----------------------------------------------+
| Lifestyle Card                                |
+-----------------------------------------------+
| ![Cashback+](/content/dam/kotak/credit-cards/lifestyle/cashback-plus.png) |
+-----------------------------------------------+
| Kotak Cashback+ Credit Card                   |
| Best for Cashback                             |
| Joining: ₹500 \| Annual: ₹500                 |
| - 5% cashback on online spends                |
| - 1% cashback on all other purchases          |
| - Fuel surcharge waiver up to ₹100/month      |
| Cashback, Shopping                            |
+-----------------------------------------------+
| [Apply Now](/en/.../apply)                    |
+-----------------------------------------------+
| Apply Now                                     |
+-----------------------------------------------+
```
(Repeat the Lifestyle Card table per card. The last paragraph in the content
cell is the comma-separated Filter Tags.)

## DAM assets required

| Asset | Proposed DAM path | Alt text |
|-------|-------------------|----------|
| Cashback+ | `/content/dam/kotak/credit-cards/lifestyle/cashback-plus.png` | Kotak Cashback+ Credit Card |
| League Platinum | `/content/dam/kotak/credit-cards/lifestyle/league-platinum.png` | League Platinum Credit Card |
| Kotak Air+ | `/content/dam/kotak/credit-cards/lifestyle/air-plus.png` | Kotak Air+ Credit Card |
| IndianOil Kotak | `/content/dam/kotak/credit-cards/lifestyle/indianoil.png` | IndianOil Kotak Credit Card |
| Kotak Classic | `/content/dam/kotak/credit-cards/lifestyle/classic.png` | Kotak Classic Credit Card |
