# 05 · Accessibility

Target **WCAG 2.1 AA**. Accessibility in EDS is mostly a *decoration discipline* — it's easy to keep and easy to destroy during DOM transformation.

## Semantics & structure
- **Recommendation:** preserve one `<h1>` and an unskipped heading hierarchy; use native elements.
  **Why:** screen-reader users navigate by headings and landmarks; a flattened or skipped hierarchy makes a page unnavigable. Native `<button>`/`<a>`/`<details>` come with keyboard behavior and roles for free — reimplementing them with `<div>` means reimplementing (and usually breaking) all of it.

## Images
- **Recommendation:** meaningful images get descriptive `alt`; decorative images get `alt=""`.
  **Why:** `alt` is how non-sighted users perceive image content; an empty `alt` correctly tells assistive tech to skip pure decoration. A missing `alt` makes the screen reader announce the filename — noise.

## Interactive blocks (the hard part)
- **Recommendation:** accordions, tabs, carousels, modals, and nav must be fully keyboard-operable — visible focus, logical tab order, `Esc` to close, arrow keys where the pattern calls for it, no focus traps (except intentional modal trapping with focus return).
  **Why:** these are the components keyboard and screen-reader users most often get stuck on; they're also the most-audited in enterprise compliance. Native semantics + the correct ARIA pattern (tabs: `role=tablist/tab/tabpanel`; disclosure: `aria-expanded`) is what makes them operable.
- **Recommendation:** use ARIA only where native semantics fall short, and never contradict native roles.
  **Why:** "no ARIA is better than bad ARIA" — incorrect ARIA actively misleads assistive tech, worse than none.

## Motion
- **Recommendation:** gate all animation on `prefers-reduced-motion`.
  **Why:** motion triggers vestibular disorders for some users; respecting the OS setting is both a WCAG requirement and basic safety. The shared reveal observer already does this — use it.

## Color & forms
- **Recommendation:** meet AA contrast against the design tokens; don't convey information by color alone.
  **Why:** low contrast fails low-vision users; color-only signaling fails color-blind users. Verify against the migrated tokens rather than assuming.
- **Recommendation:** associate labels with form controls; announce errors.
  **Why:** an unlabeled field is unusable with a screen reader; unannounced errors leave users unable to fix a form.

## Verification
- **Recommendation:** check headings, alt, keyboard operability, ARIA, contrast per changed block at 3 widths; prefer Playwright `snapshot` (exposes the accessibility tree) for routine checks.
  **Why:** the a11y tree in a snapshot is the machine-readable truth of what assistive tech sees — cheaper and more reliable than eyeballing a screenshot.

## Validation checklist — accessibility
- [ ] One `<h1>`, no skipped levels; semantic elements used.
- [ ] `alt` on meaningful images; `alt=""` on decorative.
- [ ] Interactive blocks keyboard-operable; correct ARIA; focus managed; no traps.
- [ ] Motion gated on `prefers-reduced-motion`.
- [ ] AA contrast; no color-only signaling; form labels + error announcement.
