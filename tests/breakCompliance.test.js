import { evaluateBreakCompliance } from '../src/lib/breakCompliance.js';

describe('evaluateBreakCompliance', () => {
  test('returns no requirement for null times', () => {
    const result = evaluateBreakCompliance(null, false);
    expect(result).toEqual({ requiredMins: 0, qualifyingMins: 0, missingMins: 0, isBreached: false });
  });

  test('returns no requirement for empty times', () => {
    const result = evaluateBreakCompliance([], false);
    expect(result).toEqual({ requiredMins: 0, qualifyingMins: 0, missingMins: 0, isBreached: false });
  });

  test('no requirement under the 6h threshold', () => {
    const times = ['09:00', '14:59']; // 5h59m worked
    const result = evaluateBreakCompliance(times, false);
    expect(result.requiredMins).toBe(0);
    expect(result.isBreached).toBe(false);
  });

  test('no requirement at exactly 6h worked (must exceed, not equal)', () => {
    const times = ['09:00', '15:00']; // exactly 6h worked
    const result = evaluateBreakCompliance(times, false);
    expect(result.requiredMins).toBe(0);
    expect(result.isBreached).toBe(false);
  });

  test('breached when over 6h worked with an insufficient break', () => {
    const times = ['08:00', '12:00', '12:10', '15:01']; // 6h51m worked, 10min break
    const result = evaluateBreakCompliance(times, false);
    expect(result.requiredMins).toBe(30);
    expect(result.qualifyingMins).toBe(0);
    expect(result.missingMins).toBe(30);
    expect(result.isBreached).toBe(true);
  });

  test('satisfied once a single break of 15+ minutes covers the requirement', () => {
    const times = ['08:00', '12:00', '12:35', '16:01']; // 7h26m worked, 35min break
    const result = evaluateBreakCompliance(times, false);
    expect(result.requiredMins).toBe(30);
    expect(result.qualifyingMins).toBe(35);
    expect(result.missingMins).toBe(0);
    expect(result.isBreached).toBe(false);
  });

  test('multiple short breaks do not add up to satisfy the requirement', () => {
    const times = ['08:00', '10:00', '10:10', '12:00', '12:10', '16:10']; // two 10min breaks, 7h50m worked
    const result = evaluateBreakCompliance(times, false);
    expect(result.requiredMins).toBe(30);
    expect(result.qualifyingMins).toBe(0);
    expect(result.missingMins).toBe(30);
    expect(result.isBreached).toBe(true);
  });

  test('9h threshold requires 45min, not additive with the 30min rule', () => {
    const times = ['07:00', '12:00', '12:35', '17:31']; // 9h56m worked, 35min break
    const result = evaluateBreakCompliance(times, false);
    expect(result.requiredMins).toBe(45);
    expect(result.qualifyingMins).toBe(35);
    expect(result.missingMins).toBe(10);
    expect(result.isBreached).toBe(true);
  });

  test('9h threshold satisfied with a 45min break', () => {
    const times = ['07:00', '12:00', '12:45', '17:31']; // 9h46m worked, 45min break
    const result = evaluateBreakCompliance(times, false);
    expect(result.requiredMins).toBe(45);
    expect(result.qualifyingMins).toBe(45);
    expect(result.missingMins).toBe(0);
    expect(result.isBreached).toBe(false);
  });

  test('an in-progress away period counts live once it reaches 15 minutes, today only', () => {
    const times = ['06:00', '12:30']; // 6h30m worked, then away
    const now = new Date('2026-07-12T12:50:00'); // 20min into the away period
    const result = evaluateBreakCompliance(times, true, now);
    expect(result.requiredMins).toBe(30);
    expect(result.qualifyingMins).toBe(20);
    expect(result.isBreached).toBe(true);
  });

  test('the live away period clears the warning once it reaches the requirement', () => {
    const times = ['06:00', '12:30'];
    const now = new Date('2026-07-12T13:05:00'); // 35min into the away period
    const result = evaluateBreakCompliance(times, true, now);
    expect(result.qualifyingMins).toBe(35);
    expect(result.isBreached).toBe(false);
  });
});
