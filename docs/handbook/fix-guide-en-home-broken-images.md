# Fix Guide — Broken Images on `/en/home` (kotakbank-dev)

**Audience:** content authors (Universal Editor).
**Type:** authoring fix — **not** a code change.
**Page:** `/en/home` on **kotakbank-dev** — preview: `https://main--kotakbank-dev--xeragobiz.aem.page/en/home`

---

## What's wrong

The `/en/home` page has **26 images; 17 render correctly, 9 are broken.** The 9 broken ones show up in the delivered HTML as:

```html
<img src="about:error" alt="…">
```

`about:error` is what the delivery pipeline emits when an image's **asset reference is missing/unresolved in the author** — i.e. the image slot exists in the page but isn't pointing at a valid, published asset.

**This is a content problem, not a code problem.** Proof: 17 images on the *same page*, through the *same blocks*, resolve fine. Editing block code/CSS/JS will not fix it — the asset references must be re-linked in Universal Editor.

---

## The 9 images to fix

Locations are top→bottom in page order. Fix #1 first — it's the above-the-fold hero (impacts LCP / PageSpeed most).

| # | Block | Location on page | Current `alt` |
|---|---|---|---|
| 1 | `carousel-hero` | Hero slide — **"PERSONAL LOAN" / "Grab Personal Loan offers."** | `altPersonal` |
| 2 | `cards-product` | Product card — **"Business Lending"** | *(empty)* |
| 3 | `cards-story` / `columns-feature` | Stories section — story card image | *(empty)* |
| 4 | `cards-story` / `columns-feature` | Stories section — story card image | *(empty)* |
| 5 | `carousel-icons` | Help carousel — **"Visit Help Center"** icon | *(empty)* |
| 6 | `carousel-icons` | Help carousel — **"Locate us" / "Contact us"** icon | *(empty)* |
| 7 | `carousel-icons` | Help carousel — **"Report a fraud"** icon | *(empty)* |
| 8 | `cards-product` | Product card — **"3-IN-1 TRINITY ACCOUNT"** | *(empty)* |
| 9 | `cards-product` | Product card — second product-grid image | *(empty)* |

---

## How to fix (per image)

1. Open `/en/home` in **Universal Editor**.
2. Navigate to each block/section listed above and select the broken image.
3. **Re-select the asset** from the asset picker (the current reference is unresolved — pick the correct published image).
4. **Add descriptive `alt` text** — 7 of the 9 have empty alt, which is a WCAG/accessibility gap. (e.g. hero → "Personal loan offer"; card images → the product name.)
5. **Publish** the page.

---

## Verify after publishing

The broken count should drop to 0:

```bash
curl -s "https://main--kotakbank-dev--xeragobiz.aem.page/en/home.plain.html" | grep -c 'about:error'
# expect: 0
```

Or in the browser: no `about:error` image requests in the network panel, and all hero/card/icon images render.

---

## Why it matters

- **PageSpeed / `aem-psi-check`:** broken images = failed requests; the hero image (#1) affects **LCP** directly. This is the largest remaining PSI factor on the page.
- **Accessibility:** empty `alt` fails WCAG; fix while re-linking.
- **Content parity:** the migrated page should match the original design with all imagery present.

---

## Notes

- Do **not** attempt to fix by editing files under `content/` or the block JS/CSS — authored HTML comes from the AEM backend; the fix is the asset re-link in UE.
- Prod `kotakbank` `/en/home` is currently empty (`<div></div>`), so it's not a reference for the correct images — use the design/original Kotak811 page as the source of truth for which asset each slot should use.
