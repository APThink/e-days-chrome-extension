import { getWeekdayIndex, formatISODate, parseISODate } from './dateUtils.js';

const DAY_ID_PREFIX = 'timesheet-day-';
const DAY_CONTAINER_SELECTOR = `[id^="${DAY_ID_PREFIX}"]`;

function readTimeField(fieldEl) {
  const inputs = fieldEl.querySelectorAll('input');
  const hh = inputs[0]?.value.trim();
  const mm = inputs[1]?.value.trim();
  if (!hh || !mm) return null;
  return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
}

function readPeriods(container) {
  const periods = [];
  container.querySelectorAll('[class*="_period-container_"]').forEach((row) => {
    const fields = [...row.querySelectorAll('[class*="_col-time_"]')].filter(
      (field) => !field.querySelector('input:disabled')
    );
    const start = fields[0] && readTimeField(fields[0]);
    if (!start) return;
    periods.push({ start, end: (fields[1] && readTimeField(fields[1])) || null });
  });
  return periods;
}

export function locateInfoRowAnchor(date, root = document) {
  const container = root.querySelector(`[id="${DAY_ID_PREFIX}${date}"]`);
  return container?.querySelector('[class*="_top-row_"]') ?? null;
}

export function readTimesheet(root = document, now = new Date()) {
  const todayDate = formatISODate(now);
  const days = [...root.querySelectorAll(DAY_CONTAINER_SELECTOR)].map((container) => {
    const date = container.id.slice(DAY_ID_PREFIX.length);
    return {
      date,
      isToday: date === todayDate,
      weekdayIndex: getWeekdayIndex(parseISODate(date)),
      periods: readPeriods(container),
    };
  });
  return { days };
}
