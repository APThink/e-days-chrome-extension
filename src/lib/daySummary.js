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

function walkPeriods(times, isToday, nowMins) {
  let workMins = 0;
  let pauseMins = 0;
  let qualifyingMins = 0;
  let openPeriod = false;

  for (let i = 0; i < times.length; i += 2) {
    const start = toMinutes(times[i]);
    const end = times[i + 1] ? toMinutes(times[i + 1]) : null;

    if (end !== null) {
      workMins += end - start;
      if (times[i + 2]) {
        const gap = toMinutes(times[i + 2]) - end;
        pauseMins += gap;
        if (gap >= QUALIFYING_BREAK_MINS) qualifyingMins += gap;
      }
    } else if (isToday) {
      workMins += nowMins - start;
      openPeriod = true;
    }
  }

  const closed = times.length > 0 && times.length % 2 === 0;
  if (closed && isToday) {
    const awayMins = nowMins - toMinutes(times[times.length - 1]);
    if (awayMins >= QUALIFYING_BREAK_MINS) qualifyingMins += awayMins;
  }

  return { workMins, pauseMins, qualifyingMins, openPeriod };
}

function stateFor({ times, isToday, nowMins, openPeriod }) {
  if (openPeriod) return { name: 'working' };

  const closed = times.length > 0 && times.length % 2 === 0;
  if (!closed) return { name: 'empty' };

  if (isToday) {
    const awayMins = nowMins - toMinutes(times[times.length - 1]);
    if (awayMins >= 0) return { name: 'away', awayMins };
  }
  return { name: 'done' };
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

export function summarizeDay({ times, isToday, weekdayIndex, targetHours, now = new Date() }) {
  const entries = times ?? [];
  const nowMins = minutesOfDay(now);
  const { workMins, pauseMins, qualifyingMins, openPeriod } = walkPeriods(entries, isToday, nowMins);
  const state = stateFor({ times: entries, isToday, nowMins, openPeriod });

  return {
    work: formatTime(workMins),
    pause: formatTime(pauseMins),
    status: statusText(state, entries[entries.length - 1]),
    warning: warningFor(workMins, qualifyingMins),
    feierabend: feierabendFor({ state, workMins, nowMins, weekdayIndex, targetHours }),
  };
}
