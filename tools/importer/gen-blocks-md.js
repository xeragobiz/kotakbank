/* eslint-disable */
/*
 * GridTable block-table Markdown generator for the 3 kotak811 pages.
 *
 * Emits the block-table Markdown that @adobe/helix-md2jcr expects (the same
 * format as content/kotak811-home.blocks.md). One .md is written per page under
 * migration-work/. Convert to JCR XML with md2jcr (see gen-all.sh).
 *
 *   node tools/importer/gen-blocks-md.js
 *
 * Simple (non-container) blocks: one ROW per model field-GROUP, each row a
 * single stacked cell led by a `<!-- field:x -->` hint.
 * Container blocks (offers, card-selector, steps, faq, pillars, team): the
 * parent model's fields come first (one row each), then one ROW PER ITEM with
 * one cell per item field.
 */
const fs = require('fs');
const path = require('path');

const CDN = 'https://d2gwgwt9a7yxle.cloudfront.net';
const VID = 'https://d3fn8vpnyvleeg.cloudfront.net';
const OUT = path.join(__dirname, '..', '..', 'migration-work');

// ---- GridTable helpers ----------------------------------------------------
// Render a grid table: header cell + array of rows. Each row is an array of
// cells; each cell is an array of markdown lines. Widths are auto-computed.
function gridTable(header, rows) {
  // flatten every cell into an array of lines, compute per-column widths
  const norm = rows.map((r) => r.map((c) => (Array.isArray(c) ? c : [c])));
  const cols = norm.reduce((m, r) => Math.max(m, r.length), 1);
  const widths = new Array(cols).fill(0);
  const consider = (line) => line.length;
  norm.forEach((r) => r.forEach((cell, ci) => {
    cell.forEach((line) => { widths[ci] = Math.max(widths[ci], consider(line)); });
  }));
  // header spans full width
  const headerWidth = Math.max(header.length, widths.reduce((a, b) => a + b, 0) + (cols - 1) * 3);
  // redistribute so total matches headerWidth (give slack to last col)
  let total = widths.reduce((a, b) => a + b, 0) + (cols - 1) * 3;
  if (total < headerWidth) widths[cols - 1] += headerWidth - total;

  const pad = (s, w) => `| ${s}${' '.repeat(Math.max(0, w - s.length))} `;
  const sep = (ch) => `+${widths.map((w) => ch.repeat(w + 2)).join('+')}+`;
  const line = (ch) => `+${'-'.repeat(headerWidth + 2)}+`.length; // unused

  const out = [];
  // top border (single column spanning header)
  const fullW = widths.reduce((a, b) => a + b, 0) + (cols - 1) * 3;
  out.push(`+${'-'.repeat(fullW + 2)}+`);
  out.push(`| ${header}${' '.repeat(Math.max(0, fullW - header.length))} |`);
  out.push(sep('='));
  norm.forEach((r, ri) => {
    // determine max lines in this row
    const h = r.reduce((m, c) => Math.max(m, c.length), 1);
    for (let li = 0; li < h; li += 1) {
      let rowStr = '';
      for (let ci = 0; ci < cols; ci += 1) {
        const cell = r[ci] || [''];
        const text = cell[li] || '';
        rowStr += pad(text, widths[ci]);
      }
      out.push(`${rowStr}|`);
    }
    out.push(sep('-'));
  });
  return out.join('\n');
}

function sectionMeta(style) {
  // 2-column grid table: | style | <value> |. The right column must be wide
  // enough for the value (md2jcr silently drops values that overflow their
  // separator). The single-column header row must span the full inner width.
  const KEY = 'style';
  const keyW = 7; // left column content width (matches the canonical format)
  const valW = Math.max(6, style.length); // right column content width
  // full inner width of a single-column row = keyW + valW + 3 (the " | " join)
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

// escape markdown-significant chars inside link URLs (& must be \&)
const url = (u) => u.replace(/&/g, '\\&');

// image reference collector
class Images {
  constructor() { this.map = new Map(); this.order = []; }
  ref(src, alt = '') {
    if (!this.map.has(src)) {
      const id = `image${this.order.length}`;
      this.map.set(src, id);
      this.order.push(src);
    }
    return `![${alt || 'null'}][${this.map.get(src)}]`;
  }
  block() {
    return this.order.map((src, i) => `[image${i}]: ${src}`).join('\n\n');
  }
}

// ---------------------------------------------------------------------------
// PAGE 1: HOME
// ---------------------------------------------------------------------------
function home() {
  const im = new Images();
  const parts = [];

  // K811 Hero. The model groups fields: bg (desktop+mobile image), text
  // (richtext + colour/layout/gradient selects), primaryCta, secondaryCta.
  // md2jcr maps ONE ROW per field-group, so both bg images share one cell and
  // the richtext greedily consumes the heading(s) + trailing layout token.
  parts.push(gridTable('K811 Hero', [
    [[
      '<!-- field:bg_image -->', '', im.ref(`${CDN}/MDC_All_Cards_811_Website_Homepage_Banner_Desktop_184580e31d.jpg`, 'banner'), '',
      '<!-- field:bg_imageMobile -->', '', im.ref(`${CDN}/MDC_All_Cards_811_Website_Homepage_Banner_03fd5cb1c2_79ba7348ba.png`, 'banner'),
    ]],
    [['<!-- field:text -->', '', '# INFINITY METAL DEBIT CARD', '', '## *The Power of Metal.*', '', '### *Now Crafted in Colours.*', '', 'metal']],
    [['<!-- field:primaryCta -->', '', `[Apply Now](${url('/open-zero-balance-savings-account/mdc-2?utm_source=kotak811_website_hp&utm_medium=organic&utm_campaign=account_open')})`]],
  ]) + '\n\n' + sectionMeta('metal'));

  // K811 Offers (container, grid)
  const offers = [
    ['Complimentary Lounge Access', '4 free domestic lounge access', 'complimentary_lounge_airport_access160_X94_bcdae6da57_c7004f3c39.png'],
    ['₹6,000 Cashback with 811 Super', 'Enjoy cashback on Debit Card spends', 'cashback_160_X94_b68a419db2_f10090fccc.png'],
    ['20% off on Zomato Dining', 'Experience dining like never before', 'zomato_dining_160_X94_6a2b137cc1_62e03a8e92.png'],
    ['1+1 Movie tickets on BookMyShow', 'Your ultimate movie nights start here', 'movie_offer_160_X94_f9106641be_fd074532a5.png'],
  ];
  parts.push(container('K811 Offers',
    '',
    offers.map(([h, t, ic]) => [
      ['<!-- field:image -->', '', im.ref(`${CDN}/${ic}`)],
      ['<!-- field:text -->', '', `## ${h}`, '', t],
    ])) + '\n\n' + sectionMeta('light'));

  // K811 Feature x5
  const features = [
    ['bank_wherever_you_are_fce949deca.webp', 'Manage your savings account online using Kotak811', 'The nearest bank, wherever you are', ['Visit branches no more. Open an account and manage your money online.'], null, 'light'],
    ['zero_paper_work_f1980c9d27.webp', 'Open Kotak811 account digitally', '811 Current Account', ['Simplify your banking with a Kotak811 Current Account that supports your evolving business needs'], ['Open Current A/c', '/apply-for-bank-account/current-account?utm_source=kotak811_website_2ndcta&utm_medium=organic&utm_campaign=lead_gen'], 'light'],
    ['virtual_debit_card_d3d5a7bd1a.webp', 'Virtual debit card inside your phone', 'With 811, debit cards get virtual ...', ['Get a no-fee virtual debit card with your Kotak811 account that sits inside your phone, on the app. Use it to shop and pay online. Order a physical card if you like.'], ['Open Kotak811 A/c', '/open-zero-balance-savings-account?utm_source=kotak811_website_3rdcta&utm_medium=organic&utm_campaign=lead_gen'], 'light'],
    ['credit_card_eca9fcd47d.webp', 'Obtaining a credit card becomes effortless Kotak811', '... and credit cards get easy', ['Credit scores can’t limit you anymore. With a Kotak811 account, you’re always eligible for a credit card, because everyone deserves to be rewarded.'], ['View 811 Credit Card', '/credit-cards/811-credit-card'], 'dark'],
  ];
  features.forEach(([ic, alt, h, paras, cta, style]) => {
    parts.push(feature(im, ic, alt, h, paras, cta) + '\n\n' + sectionMeta(style));
  });

  // default-content security section
  parts.push([
    '## Next-gen security meets age-old trust',
    '',
    'Governed by RBI regulations, Kotak811 guards your money with top-notch security, so you can save and spend worry-free, through your phone.',
    '',
    sectionMeta('light'),
  ].join('\n'));

  // K811 Cta
  parts.push(gridTable('K811 CTA', [
    [['<!-- field:image -->', '', im.ref(`${CDN}/kotak_toll_free_number_18004100_3b075ce61b.png`, '')]],
    [['<!-- field:title -->', '', '## Call our new toll-free number 1800 4100 for all banking needs']],
  ]) + '\n\n' + sectionMeta('accent'));

  // K811 Feature (download app)
  parts.push(feature(im, 'Website_App_QR_code_4_becfe0162e.png', 'Download the app', 'Download the app',
    ['## Download your bank'], ['Download App', 'https://811.onelink.me/xfzM/webtokotak811app'], true) + '\n\n' + sectionMeta('dark'));

  // page metadata
  parts.push(metadata(im,
    'Kotak 811: Savings Account, Credit & Debit Cards, Instant Personal Loan',
    'Kotak Bank 811 is a digital one app bank delivering seamless digital banking solutions. Kotak 811 offers digital savings accounts, instant personal loan, virtual debit & credit cards, and 5.50%* interest p.a. with ActivMoney.',
    'https://www.kotak811.bank.in/images/social-share.png'));

  return assemble(parts, im);
}

// K811 Feature helper. paras: array of paragraph strings (may already contain
// heading markdown like '## x'); cta: [text, href] or null; secondHeading
// unused flag kept for clarity.
function feature(im, ic, alt, heading, paras, cta) {
  const textLines = [`## ${heading}`];
  paras.forEach((p) => { textLines.push('', p); });
  if (cta) { textLines.push('', `[${cta[0]}](${url(cta[1])})`); }
  return gridTable('K811 Feature', [
    [['<!-- field:image -->', '', im.ref(`${CDN}/${ic}`, alt)]],
    [['<!-- field:text -->', '', ...textLines]],
  ]);
}

// Generic container-block table. These blocks are filter-only (no parent
// model), so a section "title" can't be a parent field; it is emitted as a
// leading default-content <h2> in the same section (the block JS reads its
// optional title from a single-cell heading row, but for a clean md2jcr
// mapping we surface it as a section heading immediately above the block).
// Returns the markdown for (optional heading + block table).
function container(header, title, itemRows) {
  const table = gridTable(header, itemRows);
  return title ? `## ${title}\n\n${table}` : table;
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
// PAGE 2: INFINITY METAL DEBIT CARD
// ---------------------------------------------------------------------------
function infinity() {
  const im = new Images();
  const parts = [];

  // K811 Video Hero: fields video (richtext, desktop + optional mobile URL as
  // separate lines), poster, text, primaryCta.
  parts.push(gridTable('K811 Video Hero', [
    [['<!-- field:video -->', '', `${VID}/mdc_desktop_banner_d70e8d58bf.mp4`, '', `${VID}/mdc_mobile_banner_6f78cda8bd.mp4`]],
    [['<!-- field:poster -->', '', im.ref(`${CDN}/mdc_video_poster_desktop_3e7d5270b6.jpg`, 'Infinity Metal Debit Card')]],
    [['<!-- field:text -->', '', '# INFINITY METAL DEBIT CARD', '', '## The Power of Metal.', '', '### Now Crafted in Colours.']],
    [['<!-- field:primaryCta -->', '', `[Get your metal card](${url('/open-zero-balance-savings-account/mdc-2?utm_source=kotak811_website_mdc_pp&utm_medium=organic&utm_campaign=account_open')})`]],
  ]) + '\n\n' + sectionMeta('metal'));

  // K811 Offers (grid, photo cards) with title
  const offers = [
    ['Airport travel, elevated', 'Enjoy complimentary domestic airport lounge access every quarter.', 'Gold_desktop_v2_fd1ce2f1b2.jpg'],
    ['Cinema nights, twice as good', 'Buy 1 get 1 free movie tickets on BookMyShow.', 'Red_2e0760661c.jpg'],
    ['Fine dining, finer rewards', 'Savour delicious meals with 20% off up to ₹750/month on Zomato Dining.', 'Black_v1_f14c3daa69.jpg'],
    ['Cashback on every swipe', 'Enjoy cashback up to ₹6,000/year on shopping, dining and travel.', 'Rose_Gold_desktop_409f549663.jpg'],
  ];
  parts.push(container('K811 Offers',
    'Exclusive Offers',
    offers.map(([h, t, ic]) => [
      ['<!-- field:image -->', '', im.ref(`${CDN}/${ic}`, h)],
      ['<!-- field:text -->', '', `## ${h}`, '', t],
    ])) + '\n\n' + sectionMeta('light'));

  // K811 Card Selector: parent title, then variants (name,image,panel,applyCta)
  const variants = [
    ['Gold', 'Gold_e9b1f662c8.png', '₹4,999', '₹1,999', '₹4,999', '₹1,81,100'],
    ['Rose Gold', 'Rose_Gold_68c760b557.png', '₹3,999', '₹1,499', '₹3,999', '₹81,100'],
    ['Midnight Black', 'Black_7d0e21494b.png', '₹3,999', '₹1,499', '₹3,999', '₹81,100'],
    ['Crimson Red', 'red_816bdb5741.png', '₹3,999', '₹1,499', '₹3,999', '₹81,100'],
    ['Silver', 'Silver_70fe786e70.png', '₹3,999', '₹1,499', '₹3,999', '₹81,100'],
  ];
  parts.push(container('K811 Card Selector',
    'CHOOSE YOUR METAL',
    variants.map(([name, ic, issue, best, strike, dep]) => [
      ['<!-- field:name -->', '', name],
      ['<!-- field:image -->', '', im.ref(`${CDN}/${ic}`, name)],
      ['<!-- field:panel -->', '',
        '### Fees & eligibility',
        '',
        `**Issuance fee:** ${issue}`,
        '',
        `**Best value:** ${best} ~~${strike}~~`,
        '',
        `**One-time deposit:** ${dep}`,
        '',
        `[T&C apply](/debit-cards/infinity-metal-debit-card/terms-and-conditions)`],
      ['<!-- field:applyCta -->', '', `[Apply now](${url('/open-zero-balance-savings-account/mdc-2?utm_source=kotak811_website_mdc_pp&utm_medium=organic&utm_campaign=account_open')})`],
    ])) + '\n\n' + sectionMeta('dark'));

  // K811 Offers (list variant) — additional features. classes=list via header.
  const features = [
    ['2.5% fuel surcharge waiver', 'Enjoy surcharge waiver on fuel spends of up to ₹50,000/month.', 'mdc_icon_fuel_waiver_f2749d906f.png'],
    ['2% forex markup', 'Save more on every international transaction with a low forex markup.', 'icon_Forex_f702858a3c.png'],
    ['Higher limits', 'Enjoy daily spends up to ₹4 lakhs and ATM withdrawals up to ₹1.5 lakhs.', 'mdc_icon_spend_limit_32f55e849c.png'],
    ['₹1 Cr Air Insurance cover', 'Includes air accidental cover, lost card, lost baggage & more.', 'mdc_icon_insurance_0ca024a4df.png'],
  ];
  parts.push(container('K811 Offers (list)',
    'ADDITIONAL FEATURES',
    features.map(([h, t, ic]) => [
      ['<!-- field:image -->', '', im.ref(`${CDN}/${ic}`, h)],
      ['<!-- field:text -->', '', `## ${h}`, '', t],
    ])) + '\n\n' + sectionMeta('dark'));

  // K811 Steps: parent title, then step items (single richtext each)
  const steps = [
    'Open an 811 Super Account online - zero paperwork.',
    'Select the metal debit card that reflects your style.',
    'Unlock a world of rewards & savings, curated for you.',
  ];
  parts.push(container('K811 Steps',
    'HOW TO APPLY',
    steps.map((s) => [['<!-- field:text -->', '', s]])) + '\n\n' + sectionMeta('light'));

  // K811 FAQ: parent title, then question/answer items
  const faqs = [
    ['What are the Annual Fees?', 'Click here to view the latest fees & charges for Infinity Metal Debit Card.'],
    ['Do I get complimentary domestic lounge access?', 'Yes, you get 4 complimentary visits annually (1 per quarter) at selected domestic airport lounges.'],
    ['Will I get buy 1 & get 1 free movie tickets?', 'Yes, you can buy 1 & get 1 free movie ticket up to ₹300 off once every month. It is applicable on a minimum transaction value of ₹400 on BookMyShow.'],
    ['What are the dining offers?', 'You can enjoy 20% off up to ₹750 on a minimum billing of ₹2,000 once every month on Zomato Dining.'],
    ['What are the Forex benefits?', 'Other banks charge a forex markup of up to 3.5% on international transactions. With Infinity Metal Debit Card, the forex markup is only 2%.'],
    ['How many free ATM transactions do I get?', 'Click here to view the latest transaction limits for Infinity Metal Debit Card.'],
    ['What are the spending limits on the card?', 'ATM transactions: ₹1.5 lakhs per day. In-store & online shopping: ₹4 lakhs per day.'],
    ['What if I forget my PIN?', 'If you forget your PIN, you can easily reset it through the Kotak811 Mobile Banking App.'],
    ['What should I do if I lose my Debit Card?', 'You can instantly block your card through the Kotak811 Mobile Banking App, or contact customer support at 1800 4100.'],
    ['How do I activate my Kotak811 Infinity Metal Debit Card?', 'You can set up your PIN and card controls directly from the Debit Card section on the Kotak811 Mobile Banking App.'],
  ];
  parts.push(container('K811 FAQ',
    'Ask Kotak811',
    faqs.map(([q, a]) => [
      ['<!-- field:question -->', '', q],
      ['<!-- field:answer -->', '', a],
    ])) + '\n\n' + sectionMeta('light'));

  // default content: detailed features
  parts.push([
    '## DETAILED FEATURES',
    '',
    '### Choose Kotak811 Infinity Metal Debit Card for extra perks',
    '',
    'The Kotak811 Infinity Metal Debit Card blends premium metal design with rewards across travel, dining, and shopping.',
    '',
    '### Premium offers that add more to every spend',
    '',
    'From complimentary lounge access to cashback and movie offers, every swipe is rewarding.',
    '',
    sectionMeta('light'),
  ].join('\n'));

  // K811 Cta (download app)
  parts.push(gridTable('K811 CTA', [
    [['<!-- field:image -->', '', im.ref(`${CDN}/Website_App_QR_code_4_becfe0162e.png`, 'Download the app')]],
    [['<!-- field:title -->', '', '## Download the app. Download your bank.']],
  ]) + '\n\n' + sectionMeta('dark'));

  parts.push(metadata(im,
    'Infinity Metal Debit Card | Kotak811',
    'Premium metal debit card with airport lounge access, movie and dining offers, cashback and more.',
    `${CDN}/mdc_video_poster_desktop_3e7d5270b6.jpg`));

  return assemble(parts, im);
}

// ---------------------------------------------------------------------------
// PAGE 3: ABOUT US
// ---------------------------------------------------------------------------
function about() {
  const im = new Images();
  const parts = [];

  // K811 Video Hero (no primaryCta/poster) — supply video + text only, plus
  // empty poster & primaryCta rows so every field group aligns to a row.
  parts.push(gridTable('K811 Video Hero', [
    [['<!-- field:video -->', '', `${CDN}/Kotak_Website_HD_No_Text_2_6e093e2bf6.mp4`, '', `${CDN}/Kotak_Website_mobile_2_Withou_text_3_2_615db81c7a.mp4`]],
    [['<!-- field:poster -->', '', '']],
    [['<!-- field:text -->', '', '# Rebuilding your bank, byte by byte']],
  ]) + '\n\n' + sectionMeta('dark'));

  // K811 Story x3 (image, imageAlt via alt on image, text, align)
  const stories = [
    ['Innovators first, bankers next', 'Turning footsteps to a bank to finger taps on the phone - we innovate for comfort.', 'innovater_first_ebaed783f6.jpg', 'left'],
    ['Inspired by change, to set in a revolution', 'When 8/11/2016 ushered in the unknown, Kotak811 gave India the power to step into the new, with the trusted companion - Kotak Mahindra Bank.', 'revolution_2a9f9e26b5.jpg', 'right'],
    ['Dedicated to inquire, innovate and inspire', 'In the Kotak811 way of banking, the customer comes first, every step of the way.', 'Dedicated_bd051625b5.jpg', 'left'],
  ];
  stories.forEach(([h, t, ic, align]) => {
    parts.push(gridTable('K811 Story', [
      [['<!-- field:image -->', '', im.ref(`${CDN}/${ic}`, h)]],
      [['<!-- field:text -->', '', `## ${h}`, '', t]],
      [['<!-- field:align -->', '', align]],
    ]));
  });

  // K811 Pillars: parent title, then pillars (title,description,lottieDesktop,lottieMobile)
  const pillars = [
    ['We innovate to build future-facing solutions for today', 'Technology courses through everything we do to offer an enhanced banking experience', 'Kotak_811_About_Us_Page_Animation_1_3438be6a5b.json', 'Kotak_811_About_Us_Page_Animation_1_Mobile_ba4ca35499.json'],
    ['We focus on agility to move with the people we serve', 'Being digital-first allows us to evolve with the rest of the world', 'Kotak_811_About_Us_Page_Animation_2_3c7b91b1bc.json', 'Kotak_811_About_Us_Page_Animation_1_Mobile_ba4ca35499.json'],
    ['We put the user first, every step of the way', 'Our approach to banking is non-negotiably customer-centric', 'Kotak_811_About_Us_Page_Animation_3_a6a6042e27.json', 'Kotak_811_About_Us_Page_Animation_3_Mobile_7ea78a2cb1.json'],
    ["We carry the tradition of Kotak Mahindra's trust", 'The iron-clad trust of Kotak Mahindra Bank inspires us to achieve and offer the best', 'Kotak_811_About_Us_Page_Animation_4_bc22033ae6.json', 'Kotak_811_About_Us_Page_Animation_4_Mobile_07eb568b88.json'],
  ];
  parts.push(container('K811 Pillars',
    'We always serve by the rules.',
    pillars.map(([title, desc, ld, lm]) => [
      ['<!-- field:title -->', '', title],
      ['<!-- field:description -->', '', desc],
      ['<!-- field:lottieDesktop -->', '', `${CDN}/${ld}`],
      ['<!-- field:lottieMobile -->', '', `${CDN}/${lm}`],
    ])) + '\n\n' + sectionMeta('light'));

  // K811 Team: parent title, then members (image,name,linkedin)
  const team = [
    ['Manish Agarwal', 'manish_agarwal_3d8b29efd2.jpg', 'https://www.linkedin.com/in/armagarwal'],
    ['Jay Kotak', 'jay_kotak_2cce1d219c.jpg', 'https://www.linkedin.com/in/jayukotak'],
  ];
  parts.push(container('K811 Team',
    'The Essentials',
    team.map(([name, photo, li]) => [
      ['<!-- field:image -->', '', im.ref(`${CDN}/${photo}`, name)],
      ['<!-- field:name -->', '', name],
      ['<!-- field:linkedin -->', '', `[LinkedIn](${url(li)})`],
    ])) + '\n\n' + sectionMeta('light'));

  // brand logo band (default content)
  parts.push([im.ref(`${CDN}/kotak_mahindra_logo_bdab62eafb.svg`, 'Kotak Mahindra Bank'), '', sectionMeta('brand-red')].join('\n'));

  parts.push(metadata(im,
    'About Us | Kotak811',
    'Rebuilding your bank, byte by byte. Learn about Kotak811 - digital-first banking from Kotak Mahindra Bank.',
    `${CDN}/innovater_first_ebaed783f6.jpg`));

  return assemble(parts, im);
}

// ---------------------------------------------------------------------------
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const pages = {
  'kotak811-home': home(),
  'kotak811-infinity-metal-debit-card': infinity(),
  'kotak811-about-us': about(),
};
Object.entries(pages).forEach(([name, md]) => {
  const p = path.join(OUT, `${name}.md`);
  fs.writeFileSync(p, md);
  console.log(`Wrote ${p} (${md.length} bytes)`);
});
