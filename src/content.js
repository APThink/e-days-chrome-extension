import { decorateTimesheet } from './lib/pageDecorator.js';
import { readTimesheet } from './lib/timesheetReader.js';
import { serveTimesheet } from './lib/timesheetLink.js';

const FALLBACK_POLL_MS = 500;
const FALLBACK_WINDOW_MS = 10000;
const REFRESH_MS = 60000;

export function init() {
  const stopAnswering = serveTimesheet({ runtime: chrome.runtime, read: readTimesheet });
  decorateTimesheet();

  const observeTarget = document.getElementById('time-recording-content-wrapper') || document.body;

  const observer = new MutationObserver(() => {
    observer.disconnect();
    decorateTimesheet();
    observer.observe(observeTarget, { childList: true, subtree: true });
  });
  observer.observe(observeTarget, { childList: true, subtree: true });

  const fallbackStart = Date.now();
  const fallbackInterval = setInterval(() => {
    decorateTimesheet();
    if (Date.now() - fallbackStart > FALLBACK_WINDOW_MS) {
      clearInterval(fallbackInterval);
    }
  }, FALLBACK_POLL_MS);

  const refreshInterval = setInterval(() => decorateTimesheet(), REFRESH_MS);

  return function stop() {
    stopAnswering();
    observer.disconnect();
    clearInterval(fallbackInterval);
    clearInterval(refreshInterval);
  };
}
