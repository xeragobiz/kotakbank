import { initK811, revealOnScroll, mountLottie } from '../../scripts/k811/k811-common.js';

/*
 * K811 Pillars — "We always serve by the rules." A static grid of value pillar
 * cards, each with its OWN always-on Lottie animation above a heading + short
 * description. Faithful to kotak811.bank.in/about-us: 4-up row on desktop/tablet,
 * stacked on mobile; every card's animation plays independently (no tabs).
 *
 * Content model: optional leading title row (single heading cell), then one row
 * per pillar with cells: title, description, lottie JSON url (desktop),
 * optional lottie JSON url (mobile). The mobile url is used below 900px.
 */
export default function decorate(block) {
  initK811(block);
  const rows = [...block.children];

  let titleText = '';
  const pillars = [];

  rows.forEach((row) => {
    const cells = [...row.children];
    const urls = [...row.querySelectorAll('a')].map((a) => a.href)
      .filter((u) => /\.json(\?|$)/i.test(u));
    const textUrls = cells.map((c) => (c.textContent || '').trim())
      .filter((t) => /^https?:\/\/\S+\.json$/i.test(t) || /\.json$/i.test(t));
    const lottieUrls = urls.length ? urls : textUrls;

    if (cells.length === 1 && cells[0].querySelector('h1, h2, h3')
      && lottieUrls.length === 0) {
      titleText = cells[0].textContent.trim();
      return;
    }

    const title = (cells[0]?.textContent || '').trim();
    const desc = (cells[1]?.textContent || '').trim();
    if (title) {
      pillars.push({
        title,
        desc,
        lottieDesktop: lottieUrls[0] || '',
        lottieMobile: lottieUrls[1] || lottieUrls[0] || '',
      });
    }
  });

  if (!pillars.length) return;

  // Lottie JSONs can't be delivered from AEM /content/dam paths on this Edge
  // Delivery site (only images are rewritten to ./media_ on publish), so those
  // hrefs 404. Resolve any DAM-pathed .json to the same-origin copy committed
  // alongside this block, keeping the animations self-hosted and CORS-free.
  const resolveLottie = (url) => {
    if (!url) return url;
    const m = url.match(/\/([^/]+\.json)(?:\?.*)?$/i);
    if (m && /\/content\/dam\//i.test(url)) {
      return `/blocks/k811-pillars/lottie/${m[1]}`;
    }
    return url;
  };
  pillars.forEach((p) => {
    p.lottieDesktop = resolveLottie(p.lottieDesktop);
    p.lottieMobile = resolveLottie(p.lottieMobile);
  });

  const nodes = [];
  if (titleText) {
    const h = document.createElement('h2');
    h.className = 'k811-pillars-title';
    h.textContent = titleText;
    nodes.push(h);
  }

  const grid = document.createElement('div');
  grid.className = 'k811-pillars-grid';

  const isMobile = window.matchMedia('(max-width: 899px)').matches;

  pillars.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'k811-pillars-card';

    const media = document.createElement('div');
    media.className = 'k811-pillars-media';
    card.append(media);

    const body = document.createElement('div');
    body.className = 'k811-pillars-body';
    if (p.title) {
      const h = document.createElement('h4');
      h.className = 'k811-pillars-card-title';
      h.textContent = p.title;
      body.append(h);
    }
    if (p.desc) {
      const d = document.createElement('p');
      d.className = 'k811-pillars-card-desc';
      d.textContent = p.desc;
      body.append(d);
    }
    card.append(body);
    grid.append(card);

    const src = isMobile ? p.lottieMobile : p.lottieDesktop;
    if (src) mountLottie(media, src);
  });

  nodes.push(grid);
  block.replaceChildren(...nodes);
  revealOnScroll(block);
}
