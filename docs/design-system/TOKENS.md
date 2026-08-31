# Design Tokens

Design tokens from the Design Language System (DLS), a Figma export. They live in
`styles/variables.css`, which `styles/styles.css` `@import`s eagerly so tokens are
available to every stylesheet and block.

## Source of truth: hand-maintained

The original DLS export was generated from a `variables.scss` via a
`scss-to-css` step, but **neither the SCSS source nor the generator lives in this
repo**. So in this project `styles/variables.css` is the **hand-maintained source
of truth** — edit it directly.

When updating tokens:

- Keep names **byte-for-byte identical to the DLS**. Figma group names are
  concatenated verbatim, so some read doubled — this is intentional, not a typo:
  ```
  --spacing-spacing-16
  --action-blue-blue-70
  --decorative-colors-deco-one-deco-one-10
  ```
- Run `npx stylelint "styles/variables.css" --fix` after editing; the standard
  config normalises hex to short form (`#ffffff` → `#fff`).

## Collections

| Collection       | Prefix examples                          | Notes                                    |
| ---------------- | ---------------------------------------- | ---------------------------------------- |
| `color-primitive`| `--neutral-nc-*`, `--action-blue-blue-*` | Raw palette. Prefer semantic tokens.     |
| `style`          | `--text-*`, `--background-*`, `--button-*` | Semantic aliases onto primitives. Light mode only. |
| `spacing`        | `--spacing-spacing-0` … `-200`           | 0–200px                                  |
| `font size`      | `--fs-10` … `--fs-52`                    | Raw sizes; prefer the responsive type roles below. |
| `font weight`    | `--bold`, `--semibold`, `--medium`, `--regular` | 700 / 600 / 500 / 400 |
| `line height`    | `--lh-14` … `--lh-60`                    |                                          |
| `corner radius`  | `--cr-0` … `--cr-56`                     | Alias onto `spacing`                     |
| `Letter Spacing` | `--ls-0` … `--ls-25`                     | Mostly negative tracking                 |

## Semantic tokens

Shaped as `--{role}-{variant}-{surface}-{state}`:

```css
--text-primary-default-base
--button-primary-default-bg-hover
--icon-secondary-inverse-disabled
```

- **surface** — `default` for light backgrounds, `inverse` for dark ones. There is
  no dark-mode block; `inverse` *is* the mechanism for on-dark UI.
- **state** — `base`, `hover`, `pressed`, `disabled`, `selected`, `active`.

Reach for these over primitives so a palette change propagates:

```css
/* good */
color: var(--text-primary-default-base);

/* avoid -- bypasses the semantic layer */
color: var(--neutral-nc-7);
```

## Font family

The brand faces are tokenized in `styles/styles.css` (currently Roboto):

```css
font-family: var(--font-family-base);      /* body */
font-family: var(--font-family-heading);   /* headings */
```

Swap those two token values to rebrand the whole site without touching a block.

## Responsive typography

Each typographic role has one token per property whose value changes per
breakpoint. So one declaration scales itself — **no media queries needed in your
block:**

```css
.my-block h2 {
  font-size: var(--headline-font-size-h5);
  line-height: var(--headline-line-height-lh-5);
  letter-spacing: var(--headline-letter-spacing-ls-5);
}
```

`--headline-font-size-h5` resolves to 20px on mobile, 24px on tablet/laptop and
28px on desktop.

Roles and their scale suffixes:

| Role           | Scale        | Token pattern                                |
| -------------- | ------------ | -------------------------------------------- |
| `display`      | `ds-1`       | `--display-{semibold,medium}-font-size-ds-1` |
| `headline`     | `h1`–`h7`    | `--headline-font-size-h4`                    |
| `body`         | `b1`–`b6`    | `--body-font-size-b2`                        |
| `section-title`| `s`, `m`     | `--section-title-font-size-m`                |
| `button`       | `bt-1`–`bt-3`| `--button-font-size-bt-2`                    |
| `link-button`  | `l-1`, `bt-2`| `--link-button-font-size-l-1`                |
| `amount`       | `a1`–`a8`    | `--amount-font-size-a3`                      |
| `decimal`      | `d1`–`d8`    | `--decimal-font-size-d3`                     |
| `symbol`       | `s1`–`s8`    | `--symbol-font-size-s3`                      |

Match the numeric suffix across font-size, line-height and letter-spacing —
`b2` with `lh-2` and `ls-2`. The `amount` / `decimal` / `symbol` trio is built to
compose for currency (₹ symbol + integer + decimals).

### Typography breakpoints are unified with the grid

The DLS ships typography stepping at 600 / 900 / 1200px, but in this project the
`@media` tiers in `variables.css` were **retuned to 476 / 835 / 1025px to match
`styles/grid.css`**, so type size and column count change at the same widths. This
is a deliberate project decision; if you re-import tokens from Figma, re-apply the
unified breakpoints. See [GRID.md](./GRID.md).

| Mode    | Emitted as                 |
| ------- | -------------------------- |
| Mobile  | `:root` (base)             |
| Tablet  | `@media (width >= 476px)`  |
| Laptop  | `@media (width >= 835px)`  |
| Desktop | `@media (width >= 1025px)` |

## CI enforcement

`.stylelintrc.json` fails the build if a `blocks/**/*.css` file uses a raw hex
color or a raw `px` value on `font-size`, margin/padding, `gap`, or
`border-radius`. Use tokens instead. Existing blocks are grandfathered via
`ignoreFiles`; **remove a block from that list once you migrate it to tokens.**
For a rare justified exception:

```css
/* stylelint-disable-next-line declaration-property-unit-disallowed-list -- reason */
```

## Gotchas (carried from the DLS export)

- **Light mode only.** The `style` collection exports a single `Light` mode. Use
  `inverse` tokens for dark surfaces rather than expecting a dark-mode override.
- **A few tokens alias across categories, at some breakpoints only.**
  `--decimal-line-height-lh-3` is `--lh-24` on mobile and `--lh-28` on
  laptop/desktop, but `--fs-28` — a *font-size* token — on tablet. Same for
  `--symbol-line-height-lh-3`. Verify against Figma before relying on it.
- **`--cr-40` maps to `--spacing-spacing-44`**, not `-40`. From the export.

## Reference

- `styles/styles.css` `@import`s `variables.css` then `grid.css`, so tokens are
  available to every stylesheet.
- Grid tokens live in `styles/grid.css` — see [GRID.md](./GRID.md).
- Copy-paste starting point: [`block-skeleton.css`](./block-skeleton.css).
