/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: kotak811 site-wide cleanup.
 *
 * Source is a Next.js SPA (kotak811.bank.in homepage). Selectors below are all
 * verified against migration-work/cleaned.html. Removes non-authorable site
 * chrome (header/nav, footer, breadcrumbs), tracking pixels/beacons, lottie
 * animations, AOS scroll-animation classes/attributes, and empty decorative
 * wrapper divs so the import contains only authorable page content.
 */
const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Tracking pixels & analytics beacons (would otherwise show as stray imgs).
    // Found in cleaned.html: <meta> wrapping <img src="https://t.co/.../adsct">
    // / analytics.twitter.com, and <div id="batBeacon..."> (Bing).
    WebImporter.DOMUtils.remove(element, [
      'img[src*="t.co/"]',
      'img[src*="analytics.twitter.com"]',
      'img[src*="bat.bing.com"]',
      'img[src*="google-analytics.com"]',
      'img[src*="googletagmanager.com"]',
      'img[src*="facebook.com/tr"]',
      'img[src*="clarity.ms"]',
      'img[src*="cloudflareinsights.com"]',
      'img[src*="cdn-cgi/"]',
      '[id^="batBeacon"]',
      'script',
      'noscript',
      'iframe',
      // Next.js SPA runtime chrome, not authorable.
      'next-route-announcer',
    ]);

    // Lottie animations are decorative runtime players, not authorable content.
    // Found in cleaned.html: <lottie-player src="...cloudfront.net/....json">
    element.querySelectorAll('lottie-player').forEach((el) => el.remove());

    // Strip AOS scroll-animation classes and data attributes so they don't
    // leak into the imported markup. Found on <body> and many section/li/div
    // elements: class "aos-init aos-animate", data-aos* attributes.
    element.querySelectorAll('.aos-init, .aos-animate, [data-aos]').forEach((el) => {
      el.classList.remove('aos-init', 'aos-animate');
      [...el.attributes]
        .filter((attr) => attr.name.startsWith('data-aos'))
        .forEach((attr) => el.removeAttribute(attr.name));
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome verified in cleaned.html:
    //  - <nav id="header-nav"> (main navigation / header)
    //  - <nav id="breadcrumb-nav" class="breadcrumbs">
    //  - <footer class="footer ...">
    //  - loader splash: <div class="loader hideLoader"><div class="loaderAnimation">
    WebImporter.DOMUtils.remove(element, [
      '#header-nav',
      '#breadcrumb-nav',
      '.breadcrumbs',
      'footer',
      '.loader',
      'link',
      'meta',
    ]);

    // Remove only wrappers that are completely empty (no children, no text,
    // no media). Single pass, and skip anything that still holds real content
    // so authorable sections/images/links are never collapsed. Verified against
    // cleaned.html decorative shells such as <div class="min-h-60vh relative">.
    [...element.querySelectorAll('div')]
      .filter((el) => el.children.length === 0
        && (el.textContent || '').trim().length === 0
        && !el.querySelector('img, picture, svg, video, a, iframe, lottie-player'))
      .forEach((el) => el.remove());
  }
}
