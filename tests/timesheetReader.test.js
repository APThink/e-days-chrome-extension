// @vitest-environment jsdom
import { readTimesheet, locateInfoRowAnchor } from '../src/lib/timesheetReader.js';
import { buildDayContainer } from './fixtures/timesheetDom.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('readTimesheet', () => {
  test('reads a day with its date, weekday and periods in order', () => {
    buildDayContainer({
      date: '2026-07-07',
      rows: [{ start: '08:28', end: '12:20' }, { start: '12:56', end: '17:48' }],
    });

    const { days } = readTimesheet(document, new Date('2026-07-10T10:00:00'));

    expect(days).toHaveLength(1);
    expect(days[0]).toMatchObject({
      date: '2026-07-07',
      weekdayIndex: 1, // Tuesday
      periods: [
        { start: '08:28', end: '12:20' },
        { start: '12:56', end: '17:48' },
      ],
    });
  });

  test('includes a trailing start with no end for an open period', () => {
    buildDayContainer({ rows: [{ start: '08:28', end: '12:20' }, { start: '13:00' }] });
    expect(readTimesheet().days[0].periods).toEqual([
      { start: '08:28', end: '12:20' },
      { start: '13:00', end: null },
    ]);
  });

  test('skips a period row where start and end are both empty', () => {
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }, { start: '', end: '' }] });
    expect(readTimesheet().days[0].periods).toEqual([{ start: '08:00', end: '12:00' }]);
  });

  test('drops a period row that has an end but no start, keeping later periods paired', () => {
    buildDayContainer({
      rows: [{ start: '', end: '12:00' }, { start: '13:00', end: '17:00' }],
    });
    expect(readTimesheet().days[0].periods).toEqual([{ start: '13:00', end: '17:00' }]);
  });

  test('ignores the read-only total field', () => {
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
    expect(document.querySelector('[class*="_col-time_"] input:disabled')).not.toBeNull();
    expect(readTimesheet().days[0].periods).toEqual([{ start: '08:00', end: '12:00' }]);
  });

  test('a day without period rows has no periods', () => {
    buildDayContainer({ rows: [] });
    expect(readTimesheet().days[0].periods).toEqual([]);
  });

  test('returns no days when the page has no day containers', () => {
    expect(readTimesheet()).toEqual({ days: [] });
  });

  test('returns days as plain data without DOM references', () => {
    buildDayContainer({ date: '2026-07-07', rows: [{ start: '08:00', end: '12:00' }] });
    const [day] = readTimesheet().days;
    expect(Object.keys(day).sort()).toEqual(['date', 'isToday', 'periods', 'weekdayIndex']);
  });

  test('marks only the day matching the injected now as today', () => {
    buildDayContainer({ date: '2026-07-06' });
    buildDayContainer({ date: '2026-07-07' });

    const { days } = readTimesheet(document, new Date('2026-07-07T10:00:00'));

    expect(days.map((d) => d.isToday)).toEqual([false, true]);
  });
});

describe('locateInfoRowAnchor', () => {
  test('returns the header of the day with the given date', () => {
    buildDayContainer({ date: '2026-07-06' });
    const container = buildDayContainer({ date: '2026-07-07' });

    const anchor = locateInfoRowAnchor('2026-07-07');

    expect(anchor).toBe(container.querySelector('[class*="_top-row_"]'));
  });

  test('returns null for a date that is not on the page', () => {
    buildDayContainer({ date: '2026-07-06' });
    expect(locateInfoRowAnchor('2026-07-07')).toBeNull();
  });

  test('returns null for a day that has no header', () => {
    const container = document.createElement('div');
    container.id = 'timesheet-day-2026-07-07';
    document.body.appendChild(container);

    expect(locateInfoRowAnchor('2026-07-07')).toBeNull();
  });
});
