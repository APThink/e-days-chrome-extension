function extractDayData(dayIndex) {
  const container = document.querySelectorAll('.tt_day_container')[dayIndex];
  if (!container) return null;

  const inputs = [...container.querySelectorAll('input[type="time"]')];
  const times = inputs.map(i => i.value).filter(v => v);

  const weekLinks = [...document.querySelectorAll('#weekSummary a')];
  const lastWeekEl = weekLinks[weekLinks.length - 1];
  const isCurrentWeek = lastWeekEl?.classList.contains('selectedWeek');

  const selectedWeekEl = document.querySelector('.selectedWeek .summary_week_no');
  const weekNum = selectedWeekEl ? parseInt(selectedWeekEl.textContent) : null;

  return { times, isCurrentWeek, weekNum };
}

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
  
    async fetchDayData(tabId, dayIndex) {
      return new Promise((resolve, reject) => {
        chrome.scripting.executeScript({
          target: { tabId },
          func: extractDayData,
          args: [dayIndex]
        }, (results) => {
          if (!results || !results[0]) {
            reject(new Error('Fehler beim Lesen der Seite'));
            return;
          }
  
          const data = results[0].result;
          if (data === null || data.times === undefined) {
            reject(new Error('Seite nicht erkannt'));
            return;
          }
  
          resolve(data);
        });
      });
    }
  
    openPage() {
      chrome.tabs.create({ url: this.allowedUrl });
    }
  }
