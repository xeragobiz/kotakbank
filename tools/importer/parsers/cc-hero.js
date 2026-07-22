/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cc-hero (metal variant). Base: cc-hero.
 * Source: https://www.kotak811.bank.in/ — main section.homeBanner.metalTheme
 * Model fields: bg_image (+bg_imageAlt), bg_imageMobile (+bg_imageMobileAlt),
 *   text (richtext, grouped with text_headingColor/text_textColor/text_layout/
 *   text_gradient selects), primaryCta (+primaryCtaText), secondaryCta (+secondaryCtaText).
 * The decorate() reads cells by content, not position; colour/layout/gradient
 * selects render as trailing plain <p>s inside the copy cell. Here we emit
 * text_layout=metal so the dark metallic theme is applied.
 */
export default function parse(element, { document }) {
  // Background images: desktop (.desktop-display-only) + optional mobile
  const desktopImg = element.querySelector('.desktop-display-only img, [class*="desktop"] img');
  const mobileImg = element.querySelector('.mobile-display-only img, [class*="mobile"] img');

  // Copy: eyebrow (h1) + heading (h2) + subheading (h3) inside the description block
  const copyContainer = element.querySelector('[class*="description"], [class*="homeContent"], [class*="container"]')
    || element;
  const headings = [...copyContainer.querySelectorAll('h1, h2, h3, h4, h5, h6')];

  // CTA(s): links in the button wrapper (first = primary, second = secondary)
  const ctaLinks = [...element.querySelectorAll('[class*="buttonWrpper"] a, [class*="button"] a, a.button')]
    .filter((a, i, arr) => arr.indexOf(a) === i);

  const cells = [];

  // Row: bg_image (desktop) — field collapses image + alt into the <img>
  if (desktopImg) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:bg_image '));
    frag.appendChild(desktopImg);
    cells.push([frag]);
  }

  // Row: bg_imageMobile — optional mobile art-directed image
  if (mobileImg) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:bg_imageMobile '));
    frag.appendChild(mobileImg);
    cells.push([frag]);
  }

  // Row: text (richtext) — headings, followed by layout token so decorate()
  // applies the "metal" variant class.
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));
  headings.forEach((h) => textFrag.appendChild(h));
  // text_layout select value (grouped into the text field group)
  const layout = document.createElement('p');
  layout.textContent = 'metal';
  textFrag.appendChild(layout);
  cells.push([textFrag]);

  // Row: primaryCta — the "Apply Now" link (primaryCtaText collapses into <a>)
  if (ctaLinks[0]) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:primaryCta '));
    frag.appendChild(ctaLinks[0]);
    cells.push([frag]);
  }

  // Row: secondaryCta — optional second link
  if (ctaLinks[1]) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:secondaryCta '));
    frag.appendChild(ctaLinks[1]);
    cells.push([frag]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cc-hero', cells });
  element.replaceWith(block);
}
