import { createPopup } from './lib/popup.js';
import { mountPopup } from './lib/popupView.js';
import { ChromeService } from './services/chromeService.js';
import { config } from './config.js';

mountPopup(
  document,
  createPopup({
    browser: new ChromeService(config.allowedUrl),
    allowedUrl: config.allowedUrl,
    targetHours: config.targetHours,
  })
);
