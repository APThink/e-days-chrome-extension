import { DAYS } from './dateUtils.js';
import { toMinutes } from './timeUtils.js';

export const DEFAULT_TARGET_HOURS = { Mo: 8, Di: 8, Mi: 8, Do: 8, Fr: 8, Sa: 0, So: 0 };

export function getTargetMinutes(dayIndex, targetHours = {}) {
  const day = DAYS[dayIndex];
  const value = targetHours[day] ?? DEFAULT_TARGET_HOURS[day];
  return typeof value === 'string' ? toMinutes(value) : value * 60;
}
