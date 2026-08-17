/* eslint-disable */
/*
 * Build a FileVault content package that ingests the migrated kotak811 assets
 * into AEM DAM under /content/dam/kotakbank/k811.
 *
 * For each downloaded file in migration-work/dam-assets/files/, creates a
 * dam:Asset node structure:
 *   jcr_root/content/dam/kotakbank/k811/<file>/.content.xml   (dam:Asset + jcr:content/renditions/original)
 *   jcr_root/content/dam/kotakbank/k811/<file>/_jcr_content/renditions/original  (the binary)
 * plus META-INF/vault/{filter.xml,properties.xml}.
 * Writes migration-work/k811-dam-package.zip and a url->dam path map JSON.
 *
 * Run: node tools/importer/build-dam-package.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'migration-work', 'dam-assets');
const FILES = path.join(SRC, 'files');
const PKG = path.join(ROOT, 'migration-work', 'k811-dam-pkg');
const DAM_BASE = '/content/dam/kotakbank/k811';
const CDN_HOSTS = ['https://d2gwgwt9a7yxle.cloudfront.net', 'https://d3fn8vpnyvleeg.cloudfront.net', 'https://www.kotak811.bank.in/images'];

const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  svg: 'image/svg+xml', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  json: 'application/json',
};

function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }

function assetContentXml(mime, lastMod) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:dam="http://www.day.com/dam/1.0" xmlns:mix="http://www.jcp.org/jcr/mix/1.0"
    jcr:primaryType="dam:Asset">
  <jcr:content jcr:primaryType="dam:AssetContent">
    <metadata jcr:primaryType="nt:unstructured" dc:format="${mime}" xmlns:dc="http://purl.org/dc/elements/1.1/"/>
    <renditions jcr:primaryType="nt:folder">
      <original jcr:primaryType="nt:file" jcr:mixinTypes="[dam:Thumbnails]">
        <jcr:content jcr:primaryType="nt:resource" jcr:mimeType="${mime}"/>
      </original>
    </renditions>
  </jcr:content>
</jcr:root>
`;
}

function main() {
  rmrf(PKG);
  const files = fs.readdirSync(FILES).filter((f) => !f.startsWith('.'));
  const map = {};
  files.forEach((f) => {
    const ext = f.split('.').pop().toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const assetDir = path.join(PKG, 'jcr_root', 'content', 'dam', 'kotakbank', 'k811', f);
    const renDir = path.join(assetDir, '_jcr_content', 'renditions');
    fs.mkdirSync(renDir, { recursive: true });
    // asset node structure
    fs.writeFileSync(path.join(assetDir, '.content.xml'), assetContentXml(mime));
    // binary as the "original" rendition
    fs.copyFileSync(path.join(FILES, f), path.join(renDir, 'original'));
    // map every known CDN URL form to the DAM path
    CDN_HOSTS.forEach((h) => { map[`${h}/${f}`] = `${DAM_BASE}/${f}`; });
  });

  // META-INF
  const vault = path.join(PKG, 'META-INF', 'vault');
  fs.mkdirSync(vault, { recursive: true });
  fs.writeFileSync(path.join(vault, 'filter.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
  <filter root="${DAM_BASE}"/>
</workspaceFilter>
`);
  fs.writeFileSync(path.join(vault, 'properties.xml'),
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <comment>FileVault Package Properties</comment>
  <entry key="name">kotak811-k811-dam-assets</entry>
  <entry key="group">kotak811</entry>
  <entry key="version">1.0</entry>
  <entry key="packageType">content</entry>
  <entry key="requiresRoot">false</entry>
</properties>
`);

  fs.writeFileSync(path.join(SRC, 'url-to-dam.json'), JSON.stringify(map, null, 2));
  console.log(`Prepared ${files.length} assets under ${DAM_BASE}`);
  console.log(`Package dir: ${PKG}`);
  console.log(`URL map: ${path.join(SRC, 'url-to-dam.json')} (${Object.keys(map).length} entries)`);
}

main();
