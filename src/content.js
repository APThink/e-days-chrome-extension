import { decoratePage } from './lib/pageDecorator.js';
import { readTimesheet } from './lib/timesheetReader.js';
import { serveTimesheet } from './lib/timesheetLink.js';

export function init({ targetHours } = {}) {
  const stopAnswering = serveTimesheet({ runtime: chrome.runtime, read: readTimesheet });
  const stopDecorating = decoratePage({ targetHours });

  return function stop() {
    stopAnswering();
    stopDecorating();
  };
}
