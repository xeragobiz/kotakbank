# FAQ Accordion

"Frequently Asked Questions" — a heading and a list of expandable
question/answer rows. Built on semantic `<details>/<summary>` so it works
without JS; the first item is open by default and opening one closes the
others. Container + repeatable FAQ items.

## Authoring fields (Universal Editor)

**FAQ Accordion (container)**

| Field | Type | Notes |
|-------|------|-------|
| Heading | text | Section title |

**FAQ Item (item)**

| Field | Type | Notes |
|-------|------|-------|
| Question | text | The question (summary) |
| Answer | richtext | The answer (supports paragraphs + links) |

## Behaviour

Native `<details name="faq-accordion">` gives single-open behaviour in modern
browsers; a JS `toggle` fallback closes siblings where `name` is unsupported.
Fully keyboard-accessible and works with JS disabled.

## Accessibility / SEO

Semantic disclosure widget; heading hierarchy preserved. Consider adding
FAQPage structured data at the page level if rich results are desired.

## Variations

None.

## Responsive behaviour

Single column at all breakpoints; padding and question size increase at ≥900px.

## da.live authoring sample

```
+-----------------------------------------------+
| FAQ Accordion                                 |
+-----------------------------------------------+
| Frequently Asked Questions                    |
+-----------------------------------------------+

+-----------------------------------------------+
| FAQ Item                                      |
+-----------------------------------------------+
| What is a Credit Card?                         |
| A credit card is a transactional card that     |
| enables the holder to make purchases...        |
+-----------------------------------------------+
```
(Repeat the FAQ Item table per question. 1st cell = question, 2nd = answer.)

## DAM assets required

None — the chevron icon is drawn in CSS.
