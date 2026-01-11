import { toMinutes } from './timeUtils.js';

export function calcStats(times, isToday, now = new Date()) {
  if (!times || times.length === 0) {
    return { workMins: 0, pauseMins: 0, state: 'empty' };
  }

  const nowMins = now.getHours() * 60 + now.getMinutes();

  let workMins = 0;
  let pauseMins = 0;
  let awayMins = 0;
  let state = '';

  for (let i = 0; i < times.length; i += 2) {
    const start = toMinutes(times[i]);
    const end = times[i + 1] ? toMinutes(times[i + 1]) : null;

    if (end !== null) {
      workMins += end - start;
      if (times[i + 2]) {
        pauseMins += toMinutes(times[i + 2]) - end;
      }
    } else if (isToday) {
      workMins += nowMins - start;
      state = 'working';
    }
  }

  if (times.length % 2 === 0 && times.length > 0) {
    if (isToday) {
      awayMins = nowMins - toMinutes(times[times.length - 1]);
      state = awayMins >= 0 ? 'away' : 'done';
    } else {
      state = 'done';
    }
  }

  return { workMins, pauseMins, awayMins, state, lastTime: times[times.length - 1] };
}