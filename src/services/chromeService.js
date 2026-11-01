import { requestTimesheet } from '../lib/timesheetLink.js';

export class ChromeService {
  constructor(allowedUrl) {
    this.allowedUrl = allowedUrl;
  }

  async readTimesheet() {
    const tab = await this.#currentTab();
    if (!tab?.url?.startsWith(this.allowedUrl)) return null;
    return requestTimesheet(chrome, tab.id);
  }

  openPage() {
    chrome.tabs.create({ url: this.allowedUrl });
  }

  #currentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]);
      });
    });
  }
}
