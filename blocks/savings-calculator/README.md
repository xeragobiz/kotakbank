# Savings Calculator

"How much could you save every month?" — spend-category sliders that estimate
monthly savings and surface the best-match Kotak card plus other
recommendations. Calculation is hardcoded; categories, cards, and cashback
rates are authorable. Client-side only, no network calls.

## Authoring fields (Universal Editor)

**Savings Calculator (container)**

| Field | Type | Notes |
|-------|------|-------|
| Eyebrow | text | e.g. "Personalised Estimate" |
| Heading | text | Section title |
| Sub-heading | text | Supporting line |

**Spend Category (item)** — one per slider

| Field | Type | Notes |
|-------|------|-------|
| Category Label | text | e.g. "Online Shopping" |
| Emoji / Icon | text | e.g. 🛍️ |
| Default Spend | number | Initial slider value |
| Min,Max,Step | text | e.g. `500,30000,500` |

**Calculator Card (item)** — the cards being compared

| Field | Type | Notes |
|-------|------|-------|
| Card Name | text | e.g. "Kotak Cashback+ Credit Card" |
| Badge \| Annual Fee | text | Pipe-separated, e.g. `Best for Cashback \| ₹550` |
| Cashback Rates % | text | Comma-separated, **one per category in category order** (e.g. `5,2,1,3`) |
| Apply Link / Text | aem-content / text | Collapsed to the apply button |

## How the calculation works

For each card, monthly savings = Σ (categorySpend × cardRate% / 100) across all
categories. The card with the highest total is the "Best match"; the rest are
listed under "Other Recommended Cards". Per-category "Save ₹X" reflects the
best card's rate. Recalculated live on every slider input; "Reset" restores
defaults.

## Variations

None. Logic is hardcoded; all data is authorable.

## Responsive behaviour

- **Mobile (base):** spend panel and result stacked; "other cards" 1-col.
- **Tablet (≥600px):** "other cards" 2-col.
- **Desktop (≥900px):** 2-column layout — spend panel left, red result card right.

## da.live authoring sample

```
+-----------------------------------------------+
| Savings Calculator                            |
+-----------------------------------------------+
| Personalised Estimate                         |
+-----------------------------------------------+
| How much could you save every month?          |
+-----------------------------------------------+
| Choose a profile or drag sliders to see savings |
+-----------------------------------------------+

+-----------------------------------------------+
| Spend Category                                |
+-----------------------------------------------+
| Online Shopping                               |
| 🛍️                                            |
| 8000                                          |
| 500,30000,500                                 |
+-----------------------------------------------+
(Repeat Spend Category for Dining, Travel, Groceries…)

+-----------------------------------------------+
| Calculator Card                               |
+-----------------------------------------------+
| Kotak Cashback+ Credit Card                   |
| Best for Cashback \| ₹550                     |
| 5,2,1,1                                        |
+-----------------------------------------------+
| [Apply Now](/en/.../apply)                    |
+-----------------------------------------------+
| Apply for Kotak Cashback+                     |
+-----------------------------------------------+
(Repeat Calculator Card for each card being compared.)
```

## DAM assets required

None — emojis are used for category icons; no images.
