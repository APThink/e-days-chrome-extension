import { createPopup, failedPopup } from './lib/popup.js';
import { mountPopup } from './lib/popupView.js';
import { loadConfig } from './lib/configLoader.js';
import { ChromeService } from './services/chromeService.js';

async function start() {
  try {
    const { allowedUrl, targetHours } = await loadConfig(() => import('./config.js'));
    await mountPopup(document, createPopup({ browser: new ChromeService(allowedUrl), targetHours }));
  } catch (error) {
    await mountPopup(document, failedPopup(error.message));
  }
}

start();
