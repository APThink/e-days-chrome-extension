import { init } from './content.js';
import { loadConfig } from './lib/configLoader.js';

// config.js is the extension's own file in dist/, read at runtime like the popup does,
// so editing it after the build affects the Info row too.
async function start() {
  let targetHours;
  try {
    ({ targetHours } = await loadConfig(() => import(/* @vite-ignore */ chrome.runtime.getURL('config.js'))));
  } catch (error) {
    console.warn(`e-days Tracker: ${error.message}; using default target hours`);
  }
  init({ targetHours });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
