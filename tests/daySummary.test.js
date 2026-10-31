import { summarizeDay } from '../src/lib/daySummary.js';

const MONDAY = 0;

function summarize(times, overrides = {}) {
  return summarizeDay({
    times,
    isToday: false,
    weekdayIndex: MONDAY,
    targetHours: {},
    now: new Date('2026-07-06T12:00:00'), // a Monday
    ...overrides,
  });
}

describe('summarizeDay', () => {
  describe('past days', () => {
    test('no time entries: nothing worked, nothing to warn about', () => {
      for (const times of [null, []]) {
        expect(summarize(times)).toEqual({
          work: '0h 0m',
          pause: '0h 0m',
          status: '📭 Keine Einträge',
          warning: null,
          feierabend: null,
        });
      }
    });

    test('a single completed period', () => {
      const s = summarize(['09:00', '17:00']);
      expect(s.work).toBe('8h 0m');
      expect(s.pause).toBe('0h 0m');
      expect(s.status).toBe('🏠 Tag abgeschlossen');
    });

    test('work and pause across multiple periods', () => {
      const s = summarize(['09:00', '12:00', '13:00', '17:00']);
      expect(s.work).toBe('7h 0m');
      expect(s.pause).toBe('1h 0m');
    });

    test('pause adds up every gap between periods', () => {
      const s = summarize(['08:00', '10:00', '10:30', '12:00', '13:00', '15:00']);
      expect(s.work).toBe('5h 30m');
      expect(s.pause).toBe('1h 30m');
      expect(s.status).toBe('🏠 Tag abgeschlossen');
    });

    test('start and end at the same minute is a finished day with no work', () => {
      const s = summarize(['09:00', '09:00']);
      expect(s.work).toBe('0h 0m');
      expect(s.status).toBe('🏠 Tag abgeschlossen');
    });
  });

  describe('today', () => {
    const today = (times, time) =>
      summarize(times, { isToday: true, now: new Date(`2026-07-06T${time}:00`) });

    test('working: the open period counts up to now', () => {
      const s = today(['09:00'], '10:30');
      expect(s.work).toBe('1h 30m');
      expect(s.status).toBe('🔨 Arbeitest seit 09:00');
    });

    test('working after a break: work, pause and the time since the last start', () => {
      const s = today(['09:00', '12:00', '13:00'], '15:30');
      expect(s.work).toBe('5h 30m');
      expect(s.pause).toBe('1h 0m');
      expect(s.status).toBe('🔨 Arbeitest seit 13:00');
    });

    test('away: closed day shows how long and since when', () => {
      const s = today(['09:00', '17:00'], '18:30');
      expect(s.work).toBe('8h 0m');
      expect(s.status).toBe('🚶 Weg: 1h 30m (seit 17:00)');
    });

    test('done: now is still before the last end time', () => {
      const s = today(['09:00', '17:00'], '16:30');
      expect(s.status).toBe('🏠 Tag abgeschlossen');
    });
  });

  describe('known quirk (kept as is)', () => {
    test('a past day whose last period is unclosed reports "Keine Einträge" next to its worked time', () => {
      const s = summarize(['08:00', '12:00', '13:00']);
      expect(s.work).toBe('4h 0m');
      expect(s.status).toBe('📭 Keine Einträge');
    });
  });

  describe('break warning', () => {
    test('no warning without time entries', () => {
      expect(summarize(null).warning).toBeNull();
      expect(summarize([]).warning).toBeNull();
    });

    test('no warning under the 6h threshold', () => {
      expect(summarize(['09:00', '14:59']).warning).toBeNull(); // 5h59m
    });

    test('no warning at exactly 6h worked (must exceed, not equal)', () => {
      expect(summarize(['09:00', '15:00']).warning).toBeNull();
    });

    test('warns when over 6h worked with a break that is too short', () => {
      const s = summarize(['08:00', '12:00', '12:10', '15:01']); // 6h51m worked, 10min break
      expect(s.warning).toBe('⚠️ Noch 0h 30m Pause nötig');
    });

    test('no warning once a single break of 15+ minutes covers the requirement', () => {
      expect(summarize(['08:00', '12:00', '12:35', '16:01']).warning).toBeNull(); // 7h26m, 35min break
    });

    test('several short breaks do not add up to a qualifying break', () => {
      const s = summarize(['08:00', '10:00', '10:10', '12:00', '12:10', '16:10']); // two 10min breaks
      expect(s.warning).toBe('⚠️ Noch 0h 30m Pause nötig');
    });

    test('over 9h worked requires 45min, not additive with the 30min rule', () => {
      const s = summarize(['07:00', '12:00', '12:35', '17:31']); // 9h56m worked, 35min break
      expect(s.warning).toBe('⚠️ Noch 0h 10m Pause nötig');
    });

    test('over 9h worked is satisfied by a 45min break', () => {
      expect(summarize(['07:00', '12:00', '12:45', '17:31']).warning).toBeNull();
    });

    test('an ongoing away period counts live towards the break once it reaches 15 minutes', () => {
      const s = summarize(['06:00', '12:30'], { isToday: true, now: new Date('2026-07-06T12:50:00') });
      expect(s.warning).toBe('⚠️ Noch 0h 10m Pause nötig'); // 20 of 30 minutes
    });

    test('the live away period clears the warning once it reaches the requirement', () => {
      const s = summarize(['06:00', '12:30'], { isToday: true, now: new Date('2026-07-06T13:05:00') });
      expect(s.warning).toBeNull();
    });
  });

  describe('feierabend', () => {
    const MONDAY_AT = (time, times, extra = {}) =>
      summarize(times, { isToday: true, now: new Date(`2026-07-06T${time}:00`), ...extra });

    test('none without time entries', () => {
      expect(MONDAY_AT('09:00', []).feierabend).toBeNull();
    });

    test('none for a past day', () => {
      expect(summarize(['09:00']).feierabend).toBeNull();
    });

    test('none when the day is done', () => {
      expect(MONDAY_AT('16:30', ['09:00', '17:00']).feierabend).toBeNull();
    });

    test('none once the target is reached or exceeded', () => {
      expect(MONDAY_AT('17:00', ['09:00']).feierabend).toBeNull(); // exactly 8h
      expect(MONDAY_AT('17:20', ['09:00']).feierabend).toBeNull(); // 8h20m
    });

    test('projects the end while working: now plus remaining target', () => {
      expect(MONDAY_AT('10:30', ['09:00']).feierabend).toBe('17:00'); // 1h30m worked, 6h30m to go
    });

    test('projects the end while away, moving later as the break continues', () => {
      expect(MONDAY_AT('15:00', ['08:00', '15:00']).feierabend).toBe('16:00'); // 7h worked
      expect(MONDAY_AT('15:30', ['08:00', '15:00']).feierabend).toBe('16:30');
    });

    test('adds no time for mandatory breaks that have not been taken yet', () => {
      expect(MONDAY_AT('14:50', ['09:00']).feierabend).toBe('17:00'); // 5h50m worked, 2h10m to go
    });

    describe('target hours', () => {
      const TUESDAY = 1;
      const SATURDAY = 5;
      const at = (weekdayIndex, targetHours, time = '10:30') =>
        summarize(['09:00'], { isToday: true, weekdayIndex, targetHours, now: new Date(`2026-07-06T${time}:00`) });

      test('weekdays default to 8h', () => {
        expect(at(MONDAY, {}).feierabend).toBe('17:00');
        expect(at(4, {}).feierabend).toBe('17:00'); // Friday
      });

      test('weekends default to 0h, so there is nothing to project', () => {
        expect(at(SATURDAY, {}).feierabend).toBeNull();
        expect(at(6, {}).feierabend).toBeNull();
      });

      test('a partial override changes that weekday only', () => {
        const targetHours = { Sa: 4 };
        expect(at(SATURDAY, targetHours, '10:00').feierabend).toBe('13:00'); // 1h worked, 3h to go
        expect(at(MONDAY, targetHours).feierabend).toBe('17:00');
      });

      test('a full override applies to every weekday', () => {
        const targetHours = { Mo: 6, Di: 6, Mi: 6, Do: 6, Fr: 6, Sa: 0, So: 0 };
        expect(at(MONDAY, targetHours).feierabend).toBe('15:00');
      });

      test('"HH:MM" targets are minute-precise', () => {
        expect(at(MONDAY, { Mo: '7:28' }).feierabend).toBe('16:28');
      });

      test('"HH:MM" strings and plain hour numbers can be mixed across days', () => {
        const targetHours = { Mo: '7:28', Di: 8 };
        expect(at(MONDAY, targetHours).feierabend).toBe('16:28');
        expect(at(TUESDAY, targetHours).feierabend).toBe('17:00');
      });
    });
  });
});
