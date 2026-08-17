import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * K811 Story — full-bleed background image with an overlaid heading + text.
 * Used for the About Us "Innovators / Inspired / Dedicated" panels.
 *
 * Content model (rows): image (background), text (heading + paragraph).
 * Optional modifier cell "right"/"left"/"center" to place the text overlay.
 */

// Art-directed portrait crops for mobile (<900px). The desktop images are
// ultra-wide (2.4:1) and crop badly on a phone, so below 900px we swap in the
// live site's portrait photos (self-hosted alongside this block). Matched by a
// keyword in the panel heading so it stays correct regardless of DAM hashes.
const MOBILE_IMAGES = [
  { match: /innovators?\s+first/i, src: '/blocks/k811-story/img/innovater-first-mobile.jpg' },
  { match: /inspired\s+by\s+change/i, src: '/blocks/k811-story/img/inspired-mobile.jpg' },
  { match: /dedicated\s+to\s+inquire/i, src: '/blocks/k811-story/img/dedicated-mobile.jpg' },
];

function addMobileSource(picture, headingText) {
  if (!picture) return;
  const entry = MOBILE_IMAGES.find((m) => m.match.test(headingText || ''));
  if (!entry) return;
  const source = document.createElement('source');
  source.setAttribute('media', '(max-width: 899px)');
  source.setAttribute('srcset', entry.src);
  // Insert first so it wins over the backend's default sources below 900px.
  picture.prepend(source);
}

export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];
  const cells = rows.map((r) => r.querySelector(':scope > div') || r);

  const imageCell = cells.find((c) => c.querySelector('picture, img'));
  const textCell = cells.find((c) => c !== imageCell
    && c.querySelector('h1, h2, h3, h4, p'));
  const alignCell = cells.find((c) => c !== imageCell && c !== textCell
    && /^(left|right|center)$/i.test((c.textContent || '').trim()));
  const align = alignCell ? alignCell.textContent.trim().toLowerCase() : 'left';

  const headingText = textCell
    ? (textCell.querySelector('h1, h2, h3, h4')?.textContent || '') : '';

  const media = document.createElement('div');
  media.className = 'k811-story-media';
  const picture = imageCell ? imageCell.querySelector('picture') : null;
  if (picture) {
    addMobileSource(picture, headingText);
    media.append(picture);
  } else if (imageCell && imageCell.querySelector('img')) {
    media.append(imageCell.querySelector('img'));
  }

  const content = document.createElement('div');
  content.className = `k811-story-content k811-story-${align}`;
  if (textCell) while (textCell.firstChild) content.append(textCell.firstChild);

  block.replaceChildren(media, content);
  revealOnScroll(block);
}
