/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: kotak811 section boundaries.
 *
 * Runs in beforeTransform, before the block parsers replace the original
 * <section> elements with block markup (parsers call element.replaceWith,
 * which would otherwise destroy the anchors this transformer needs). Reads the
 * section definitions from payload.template.sections (kotak811-home has 9
 * sections) and, for each section, inserts a Section Metadata block (when the
 * section has a `style`) and an <hr> section break before every non-first
 * section. The inserted <hr>/metadata are siblings of the section, so they
 * survive the subsequent in-place block replacement.
 *
 * Section selectors come from tools/importer/page-templates.json, which are
 * derived from the captured DOM. One template selector
 * (Home_cardsection_pad_20__Zu30) differs from the live DOM class
 * (Home_cardsection_pad_20___Zu30) by an underscore, so resolveSection falls
 * back to normalized/relaxed variants before giving up.
 */
const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

/**
 * Resolve a section's element from its template selector, tolerating minor
 * class-name drift (extra/fewer underscores) between the template and the DOM.
 */
function resolveSection(element, selector) {
  if (!selector) return null;

  // 1. Literal selector as authored in the template.
  let el = element.querySelector(selector);
  if (el) return el;

  // 2. Strip a leading "main " scope — the transformer already operates on main.
  const scoped = selector.replace(/^main\s+/, '');
  if (scoped !== selector) {
    el = element.querySelector(scoped);
    if (el) return el;
  }

  // 3. Collapse runs of underscores so "__Zu30" also matches "___Zu30" and
  //    vice-versa. Match against each candidate section by its class list.
  const wanted = scoped
    .replace(/^section\./, '')
    .split('.')
    .map((c) => c.replace(/_+/g, '_'))
    .filter(Boolean);
  const candidates = [...element.querySelectorAll('section')];
  return candidates.find((section) => {
    const classes = [...section.classList].map((c) => c.replace(/_+/g, '_'));
    return wanted.every((w) => classes.includes(w));
  }) || null;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.beforeTransform) return;

  const sections = (payload && payload.template && payload.template.sections) || [];
  if (sections.length < 2) return;

  const { document } = element.ownerDocument
    ? { document: element.ownerDocument }
    : { document: element };

  // Process in reverse so inserted <hr>/metadata don't shift not-yet-processed
  // section elements.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    const target = resolveSection(element, section.selector);
    if (!target) {
      // eslint-disable-next-line no-console
      console.warn(`[kotak811-sections] selector not found: ${section.selector}`);
      continue;
    }

    // Section Metadata block after the section, when a style is defined.
    if (section.style) {
      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      target.after(metadataBlock);
    }

    // Section break before every non-first section (when content precedes it).
    if (i > 0) {
      target.before(document.createElement('hr'));
    }
  }
}
