/* eslint-env node */
/**
 * Compiles each block SCSS file (non-partial) to a sibling CSS file.
 * Shared tokens live in `styles/scss/` and are loaded via Sass load path.
 *
 *   npm run build:css
 *   npm run build:css -- --check
 *   npm run watch:css
 *   npm run build:css -- --brand=kotak
 */
import { watch } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const blocksDir = join(root, 'blocks');
const scssDir = join(root, 'styles', 'scss');
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
  const entries = await readdir(dir, { withFileTypes: true });
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
  return betweenRules.replace(/}\n(?!\n)([.#:@*[a-zA-Z])/g, '}\n\n$1');
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
  const sources = await findScss(blocksDir);
  const written = [];
  const stale = [];

  await Promise.all(sources.map(async (scssPath) => {
    const cssPath = scssPath.replace(/\.scss$/i, '.css');
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
    console.error('Compiled block CSS is out of date. Run `npm run build:css` and commit:');
    stale.forEach((file) => console.error(`  ${file}`));
    process.exit(1);
  }
  console.log('Block SCSS is in sync with committed CSS.');
} else if (written.length) {
  console.log(`Wrote ${written.length} CSS file(s):`);
  written.forEach((file) => console.log(`  ${file}`));
} else {
  console.log('Block CSS already up to date.');
}

if (watchMode) {
  console.log('Watching block SCSS and styles/scss ...');
  let timer;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      build().then((next) => {
        if (next.written.length) console.log(`Rebuilt: ${next.written.join(', ')}`);
      }).catch((err) => console.error(err.message || err));
    }, 150);
  };
  watch(blocksDir, { recursive: true }, rebuild);
  watch(scssDir, { recursive: true }, rebuild);
}
