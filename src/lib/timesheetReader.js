import { getWeekdayIndex, formatISODate, parseISODate } from './dateUtils.js';

export const READ_TIMESHEET_MESSAGE = 'edays:readTimesheet';

const DAY_ID_PREFIX = 'timesheet-day-';
const DAY_CONTAINER_SELECTOR = `[id^="${DAY_ID_PREFIX}"]`;

function readTimeField(fieldEl) {
  const inputs = fieldEl.querySelectorAll('input');
  const hh = inputs[0]?.value.trim();
  const mm = inputs[1]?.value.trim();
  if (!hh || !mm) return null;
  return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
}

function readTimes(container) {
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
  return times;
}

export function readTimesheet(root = document, now = new Date()) {
  const todayDate = formatISODate(now);
  const days = [...root.querySelectorAll(DAY_CONTAINER_SELECTOR)].map((element) => {
    const date = element.id.slice(DAY_ID_PREFIX.length);
    return {
      date,
      isToday: date === todayDate,
      weekdayIndex: getWeekdayIndex(parseISODate(date)),
      times: readTimes(element),
      element,
    };
  });
  return { days };
}
