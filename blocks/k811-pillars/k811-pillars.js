import { initK811, revealOnScroll, mountLottie } from '../../scripts/k811/k811-common.js';

/*
 * K811 Pillars — "We always serve by the rules." A tabbed set of value pillars
 * synced to a crossfading Lottie stage (the source uses linked Swipers; we use
 * lightweight vanilla tabs + lazy lottie-player, no Swiper dependency).
 *
 * Content model: optional leading title row, then one row per pillar with
 * cells: title, description, lottie JSON url (desktop), optional lottie mobile url.
 * Desktop: title tab-list on one side, Lottie stage on the other. Selecting a
 * tab crossfades to that pillar's Lottie. Mobile: stacked.
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
      .filter((t) => /^https?:\/\/\S+\.json$/i.test(t));
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

  const nodes = [];
  if (titleText) {
    const h = document.createElement('h2');
    h.className = 'k811-pillars-title';
    h.textContent = titleText;
    nodes.push(h);
  }

  const wrap = document.createElement('div');
  wrap.className = 'k811-pillars-wrap';

  const tabs = document.createElement('div');
  tabs.className = 'k811-pillars-tabs';
  tabs.setAttribute('role', 'tablist');

  const stage = document.createElement('div');
  stage.className = 'k811-pillars-stage';

  const stageItems = [];
  const mounted = [];

  pillars.forEach((p, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'k811-pillars-tab';
    tab.setAttribute('role', 'tab');
    const descHtml = p.desc ? `<span class="k811-pillars-tab-desc">${p.desc}</span>` : '';
    tab.innerHTML = `<span class="k811-pillars-tab-title">${p.title}</span>${descHtml}`;

    const stageItem = document.createElement('div');
    stageItem.className = 'k811-pillars-stage-item';
    stageItems.push(stageItem);
    stage.append(stageItem);

    const activate = () => {
      tabs.querySelectorAll('.k811-pillars-tab').forEach((t) => t.classList.remove('is-active'));
      stageItems.forEach((s) => s.classList.remove('is-active'));
      tab.classList.add('is-active');
      stageItem.classList.add('is-active');
      // lazy-mount this pillar's lottie on first activation
      if (!mounted[i] && p.lottieDesktop) {
        mounted[i] = true;
        mountLottie(stageItem, p.lottieDesktop);
      }
    };
    tab.addEventListener('click', activate);
    if (i === 0) activate();
    tabs.append(tab);
  });

  wrap.append(tabs, stage);
  nodes.push(wrap);
  block.replaceChildren(...nodes);
  revealOnScroll(block);
}
