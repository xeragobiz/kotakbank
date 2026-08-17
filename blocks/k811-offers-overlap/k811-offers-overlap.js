import decorateOffers from '../k811-offers/k811-offers.js';

/*
 * k811-offers-overlap — homepage-only variant of the shared k811-offers block.
 *
 * It delegates ALL content decoration (cards, images, titles, descriptions,
 * responsive grid) to the shared k811-offers block so authoring stays
 * identical and fully dynamic. This block adds ONLY the presentation concern
 * unique to the homepage: pulling the offers wrapper up so it overlaps the
 * preceding metal hero banner (as in the source design). The overlap itself
 * lives in k811-offers-overlap.css.
 *
 * Kept as a separate block (not a change to k811-offers) because k811-offers
 * is shared — used again on the infinity-metal page — and must not change.
 */
export default function decorate(block) {
  // Inherit the shared block's card styling by also carrying its class, so all
  // card CSS (.k811-offers …) applies from a single source of truth. The
  // overlap-only rules are scoped to .k811-offers-overlap in this block's CSS.
  block.classList.add('k811-offers');
  // reuse the shared offers decoration (adds .k811-offers-* structure + reveal)
  decorateOffers(block);
}
