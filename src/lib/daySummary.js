import { DAYS } from './dateUtils.js';

const QUALIFYING_BREAK_MINS = 15;
const DEFAULT_TARGET_HOURS = { Mo: 8, Di: 8, Mi: 8, Do: 8, Fr: 8, Sa: 0, So: 0 };

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(mins) {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  return `${h}h ${m}m`;
}

function formatClockTime(mins) {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function walkPeriods(periods, isToday, nowMins) {
  let workMins = 0;
  let pauseMins = 0;
  let qualifyingMins = 0;
  let working = false;

  periods.forEach((period, i) => {
    const start = toMinutes(period.start);
    if (period.end) {
      const end = toMinutes(period.end);
      workMins += end - start;
      const next = periods[i + 1];
      if (next) {
        const gap = toMinutes(next.start) - end;
        pauseMins += gap;
        if (gap >= QUALIFYING_BREAK_MINS) qualifyingMins += gap;
      }
    } else if (isToday) {
      workMins += nowMins - start;
      working = true;
    }
  });

  const last = periods[periods.length - 1];
  let state = { name: last?.end ? 'done' : 'empty' };
  if (working) {
    state = { name: 'working' };
  } else if (last?.end && isToday) {
    const awayMins = nowMins - toMinutes(last.end);
    if (awayMins >= QUALIFYING_BREAK_MINS) qualifyingMins += awayMins;
    if (awayMins >= 0) state = { name: 'away', awayMins };
  }

  return { workMins, pauseMins, qualifyingMins, state };
}

function statusText(state, lastTime) {
  switch (state.name) {
    case 'working':
      return `🔨 Arbeitest seit ${lastTime}`;
    case 'away':
      return `🚶 Weg: ${formatTime(state.awayMins)} (seit ${lastTime})`;
    case 'done':
      return '🏠 Tag abgeschlossen';
    default:
      return '📭 Keine Einträge';
  }
}

function targetMinutes(weekdayIndex, targetHours = {}) {
  const day = DAYS[weekdayIndex];
  const value = targetHours[day] ?? DEFAULT_TARGET_HOURS[day];
  return typeof value === 'string' ? toMinutes(value) : value * 60;
}

function feierabendFor({ state, workMins, nowMins, weekdayIndex, targetHours }) {
  if (state.name !== 'working' && state.name !== 'away') return null;
  const remainingMins = targetMinutes(weekdayIndex, targetHours) - workMins;
  if (remainingMins <= 0) return null;
  return formatClockTime(nowMins + remainingMins);
}

function requiredBreakMins(workMins) {
  if (workMins > 540) return 45;
  if (workMins > 360) return 30;
  return 0;
}

function warningFor(workMins, qualifyingMins) {
  const missingMins = requiredBreakMins(workMins) - qualifyingMins;
  return missingMins > 0 ? `⚠️ Noch ${formatTime(missingMins)} Pause nötig` : null;
}

export function summarizeDay({ periods, isToday, weekdayIndex, targetHours, now = new Date() }) {
  const list = periods ?? [];
  const nowMins = minutesOfDay(now);
  const { workMins, pauseMins, qualifyingMins, state } = walkPeriods(list, isToday, nowMins);
  const lastPeriod = list[list.length - 1];

  return {
    work: formatTime(workMins),
    pause: formatTime(pauseMins),
    status: statusText(state, lastPeriod && (lastPeriod.end ?? lastPeriod.start)),
    warning: warningFor(workMins, qualifyingMins),
    feierabend: feierabendFor({ state, workMins, nowMins, weekdayIndex, targetHours }),
  };
}
