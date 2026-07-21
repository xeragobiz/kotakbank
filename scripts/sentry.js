// Sentry is loaded from a CDN at runtime: EDS serves modules as-is (no bundler),
// so a bare "@sentry/browser" specifier can't resolve in the browser.
// esm.sh maps the package to a browser-native ES module.

const SENTRY_MODULE_URL = 'https://esm.sh/@sentry/browser@10.65.0';
const DSN = 'https://8f3c99cccbfab19dc79a2a7801501512@o4511738502512640.ingest.us.sentry.io/4511767734255616';

function resolveEnvironment() {
  const host = window.location.hostname;
  if (host.endsWith('.aem.live') || host.endsWith('kotak.com')) return 'production';
  if (host.endsWith('.aem.page')) return 'qa';
  return 'development';
}

export default async function initSentry() {
  let Sentry;

  try {
    Sentry = await import(SENTRY_MODULE_URL);
  } catch (e) {
    return false;
  }

  Sentry.init({
    debug: true,
    dsn: DSN,
    environment: resolveEnvironment(),
    release: 'eds-banking-1.0.0',

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
      Sentry.replayIntegration(),
    ],

    tracesSampleRate: 1.0,

    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    enableLogs: true,

    dataCollection: {
      // Keep defaults unless you need to explicitly limit collection
      // userInfo: false,
      // httpBodies: [],
    },
  });

  if (Sentry.metrics) {
    Sentry.metrics.count('button_click', 1);
    Sentry.metrics.gauge('page_load_time', 150);
    Sentry.metrics.distribution('response_time', 200);
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('sentry-test') === '1') {
    Sentry.captureException(new Error(`Sentry test exception (${resolveEnvironment()})`));
  }

  return true;
}