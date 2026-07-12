import { formatTime } from './lib/timeUtils.js';
import { calcStats } from './lib/statsCalculator.js';

export function extractTimes(container) {
  return [...container.querySelectorAll('input[type="time"]')]
    .map((input) => input.value)
    .filter(Boolean);
}

export function isTodayContainer(container) {
  return !!container.querySelector('.today_chip');
}

export function statusText(stats) {
  switch (stats.state) {
    case 'working':
      return `🔨 Arbeitest seit ${stats.lastTime}`;
    case 'away':
      return `🚶 Weg: ${formatTime(stats.awayMins)} (seit ${stats.lastTime})`;
    case 'done':
      return '🏠 Tag abgeschlossen';
    default:
      return '📭 Keine Einträge';
  }
}

export function buildInfoText(container, now = new Date()) {
  const times = extractTimes(container);
  const isToday = isTodayContainer(container);
  const stats = calcStats(times, isToday, now);
  return `Arbeit: ${formatTime(stats.workMins)} · Pause: ${formatTime(stats.pauseMins)} · ${statusText(stats)}`;
}

export const INFO_CLASS = 'edays-tracker-day-info';

export function ensureInfoElement(container) {
  const header = container.querySelector('.timesheet_day_header');
  if (!header) return null;

  let el = container.querySelector(`.${INFO_CLASS}`);
  if (!el) {
    el = document.createElement('div');
    el.className = INFO_CLASS;
    el.style.color = '#d32f2f';
    el.style.fontWeight = '600';
    el.style.fontSize = '13px';
    el.style.padding = '4px 16px 8px';
    header.insertAdjacentElement('afterend', el);
  }
  return el;
}

export function updateAll(root = document) {
  root.querySelectorAll('.tt_day_container').forEach((container) => {
    const el = ensureInfoElement(container);
    if (!el) return;
    const text = buildInfoText(container);
    if (el.textContent !== text) {
      el.textContent = text;
    }
  });
}

export function init() {
  updateAll();

  const observeTarget = document.getElementById('time-recording-content-wrapper') || document.body;

  const observer = new MutationObserver(() => {
    observer.disconnect();
    updateAll();
    observer.observe(observeTarget, { childList: true, subtree: true });
  });
  observer.observe(observeTarget, { childList: true, subtree: true });

  const fallbackStart = Date.now();
  const fallbackInterval = setInterval(() => {
    updateAll();
    if (Date.now() - fallbackStart > 10000) {
      clearInterval(fallbackInterval);
    }
  }, 500);

  setInterval(updateAll, 60000);

  return observer;
}

if (typeof process === 'undefined' || !process.env.VITEST) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
