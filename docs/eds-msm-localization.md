# Multi-language ("MSM"-style) Localization in Edge Delivery Services

This project uses **AEM Edge Delivery Services (EDS)**, which has **no built-in
Multi Site Manager (MSM)** — there are no blueprints, live copies, rollout
configs or inheritance the way AEM Sites has. Instead we reproduce the *intent*
of MSM with a lightweight, convention-based pattern:

> **One shared codebase + a locale-prefixed content tree.**
> All blocks, styles and scripts are shared across every locale (the
> "rolled-out" code layer). Only **content**, **placeholders**, and the
> **nav/footer** fragments differ per locale.

## MSM → EDS concept mapping

| AEM MSM concept | EDS equivalent here |
|---|---|
| Blueprint / master site | The **default locale** (`en`) content tree — lives at the site root |
| Live Copy | A parallel locale tree (`/hi`, `/ar`, …) with the **same logical page paths** |
| Rollout / inheritance | Shared code is automatic (one repo). Content is copied + translated by authors. Missing nav/footer falls back to the default locale. |
| "Components stay in sync" | Shared blocks in `blocks/` render identically in every locale |
| Language Copy | Locale folders + per-locale `placeholders.json`, `nav`, `footer` |
| Locale detection / switcher | `<html lang>` from the path, the `language-switcher` block, and `hreflang` tags |

## URL / content structure

The **default locale lives at the root** (so existing pages need no migration);
every other locale lives under a `/<locale>` prefix:

```
/kotak-league-credit-card         ← default (en) — the "blueprint"
/hi/kotak-league-credit-card      ← Hindi "live copy" (same logical path)

/placeholders.json      /hi/placeholders.json     ← per-locale labels
/nav       /footer      /hi/nav     /hi/footer     ← per-locale header/footer
```

The *logical* page path (`/kotak-league-credit-card`) is identical across
locales — that shared path is what makes the language switcher and `hreflang`
alternates work.

## How it works (code)

All locale logic lives in **`scripts/locale.js`**:

| Export | Purpose |
|---|---|
| `LOCALES` | Registry of supported locales (`{ label, dir }`). **Add a locale here.** |
| `DEFAULT_LOCALE` | The master locale (`en`); also the fallback for missing resources |
| `getLocale(pathname?)` | Detects the locale from the first path segment; defaults safely |
| `getLocaleRoot(locale?)` | `''` for default, `/hi` otherwise |
| `stripLocale(pathname?)` | Removes the locale prefix → the logical path |
| `localizePath(locale, pathname?)` | The same logical page under another locale |
| `resolveLocalized(name, locale?)` | Locale-scoped resource path (e.g. `/hi/nav`) |

Wired into the runtime:

- **`scripts/scripts.js` (eager):** sets `document.documentElement.lang` (and
  `dir` for RTL locales) from `getLocale()` instead of a hard-coded `'en'`.
- **`scripts/scripts.js` (lazy):** `addHreflangAlternates()` injects
  `<link rel="alternate" hreflang>` for every locale + `x-default`.
- **`blocks/header/header.js` & `blocks/footer/footer.js`:** resolve their
  fragment locale-aware (`/hi/nav`, `/hi/footer`), **falling back to the
  default-locale fragment** when a translated one hasn't been authored — the
  MSM "inherit from blueprint" behaviour.
- **`blocks/language-switcher/`:** a content-free block that lists every locale
  from `LOCALES`, linking to the equivalent page and marking the current one.

## Try the demo locally

```bash
npx -y @adobe/aem-cli up --html-folder content --prefer-plain-html --no-open
```

- Default locale: <http://localhost:3000/content/msm-demo>
- Hindi locale:   <http://localhost:3000/content/hi/msm-demo>

Both render the **same shared blocks** (`language-switcher`,
`k811-promo-brand-test`); only the authored content and `<html lang>` differ,
and the switcher moves you between them.

> The `content/` folder is local-only (gitignored). Real locale pages are
> authored/translated in AEM — do not hand-edit `content/` for production.

## Runbook — add a new locale (e.g. Arabic `ar`)

1. **Register it** in `scripts/locale.js`:
   ```js
   export const LOCALES = {
     en: { label: 'English', dir: 'ltr' },
     hi: { label: 'हिन्दी', dir: 'ltr' },
     ar: { label: 'العربية', dir: 'rtl' }, // dir: 'rtl' sets <html dir>
   };
   ```
2. **Create the content tree** under `/ar` in AEM (author + translate the pages,
   mirroring the default-locale paths).
3. **Author locale fragments:** `/ar/nav`, `/ar/footer`, `/ar/placeholders.json`.
   Any you skip fall back to the default locale automatically.
4. **Nothing else to change** — the language switcher, `hreflang` tags and
   `<html lang>`/`dir` update automatically from the registry.
5. **Verify** at `/ar/<page>`: correct `lang`/`dir`, shared blocks render,
   switcher links resolve, `hreflang` alternates present in `<head>`.

## Notes & limits

- This is a **convention**, not a product feature: there is no automated
  rollout/sync. Keeping locale trees structurally aligned is an authoring
  discipline (or a job for the import tooling).
- Because code is shared, a block change ships to **every** locale at once —
  test one representative page per locale after changing shared blocks.
- RTL locales set `<html dir="rtl">`; ensure block CSS uses logical properties
  (`margin-inline`, `padding-inline`, …) where direction matters.
