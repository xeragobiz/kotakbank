/* eslint-env node */
/**
 * Smoke-test: lint a snippet that violates the basic rules and assert each
 * rule actually reports. Run via `npm run lint:rules-smoke`.
 */
import { ESLint } from 'eslint';

const snippet = `
var leftover = 1;
eval('1 + 1');
const built = new Function('return 1');
setTimeout('1 + 1', 0);
debugger;
alert('x');
if (leftover == 2) {
  const msg = 'n=' + leftover;
}
`;

const expected = [
  'no-var',
  'no-eval',
  'no-new-func',
  'no-implied-eval',
  'no-debugger',
  'no-alert',
  'eqeqeq',
  'prefer-template',
];

const eslint = new ESLint();
const [result] = await eslint.lintText(snippet, { filePath: 'blocks/sample/sample.js' });
const fired = new Set(result.messages.map((message) => message.ruleId).filter(Boolean));
const missing = expected.filter((rule) => !fired.has(rule));

if (missing.length) {
  console.error('ESLint smoke failed. Rules that did not fire:');
  missing.forEach((rule) => console.error(`  ${rule}`));
  console.error('Rules that did fire:', [...fired].join(', ') || '(none)');
  process.exit(1);
}

console.log(`ESLint smoke passed. Fired: ${expected.join(', ')}`);
