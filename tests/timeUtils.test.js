import { formatTime, toMinutes } from '../src/lib/timeUtils.js';

describe('timeUtils', () => {
  describe('formatTime', () => {
    test('formats work hours correctly', () => {
      expect(formatTime(480)).toBe('8h 0m');
      expect(formatTime(135)).toBe('2h 15m');
      expect(formatTime(45)).toBe('0h 45m');
    });

    test('handles negative time (away calculation)', () => {
      expect(formatTime(-30)).toBe('0h 30m');
    });
  });

  describe('toMinutes', () => {
    test('converts time entries to minutes', () => {
      expect(toMinutes('08:00')).toBe(480);
      expect(toMinutes('12:30')).toBe(750);
      expect(toMinutes('17:00')).toBe(1020);
    });
  });
});