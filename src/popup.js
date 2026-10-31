import { getWeekdayIndex, formatDayLabel } from './lib/dateUtils.js';
import { summarizeDay } from './lib/daySummary.js';
import { ChromeService } from './services/chromeService.js';
import { config } from './config.js';

const ALLOWED_URL = config.allowedUrl;

class PopupController {
  constructor() {
    this.chromeService = new ChromeService(ALLOWED_URL);
    this.currentDayIndex = getWeekdayIndex();
    this.week = null;
    
    this.initEventListeners();
    this.initialize();
  }

  initEventListeners() {
    document.getElementById('prev').addEventListener('click', () => this.navigateDay(-1));
    document.getElementById('next').addEventListener('click', () => this.navigateDay(1));
    document.getElementById('goToPage').addEventListener('click', () => this.chromeService.openPage());
  }

  async initialize() {
    try {
      const tab = await this.chromeService.getCurrentTab();
      
      if (!this.chromeService.isValidUrl(tab?.url)) {
        this.showError('Öffne zuerst die Zeiterfassung');
        this.showGoToPageButton();
        return;
      }

      this.week = await this.chromeService.readTimesheet(tab.id);
      this.loadDay();
    } catch (error) {
      this.showError(error.message);
    }
  }

  navigateDay(direction) {
    const newIndex = this.currentDayIndex + direction;
    if (newIndex < 0 || newIndex > 6) return;
    
    this.currentDayIndex = newIndex;
    this.loadDay();
  }

  loadDay() {
    try {
      const day = this.week?.days.find((d) => d.weekdayIndex === this.currentDayIndex);
      if (!day) {
        this.showError('Seite nicht erkannt');
        return;
      }

      this.updateNavigation(day);
      this.render(summarizeDay({ ...day, targetHours: config.targetHours }));
    } catch (error) {
      this.showError(error.message);
    }
  }

  updateNavigation(day) {
    const label = formatDayLabel(day);
    const dayEl = document.getElementById('day');
    dayEl.textContent = label;
    dayEl.classList.toggle('day-other', !day.isToday);
    document.getElementById('prev').disabled = this.currentDayIndex <= 0;
    document.getElementById('next').disabled = this.currentDayIndex >= 6;
  }

  render(summary) {
    const statsEl = document.getElementById('stats');
    const statusEl = document.getElementById('status');
    const warningEl = document.getElementById('warning');
    const projectedEndRow = document.getElementById('projectedEndRow');
    const projectedEndEl = document.getElementById('projectedEnd');

    document.getElementById('content').classList.remove('hidden');
    statsEl.classList.remove('hidden');
    document.getElementById('work').textContent = summary.work;
    document.getElementById('pause').textContent = summary.pause;

    if (summary.feierabend) {
      projectedEndEl.textContent = summary.feierabend;
      projectedEndRow.classList.remove('hidden');
    } else {
      projectedEndEl.textContent = '-';
      projectedEndRow.classList.add('hidden');
    }

    statusEl.textContent = summary.status;

    if (summary.warning) {
      warningEl.textContent = summary.warning;
      warningEl.classList.remove('hidden');
    } else {
      warningEl.textContent = '';
      warningEl.classList.add('hidden');
    }
  }

  showError(message) {
    document.getElementById('stats').classList.add('hidden');
    document.getElementById('content').classList.add('hidden');
    document.getElementById('warning').classList.add('hidden');
    document.getElementById('status').textContent = '❌ ' + message;
  }

  showGoToPageButton() {
    document.getElementById('goToPage').classList.remove('hidden');
  }
}

new PopupController();