# Testimonials

"Credit Cards that everyone is talking about" — a heading and a carousel of
customer review cards (name, star rating, review text, review date).
Container + repeatable Review items.

## Authoring fields (Universal Editor)

**Testimonials (container)**

| Field | Type | Notes |
|-------|------|-------|
| Heading | text | Section title |

**Review (item)**

| Field | Type | Notes |
|-------|------|-------|
| Reviewer Name | text | e.g. "Sudhanshu" |
| Rating (1-5) | number | Fills that many gold stars |
| Review Text | richtext | The quote |
| Reviewed On | text | e.g. "Reviewed on 06/02/2022" |

## Behaviour

Scroll-snap carousel; prev/next arrows scroll by one card. Stars are drawn via
CSS (no image assets). `aria-label` announces "N out of 5 stars".

## Variations

None.

## Responsive behaviour

- **Mobile (base):** 1 card per view.
- **Tablet (≥600px):** 2 per view.
- **Desktop (≥900px):** 3 per view.

## da.live authoring sample

```
+-----------------------------------------------+
| Testimonials                                  |
+-----------------------------------------------+
| Credit Cards that everyone is talking about   |
+-----------------------------------------------+

+-----------------------------------------------+
| Review                                        |
+-----------------------------------------------+
| Sudhanshu                                     |
| 5                                             |
| Utilised card for online shopping, fuel...    |
| Reviewed on 06/02/2022                        |
+-----------------------------------------------+
```
(Repeat the Review table per testimonial.)

## DAM assets required

None — star icons are drawn in CSS.
