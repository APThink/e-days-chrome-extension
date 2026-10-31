import { READ_TIMESHEET_MESSAGE } from '../lib/timesheetReader.js';

export class ChromeService {
  constructor(allowedUrl) {
    this.allowedUrl = allowedUrl;
  }

  async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  isValidUrl(url) {
    return url && url.startsWith(this.allowedUrl);
  }

  async readTimesheet(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: READ_TIMESHEET_MESSAGE }, (response) => {
        if (chrome.runtime.lastError || !response) {
          reject(new Error('Seite neu laden'));
          return;
        }
        resolve(response);
      });
    });
  }

  openPage() {
    chrome.tabs.create({ url: this.allowedUrl });
  }
}
