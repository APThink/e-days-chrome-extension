import { calcProjectedEnd } from '../src/lib/projectedEnd.js';

describe('calcProjectedEnd', () => {
  test('returns null for empty state', () => {
    const stats = { workMins: 0, state: 'empty' };
    expect(calcProjectedEnd(stats, 480, new Date('2026-07-06T09:00:00'))).toBeNull();
  });

  test('returns null for done state', () => {
    const stats = { workMins: 480, state: 'done' };
    expect(calcProjectedEnd(stats, 480, new Date('2026-07-06T17:00:00'))).toBeNull();
  });

  test('returns null when the target is already reached while working', () => {
    const stats = { workMins: 480, state: 'working' };
    expect(calcProjectedEnd(stats, 480, new Date('2026-07-06T17:00:00'))).toBeNull();
  });

  test('returns null when the target is already exceeded', () => {
    const stats = { workMins: 500, state: 'working' };
    expect(calcProjectedEnd(stats, 480, new Date('2026-07-06T17:20:00'))).toBeNull();
  });

  test('projects the end time while working, target not yet reached', () => {
    // 09:00 start, now 10:30 => 90 worked, target 480 => 390 remaining => ends 17:00
    const stats = { workMins: 90, state: 'working' };
    const now = new Date('2026-07-06T10:30:00');
    const result = calcProjectedEnd(stats, 480, now);
    expect(result).toEqual({ projectedEndMins: 1020, remainingMins: 390 });
  });

  test('projects the end time while away, shifting forward as the break continues', () => {
    // worked 420 so far (7h), target 480 => 60 remaining. now 15:00 => ends 16:00.
    const stats = { workMins: 420, state: 'away' };
    const now = new Date('2026-07-06T15:00:00');
    const result = calcProjectedEnd(stats, 480, now);
    expect(result).toEqual({ projectedEndMins: 960, remainingMins: 60 });
  });

  test('does not add time for future mandatory breaks not yet taken', () => {
    // 5h50m worked, target 480 (8h) => remaining 130min, even though continuing
    // to work would eventually cross the 6h mandatory-break threshold.
    const stats = { workMins: 350, state: 'working' };
    const now = new Date('2026-07-06T14:50:00');
    const result = calcProjectedEnd(stats, 480, now);
    expect(result.remainingMins).toBe(130);
  });
});
