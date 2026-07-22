/* eslint-disable */
/*
 * Post-process md2jcr XML output so it is well-formed. md2jcr emits attribute
 * values (e.g. CTA link URLs with query strings) containing raw `&`, which is
 * illegal in XML. Escape every bare `&` to `&amp;` while leaving already-valid
 * entities (&amp; &lt; &gt; &quot; &apos; and numeric &#...;) untouched.
 *
 *   node tools/importer/fix-xml-entities.js <file.xml> [<file.xml> ...]
 */
const fs = require('fs');

// a bare ampersand = `&` NOT already starting a known/numeric entity
const BARE_AMP = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;

function fixFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const fixed = src.replace(BARE_AMP, '&amp;');
  if (fixed !== src) {
    fs.writeFileSync(file, fixed);
    const n = (src.match(BARE_AMP) || []).length;
    console.log(`Fixed ${n} bare '&' in ${file}`);
  } else {
    console.log(`No changes needed in ${file}`);
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node fix-xml-entities.js <file.xml> [...]');
  process.exit(1);
}
files.forEach(fixFile);
