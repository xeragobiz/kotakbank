import { initK811, revealOnScroll } from '../../scripts/k811/k811-common.js';

/*
 * K811 Story — full-bleed background image with an overlaid heading + text.
 * Used for the About Us "Innovators / Inspired / Dedicated" panels.
 *
 * Content model (rows): image (background), text (heading + paragraph).
 * Optional modifier cell "right"/"left"/"center" to place the text overlay.
 */
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

  const media = document.createElement('div');
  media.className = 'k811-story-media';
  const picture = imageCell ? imageCell.querySelector('picture') : null;
  if (picture) media.append(picture);
  else if (imageCell && imageCell.querySelector('img')) media.append(imageCell.querySelector('img'));

  const content = document.createElement('div');
  content.className = `k811-story-content k811-story-${align}`;
  if (textCell) while (textCell.firstChild) content.append(textCell.firstChild);

  block.replaceChildren(media, content);
  revealOnScroll(block);
}
