import { getTodayIndex, getMondayOfWeek, formatDayLabel } from '../src/lib/dateUtils.js';

describe('dateUtils', () => {
  describe('getTodayIndex', () => {
    test('converts Sunday to index 6', () => {
      const sunday = new Date('2025-01-12');
      expect(getTodayIndex(sunday)).toBe(6);
    });

    test('converts Monday to index 0', () => {
      const monday = new Date('2025-01-13');
      expect(getTodayIndex(monday)).toBe(0);
    });

    test('converts Friday to index 4', () => {
      const friday = new Date('2025-01-17');
      expect(getTodayIndex(friday)).toBe(4);
    });
  });

  describe('getMondayOfWeek', () => {
    test('returns Monday', () => {
      const monday = getMondayOfWeek(2, 2025);
      expect(monday.getDay()).toBe(1);
    });

    test('consecutive weeks are 7 days apart', () => {
      const week10 = getMondayOfWeek(10, 2025);
      const week11 = getMondayOfWeek(11, 2025);
      const diff = week11.getTime() - week10.getTime();
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('formatDayLabel', () => {
    test('formats day with date', () => {
      const label = formatDayLabel(0, 2, false);
      expect(label).toMatch(/^Mo \d{1,2}\.\d{1,2}$/);
    });

    test('adds (Heute) when isToday is true', () => {
      const label = formatDayLabel(0, 2, true);
      expect(label).toContain('(Heute)');
    });

    test('does not add (Heute) when isToday is false', () => {
      const label = formatDayLabel(0, 2, false);
      expect(label).not.toContain('(Heute)');
    });
  });
});