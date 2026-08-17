#!/usr/bin/env bash
# Generate JCR XML for the 3 kotak811 pages, end to end.
#   1. emit GridTable block-table markdown (gen-blocks-md.js)
#   2. convert each .md to .xml with @adobe/helix-md2jcr (reads component-*.json)
#   3. escape bare '&' so the XML is well-formed (fix-xml-entities.js)
#   4. validate well-formedness
set -euo pipefail
cd "$(dirname "$0")/../.."
MD2JCR=/home/node/.excat-marketplaces/excat-marketplace/excat/hooks/import-validator/node_modules/@adobe/helix-md2jcr/bin/md2jcr.js
PAGES=(kotak811-home kotak811-infinity-metal-debit-card kotak811-about-us)

npm run build:json >/dev/null
node tools/importer/gen-blocks-md.js

for p in "${PAGES[@]}"; do
  node "$MD2JCR" "migration-work/$p.md" --ue-files "$PWD"
  node tools/importer/fix-xml-entities.js "migration-work/$p.xml"
  # rewrite CDN asset URLs -> DAM paths (only if the DAM map exists)
  if [ -f migration-work/dam-assets/url-to-dam.json ]; then
    node tools/importer/rewrite-dam-refs.js "migration-work/$p.xml"
  fi
  python3 -c "import xml.dom.minidom; xml.dom.minidom.parse('migration-work/$p.xml'); print('OK well-formed: $p')"
done
