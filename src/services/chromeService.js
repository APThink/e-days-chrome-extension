function extractDayData(dayIndex) {
  const containers = [...document.querySelectorAll('[id^="timesheet-day-"]')];
  const container = containers[dayIndex];
  if (!container) return null;

  const readTimeField = (fieldEl) => {
    const inputs = fieldEl.querySelectorAll('input');
    const hh = inputs[0]?.value.trim();
    const mm = inputs[1]?.value.trim();
    if (!hh || !mm) return null;
    return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
  };

  const times = [];
  container.querySelectorAll('[class*="_period-container_"]').forEach((period) => {
    const fields = [...period.querySelectorAll('[class*="_col-time_"]')].filter(
      (field) => !field.querySelector('input:disabled')
    );
    const start = fields[0] && readTimeField(fields[0]);
    const end = fields[1] && readTimeField(fields[1]);
    if (start) times.push(start);
    if (end) times.push(end);
  });

  const pad2 = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const todayId = `timesheet-day-${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const isCurrentWeek = containers.some((c) => c.id === todayId);

  const headerLabel = document.querySelector('[class*="_header-label_"]');
  const weekMatch = headerLabel?.textContent.match(/Woche\s+(\d+)/);
  const weekNum = weekMatch ? parseInt(weekMatch[1], 10) : null;

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
