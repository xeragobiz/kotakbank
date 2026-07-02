# Eligibility Checker

"Check your eligibility in 30 seconds" — a short multi-step quiz with a
progress bar. Renders one question at a time; selecting an answer advances to
the next; after the last question an authorable result panel with a CTA is
shown. Container + repeatable Question items.

## Authoring fields (Universal Editor)

**Eligibility Checker (container)**

| Field | Type | Notes |
|-------|------|-------|
| Eyebrow | text | e.g. "Quick Check" |
| Heading | text | Section title |
| Sub-heading | text | Supporting line |
| Result Heading | text | Shown after last question; part of result group |
| Result Message | richtext | Result body copy; result group |
| Result CTA Link / Text | aem-content / text | Collapsed to one CTA |

**Question (item)**

| Field | Type | Notes |
|-------|------|-------|
| Question | text | e.g. "What's your age?" |
| Answer Options | text | Comma-separated (e.g. `18-25 years, 26-40 years, 41-60 years, 60+ years`) |

## Behaviour

Client-side only. Progress bar fills as `(current+1)/total`. Any answer
advances (this is a guidance/qualification funnel, not a scored form). A
"Start over" button resets. No network calls, no layout shift.

## Variations

None. Logic (navigation, progress) is hardcoded; content is authorable.

## Responsive behaviour

- **Mobile (base):** answer options stacked 1-col.
- **Desktop (≥900px):** options in a 2-col grid; wider panel padding.

## da.live authoring sample

```
+-----------------------------------------------+
| Eligibility Checker                           |
+-----------------------------------------------+
| Quick Check                                   |
+-----------------------------------------------+
| Check your eligibility in 30 seconds          |
+-----------------------------------------------+
| Answer 4 quick questions to know if you qualify |
+-----------------------------------------------+
| You're likely eligible!                       |
+-----------------------------------------------+
| Based on your answers, you can apply for a     |
| Kotak credit card in minutes.                  |
+-----------------------------------------------+
| [Apply Now](/en/.../apply)                    |
+-----------------------------------------------+
| Apply Now                                     |
+-----------------------------------------------+

+-----------------------------------------------+
| Question                                      |
+-----------------------------------------------+
| What's your age?                              |
| 18-25 years, 26-40 years, 41-60 years, 60+ years |
+-----------------------------------------------+
```
(Repeat the Question table for each question. The 2nd cell is the
comma-separated options.)

## DAM assets required

None — this block uses no images.
