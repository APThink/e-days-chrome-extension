import { getWeekdayIndex, parseISODate, formatDayLabel, formatISODate } from '../src/lib/dateUtils.js';

describe('dateUtils', () => {
  describe('formatISODate', () => {
    test('formats a date as YYYY-MM-DD using local components', () => {
      expect(formatISODate(new Date(2026, 6, 6))).toBe('2026-07-06');
    });

    test('zero-pads single digit month and day', () => {
      expect(formatISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
  });

  describe('parseISODate', () => {
    test('reads a YYYY-MM-DD string as a local date', () => {
      const date = parseISODate('2026-07-06');
      expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 6, 6]);
    });

    test('round-trips with formatISODate', () => {
      expect(formatISODate(parseISODate('2027-01-04'))).toBe('2027-01-04');
    });
  });

  describe('getWeekdayIndex', () => {
    test('converts Sunday to index 6', () => {
      expect(getWeekdayIndex(new Date('2025-01-12'))).toBe(6);
    });

    test('converts Monday to index 0', () => {
      expect(getWeekdayIndex(new Date('2025-01-13'))).toBe(0);
    });

    test('converts Friday to index 4', () => {
      expect(getWeekdayIndex(new Date('2025-01-17'))).toBe(4);
    });

    test('defaults to today', () => {
      expect(getWeekdayIndex()).toBe(getWeekdayIndex(new Date()));
    });
  });

  describe('formatDayLabel', () => {
    test('shows the weekday and the day and month of the date', () => {
      expect(formatDayLabel({ date: '2026-07-07', weekdayIndex: 1, isToday: false })).toBe('Di 7.7');
    });

    test('does not pad day or month', () => {
      expect(formatDayLabel({ date: '2026-01-05', weekdayIndex: 0, isToday: false })).toBe('Mo 5.1');
      expect(formatDayLabel({ date: '2026-12-31', weekdayIndex: 3, isToday: false })).toBe('Do 31.12');
    });

    test('adds (Heute) when isToday is true', () => {
      expect(formatDayLabel({ date: '2026-07-07', weekdayIndex: 1, isToday: true })).toBe('Di 7.7 (Heute)');
    });

    test('is right in years where the week number would mislead (2027 starts on a Friday)', () => {
      expect(formatDayLabel({ date: '2027-01-04', weekdayIndex: 0, isToday: false })).toBe('Mo 4.1');
    });
  });
});
