import { requestTimesheet } from '../lib/timesheetLink.js';

export class ChromeService {
  constructor(allowedUrl) {
    this.allowedUrl = allowedUrl;
  }

  async currentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }

  readTimesheet(tabId) {
    return requestTimesheet(chrome, tabId);
  }

  openPage() {
    chrome.tabs.create({ url: this.allowedUrl });
  }
}
