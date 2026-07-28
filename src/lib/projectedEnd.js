export function calcProjectedEnd(stats, targetMins, now = new Date()) {
  if (stats.state !== 'working' && stats.state !== 'away') return null;

  const remainingMins = targetMins - stats.workMins;
  if (remainingMins <= 0) return null;

  const nowMins = now.getHours() * 60 + now.getMinutes();
  return { projectedEndMins: nowMins + remainingMins, remainingMins };
}
