/* eslint-disable */
/*
 * Content generator for the "CC Landing Page" TEMPLATE.
 *
 * This is a reusable STARTING LAYOUT (a "duplicate-me" template) for a
 * credit-card marketing landing page, not a migrated live page. It emits the
 * GridTable block-table markdown (migration-work/cc-landing-page.md) using the
 * same helpers/conventions as gen-blocks-md.js, then md2jcr converts it to JCR
 * XML which build-pages-package.js packs into an installable content package.
 *
 * Sections (matches the requested layout):
 *   1. CC Hero              (banner + heading + primary/secondary CTA)
 *   2. K811 Offers Overlap  (4-up offer/benefit cards)
 *   3. K811 Feature x2      (alternating image/text promos, light + dark)
 *   4. K811 FAQ             ("Ask Kotak811" + 3 starter Q/A)
 *   5. K811 CTA             (closing call-to-action banner)
 *
 * All copy is generic placeholder text so the imported page can be duplicated
 * and re-authored per campaign in Universal Editor.
 *
 * Run:  node tools/importer/gen-cc-landing-page.js
 * Then: (add 'cc-landing-page' to gen-all.sh PAGES + build-pages-package.js
 *        ALL_PAGES, or convert this one .md with md2jcr) to produce the package.
 */
const fs = require('fs');
const path = require('path');

const CDN = 'https://d2gwgwt9a7yxle.cloudfront.net';
const OUT = path.join(__dirname, '..', '..', 'migration-work');

// A neutral 1x1-ish placeholder banner already present in the DAM/CDN set.
// Authors replace these via the reference fields after duplicating the page.
const HERO_DESKTOP = `${CDN}/MDC_All_Cards_811_Website_Homepage_Banner_Desktop_184580e31d.jpg`;
const HERO_MOBILE = `${CDN}/MDC_All_Cards_811_Website_Homepage_Banner_03fd5cb1c2_79ba7348ba.png`;

// ---- GridTable helpers (copied verbatim from gen-blocks-md.js) ------------
function gridTable(header, rows) {
  const norm = rows.map((r) => r.map((c) => (Array.isArray(c) ? c : [c])));
  const cols = norm.reduce((m, r) => Math.max(m, r.length), 1);
  const widths = new Array(cols).fill(0);
  norm.forEach((r) => r.forEach((cell, ci) => {
    cell.forEach((line) => { widths[ci] = Math.max(widths[ci], line.length); });
  }));
  const headerWidth = Math.max(header.length, widths.reduce((a, b) => a + b, 0) + (cols - 1) * 3);
  const total = widths.reduce((a, b) => a + b, 0) + (cols - 1) * 3;
  if (total < headerWidth) widths[cols - 1] += headerWidth - total;

  const pad = (s, w) => `| ${s}${' '.repeat(Math.max(0, w - s.length))} `;
  const sep = (ch) => `+${widths.map((w) => ch.repeat(w + 2)).join('+')}+`;

  const out = [];
  const fullW = widths.reduce((a, b) => a + b, 0) + (cols - 1) * 3;
  out.push(`+${'-'.repeat(fullW + 2)}+`);
  out.push(`| ${header}${' '.repeat(Math.max(0, fullW - header.length))} |`);
  out.push(sep('='));
  norm.forEach((r) => {
    const h = r.reduce((m, c) => Math.max(m, c.length), 1);
    for (let li = 0; li < h; li += 1) {
      let rowStr = '';
      for (let ci = 0; ci < cols; ci += 1) {
        const cell = r[ci] || [''];
        rowStr += pad(cell[li] || '', widths[ci]);
      }
      out.push(`${rowStr}|`);
    }
    out.push(sep('-'));
  });
  return out.join('\n');
}

function sectionMeta(style) {
  const KEY = 'style';
  const keyW = 7;
  const valW = Math.max(6, style.length);
  const innerW = keyW + valW + 3;
  const pad = (s, w) => `${s}${' '.repeat(Math.max(0, w - s.length))}`;
  return [
    `+${'-'.repeat(innerW + 2)}+`,
    `| ${pad('Section Metadata', innerW)} |`,
    `+${'='.repeat(keyW + 2)}+${'='.repeat(valW + 2)}+`,
    `| ${pad(KEY, keyW)} | ${pad(style, valW)} |`,
    `+${'-'.repeat(keyW + 2)}+${'-'.repeat(valW + 2)}+`,
  ].join('\n');
}

const url = (u) => u.replace(/&/g, '\\&');

class Images {
  constructor() { this.map = new Map(); this.order = []; }
  ref(src, alt = '') {
    if (!this.map.has(src)) {
      this.map.set(src, `image${this.order.length}`);
      this.order.push(src);
    }
    return `![${alt || 'null'}][${this.map.get(src)}]`;
  }
  block() {
    return this.order.map((src, i) => `[image${i}]: ${src}`).join('\n\n');
  }
}

// K811 Feature helper (same shape as gen-blocks-md.js): image row + text row.
function feature(im, ic, alt, heading, paras, cta) {
  const textLines = [`## ${heading}`];
  paras.forEach((p) => { textLines.push('', p); });
  if (cta) { textLines.push('', `[${cta[0]}](${url(cta[1])})`); }
  return gridTable('K811 Feature', [
    [['<!-- field:image -->', '', im.ref(`${CDN}/${ic}`, alt)]],
    [['<!-- field:text -->', '', ...textLines]],
  ]);
}

function metadata(im, title, desc, imgSrc) {
  return gridTable('Metadata', [
    ['Title', title],
    ['Description', desc],
    ['Image', im.ref(imgSrc, '')],
  ]);
}

function assemble(parts, im) {
  return parts.join('\n\n---\n\n') + '\n\n' + im.block() + '\n';
}

// ---------------------------------------------------------------------------
// CC LANDING PAGE TEMPLATE
// ---------------------------------------------------------------------------
function ccLandingPage() {
  const im = new Images();
  const parts = [];

  // ---- Section 1: CC Hero -------------------------------------------------
  // Field groups: bg (desktop + optional mobile image), text (richtext heading
  // + colour/layout/gradient selects), primaryCta, secondaryCta. md2jcr maps
  // one row per field group, so the two bg images share a single cell.
  parts.push(gridTable('CC Hero', [
    [[
      '<!-- field:bg_image -->', '', im.ref(HERO_DESKTOP, 'Card banner'), '',
      '<!-- field:bg_imageMobile -->', '', im.ref(HERO_MOBILE, 'Card banner'),
    ]],
    [[
      '<!-- field:text -->', '',
      '# Card Name', '',
      '## *Your headline goes here.*', '',
      '### *A short supporting line.*',
    ]],
    [['<!-- field:primaryCta -->', '', `[Apply Now](${url('/apply')})`]],
    [['<!-- field:secondaryCta -->', '', '[Know More](/credit-cards)']],
  ]) + '\n\n' + sectionMeta('metal'));

  // ---- Section 2: K811 Offers Overlap (4-up cards) ------------------------
  const offers = [
    ['Benefit one', 'Short description of the first key benefit.', 'complimentary_lounge_airport_access160_X94_bcdae6da57_c7004f3c39.png'],
    ['Benefit two', 'Short description of the second key benefit.', 'cashback_160_X94_b68a419db2_f10090fccc.png'],
    ['Benefit three', 'Short description of the third key benefit.', 'zomato_dining_160_X94_6a2b137cc1_62e03a8e92.png'],
    ['Benefit four', 'Short description of the fourth key benefit.', 'movie_offer_160_X94_f9106641be_fd074532a5.png'],
  ];
  parts.push(gridTable('K811 Offers Overlap',
    offers.map(([h, t, ic]) => [
      ['<!-- field:image -->', '', im.ref(`${CDN}/${ic}`, h)],
      ['<!-- field:text -->', '', `## ${h}`, '', t],
    ])) + '\n\n' + sectionMeta('light'));

  // ---- Section 3: K811 Feature x2 (alternating image/text) ----------------
  parts.push(feature(im,
    'virtual_debit_card_d3d5a7bd1a.webp', 'Feature one image',
    'Feature one heading',
    ['Describe the first feature here. Explain the value it brings to the customer in a sentence or two.'],
    ['Learn More', '/credit-cards']) + '\n\n' + sectionMeta('light'));

  parts.push(feature(im,
    'credit_card_eca9fcd47d.webp', 'Feature two image',
    'Feature two heading',
    ['Describe the second feature here. Keep the copy concise and benefit-led.'],
    ['Learn More', '/credit-cards']) + '\n\n' + sectionMeta('dark'));

  // ---- Section 4: K811 FAQ ------------------------------------------------
  const faqs = [
    ['What is the annual fee for this card?', 'Add the annual fee details for this card here.'],
    ['What are the key benefits?', 'Summarise the headline rewards and benefits here.'],
    ['How do I apply?', 'Explain the application steps or link to the apply page here.'],
  ];
  parts.push(['## Ask Kotak811', '', '### Frequently Asked Questions', '',
    gridTable('K811 FAQ', faqs.map(([q, a]) => [
      ['<!-- field:question -->', '', q],
      ['<!-- field:answer -->', '', a],
    ]))].join('\n') + '\n\n' + sectionMeta('dark'));

  // ---- Section 5: K811 CTA (closing banner) -------------------------------
  parts.push(gridTable('K811 CTA', [
    [['<!-- field:image -->', '', im.ref(`${CDN}/kotak_toll_free_number_18004100_3b075ce61b.png`, '')]],
    [['<!-- field:title -->', '', '## Ready to apply? Get your card today.']],
    [['<!-- field:ctaLink -->', '', `[Apply Now](${url('/apply')})`]],
  ]) + '\n\n' + sectionMeta('light'));

  // ---- Page metadata ------------------------------------------------------
  parts.push(metadata(im,
    'Credit Card Landing Page | Kotak811',
    'Template landing page for a Kotak811 credit card. Duplicate and re-author per campaign.',
    'https://www.kotak811.bank.in/images/social-share.png'));

  return assemble(parts, im);
}

// ---------------------------------------------------------------------------
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const p = path.join(OUT, 'cc-landing-page.md');
const md = ccLandingPage();
fs.writeFileSync(p, md);
console.log(`Wrote ${p} (${md.length} bytes)`);
