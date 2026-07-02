# CTA Banner

"Ready to take the next step?" — a full-bleed orange→red gradient band with a
heading and a single white Apply button. Used near the foot of the page.

## Authoring fields (Universal Editor)

| Field | Type | Notes |
|-------|------|-------|
| Heading | text | e.g. "Ready to take the next step?" |
| CTA Link / Text | aem-content / text | Collapsed to one white button |

## Variations

None. An alternate gradient (e.g. navy) would be a space-separated modifier
(`cta-banner cta-banner-navy`).

## Responsive behaviour

Centered content on all breakpoints; padding and heading size increase at
≥900px. Full-bleed (cancels section padding via `.cta-banner-wrapper`).

## da.live authoring sample

```
+-----------------------------------------------+
| CTA Banner                                    |
+-----------------------------------------------+
| Ready to take the next step?                  |
+-----------------------------------------------+
| [Apply Now](/en/.../apply)                    |
+-----------------------------------------------+
| Apply Now                                     |
+-----------------------------------------------+
```

## DAM assets required

None — the brand motif is an inline CSS SVG.
