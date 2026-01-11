export const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function getTodayIndex(now = new Date()) {
  const d = now.getDay();
  return d === 0 ? 6 : d - 1;
}

export function getMondayOfWeek(weekNum, year = new Date().getFullYear()) {
  const simple = new Date(year, 0, 1 + (weekNum - 1) * 7);
  const dayOfWeek = simple.getDay();
  const monday = new Date(simple);
  monday.setDate(simple.getDate() - dayOfWeek + 1);
  return monday;
}

export function formatDayLabel(dayIndex, weekNum, isToday) {
  const monday = getMondayOfWeek(weekNum);
  const date = new Date(monday);
  date.setDate(monday.getDate() + dayIndex);

  const dateStr = `${date.getDate()}.${date.getMonth() + 1}`;
  let label = `${DAYS[dayIndex]} ${dateStr}`;

  if (isToday) {
    label += ' (Heute)';
  }

  return label;
}