// add delayed functionality here

/**
 * Global "Back to Top" control. Rendered site-wide (no authoring), shown only
 * on mobile via CSS, and revealed after the user scrolls down a bit. Loaded in
 * the delayed phase so it never affects LCP.
 */
function initBackToTop() {
  if (document.querySelector('.back-to-top')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<span class="back-to-top-label">Back to Top</span><span class="back-to-top-icon" aria-hidden="true"></span>';

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Dock the control next to the Help Links section when present (right-aligned
  // within it); otherwise fall back to a floating button that reveals on scroll.
  const helpLinks = document.querySelector('.help-links .help-links-inner')
    || document.querySelector('.help-links');
  if (helpLinks) {
    btn.classList.add('back-to-top-docked');
    helpLinks.append(btn);
  } else {
    const toggle = () => {
      btn.classList.toggle('back-to-top-visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
    document.body.append(btn);
  }
}

initBackToTop();

// error monitoring — delayed so it never affects LCP. Uses the Sentry Loader
// Script (CDN) which self-initializes; public Sentry.io cloud host so it's
// reachable from the public site (a private/self-hosted host would be blocked
// by the browser's Private Network Access).
function loadSentry() {
  const src = 'https://js.sentry-cdn.com/8f3c99cccbfab19dc79a2a7801501512.min.js';
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement('script');
  script.src = src;
  script.crossOrigin = 'anonymous';
  script.setAttribute('nonce', 'aem');
  document.head.append(script);
}

loadSentry();

/**
 * Adobe Launch (Tags) — loaded in the delayed phase so the tag manager and the
 * martech it pulls in never block LCP.
 */
function loadAdobeLaunch(src) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  document.head.append(script);
}

loadAdobeLaunch('https://assets.adobedtm.com/4fa03d1212c6/54bdeb5cf391/launch-ae58bb97db41-development.min.js');
