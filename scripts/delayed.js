// add delayed functionality here
import initSentry from './sentry.js';

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

// error/performance monitoring — delayed so it never affects LCP
initSentry();
