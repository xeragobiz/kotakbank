/* eslint-disable */
/*
 * Content generator for the About Us page.
 * Emits content/kotak811-about-us.plain.html using verified structured data.
 * Blocks: k811-video-hero, k811-story (x3), k811-pillars, k811-team, default.
 * Run: node tools/importer/gen-about-us.js
 */
const fs = require('fs');
const path = require('path');

const CDN = 'https://d2gwgwt9a7yxle.cloudfront.net';

const img = (src, alt = '') => `<picture><img src="${src}" alt="${alt}"></picture>`;
const field = (name, inner) => `<div><!-- field:${name} -->${inner}</div>`;
const cell = (inner) => `<div>${inner}</div>`;
const row1 = (inner) => `<div><div>${inner}</div></div>`;
const sectionMeta = (style) => `<div class="section-metadata"><div><div>style</div><div>${style}</div></div></div>`;

// ---- Section 1: about hero (full-bleed looping video + centered heading) --
const hero = `<div class="k811-about-hero">
  ${cell(field('video', `<p>${CDN}/Kotak_Website_HD_No_Text_2_6e093e2bf6.mp4</p><p>${CDN}/Kotak_Website_mobile_2_Withou_text_3_2_615db81c7a.mp4</p>`))}
  ${cell(field('text', '<h1>Rebuilding your bank, byte by byte</h1>'))}
</div>`;

// ---- Sections 2-4: story panels (full-bleed image + overlay) --------------
const stories = [
  ['Innovators first, bankers next', 'Turning footsteps to a bank to finger taps on the phone - we innovate for comfort.', 'innovater_first_ebaed783f6.jpg', 'left'],
  ['Inspired by change, to set in a revolution', 'When 8/11/2016 ushered in the unknown, Kotak811 gave India the power to step into the new, with the trusted companion - Kotak Mahindra Bank.', 'revolution_2a9f9e26b5.jpg', 'left'],
  ['Dedicated to inquire, innovate and inspire', 'In the Kotak811 way of banking, the customer comes first, every step of the way.', 'Dedicated_bd051625b5.jpg', 'left'],
];
const storyBlocks = stories.map(([h, t, im, align]) => `<div class="k811-story">
  ${cell(field('image', `<p>${img(`${CDN}/${im}`, h)}</p>`))}
  ${cell(field('text', `<h2>${h}</h2><p>${t}</p>`))}
  ${cell(`<p>${align}</p>`)}
</div>`);

// ---- Section 5: value pillars (tabbed lottie) -----------------------------
const pillars = [
  ['We innovate to build future-facing solutions for today', 'Technology courses through everything we do to offer an enhanced banking experience', 'Kotak_811_About_Us_Page_Animation_1_3438be6a5b.json', 'Kotak_811_About_Us_Page_Animation_1_Mobile_ba4ca35499.json'],
  ['We focus on agility to move with the people we serve', 'Being digital-first allows us to evolve with the rest of the world', 'Kotak_811_About_Us_Page_Animation_2_3c7b91b1bc.json', 'Kotak_811_About_Us_Page_Animation_1_Mobile_ba4ca35499.json'],
  ['We put the user first, every step of the way', 'Our approach to banking is non-negotiably customer-centric', 'Kotak_811_About_Us_Page_Animation_3_a6a6042e27.json', 'Kotak_811_About_Us_Page_Animation_3_Mobile_7ea78a2cb1.json'],
  ["We carry the tradition of Kotak Mahindra's trust", 'The iron-clad trust of Kotak Mahindra Bank inspires us to achieve and offer the best', 'Kotak_811_About_Us_Page_Animation_4_bc22033ae6.json', 'Kotak_811_About_Us_Page_Animation_4_Mobile_07eb568b88.json'],
];
const pillarsBlock = `<div class="k811-pillars">
  ${row1('<h2>We always serve by the rules.</h2>')}
  ${pillars.map(([title, desc, ld, lm]) => `<div>${cell(`<p>${title}</p>`)}${cell(`<p>${desc}</p>`)}${cell(`<p>${CDN}/${ld}</p>`)}${cell(`<p>${CDN}/${lm}</p>`)}</div>`).join('\n  ')}
</div>`;

// ---- Section 6: team ------------------------------------------------------
const team = [
  ['Manish Agarwal', 'manish_agarwal_3d8b29efd2.jpg', 'https://www.linkedin.com/in/armagarwal'],
  ['Jay Kotak', 'jay_kotak_2cce1d219c.jpg', 'https://www.linkedin.com/in/jayukotak'],
];
const teamBlock = `<div class="k811-team">
  ${row1('<h2>The Essentials</h2>')}
  ${team.map(([name, photo, li]) => `<div>${cell(`<p>${img(`${CDN}/${photo}`, name)}</p>`)}${cell(`<p>${name}</p>`)}${cell(`<p><a href="${li}">LinkedIn</a></p>`)}</div>`).join('\n  ')}
</div>`;

// ---- Section 7: brand logo band (default content) -------------------------
const logoBand = `<p>${img(`${CDN}/kotak_mahindra_logo_bdab62eafb.svg`, 'Kotak Mahindra Bank')}</p>`;

const html = [
  `<div>${hero}</div>`,
  `<div>${storyBlocks[0]}</div>`,
  `<div>${storyBlocks[1]}</div>`,
  `<div>${storyBlocks[2]}</div>`,
  `<div>${pillarsBlock}${sectionMeta('light')}</div>`,
  `<div>${teamBlock}${sectionMeta('light')}</div>`,
  `<div>${logoBand}${sectionMeta('brand-red')}</div>`,
  `<div><div class="metadata"><div><div>Title</div><div>About Us | Kotak811</div></div><div><div>Description</div><div>Rebuilding your bank, byte by byte. Learn about Kotak811 - digital-first banking from Kotak Mahindra Bank.</div></div></div></div>`,
].join('\n');

const out = path.join(__dirname, '..', '..', 'content', 'kotak811-about-us.plain.html');
fs.writeFileSync(out, `${html}\n`);
console.log(`Wrote ${out} (${html.length} bytes)`);
