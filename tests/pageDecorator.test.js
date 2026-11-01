// @vitest-environment jsdom
import { decorateTimesheet, decoratePage, INFO_CLASS, WARNING_CLASS } from '../src/lib/pageDecorator.js';
import { locateInfoRowAnchor } from '../src/lib/timesheetReader.js';
import { PAST_DATE, buildDayContainer } from './fixtures/timesheetDom.js';

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('decorateTimesheet', () => {
  describe('info row', () => {
    test('is added to every day, right after its header', () => {
      buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }], date: '2000-01-01' });
      buildDayContainer({ rows: [], date: '2000-01-02' });

      decorateTimesheet();

      for (const date of ['2000-01-01', '2000-01-02']) {
        const header = locateInfoRowAnchor(date);
        expect(header.nextElementSibling.classList.contains(INFO_CLASS)).toBe(true);
      }
      const infos = document.querySelectorAll(`.${INFO_CLASS}`);
      expect(infos[0].textContent).toContain('Arbeit: 4h 0m');
      expect(infos[1].textContent).toContain('Keine Einträge');
    });

    test('is reused on a second call instead of duplicated', () => {
      const container = buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });

      decorateTimesheet();
      const first = container.querySelector(`.${INFO_CLASS}`);
      decorateTimesheet();

      expect(container.querySelectorAll(`.${INFO_CLASS}`)).toHaveLength(1);
      expect(container.querySelector(`.${INFO_CLASS}`)).toBe(first);
    });

    test('reflects changed time inputs on the next call', () => {
      const container = buildDayContainer({ rows: [{ start: '08:00' }] });
      decorateTimesheet();
      expect(container.querySelector(`.${INFO_CLASS}`).textContent).toContain('Keine Einträge');

      const endInputs = container.querySelectorAll('[class*="_col-time_"]')[1].querySelectorAll('input');
      endInputs[0].value = '12';
      endInputs[1].value = '00';
      decorateTimesheet();

      expect(container.querySelector(`.${INFO_CLASS}`).textContent).toContain('Arbeit: 4h 0m');
    });

    test('is skipped for a day that has no header to anchor to', () => {
      const container = document.createElement('div');
      container.id = `timesheet-day-${PAST_DATE}`;
      document.body.appendChild(container);

      decorateTimesheet();

      expect(container.querySelector(`.${INFO_CLASS}`)).toBeNull();
      expect(container.querySelector(`.${WARNING_CLASS}`)).toBeNull();
    });

    describe('line', () => {
      const lineFor = (rows, date, now) => {
        buildDayContainer({ rows, date });
        decorateTimesheet({ now: new Date(now) });
        return document.querySelector(`.${INFO_CLASS}`).textContent;
      };

      test('completed past day', () => {
        const text = lineFor(
          [{ start: '08:28', end: '12:20' }, { start: '12:56', end: '17:48' }],
          '2026-07-06',
          '2026-07-07T20:00:00'
        );
        expect(text).toBe('Arbeit: 8h 44m · Pause: 0h 36m · 🏠 Tag abgeschlossen');
      });

      test('today mid-shift on a day without a target', () => {
        const text = lineFor([{ start: '09:00' }], '2026-07-12', '2026-07-12T10:30:00'); // Sunday
        expect(text).toBe('Arbeit: 1h 30m · Pause: 0h 0m · 🔨 Arbeitest seit 09:00');
      });

      test('day without entries', () => {
        const text = lineFor([], PAST_DATE, '2026-07-06T10:00:00');
        expect(text).toBe('Arbeit: 0h 0m · Pause: 0h 0m · 📭 Keine Einträge');
      });

      test('today mid-shift on a weekday ends with the projected Feierabend', () => {
        const text = lineFor([{ start: '09:00' }], '2026-07-06', '2026-07-06T10:30:00'); // Monday
        expect(text).toBe('Arbeit: 1h 30m · Pause: 0h 0m · 🔨 Arbeitest seit 09:00 · 🏁 Feierabend ca. 17:00');
      });

      test('Feierabend uses the injected target hours', () => {
        buildDayContainer({ rows: [{ start: '09:00' }], date: '2026-07-06' }); // Monday
        decorateTimesheet({ targetHours: { Mo: 6 }, now: new Date('2026-07-06T10:30:00') });
        expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Feierabend ca. 15:00');
      });

      test('no Feierabend once the target is reached', () => {
        const text = lineFor([{ start: '09:00' }], '2026-07-06', '2026-07-06T17:00:00'); // 8h worked
        expect(text).not.toContain('Feierabend');
      });

      test('no Feierabend for a past day', () => {
        const text = lineFor(
          [{ start: '08:28', end: '12:20' }, { start: '12:56', end: '17:48' }],
          '2026-07-05',
          '2026-07-06T20:00:00'
        );
        expect(text).not.toContain('Feierabend');
      });
    });

    describe('day styling', () => {
      test('today gets is-today', () => {
        buildDayContainer({ date: '2026-07-06', rows: [{ start: '08:00' }] });
        decorateTimesheet({ now: new Date('2026-07-06T10:00:00') });
        const el = document.querySelector(`.${INFO_CLASS}`);
        expect(el.classList.contains('is-today')).toBe(true);
        expect(el.classList.contains('is-other')).toBe(false);
      });

      test('any other day gets is-other', () => {
        buildDayContainer({ date: '2026-07-05', rows: [{ start: '08:00' }] });
        decorateTimesheet({ now: new Date('2026-07-06T10:00:00') });
        const el = document.querySelector(`.${INFO_CLASS}`);
        expect(el.classList.contains('is-other')).toBe(true);
        expect(el.classList.contains('is-today')).toBe(false);
      });
    });

    test('styles are added to the page once, however often it decorates', () => {
      buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
      decorateTimesheet();
      decorateTimesheet();
      expect(document.querySelectorAll('style#edays-tracker-styles')).toHaveLength(1);
    });
  });

  describe('warning row', () => {
    const warningRow = () => document.querySelector(`.${WARNING_CLASS}`);

    test('sits right after the info row and is reused on a second call', () => {
      const container = buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });

      decorateTimesheet();
      const first = warningRow();
      decorateTimesheet();

      expect(container.querySelector(`.${INFO_CLASS}`).nextElementSibling).toBe(first);
      expect(container.querySelectorAll(`.${WARNING_CLASS}`)).toHaveLength(1);
      expect(warningRow()).toBe(first);
    });

    test('is empty and hidden for a day under the break threshold', () => {
      buildDayContainer({ rows: [{ start: '09:00', end: '14:00' }] }); // 5h worked
      decorateTimesheet();
      expect(warningRow().textContent).toBe('');
      expect(warningRow().style.display).toBe('none');
    });

    test('shows what is missing when over 6h were worked without a qualifying break', () => {
      buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }, { start: '12:10', end: '15:01' }] });
      decorateTimesheet();
      expect(warningRow().textContent).toBe('⚠️ Noch 0h 30m Pause nötig');
      expect(warningRow().style.display).toBe('');
    });

    test('clears again once a 15+ minute break satisfies the requirement', () => {
      const container = buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }, { start: '12:10', end: '15:01' }] });
      decorateTimesheet();
      expect(warningRow().textContent).not.toBe('');

      const startInputs = container.querySelectorAll('[class*="_period-container_"]')[1]
        .querySelectorAll('[class*="_col-time_"]')[0].querySelectorAll('input');
      startInputs[0].value = '12';
      startInputs[1].value = '35';
      decorateTimesheet();

      expect(warningRow().textContent).toBe('');
      expect(warningRow().style.display).toBe('none');
    });
  });
});

describe('decoratePage', () => {
  const infoText = () => document.querySelector(`.${INFO_CLASS}`)?.textContent;

  function setEndTime(container, hh, mm) {
    const endInputs = container.querySelectorAll('[class*="_col-time_"]')[1].querySelectorAll('input');
    endInputs[0].value = hh;
    endInputs[1].value = mm;
  }

  let stop;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test('decorates the page immediately', () => {
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
    stop = decoratePage();
    expect(infoText()).toContain('Arbeit: 4h 0m');
  });

  test('fallback polling picks up a value change within the first 10 seconds', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00' }] });
    stop = decoratePage();
    expect(infoText()).toContain('Keine Einträge');

    setEndTime(container, '12', '00');
    vi.advanceTimersByTime(500);

    expect(infoText()).toContain('Arbeit: 4h 0m');
  });

  test('keeps updating every 60 seconds after the fallback window ends', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00' }] });
    stop = decoratePage();
    vi.advanceTimersByTime(11000);
    expect(infoText()).toContain('Keine Einträge');

    setEndTime(container, '12', '00');
    vi.advanceTimersByTime(60000);

    expect(infoText()).toContain('Arbeit: 4h 0m');
  });

  test('reacts to new day containers being added to the DOM (week navigation)', async () => {
    stop = decoratePage();
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });

    await vi.advanceTimersByTimeAsync(500);

    expect(infoText()).toContain('Arbeit: 4h 0m');
  });

  describe('stop', () => {
    test('ends the timers: later value changes are no longer picked up', () => {
      const container = buildDayContainer({ rows: [{ start: '08:00' }] });
      stop = decoratePage();

      stop();
      setEndTime(container, '12', '00');
      vi.advanceTimersByTime(120000);

      expect(infoText()).toContain('Keine Einträge');
    });

    test('ends the DOM observer: new day containers are no longer decorated', async () => {
      stop = decoratePage();
      stop();

      buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
      await vi.advanceTimersByTimeAsync(0);

      expect(infoText()).toBeUndefined();
    });
  });
});
