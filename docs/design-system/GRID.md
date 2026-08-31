# Grid System

A responsive 12-column grid built on CSS Grid and custom properties. Lives in
`styles/grid.css`, which `styles/styles.css` pulls in with
`@import url('./grid.css')` so it is available on every page.

It is self-contained — it declares its own tokens, so it does not depend on
`styles/variables.css`.

## Breakpoints

| Viewport         | Range        | Columns | Gutter | Margin              | Col width    | Max width |
| ---------------- | ------------ | ------- | ------ | ------------------- | ------------ | --------- |
| Mobile           | 0–475px      | 4       | 12px   | 20px                | fluid        | —         |
| Tablet Portrait  | 476–834px    | 8       | 12px   | 40px                | fluid        | —         |
| Tablet Landscape | 835–1024px   | 12      | 12px   | 92px                | fluid        | —         |
| Laptop           | 1025–1366px  | 12      | 16px   | 92px                | fluid        | 1736px    |
| Desktop          | 1367–1920px  | 12      | 16px   | 92px                | fluid        | 1736px    |
| Ultrawide        | 1921px+      | 12      | 16px   | auto (412px @2560)  | 130px fixed  | 1736px    |

Laptop and Desktop share identical values, so no media query separates them.

Ultrawide needs no breakpoint either. At exactly 1920px the fluid content area
already measures 1736px (12 × 130px + 11 × 16px), so `max-width: 1736px` plus
`margin-inline: auto` takes over from there and lets the margins grow on their
own — 92px at 1921px, 412px at 2560px. Columns naturally lock at 130px.

## Usage

Wrap items in `.grid` and give each child a span class:

```html
<div class="grid">
  <div class="grid-col-12 grid-col-t-4 grid-col-d-3">Card 1</div>
  <div class="grid-col-12 grid-col-t-4 grid-col-d-3">Card 2</div>
  <div class="grid-col-12 grid-col-t-4 grid-col-d-3">Card 3</div>
  <div class="grid-col-12 grid-col-t-4 grid-col-d-3">Card 4</div>
</div>
```

That gives one card per row on mobile, two per row on tablet, four across on
desktop.

## Span classes

| Prefix           | Applies from | Available range | Grid columns there |
| ---------------- | ------------ | --------------- | ------------------ |
| `.grid-col-*`    | 0px          | 1–12            | 4                  |
| `.grid-col-t-*`  | 476px        | 1–8             | 8                  |
| `.grid-col-d-*`  | 1025px       | 1–12            | 12                 |

There is no `-u-` (ultrawide) prefix; `.grid-col-d-*` already covers 1025px and up.

### Spans are relative to the current breakpoint

This is the main thing to get right. A span is counted against the column count
of the active breakpoint, not always against 12:

| Class           | Mobile (4 cols) | Tablet P (8 cols) | 835px+ (12 cols) |
| --------------- | --------------- | ----------------- | ---------------- |
| `.grid-col-3`   | 75%             | 37.5%             | 25%              |
| `.grid-col-6`   | full row        | 75%               | 50%              |
| `.grid-col-12`  | full row        | full row          | 100%             |

Two consequences:

- **Keep per-row spans within the breakpoint's budget.** On tablet portrait the
  budget is 8, so `t-4 + t-4` pairs up but `t-6 + t-6` (= 12) silently wraps to
  separate rows. Likewise `t-5 + t-3` sits on one row; `t-8 + t-4` does not.
- **Spans larger than the column count fall back to a full row.** A
  `.grid-col-12` on mobile creates implicit tracks and renders full width, which
  is usually what you want — but it is a fallback, not an explicit design.

## How it works

The breakpoint tokens resolve on `body`, then a single declaration on `.grid`
handles both the fluid and capped cases:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols), 1fr);
  gap: var(--grid-gutter);
  width: min(100% - (2 * var(--grid-margin)), var(--grid-max-width));
  margin-inline: auto;
}
```

Below the cap, `100% - 2 × margin` wins and the grid is fluid with fixed side
margins. Above it, `--grid-max-width` wins and `margin-inline: auto` centres the
grid while the margins absorb the surplus.

Two things to avoid if you edit this rule:

- `max-width: auto` is invalid CSS and gets dropped — that is why the fluid
  breakpoints use `100%` rather than `auto` for `--grid-max-width-*`.
- Do not set `margin-inline: var(--grid-margin)` alongside `margin-inline: auto`;
  the second wins and the margin token becomes dead.

## Tokens

Override on `:root` to retheme:

```
--grid-columns-mobile     --grid-gutter-mobile     --grid-margin-mobile
--grid-columns-tablet-p   --grid-gutter-tablet     --grid-margin-tablet-p
--grid-columns-tablet-l                            --grid-margin-tablet-l
--grid-columns-desktop    --grid-gutter-desktop    --grid-margin-desktop

--grid-max-width-mobile   --grid-max-width-tablet  --grid-max-width-desktop
```

The global section wrapper (`main > .section > div` in `styles/styles.css`) uses
these same margin tokens for its side padding and caps at
`--grid-max-width-desktop` (1736px), so section content and `.grid` blocks align
at the same breakpoints.

## Grid and typography breakpoints are unified

In this project the grid steps at **476 / 835 / 1025px** *and* the responsive
typography in `styles/variables.css` was tuned to the **same** tiers, so column
count and type size change together. (This intentionally diverges from the DLS's
original 600/900/1200 typography tiers — unified tiers are the project standard.)
See [TOKENS.md](./TOKENS.md).

## Notes

- `drafts/test.html` (if present) renders every layout above. Run
  `aem up --html-folder drafts --html-mount /` and open
  `http://localhost:3000/test.html`.
- Below 500px is hard to verify in headless Chrome (it clamps the viewport to a
  500px minimum), so spot-check the 4-column mobile case in DevTools.
