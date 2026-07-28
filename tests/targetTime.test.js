import { getTargetMinutes, DEFAULT_TARGET_HOURS } from '../src/lib/targetTime.js';

describe('getTargetMinutes', () => {
  test('defaults to 8h on weekdays when no config is given', () => {
    expect(getTargetMinutes(0)).toBe(480); // Mo
    expect(getTargetMinutes(4)).toBe(480); // Fr
  });

  test('defaults to 0h on weekends when no config is given', () => {
    expect(getTargetMinutes(5)).toBe(0); // Sa
    expect(getTargetMinutes(6)).toBe(0); // So
  });

  test('applies a partial override and keeps defaults for the rest', () => {
    const targetHours = { Sa: 4 };
    expect(getTargetMinutes(5, targetHours)).toBe(240); // Sa overridden
    expect(getTargetMinutes(0, targetHours)).toBe(480); // Mo still default
  });

  test('applies a full override', () => {
    const targetHours = { Mo: 6, Di: 6, Mi: 6, Do: 6, Fr: 6, Sa: 0, So: 0 };
    expect(getTargetMinutes(0, targetHours)).toBe(360);
  });

  test('exports the default hours map', () => {
    expect(DEFAULT_TARGET_HOURS).toEqual({ Mo: 8, Di: 8, Mi: 8, Do: 8, Fr: 8, Sa: 0, So: 0 });
  });

  test('accepts an "HH:MM" string for minute-precise targets', () => {
    const targetHours = { Mo: '7:28' };
    expect(getTargetMinutes(0, targetHours)).toBe(448); // 7h28m
  });

  test('allows mixing "HH:MM" strings and plain hour numbers across days', () => {
    const targetHours = { Mo: '7:28', Di: 8 };
    expect(getTargetMinutes(0, targetHours)).toBe(448);
    expect(getTargetMinutes(1, targetHours)).toBe(480);
  });
});
