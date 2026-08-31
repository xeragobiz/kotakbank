/* eslint-env node */
/**
 * Compiles SCSS to the CSS Edge Delivery Services actually serves.
 *
 *   styles/scss/block/{name}.scss  →  blocks/{name}/{name}.css
 *   styles/scss/{name}.scss        →  styles/{name}.css
 *
 * Shared tokens live in `styles/scss/` and are loaded via Sass load path.
 * `styles/styles.css` stays hand-written (LCP-critical, loaded from head.html).
 *
 *   npm run build:css
 *   npm run build:css -- --check
 *   npm run watch:css
 *   npm run build:css -- --brand=kotak
 */
import { watch } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import {
  basename,
  dirname,
  join,
  relative,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const blocksDir = join(root, 'blocks');
const stylesDir = join(root, 'styles');
const scssDir = join(stylesDir, 'scss');
const blockScssDir = join(scssDir, 'block');
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const watchMode = args.includes('--watch');
const brandArg = args.find((a) => a.startsWith('--brand='));
const brand = brandArg ? brandArg.slice('--brand='.length) : process.env.BRAND;

/**
 * @param {string} src relative posix path of the SCSS source
 * @returns {string}
 */
const banner = (src) => `/* Generated from ${src} — do not edit. Run \`npm run build:css\`. */\n\n`;

/**
 * Recursively find non-partial `.scss` files under a directory.
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function findScss(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return findScss(path);
    if (entry.isFile() && entry.name.endsWith('.scss') && !entry.name.startsWith('_')) {
      return [path];
    }
    return [];
  }));
  return nested.flat();
}

/**
 * Non-partial `.scss` files sitting directly in `styles/scss/` (not `block/`).
 * @returns {Promise<string[]>}
 */
async function findGlobalScss() {
  let entries;
  try {
    entries = await readdir(scssDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return entries
    .filter((entry) => {
      const { name } = entry;
      return entry.isFile() && name.endsWith('.scss') && !name.startsWith('_');
    })
    .map((entry) => join(scssDir, entry.name));
}

/**
 * `styles/scss/block/cc-hero.scss` → `blocks/cc-hero/cc-hero.css`
 * `styles/scss/lazy-styles.scss`   → `styles/lazy-styles.css`
 * @param {string} scssPath
 * @returns {string}
 */
function cssPathFor(scssPath) {
  const name = basename(scssPath, '.scss');
  if (dirname(scssPath) === scssDir) {
    return join(stylesDir, `${name}.css`);
  }
  return join(blocksDir, name, `${name}.css`);
}

/**
 * Dart Sass emits 2-space indent; this repo's CSS is 4-space. Also insert the
 * empty lines Stylelint standard expects between rules and after custom props.
 * @param {string} css
 * @returns {string}
 */
function formatCss(css) {
  const indented = css.replace(/^( +)/gm, (spaces) => ' '.repeat(spaces.length * 2));
  const afterCustomProps = indented.replace(
    /(--[\w-]+:[\s\S]*?;\n)( +)([a-z][\w-]*:)/g,
    '$1\n$2$3',
  );
  const betweenRules = afterCustomProps.replace(/}\n( +)([.#:[*a-zA-Z])/g, '}\n\n$1$2');
  const spaced = betweenRules.replace(/}\n(?!\n)([.#:@*[a-zA-Z])/g, '}\n\n$1');
  // Dart Sass unquotes identifier-like attribute values; Stylelint requires quotes.
  return spaced.replace(/\[([\w-]+)=([^\s"'\]]+)\]/g, '[$1="$2"]');
}

/**
 * @param {string} scssPath
 * @returns {string}
 */
function compileOne(scssPath) {
  const result = sass.compile(scssPath, {
    loadPaths: [scssDir],
    style: 'expanded',
    sourceMap: false,
    charset: false,
    importers: brand
      ? [{
        canonicalize(url) {
          if (url === 'config') return new URL('file:///__kotak_scss_config');
          return null;
        },
        load(canonicalUrl) {
          if (canonicalUrl.href === 'file:///__kotak_scss_config') {
            return { contents: `$brand: ${brand};\n`, syntax: 'scss' };
          }
          return null;
        },
      }]
      : [],
  });
  const rel = relative(root, scssPath).replaceAll('\\', '/');
  return `${banner(rel)}${formatCss(result.css).trimEnd()}\n`;
}

/**
 * @returns {Promise<{ written: string[], stale: string[] }>}
 */
async function build() {
  const sources = [...await findScss(blockScssDir), ...await findGlobalScss()];
  const written = [];
  const stale = [];

  await Promise.all(sources.map(async (scssPath) => {
    const cssPath = cssPathFor(scssPath);
    const css = compileOne(scssPath);
    let existing = '';
    try {
      existing = (await readFile(cssPath, 'utf8')).replace(/\r\n/g, '\n');
    } catch {
      existing = '';
    }
    if (existing === css) return;
    stale.push(relative(root, cssPath).replaceAll('\\', '/'));
    if (!checkOnly) {
      await writeFile(cssPath, css, { encoding: 'utf8' });
      written.push(relative(root, cssPath).replaceAll('\\', '/'));
    }
  }));

  return { written, stale };
}

const { written, stale } = await build();

if (checkOnly) {
  if (stale.length) {
    console.error('Compiled CSS is out of date. Run `npm run build:css` and commit:');
    stale.forEach((file) => console.error(`  ${file}`));
    process.exit(1);
  }
  console.log('SCSS is in sync with committed CSS.');
} else if (written.length) {
  console.log(`Wrote ${written.length} CSS file(s):`);
  written.forEach((file) => console.log(`  ${file}`));
} else {
  console.log('CSS already up to date.');
}

if (watchMode) {
  console.log('Watching styles/scss ...');
  let timer;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      build().then((next) => {
        if (next.written.length) console.log(`Rebuilt: ${next.written.join(', ')}`);
      }).catch((err) => console.error(err.message || err));
    }, 150);
  };
  watch(scssDir, { recursive: true }, rebuild);
}
