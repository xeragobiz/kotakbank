/* eslint-disable */
/*
 * Rewrite CDN asset URLs -> DAM paths in the generated page JCR XML, using the
 * url->dam map produced by build-dam-package.js. Run AFTER md2jcr + entity-fix.
 *
 * Usage: node tools/importer/rewrite-dam-refs.js <xml-file> [<xml-file> ...]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const MAP = path.join(ROOT, 'migration-work', 'dam-assets', 'url-to-dam.json');

const map = JSON.parse(fs.readFileSync(MAP, 'utf-8'));
// longest URLs first so query-string/host variants don't partially match
const urls = Object.keys(map).sort((a, b) => b.length - a.length);

const files = process.argv.slice(2);
if (!files.length) {
  console.error('No XML files given');
  process.exit(1);
}

files.forEach((file) => {
  let xml = fs.readFileSync(file, 'utf-8');
  let n = 0;
  urls.forEach((url) => {
    // match the URL possibly followed by a query string (?width=... etc.)
    const esc = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`${esc}(\\?[^"'\\s<)]*)?`, 'g');
    xml = xml.replace(re, (m) => { n += 1; return map[url]; });
  });
  fs.writeFileSync(file, xml);
  console.log(`${path.basename(file)}: rewrote ${n} asset reference(s) to DAM`);
});
