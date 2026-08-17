/* eslint-disable */
/*
 * Build the FileVault content package that installs the migrated kotak811
 * pages into AEM under /content/kotakbank/<page>.
 *
 * Reads the freshly generated JCR XML (migration-work/<page>.xml, produced by
 * gen-all.sh) and writes each as jcr_root/content/kotakbank/<page>/.content.xml,
 * plus META-INF/vault/{filter,properties}.xml, then zips to
 * tools/importer/dist/k811-pages-package.zip.
 *
 * Uses a minimal store-method (no compression) zip writer so it works without
 * the system `zip` binary. Run: node tools/importer/build-pages-package.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..', '..');
const MW = path.join(ROOT, 'migration-work');
const ALL_PAGES = ['kotak811-home', 'kotak811-infinity-metal-debit-card', 'kotak811-about-us'];

// Optional CLI page filter: `node build-pages-package.js kotak811-home` builds
// a package containing (and replacing) only the named page(s). With no args it
// builds all pages. The output filename reflects the selection so a single-page
// package doesn't overwrite the full one.
const requested = process.argv.slice(2);
const PAGES = requested.length
  ? requested.filter((p) => ALL_PAGES.includes(p))
  : ALL_PAGES;
if (requested.length && PAGES.length !== requested.length) {
  const unknown = requested.filter((p) => !ALL_PAGES.includes(p));
  throw new Error(`Unknown page(s): ${unknown.join(', ')}. Valid: ${ALL_PAGES.join(', ')}`);
}
const OUT = path.join(
  ROOT, 'tools', 'importer', 'dist',
  PAGES.length === ALL_PAGES.length
    ? 'k811-pages-package.zip'
    : `k811-pages-package-${PAGES.join('-')}.zip`,
);

// ---- CRC32 ----------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---- minimal ZIP (deflate) writer -----------------------------------------
function buildZip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  entries.forEach(({ name, data }) => {
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const comp = zlib.deflateRawSync(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(8, 8); // method: deflate
    local.writeUInt16LE(0, 10); // time
    local.writeUInt16LE(0, 12); // date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, comp);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0, 8);
    cen.writeUInt16LE(8, 10);
    cen.writeUInt16LE(0, 12);
    cen.writeUInt16LE(0, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(comp.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt16LE(0, 30);
    cen.writeUInt16LE(0, 32);
    cen.writeUInt16LE(0, 34);
    cen.writeUInt16LE(0, 36);
    cen.writeUInt32LE(0, 38);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);
    offset += local.length + nameBuf.length + comp.length;
  });
  const centralStart = offset;
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(centralStart, 16);
  return Buffer.concat([...chunks, centralBuf, end]);
}

// mode="replace" so reinstalling OVERWRITES existing page nodes. The default
// FileVault mode is "merge", which leaves already-present property values
// (e.g. an old applyCta/primaryCta) untouched — so a reinstall would appear to
// do nothing. "replace" makes each page root an authoritative overwrite.
const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
${PAGES.map((p) => `  <filter root="/content/kotakbank/${p}" mode="replace"/>`).join('\n')}
</workspaceFilter>
`;

const propertiesXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <comment>FileVault Package Properties</comment>
  <entry key="name">kotak811-k811-pages</entry>
  <entry key="group">kotak811</entry>
  <entry key="version">1.0</entry>
  <entry key="createdBy">excat-migration</entry>
  <entry key="packageType">content</entry>
  <entry key="requiresRoot">false</entry>
  <entry key="allowIndexDefinitions">false</entry>
</properties>
`;

const entries = [
  { name: 'META-INF/vault/filter.xml', data: Buffer.from(filterXml, 'utf8') },
  { name: 'META-INF/vault/properties.xml', data: Buffer.from(propertiesXml, 'utf8') },
];
PAGES.forEach((p) => {
  const xml = fs.readFileSync(path.join(MW, `${p}.xml`));
  entries.push({ name: `jcr_root/content/kotakbank/${p}/.content.xml`, data: xml });
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, buildZip(entries));
console.log(`Wrote ${OUT} (${fs.statSync(OUT).size} bytes, ${entries.length} entries)`);
