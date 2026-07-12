import { toMinutes } from './timeUtils.js';

export function evaluateBreakCompliance(times, isToday, now = new Date()) {
  if (!times || times.length === 0) {
    return { requiredMins: 0, qualifyingMins: 0, missingMins: 0, isBreached: false };
  }

  const nowMins = now.getHours() * 60 + now.getMinutes();

  let workMins = 0;
  let qualifyingMins = 0;

  for (let i = 0; i < times.length; i += 2) {
    const start = toMinutes(times[i]);
    const end = times[i + 1] ? toMinutes(times[i + 1]) : null;

    if (end !== null) {
      workMins += end - start;
      if (times[i + 2]) {
        const gap = toMinutes(times[i + 2]) - end;
        if (gap >= 15) qualifyingMins += gap;
      }
    } else if (isToday) {
      workMins += nowMins - start;
    }
  }

  if (times.length % 2 === 0 && isToday) {
    const awayMins = nowMins - toMinutes(times[times.length - 1]);
    if (awayMins >= 15) qualifyingMins += awayMins;
  }

  const requiredMins = workMins > 540 ? 45 : workMins > 360 ? 30 : 0;
  const missingMins = Math.max(0, requiredMins - qualifyingMins);
  const isBreached = requiredMins > 0 && qualifyingMins < requiredMins;

  return { requiredMins, qualifyingMins, missingMins, isBreached };
}
