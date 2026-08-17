import { initK811, revealOnScroll, mountLottie } from '../../scripts/k811/k811-common.js';

/*
 * K811 Pillars — "We always serve by the rules." Faithful to
 * kotak811.bank.in/about-us.
 *
 * Desktop (>=900px): a large shared animation stage on top with a row of four
 * left-aligned text tabs below. Selecting a tab (click or hover) swaps the
 * stage animation and marks that tab active; the stage also auto-advances until
 * the user interacts, mirroring the source's swiper-fade carousel.
 *
 * Mobile (<900px): the tabs stack, each showing its OWN animation above the
 * heading + description (the source's stacked layout).
 *
 * Content model: optional leading title row (single heading cell), then one row
 * per pillar with cells: title, description, lottie JSON url (desktop),
 * optional lottie JSON url (mobile). The mobile url is used below 900px.
 */

const DESKTOP_MQ = '(min-width: 900px)';
const AUTOPLAY_MS = 4000;

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

  const content = document.createElement('div');
  content.className = 'k811-pillars-content';

  // Shared animation stage (desktop). Hidden on mobile via CSS.
  const stage = document.createElement('div');
  stage.className = 'k811-pillars-stage';

  const tabsRow = document.createElement('div');
  tabsRow.className = 'k811-pillars-tabs';

  pillars.forEach((p, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'k811-pillars-tab';
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');

    // Per-card animation (mobile only). Hidden on desktop via CSS.
    const media = document.createElement('div');
    media.className = 'k811-pillars-tab-media';
    tab.append(media);
    p.media = media;

    if (p.title) {
      const h = document.createElement('h4');
      h.className = 'k811-pillars-card-title';
      h.textContent = p.title;
      tab.append(h);
    }
    if (p.desc) {
      const d = document.createElement('p');
      d.className = 'k811-pillars-card-desc';
      d.textContent = p.desc;
      tab.append(d);
    }
    p.tab = tab;
    tabsRow.append(tab);
  });

  content.append(stage, tabsRow);
  nodes.push(content);
  block.replaceChildren(...nodes);

  let active = -1;
  let autoplayId = 0;
  let userEngaged = false;

  const showOnStage = (i) => {
    if (i === active) return;
    active = i;
    pillars.forEach((p, idx) => {
      p.tab.classList.toggle('is-active', idx === i);
      p.tab.setAttribute('aria-selected', idx === i ? 'true' : 'false');
    });
    stage.textContent = '';
    const src = pillars[i].lottieDesktop;
    if (src) mountLottie(stage, src);
  };

  const stopAutoplay = () => {
    if (autoplayId) { clearInterval(autoplayId); autoplayId = 0; }
  };
  const startAutoplay = () => {
    stopAutoplay();
    if (userEngaged || pillars.length < 2) return;
    autoplayId = setInterval(() => {
      showOnStage((active + 1) % pillars.length);
    }, AUTOPLAY_MS);
  };

  const engage = (i) => {
    userEngaged = true;
    stopAutoplay();
    showOnStage(i);
  };

  // Desktop: wire the tabs to the shared stage. Mobile: give each tab its own
  // always-on animation. Re-run when crossing the breakpoint so a resize
  // reconfigures cleanly.
  const mql = window.matchMedia(DESKTOP_MQ);
  const setup = () => {
    stopAutoplay();
    stage.textContent = '';
    pillars.forEach((p) => { p.media.textContent = ''; });

    if (mql.matches) {
      active = -1;
      userEngaged = false;
      showOnStage(0);
      pillars.forEach((p, i) => {
        p.tab.onclick = () => engage(i);
        p.tab.onmouseenter = () => engage(i);
      });
      startAutoplay();
    } else {
      pillars.forEach((p) => {
        p.tab.onclick = null;
        p.tab.onmouseenter = null;
        p.tab.classList.remove('is-active');
        const src = p.lottieMobile || p.lottieDesktop;
        if (src) mountLottie(p.media, src);
      });
    }
  };

  setup();
  if (mql.addEventListener) mql.addEventListener('change', setup);

  revealOnScroll(block);
}
