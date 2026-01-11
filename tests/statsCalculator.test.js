import { calcStats } from '../src/lib/statsCalculator.js';

describe('calcStats', () => {
  describe('empty cases', () => {
    test('returns empty state for null times', () => {
      const result = calcStats(null, false);
      expect(result).toEqual({ workMins: 0, pauseMins: 0, state: 'empty' });
    });

    test('returns empty state for empty array', () => {
      const result = calcStats([], false);
      expect(result).toEqual({ workMins: 0, pauseMins: 0, state: 'empty' });
    });
  });

  describe('completed day', () => {
    test('calculates work time for single completed block', () => {
      const times = ['09:00', '17:00'];
      const result = calcStats(times, false);
      
      expect(result.workMins).toBe(480);
      expect(result.pauseMins).toBe(0);
      expect(result.state).toBe('done');
    });

    test('calculates work and pause for multiple blocks', () => {
      const times = ['09:00', '12:00', '13:00', '17:00'];
      const result = calcStats(times, false);
      
      expect(result.workMins).toBe(420);
      expect(result.pauseMins).toBe(60);
      expect(result.state).toBe('done');
    });

    test('cly', () => {
        const times = ['08:00', '10:00', '10:30', '12:00', '13:00', '15:00'];
        const result = calcStats(times, false);
        
        expect(result.workMins).toBe(330);
        expect(result.pauseMins).toBe(90);
        expect(result.state).toBe('done');
      });
  });

  describe('active day (isToday = true)', () => {
    test('state is working when last entry is start time', () => {
      const times = ['09:00'];
      const now = new Date('2025-01-11T10:30:00');
      const result = calcStats(times, true, now);
      
      expect(result.workMins).toBe(90);
      expect(result.state).toBe('working');
    });

    test('calculates current work time correctly', () => {
      const times = ['09:00', '12:00', '13:00'];
      const now = new Date('2025-01-11T15:30:00');
      const result = calcStats(times, true, now);
      
      expect(result.workMins).toBe(330);
      expect(result.pauseMins).toBe(60);
      expect(result.state).toBe('working');
    });

    test('state is away when day is completed', () => {
      const times = ['09:00', '17:00'];
      const now = new Date('2025-01-11T18:30:00');
      const result = calcStats(times, true, now);
      
      expect(result.workMins).toBe(480);
      expect(result.state).toBe('away');
      expect(result.awayMins).toBe(90);
    });

    test('state is done when now is before last end time', () => {
      const times = ['09:00', '17:00'];
      const now = new Date('2025-01-11T16:30:00');
      const result = calcStats(times, true, now);
      
      expect(result.state).toBe('done');
    });
  });

  describe('lastTime', () => {
    test('returns last time entry', () => {
      const times = ['09:00', '12:00', '13:00'];
      const result = calcStats(times, false);
      
      expect(result.lastTime).toBe('13:00');
    });

    test('returns last time for completed day', () => {
      const times = ['09:00', '17:00'];
      const result = calcStats(times, false);
      
      expect(result.lastTime).toBe('17:00');
    });
  });

  describe('edge cases', () => {
    test('handles times crossing midnight', () => {
      const times = ['23:00', '01:00'];
      const result = calcStats(times, false);
      
      expect(result.workMins).toBeLessThan(0);
    });

    test('handles same start and end time', () => {
      const times = ['09:00', '09:00'];
      const result = calcStats(times, false);
      
      expect(result.workMins).toBe(0);
      expect(result.state).toBe('done');
    });
  });
});