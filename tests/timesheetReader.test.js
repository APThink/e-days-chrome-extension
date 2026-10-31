// @vitest-environment jsdom
import { readTimesheet } from '../src/lib/timesheetReader.js';
import { buildDayContainer } from './fixtures/timesheetDom.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('readTimesheet', () => {
  test('reads a day with its date, weekday and time entries in order', () => {
    buildDayContainer({
      date: '2026-07-07',
      rows: [{ start: '08:28', end: '12:20' }, { start: '12:56', end: '17:48' }],
    });

    const { days } = readTimesheet(document, new Date('2026-07-10T10:00:00'));

    expect(days).toHaveLength(1);
    expect(days[0]).toMatchObject({
      date: '2026-07-07',
      weekdayIndex: 1, // Tuesday
      times: ['08:28', '12:20', '12:56', '17:48'],
    });
  });

  test('includes a trailing start with no end for an open period', () => {
    buildDayContainer({ rows: [{ start: '08:28', end: '12:20' }, { start: '13:00' }] });
    expect(readTimesheet().days[0].times).toEqual(['08:28', '12:20', '13:00']);
  });

  test('skips a period row where start and end are both empty', () => {
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }, { start: '', end: '' }] });
    expect(readTimesheet().days[0].times).toEqual(['08:00', '12:00']);
  });

  test('ignores the read-only total field', () => {
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
    expect(document.querySelector('[class*="_col-time_"] input:disabled')).not.toBeNull();
    expect(readTimesheet().days[0].times).toEqual(['08:00', '12:00']);
  });

  test('a day without periods has no times', () => {
    buildDayContainer({ rows: [] });
    expect(readTimesheet().days[0].times).toEqual([]);
  });

  test('returns no days when the page has no day containers', () => {
    expect(readTimesheet()).toEqual({ days: [] });
  });

  test('exposes each day\'s container element for in-page callers', () => {
    const container = buildDayContainer({ date: '2026-07-07' });
    expect(readTimesheet().days[0].element).toBe(container);
  });

  test('marks only the day matching the injected now as today', () => {
    buildDayContainer({ date: '2026-07-06' });
    buildDayContainer({ date: '2026-07-07' });

    const { days } = readTimesheet(document, new Date('2026-07-07T10:00:00'));

    expect(days.map((d) => d.isToday)).toEqual([false, true]);
  });
});
