import { summarizeDay } from './daySummary.js';
import { readTimesheet, locateInfoRowAnchor } from './timesheetReader.js';

export const INFO_CLASS = 'edays-tracker-day-info';
export const WARNING_CLASS = 'edays-tracker-warning';
const STYLE_ID = 'edays-tracker-styles';
const FALLBACK_POLL_MS = 500;
const FALLBACK_WINDOW_MS = 10000;
const REFRESH_MS = 60000;

function infoLine(summary) {
  let text = `Arbeit: ${summary.work} · Pause: ${summary.pause} · ${summary.status}`;
  if (summary.feierabend) {
    text += ` · 🏁 Feierabend ca. ${summary.feierabend}`;
  }
  return text;
}

function injectStyles() {
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

function ensureInfoElement(anchor, isToday) {
  injectStyles();

  const scope = anchor.parentElement;
  let el = scope.querySelector(`.${INFO_CLASS}`);
  if (!el) {
    el = document.createElement('div');
    el.className = INFO_CLASS;
    anchor.insertAdjacentElement('afterend', el);
  }

  el.classList.toggle('is-today', isToday);
  el.classList.toggle('is-other', !isToday);

  return el;
}

function ensureWarningElement(infoEl) {
  let el = infoEl.parentElement.querySelector(`.${WARNING_CLASS}`);
  if (!el) {
    el = document.createElement('div');
    el.className = WARNING_CLASS;
    infoEl.insertAdjacentElement('afterend', el);
  }
  return el;
}

export function decorateTimesheet({ targetHours, root = document, now = new Date() } = {}) {
  readTimesheet(root, now).days.forEach((day) => {
    const anchor = locateInfoRowAnchor(day.date, root);
    if (!anchor) return;
    const el = ensureInfoElement(anchor, day.isToday);
    const summary = summarizeDay({ ...day, targetHours, now });
    const text = infoLine(summary);
    if (el.textContent !== text) {
      el.textContent = text;
    }

    const warningEl = ensureWarningElement(el);
    const warningText = summary.warning ?? '';
    if (warningEl.textContent !== warningText) {
      warningEl.textContent = warningText;
    }
    warningEl.style.display = summary.warning ? '' : 'none';
  });
}

export function decoratePage({ targetHours, root = document } = {}) {
  const decorate = () => decorateTimesheet({ targetHours, root });
  decorate();

  const observeTarget = document.getElementById('time-recording-content-wrapper') || document.body;

  const observer = new MutationObserver(() => {
    observer.disconnect();
    decorate();
    observer.observe(observeTarget, { childList: true, subtree: true });
  });
  observer.observe(observeTarget, { childList: true, subtree: true });

  const fallbackStart = Date.now();
  const fallbackInterval = setInterval(() => {
    decorate();
    if (Date.now() - fallbackStart > FALLBACK_WINDOW_MS) {
      clearInterval(fallbackInterval);
    }
  }, FALLBACK_POLL_MS);

  const refreshInterval = setInterval(decorate, REFRESH_MS);

  return function stop() {
    observer.disconnect();
    clearInterval(fallbackInterval);
    clearInterval(refreshInterval);
  };
}
