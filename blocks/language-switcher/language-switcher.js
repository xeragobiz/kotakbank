import {
  LOCALES, getLocale, localizePath,
} from '../../scripts/locale.js';

/**
 * language-switcher — links to the equivalent page in every known locale.
 *
 * The switcher is content-free: it derives its options from the locale
 * registry (scripts/locale.js) and keeps the current logical page path,
 * swapping only the locale prefix — the MSM "language copy" relationship.
 * The current locale is marked and rendered as non-navigating.
 *
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const current = getLocale();

  const nav = document.createElement('nav');
  nav.className = 'language-switcher-list';
  nav.setAttribute('aria-label', 'Language');

  Object.entries(LOCALES).forEach(([locale, { label }]) => {
    const isCurrent = locale === current;
    const item = document.createElement(isCurrent ? 'span' : 'a');
    item.className = 'language-switcher-item';
    item.textContent = label;
    item.lang = locale;
    if (isCurrent) {
      item.setAttribute('aria-current', 'true');
    } else {
      item.href = localizePath(locale);
      item.setAttribute('hreflang', locale);
    }
    nav.append(item);
  });

  block.textContent = '';
  block.append(nav);
}
