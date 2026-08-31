# 16 · Adding ESLint Rules

How to add, test, and see ESLint rules in this repository. Grounded in `.eslintrc.js`, `test/eslint-rules-smoke.mjs`, and `.vscode/` editor settings.

> **Lint is a hard gate.** GitHub Actions runs `npm run lint` on every push. A rule that is not enforced in `.eslintrc.js` is not part of the project, no matter what a blog post recommends.

See also [03](03-markup-css-javascript.md) (JS conventions the rules encode) and [15](15-scss-compiler.md) (CSS is Stylelint, not ESLint).

---

## The one idea: extend Airbnb, don't replace it

This project **extends** three configs. New rules go in `.eslintrc.js` `rules` (or `overrides`). Do not add `airbnb` (React), TypeScript, Prettier, or a flat `eslint.config.js` on top — they fight `airbnb-base` and the no-bundler import rule.

```
.eslintrc.js
  extends:
    airbnb-base              vanilla JS style + correctness
    plugin:json/recommended  _{block}.json / models
    plugin:xwalk/recommended Universal Editor cell-count, etc.
  rules:                     project overrides + explicit basics
  overrides:                 Node CLI (tools/, test/, .husky/)
```

**Parser:** `@babel/eslint-parser` (ES modules, no Babel config).  
**Default env:** `browser` (blocks). Node files are listed under `overrides`.  
**Command:** `eslint . --ext .json,.js,.mjs` (`npm run lint:js`).

- **Recommendation:** add **one named rule** with a comment explaining why. Do not `extends` another huge preset.
  **Why:** a new preset re-lits 50+ blocks and importer scripts. A single rule is reviewable and can be smoke-tested.
- **Recommendation:** run `npm run lint:js` on the whole repo **before** you commit a new rule.
  **Why:** a rule that is `error` in CI with 200 existing hits will block every PR. Either fix the hits, scope the rule with `overrides`, or don't add it.

---

## What is already on (do not re-add blindly)

### Project overrides (EDS-specific)

| Rule | Setting | Why |
|---|---|---|
| `import/extensions` | `.js` **always** | No bundler; the browser needs the extension. |
| `linebreak-style` | `unix` (LF) | CI is Linux; Windows CRLF fails the build. |
| `no-param-reassign` | properties **allowed** | `decorate(block)` mutates `block`; reassigning `block` is still forbidden. |
| `xwalk/max-cells` | default **4**; forms listed higher | UE models stay small unless you add a named exception. |
| `xwalk/no-orphan-collapsible-fields` | **off** | Forms UE support; do not turn back on without checking forms. |

### Explicit basics (also in Airbnb; listed so they stay if Airbnb is trimmed)

| Rule | Catches |
|---|---|
| `eqeqeq` | `==` / `!=` (`== null` still allowed) |
| `no-var` / `prefer-const` | `var`; `let` that never reassigns |
| `no-eval` / `no-implied-eval` / `no-new-func` | `eval`, `setTimeout('…')`, `new Function` — matches `head.html` CSP |
| `no-debugger` / `no-alert` | leftover debug / `alert` |
| `prefer-template` | `'n=' + x` |
| `no-unused-vars` | unused names; `_` prefix is ignored |

### Node override

`tools/**/*.mjs`, `test/**/*.mjs`, `.husky/**/*.mjs`: `no-console` off; `import/no-extraneous-dependencies` allows `devDependencies` (e.g. `eslint`, `sass`). **Block JS still cannot `console.log`.**

### Ignored (`.eslintignore`)

Minified libs, form rule engines, UE `editor-support*.js`. Put generated dumps here — do not `eslint-disable` a whole product file.

---

## How to add a rule (checklist)

1. **Pick the rule id** from [ESLint rules](https://eslint.org/docs/latest/rules/) or a plugin you already depend on (`eslint-plugin-import`, `eslint-plugin-xwalk`, `eslint-plugin-json`). Do not add a new plugin without a size/justification review.
2. **Open `.eslintrc.js`** and add it under `rules` with a severity:
   - `'error'` — fails `npm run lint` and CI
   - `'warn'` — visible, does **not** fail CI (avoid for anything you actually care about)
   - `'off'` — disable (only with a comment)
3. **Comment why** next to the rule (match existing comments).
4. **Decide scope.** Browser blocks vs Node CLI:
   ```js
   overrides: [
     {
       files: ['tools/**/*.mjs'],
       rules: { 'no-console': 'off' },
     },
   ],
   ```
5. **Scan the repo:** `npm run lint:js`. Fix real violations or narrow the rule. Do not `--no-verify`.
6. **Prove it fires** — see [Smoke test](#smoke-test) below.
7. **Confirm the editor** underlines it — see [While you code](#while-you-code).

Example — adding `no-nested-ternary` (already an Airbnb error; shown as the *shape* of a change):

```js
rules: {
  // …
  'no-nested-ternary': 'error', // hard to read in decorate(); split into if/else
},
```

For a **new xwalk model** that needs more than 4 cells, do **not** raise the global `*`. Add a named exception:

```js
'xwalk/max-cells': ['error', {
  '*': 4,
  'my-block': 6,
}],
```

---

## Smoke test

`test/eslint-rules-smoke.mjs` lints a **snippet that is supposed to fail** and asserts each rule id appears. It is part of `npm run lint`.

```bash
npm run lint:rules-smoke
```

When you add a rule that should always catch a pattern:

1. Add a violating line to the `snippet` in `test/eslint-rules-smoke.mjs`.
2. Add the rule id to the `expected` array.
3. Run `npm run lint:rules-smoke`.
   - **Pass** — the rule is on and reports.
   - **Fail: rule did not fire** — wrong id, wrong options, or the snippet doesn't trigger it.
   - **`npm run lint:js` fails on the smoke file** — the smoke file itself must stay lint-clean; only the *string* snippet is dirty.

If you later set that rule to `'off'`, CI fails the smoke test. That is intentional.

---

## While you code

ESLint in the terminal is not the same as squiggles in Cursor.

| Path | When |
|---|---|
| Red underline + hover | ESLint **extension** + `.vscode/settings.json` (`eslint.enable: true`) |
| Problems panel (`Ctrl+Shift+M`) | Same extension |
| `npm run lint` / CI | Always, even without the extension |

**One-time:** install **ESLint** (`dbaeumer.vscode-eslint`) when Cursor prompts (see `.vscode/extensions.json`). `npm install` must have been run. Reload the window if underlines don't appear.

Workspace settings (do not switch on ESLint flat config — this repo uses `.eslintrc.js`):

- `eslint.useFlatConfig`: `false`
- `eslint.validate`: `javascript`, `json`
- `files.eol`: `\n` so `linebreak-style` doesn't spam CRLF on Windows

To confirm a **new** rule in the editor: open a `blocks/**/*.js` file, type a violation, save. You should see a red underline with the rule name. Revert the line.

---

## Commands

| Command | What it does |
|---|---|
| `npm run lint:js` | ESLint on `.js`, `.mjs`, `.json` |
| `npm run lint:fix` | Auto-fix JS + CSS where possible |
| `npm run lint:rules-smoke` | Assert basic rules still fire |
| `npm run lint` | JS + CSS + smoke (what CI runs) |

---

## What not to do

- Don't add Prettier + Airbnb together — they conflict on quotes, semicolons, and wrapping.
- Don't `eslint-disable` a whole `decorate` file. Prefer `// eslint-disable-next-line rule-id` with a one-line why.
- Don't skip hooks (`--no-verify`). Don't commit CRLF; set the editor to LF.
- Don't lint `*.min.js` — they belong in `.eslintignore`.
- Don't expect ESLint to catch unscoped CSS, missing JSDoc, or LCP mistakes. Those are Stylelint / review / handbook.

---

## Validation checklist — adding a rule

- [ ] Rule added in `.eslintrc.js` with severity and a why-comment.
- [ ] `npm run lint:js` clean on the existing tree (or violations fixed / scoped).
- [ ] Smoke snippet + `expected` updated if the rule is a “must always fire” basic; `npm run lint:rules-smoke` passes.
- [ ] Editor underline verified on a throwaway violation in a block `.js` file.
- [ ] No new runtime dependency; no flat config; `aem.js` untouched.
