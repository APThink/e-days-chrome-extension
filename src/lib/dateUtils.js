export const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function getWeekdayIndex(date = new Date()) {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}

export function formatISODate(date) {
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseISODate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayLabel({ date, weekdayIndex, isToday }) {
  const [, month, day] = date.split('-').map(Number);
  const label = `${DAYS[weekdayIndex]} ${day}.${month}`;
  return isToday ? `${label} (Heute)` : label;
}
