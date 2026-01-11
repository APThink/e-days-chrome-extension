import { formatTime } from './lib/timeUtils.js';
import { getTodayIndex, formatDayLabel } from './lib/dateUtils.js';
import { calcStats } from './lib/statsCalculator.js';
import { ChromeService } from './services/chromeService.js';
import { config } from './config.js';

const ALLOWED_URL = config.allowedUrl;

class PopupController {
  constructor() {
    this.chromeService = new ChromeService(ALLOWED_URL);
    this.currentDayIndex = getTodayIndex();
    this.tabId = null;
    
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

      this.tabId = tab.id;
      await this.loadDay();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async navigateDay(direction) {
    const newIndex = this.currentDayIndex + direction;
    if (newIndex < 0 || newIndex > 6) return;
    
    this.currentDayIndex = newIndex;
    await this.loadDay();
  }

  async loadDay() {
    try {
      const data = await this.chromeService.fetchDayData(this.tabId, this.currentDayIndex);
      const { times, isCurrentWeek, weekNum } = data;

      const todayIdx = getTodayIndex();
      const isToday = isCurrentWeek && this.currentDayIndex === todayIdx;

      this.updateNavigation(isToday, weekNum);

      const stats = calcStats(times, isToday);
      this.render(stats);
    } catch (error) {
      this.showError(error.message);
    }
  }

  updateNavigation(isToday, weekNum) {
    const label = formatDayLabel(this.currentDayIndex, weekNum, isToday);
    document.getElementById('day').textContent = label;
    document.getElementById('prev').disabled = this.currentDayIndex <= 0;
    document.getElementById('next').disabled = this.currentDayIndex >= 6;
  }

  render(stats) {
    const statsEl = document.getElementById('stats');
    const statusEl = document.getElementById('status');

    document.getElementById('content').classList.remove('hidden');
    statsEl.classList.remove('hidden');
    document.getElementById('work').textContent = formatTime(stats.workMins);
    document.getElementById('pause').textContent = formatTime(stats.pauseMins);

    if (stats.state === 'working') {
      statusEl.textContent = `🔨 Arbeitest seit ${stats.lastTime}`;
    } else if (stats.state === 'away') {
      statusEl.textContent = `🚶 Weg: ${formatTime(stats.awayMins)} (seit ${stats.lastTime})`;
    } else if (stats.state === 'done') {
      statusEl.textContent = `🏠 Tag abgeschlossen`;
    } else {
      statusEl.textContent = `📭 Keine Einträge`;
    }
  }

  showError(message) {
    document.getElementById('stats').classList.add('hidden');
    document.getElementById('content').classList.add('hidden');
    document.getElementById('status').textContent = '❌ ' + message;
  }

  showGoToPageButton() {
    document.getElementById('goToPage').classList.remove('hidden');
  }
}

new PopupController();