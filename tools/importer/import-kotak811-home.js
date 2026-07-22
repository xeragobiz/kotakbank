/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import k811HeroParser from './parsers/k811-hero.js';
import k811OffersParser from './parsers/k811-offers.js';
import k811PromoBandParser from './parsers/k811-promo-band.js';
import k811FeatureParser from './parsers/k811-feature.js';
import k811CtaParser from './parsers/k811-cta.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/kotak811-cleanup.js';
import sectionsTransformer from './transformers/kotak811-sections.js';

// PARSER REGISTRY
const parsers = {
  'k811-hero': k811HeroParser,
  'k811-offers': k811OffersParser,
  'k811-promo-band': k811PromoBandParser,
  'k811-feature': k811FeatureParser,
  'k811-cta': k811CtaParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'kotak811-home',
  description: 'Kotak811 homepage: metal debit-card hero, 4-up offers grid, alternating image/text feature promos, security default content, toll-free CTA banner, app-download banner.',
  urls: [
    'https://www.kotak811.bank.in/',
  ],
  blocks: [
    {
      name: 'k811-hero',
      instances: ['main section.homeBanner.metalTheme'],
      section: 'metal',
    },
    {
      name: 'k811-offers',
      instances: ['main section.undefined'],
    },
    {
      name: 'k811-promo-band',
      instances: ['main section.position_container'],
    },
    {
      name: 'k811-feature',
      instances: [
        'main section.Home_pad_ex_80__EepyR',
        'main section.Home_creditcard__4GMng',
        'main section.Home_cardsection_pad_20___Zu30',
        'main section.Home_app__Ll1Hm',
      ],
    },
    {
      name: 'k811-cta',
      instances: ['main section.blackWrap'],
    },
  ],
  sections: [
    { id: 'section-1', name: 'Metal Hero', selector: 'main section.homeBanner.metalTheme', style: 'metal', blocks: ['k811-hero'], defaultContent: [] },
    { id: 'section-2', name: 'Offers Grid', selector: 'main section.undefined', style: 'light', blocks: ['k811-offers'], defaultContent: [] },
    { id: 'section-3', name: 'Nearest Bank', selector: 'main section.position_container:nth-of-type(3)', style: 'light', blocks: ['k811-promo-band'], defaultContent: [] },
    { id: 'section-4', name: 'Current Account', selector: 'main section.position_container:nth-of-type(4)', style: 'light', blocks: ['k811-promo-band'], defaultContent: [] },
    { id: 'section-5', name: 'Virtual Card', selector: 'main section.Home_pad_ex_80__EepyR', style: 'light', blocks: ['k811-feature'], defaultContent: [] },
    { id: 'section-6', name: 'Credit Cards Easy', selector: 'main section.Home_creditcard__4GMng', style: 'dark', blocks: ['k811-feature'], defaultContent: [] },
    { id: 'section-7', name: 'Security Trust', selector: 'main section.Home_cardsection_pad_20___Zu30', style: 'light', blocks: ['k811-feature'], defaultContent: [] },
    { id: 'section-8', name: 'Toll-free CTA', selector: 'main section.blackWrap', style: 'light', blocks: ['k811-cta'], defaultContent: [] },
    { id: 'section-9', name: 'Download App', selector: 'main section.Home_app__Ll1Hm', style: 'light', blocks: ['k811-feature'], defaultContent: [] },
  ],
};

// Target document path for this migration (overrides the source '/' → '/index' default
// so the new page does not collide with any existing homepage/index content).
const TARGET_PATH = '/kotak811-home';

// TRANSFORMER REGISTRY - cleanup first, then sections (adds <hr> + section metadata)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Fixed target path so the new page does not collide with existing content
    const path = WebImporter.FileUtils.sanitizePath(TARGET_PATH);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
