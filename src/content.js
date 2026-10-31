import { formatTime, formatClockTime } from './lib/timeUtils.js';
import { calcStats } from './lib/statsCalculator.js';
import { evaluateBreakCompliance } from './lib/breakCompliance.js';
import { getTargetMinutes } from './lib/targetTime.js';
import { calcProjectedEnd } from './lib/projectedEnd.js';
import { getTodayIndex } from './lib/dateUtils.js';
import { readTimesheet, READ_TIMESHEET_MESSAGE } from './lib/timesheetReader.js';
import { config } from './config.js';

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

export function buildInfoText({ times, isToday }, now = new Date()) {
  const stats = calcStats(times, isToday, now);
  let text = `Arbeit: ${formatTime(stats.workMins)} · Pause: ${formatTime(stats.pauseMins)} · ${statusText(stats)}`;

  if (isToday) {
    const targetMins = getTargetMinutes(getTodayIndex(now), config.targetHours);
    const projection = calcProjectedEnd(stats, targetMins, now);
    if (projection) {
      text += ` · 🏁 Feierabend ca. ${formatClockTime(projection.projectedEndMins)}`;
    }
  }

  return text;
}

export const INFO_CLASS = 'edays-tracker-day-info';
export const WARNING_CLASS = 'edays-tracker-warning';
const STYLE_ID = 'edays-tracker-styles';

export function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${INFO_CLASS} {
      font-size: 13px;
      line-height: 1.4;
      padding: 10px 20px;
      border-top: 1px solid var(--greyscale-90, #e5e7eb);
    }
    .${INFO_CLASS}.is-today { color: var(--greyscale-10, #111827); font-weight: 600; }
    .${INFO_CLASS}.is-other { color: var(--greyscale-30, #6b7280); font-weight: 500; }
    .${WARNING_CLASS} {
      color: #dc2626;
      font-weight: 700;
      font-size: 13px;
      padding: 0 20px 10px;
      animation: edays-blink 1s ease-in-out infinite;
    }
    @keyframes edays-blink { 50% { opacity: 0.35; } }
    @media (prefers-reduced-motion: reduce) {
      .${WARNING_CLASS} { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

export function ensureInfoElement(container, isToday) {
  const header = container.querySelector('[class*="_top-row_"]');
  if (!header) return null;

  injectStyles();

  let el = container.querySelector(`.${INFO_CLASS}`);
  if (!el) {
    el = document.createElement('div');
    el.className = INFO_CLASS;
    header.insertAdjacentElement('afterend', el);
  }

  el.classList.toggle('is-today', isToday);
  el.classList.toggle('is-other', !isToday);

  return el;
}

export function ensureWarningElement(container) {
  const infoEl = container.querySelector(`.${INFO_CLASS}`);
  if (!infoEl) return null;

  let el = container.querySelector(`.${WARNING_CLASS}`);
  if (!el) {
    el = document.createElement('div');
    el.className = WARNING_CLASS;
    infoEl.insertAdjacentElement('afterend', el);
  }
  return el;
}

export function updateAll(root = document, now = new Date()) {
  readTimesheet(root, now).days.forEach((day) => {
    const el = ensureInfoElement(day.element, day.isToday);
    if (!el) return;
    const text = buildInfoText(day, now);
    if (el.textContent !== text) {
      el.textContent = text;
    }

    const warningEl = ensureWarningElement(day.element);
    if (!warningEl) return;
    const compliance = evaluateBreakCompliance(day.times, day.isToday, now);
    const warningText = compliance.isBreached
      ? `⚠️ Noch ${formatTime(compliance.missingMins)} Pause nötig`
      : '';
    if (warningEl.textContent !== warningText) {
      warningEl.textContent = warningText;
    }
    warningEl.style.display = compliance.isBreached ? '' : 'none';
  });
}

function respondToTimesheetRequests() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== READ_TIMESHEET_MESSAGE) return;
    const { weekNum, days } = readTimesheet();
    sendResponse({
      weekNum,
      days: days.map(({ element, ...day }) => day),
    });
  });
}

export function init() {
  respondToTimesheetRequests();
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
