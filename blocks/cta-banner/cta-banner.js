/**
 * CTA Banner — "Ready to take the next step?".
 * Full-width gradient band with a heading and a single Apply button.
 * Rows (in model order): heading, cta link, cta text (link+text collapse).
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cellOf = (r) => (r ? r.querySelector(':scope > div') || r : null);

  let heading = '';
  let ctaHref = '';
  let ctaText = '';
  rows.forEach((r) => {
    const cell = cellOf(r);
    if (!cell) return;
    const link = cell.querySelector('a');
    const txt = cell.textContent.trim();
    if (link) {
      ctaHref = link.getAttribute('href');
      if (link.textContent.trim()) ctaText = link.textContent.trim();
    } else if (txt) {
      if (!heading) heading = txt;
      else if (!ctaText) ctaText = txt;
    }
  });

  const inner = document.createElement('div');
  inner.className = 'cta-banner-inner';

  if (heading) {
    const h = document.createElement('h2');
    h.className = 'cta-banner-title';
    h.textContent = heading;
    inner.append(h);
  }
  if (ctaHref && ctaText) {
    const a = document.createElement('a');
    a.href = ctaHref;
    a.className = 'cta-banner-btn';
    a.textContent = ctaText;
    inner.append(a);
  }

  block.textContent = '';
  block.append(inner);
}
