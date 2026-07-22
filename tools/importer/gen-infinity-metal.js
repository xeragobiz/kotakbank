/* eslint-disable */
/*
 * Content generator for the Infinity Metal Debit Card page.
 *
 * Emits the EDS block-table HTML (content/kotak811-infinity-metal-debit-card.plain.html)
 * using the verified structured data captured from the original page. Faithful
 * reproduction with the dedicated k811-* blocks (video hero, offers, card
 * selector, steps, faq, cta). Run: node tools/importer/gen-infinity-metal.js
 */
const fs = require('fs');
const path = require('path');

const CDN = 'https://d2gwgwt9a7yxle.cloudfront.net';
const VID = 'https://d3fn8vpnyvleeg.cloudfront.net';

const img = (src, alt = '') => `<picture><img src="${src}" alt="${alt}"></picture>`;
const field = (name, inner) => `<div><!-- field:${name} -->${inner}</div>`;
const cell = (inner) => `<div>${inner}</div>`;
// A single-cell block ROW: <div>(row)<div>(cell)...</div></div>
const row1 = (inner) => `<div><div>${inner}</div></div>`;
const sectionMeta = (style) => `<div class="section-metadata"><div><div>style</div><div>${style}</div></div></div>`;

// ---- Section 1: video hero ------------------------------------------------
const hero = `<div class="k811-video-hero">
  ${cell(field('videoDesktop', `<p>${VID}/mdc_desktop_banner_d70e8d58bf.mp4</p>`))}
  ${cell(field('videoMobile', `<p>${VID}/mdc_mobile_banner_6f78cda8bd.mp4</p>`))}
  ${cell(field('poster', `<p>${img(`${CDN}/mdc_video_poster_desktop_3e7d5270b6.jpg`, 'Infinity Metal Debit Card')}</p>`))}
  ${cell(field('text', '<h1>INFINITY METAL DEBIT CARD</h1><h2>The Power of Metal.</h2><h3>Now Crafted in Colours.</h3>'))}
  ${cell(field('primaryCta', '<p><a href="/open-zero-balance-savings-account/mdc-2?utm_source=kotak811_website_mdc_pp&utm_medium=organic&utm_campaign=account_open">Get your metal card</a></p>'))}
  ${cell(field('secondaryCta', '<p>Existing customer? <a href="https://811.onelink.me/xfzM/DCSMDC">Apply here</a></p>'))}
</div>`;

// ---- Section 2: exclusive offers (photo cards) — reuse k811-offers --------
const offers = [
  ['Airport travel, elevated', 'Enjoy complimentary domestic airport lounge access every quarter.', 'Gold_desktop_v2_fd1ce2f1b2.jpg'],
  ['Cinema nights, twice as good', 'Buy 1 get 1 free movie tickets on BookMyShow.', 'Red_2e0760661c.jpg'],
  ['Fine dining, finer rewards', 'Savour delicious meals with 20% off up to ₹750/month on Zomato Dining.', 'Black_v1_f14c3daa69.jpg'],
  ['Cashback on every swipe', 'Enjoy cashback up to ₹6,000/year on shopping, dining and travel.', 'Rose_Gold_desktop_409f549663.jpg'],
];
const offersBlock = `<div class="k811-offers">
  ${offers.map(([h, t, im]) => `<div>${field('image', `<p>${img(`${CDN}/${im}`, h)}</p>`)}${field('text', `<h3>${h}</h3><p>${t}</p>`)}</div>`).join('\n  ')}
</div>`;

// ---- Section 3: choose your metal (card selector) -------------------------
const variants = [
  ['Gold', 'Gold_e9b1f662c8.png', '₹4,999', '₹1,999', '₹4,999', '₹1,81,100'],
  ['Rose Gold', 'Rose_Gold_68c760b557.png', '₹3,999', '₹1,499', '₹3,999', '₹81,100'],
  ['Midnight Black', 'Black_7d0e21494b.png', '₹3,999', '₹1,499', '₹3,999', '₹81,100'],
  ['Crimson Red', 'red_816bdb5741.png', '₹3,999', '₹1,499', '₹3,999', '₹81,100'],
  ['Silver', 'Silver_70fe786e70.png', '₹3,999', '₹1,499', '₹3,999', '₹81,100'],
];
const selectorRows = variants.map(([name, im, issue, best, strike, deposit]) => {
  const panel = `<h3>Fees &amp; eligibility</h3>`
    + `<p><strong>Issuance fee:</strong> ${issue}</p>`
    + `<p><strong>Best value:</strong> ${best} <s>${strike}</s></p>`
    + `<p><strong>One-time deposit:</strong> ${deposit}</p>`;
  return `<div>`
    + cell(`<p>${name}</p>`)
    + cell(`<p>${img(`${CDN}/${im}`, name)}</p>`)
    + cell(panel)
    + cell('<p><a href="/open-zero-balance-savings-account/mdc-2?utm_source=kotak811_website_mdc_pp&utm_medium=organic&utm_campaign=account_open">Apply now</a></p>')
    + cell('<p><a href="/debit-cards/infinity-metal-debit-card/terms-and-conditions">T&amp;C apply</a></p>')
    + `</div>`;
}).join('\n  ');
const selectorBlock = `<div class="k811-card-selector">
  ${row1('<h2>CHOOSE YOUR METAL</h2>')}
  ${selectorRows}
</div>`;

// ---- Section 4: additional features (icon grid) — reuse k811-offers list --
const features = [
  ['2.5% fuel surcharge waiver', 'Enjoy surcharge waiver on fuel spends of up to ₹50,000/month.', 'mdc_icon_fuel_waiver_f2749d906f.png'],
  ['2% forex markup', 'Save more on every international transaction with a low forex markup.', 'icon_Forex_f702858a3c.png'],
  ['Higher limits', 'Enjoy daily spends up to ₹4 lakhs and ATM withdrawals up to ₹1.5 lakhs.', 'mdc_icon_spend_limit_32f55e849c.png'],
  ['₹1 Cr Air Insurance cover', 'Includes air accidental cover, lost card, lost baggage & more.', 'mdc_icon_insurance_0ca024a4df.png'],
];
const featuresBlock = `<div class="k811-offers list">
  ${row1('<h2>ADDITIONAL FEATURES</h2>')}
  ${features.map(([h, t, ic]) => `<div>${field('image', `<p>${img(`${CDN}/${ic}`, h)}</p>`)}${field('text', `<h3>${h}</h3><p>${t}</p>`)}</div>`).join('\n  ')}
</div>`;

// ---- Section 5: how to apply (steps) --------------------------------------
const steps = [
  'Open an 811 Super Account online - zero paperwork.',
  'Select the metal debit card that reflects your style.',
  'Unlock a world of rewards & savings, curated for you.',
];
const stepsBlock = `<div class="k811-steps">
  ${row1('<h2>HOW TO APPLY</h2>')}
  ${steps.map((s) => row1(`<p>${s}</p>`)).join('\n  ')}
  ${row1('<p><a href="/open-zero-balance-savings-account/mdc-2?utm_source=kotak811_website_mdc_pp&utm_medium=organic&utm_campaign=account_open">Apply now</a></p>')}
  ${row1('<p>Existing customer? <a href="https://811.onelink.me/xfzM/DCSMDC">Click here</a></p>')}
</div>`;

// ---- Section 6: FAQ -------------------------------------------------------
const faqs = [
  ['What are the Annual Fees?', 'Click here to view the latest fees &amp; charges for Infinity Metal Debit Card.'],
  ['Do I get complimentary domestic lounge access?', 'Yes, you get 4 complimentary visits annually (1 per quarter) at selected domestic airport lounges.'],
  ['Will I get buy 1 &amp; get 1 free movie tickets?', 'Yes, you can buy 1 &amp; get 1 free movie ticket up to ₹300 off once every month. It is applicable on a minimum transaction value of ₹400 on BookMyShow.'],
  ['What are the dining offers?', 'You can enjoy 20% off up to ₹750 on a minimum billing of ₹2,000 once every month on Zomato Dining.'],
  ['What are the Forex benefits?', 'Other banks charge a forex markup of up to 3.5% on international transactions. With Infinity Metal Debit Card, the forex markup is only 2%.'],
  ['How many free ATM transactions do I get?', 'Click here to view the latest transaction limits for Infinity Metal Debit Card.'],
  ['What are the spending limits on the card?', 'ATM transactions: ₹1.5 lakhs per day. In-store &amp; online shopping: ₹4 lakhs per day.'],
  ['What if I forget my PIN?', 'If you forget your PIN, you can easily reset it through the Kotak811 Mobile Banking App.'],
  ['What should I do if I lose my Debit Card?', 'You can instantly block your card through the Kotak811 Mobile Banking App, or contact customer support at 1800 4100.'],
  ['How do I activate my Kotak811 Infinity Metal Debit Card?', 'You can set up your PIN and card controls directly from the Debit Card section on the Kotak811 Mobile Banking App.'],
];
const faqBlock = `<div class="k811-faq">
  ${row1('<h2>Ask Kotak811</h2>')}
  ${row1('<h3>Frequently Asked Questions</h3>')}
  ${faqs.map(([q, a]) => `<div>${cell(`<p>${q}</p>`)}${cell(`<p>${a}</p>`)}</div>`).join('\n  ')}
</div>`;

// ---- Section 7: detailed features (default content) -----------------------
const detailed = `<h2>DETAILED FEATURES</h2>
<h3>Choose Kotak811 Infinity Metal Debit Card for extra perks</h3>
<p>The Kotak811 Infinity Metal Debit Card blends premium metal design with rewards across travel, dining, and shopping.</p>
<h3>Premium offers that add more to every spend</h3>
<p>From complimentary lounge access to cashback and movie offers, every swipe is rewarding.</p>`;

// ---- Section 8: download app (cta) — reuse k811-cta -----------------------
const ctaBlock = `<div class="k811-cta">
  ${cell(field('image', `<p>${img(`${CDN}/Website_App_QR_code_4_becfe0162e.png`, 'Download the app')}</p>`))}
  ${cell(field('title', '<h2>Download the app</h2><h2>Download your bank</h2><p><a href="https://811.onelink.me/xfzM/webtokotak811app">Download App</a></p>'))}
</div>`;

// ---- Assemble sections (separated by top-level <div> = section) -----------
const html = [
  `<div>${hero}${sectionMeta('metal')}</div>`,
  `<div>${offersBlock}${sectionMeta('light')}</div>`,
  `<div>${selectorBlock}${sectionMeta('dark')}</div>`,
  `<div>${featuresBlock}${sectionMeta('dark')}</div>`,
  `<div>${stepsBlock}${sectionMeta('light')}</div>`,
  `<div>${faqBlock}${sectionMeta('light')}</div>`,
  `<div>${detailed}${sectionMeta('light')}</div>`,
  `<div>${ctaBlock}${sectionMeta('dark')}</div>`,
  `<div><div class="metadata"><div><div>Title</div><div>Infinity Metal Debit Card | Kotak811</div></div><div><div>Description</div><div>Premium metal debit card with airport lounge access, movie and dining offers, cashback and more.</div></div></div></div>`,
].join('\n');

const out = path.join(__dirname, '..', '..', 'content', 'kotak811-infinity-metal-debit-card.plain.html');
fs.writeFileSync(out, `${html}\n`);
console.log(`Wrote ${out} (${html.length} bytes)`);
