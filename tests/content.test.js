// @vitest-environment jsdom
import { statusText, buildInfoText, ensureInfoElement, ensureWarningElement, updateAll, init, INFO_CLASS, WARNING_CLASS } from '../src/content.js';

import { PAST_DATE, buildDayContainer, buildWeekLabel } from './fixtures/timesheetDom.js';
import { READ_TIMESHEET_MESSAGE } from '../src/lib/timesheetReader.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('statusText', () => {
  test('working state', () => {
    expect(statusText({ state: 'working', lastTime: '08:28' })).toBe('🔨 Arbeitest seit 08:28');
  });

  test('away state', () => {
    expect(statusText({ state: 'away', awayMins: 30, lastTime: '17:00' })).toBe('🚶 Weg: 0h 30m (seit 17:00)');
  });

  test('done state', () => {
    expect(statusText({ state: 'done' })).toBe('🏠 Tag abgeschlossen');
  });

  test('empty state', () => {
    expect(statusText({ state: 'empty' })).toBe('📭 Keine Einträge');
  });
});

describe('buildInfoText', () => {
  const completed = ['08:28', '12:20', '12:56', '17:48'];

  test('completed (non-today) day', () => {
    const text = buildInfoText({ times: completed, isToday: false }, new Date('2026-07-07T20:00:00'));
    expect(text).toBe('Arbeit: 8h 44m · Pause: 0h 36m · 🏠 Tag abgeschlossen');
  });

  test('today mid-shift', () => {
    const text = buildInfoText({ times: ['09:00'], isToday: true }, new Date('2026-07-12T10:30:00'));
    expect(text).toBe('Arbeit: 1h 30m · Pause: 0h 0m · 🔨 Arbeitest seit 09:00');
  });

  test('future/empty day', () => {
    const text = buildInfoText({ times: [], isToday: false });
    expect(text).toBe('Arbeit: 0h 0m · Pause: 0h 0m · 📭 Keine Einträge');
  });

  test('today mid-shift on a weekday shows the projected end time', () => {
    const text = buildInfoText({ times: ['09:00'], isToday: true }, new Date('2026-07-06T10:30:00')); // Monday
    expect(text).toBe('Arbeit: 1h 30m · Pause: 0h 0m · 🔨 Arbeitest seit 09:00 · 🏁 Feierabend ca. 17:00');
  });

  test('does not show a projection once the target is already reached', () => {
    const text = buildInfoText({ times: ['09:00'], isToday: true }, new Date('2026-07-06T17:00:00')); // Monday, 8h worked
    expect(text).not.toContain('Feierabend');
  });

  test('does not show a projection for a completed (non-today) day', () => {
    const text = buildInfoText({ times: completed, isToday: false }, new Date('2026-07-06T20:00:00'));
    expect(text).not.toContain('Feierabend');
  });
});

describe('ensureInfoElement', () => {
  test('creates the info element right after the header', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
    const el = ensureInfoElement(container);
    expect(el.classList.contains(INFO_CLASS)).toBe(true);
    expect(container.querySelector('[class*="_top-row_"]').nextElementSibling).toBe(el);
  });

  test('reuses the existing element on a second call instead of duplicating', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
    const first = ensureInfoElement(container);
    const second = ensureInfoElement(container);
    expect(second).toBe(first);
    expect(container.querySelectorAll(`.${INFO_CLASS}`).length).toBe(1);
  });

  test('returns null when there is no header to anchor to', () => {
    const container = document.createElement('div');
    container.id = `timesheet-day-${PAST_DATE}`;
    document.body.appendChild(container);
    expect(ensureInfoElement(container)).toBeNull();
  });
});

describe('ensureInfoElement day styling', () => {
  test('applies is-today for the today container', () => {
    const container = buildDayContainer({ date: '2026-07-06', rows: [{ start: '08:00' }] });
    const el = ensureInfoElement(container, true);
    expect(el.classList.contains('is-today')).toBe(true);
    expect(el.classList.contains('is-other')).toBe(false);
  });

  test('applies is-other for a non-today container', () => {
    const container = buildDayContainer({ date: '2026-07-05', rows: [{ start: '08:00' }] });
    const el = ensureInfoElement(container, false);
    expect(el.classList.contains('is-other')).toBe(true);
    expect(el.classList.contains('is-today')).toBe(false);
  });
});

describe('ensureWarningElement', () => {
  test('creates the warning element right after the info element', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
    ensureInfoElement(container);
    const el = ensureWarningElement(container);
    expect(el.classList.contains(WARNING_CLASS)).toBe(true);
    expect(container.querySelector(`.${INFO_CLASS}`).nextElementSibling).toBe(el);
  });

  test('reuses the existing warning element on a second call', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
    ensureInfoElement(container);
    const first = ensureWarningElement(container);
    const second = ensureWarningElement(container);
    expect(second).toBe(first);
    expect(container.querySelectorAll(`.${WARNING_CLASS}`).length).toBe(1);
  });

  test('returns null when there is no info element to anchor to', () => {
    const container = document.createElement('div');
    container.id = `timesheet-day-${PAST_DATE}`;
    document.body.appendChild(container);
    expect(ensureWarningElement(container)).toBeNull();
  });
});

describe('updateAll', () => {
  test('injects text into every day container under root', () => {
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }], date: '2000-01-01' });
    buildDayContainer({ rows: [], date: '2000-01-02' });

    updateAll();

    const infos = document.querySelectorAll(`.${INFO_CLASS}`);
    expect(infos.length).toBe(2);
    expect(infos[0].textContent).toContain('Arbeit: 4h 0m');
    expect(infos[1].textContent).toContain('Keine Einträge');
  });

  test('reflects input value changes on the next call without duplicating the element', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00' }] });
    updateAll();
    expect(container.querySelector(`.${INFO_CLASS}`).textContent).toContain('Keine Einträge');

    const endInputs = container.querySelectorAll('[class*="_col-time_"]')[1].querySelectorAll('input');
    endInputs[0].value = '12';
    endInputs[1].value = '00';
    updateAll();

    expect(container.querySelectorAll(`.${INFO_CLASS}`).length).toBe(1);
    expect(container.querySelector(`.${INFO_CLASS}`).textContent).toContain('Arbeit: 4h 0m');
  });
});

describe('updateAll break warning', () => {
  test('shows no warning for a day under the threshold', () => {
    buildDayContainer({ rows: [{ start: '09:00', end: '14:00' }] }); // 5h worked
    updateAll();
    const warning = document.querySelector(`.${WARNING_CLASS}`);
    expect(warning.textContent).toBe('');
    expect(warning.style.display).toBe('none');
  });

  test('shows a blinking warning when worked over 6h without a qualifying break', () => {
    buildDayContainer({
      rows: [{ start: '08:00', end: '12:00' }, { start: '12:10', end: '15:01' }],
    }); // 6h51m worked, 10min break
    updateAll();
    const warning = document.querySelector(`.${WARNING_CLASS}`);
    expect(warning.textContent).toBe('⚠️ Noch 0h 30m Pause nötig');
    expect(warning.style.display).toBe('');
  });

  test('clears the warning once a 15+ minute break satisfies the requirement', () => {
    buildDayContainer({
      rows: [{ start: '08:00', end: '12:00' }, { start: '12:35', end: '16:01' }],
    }); // 7h26m worked, 35min break
    updateAll();
    const warning = document.querySelector(`.${WARNING_CLASS}`);
    expect(warning.textContent).toBe('');
    expect(warning.style.display).toBe('none');
  });
});

describe('init', () => {
  let observer;
  let messageListener;

  beforeEach(() => {
    vi.useFakeTimers();
    messageListener = undefined;
    globalThis.chrome = {
      runtime: { onMessage: { addListener: (fn) => { messageListener = fn; } } },
    };
  });

  afterEach(() => {
    delete globalThis.chrome;
    observer?.disconnect();
    observer = undefined;
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test('injects text immediately', () => {
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
    observer = init();
    expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Arbeit: 4h 0m');
  });

  test('fallback polling picks up a value change within the first 10 seconds', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00' }] });
    observer = init();
    expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Keine Einträge');

    const endInputs = container.querySelectorAll('[class*="_col-time_"]')[1].querySelectorAll('input');
    endInputs[0].value = '12';
    endInputs[1].value = '00';
    vi.advanceTimersByTime(500);

    expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Arbeit: 4h 0m');
  });

  test('keeps updating every 60 seconds after the fallback window ends', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00' }] });
    observer = init();
    vi.advanceTimersByTime(11000);
    expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Keine Einträge');

    const endInputs = container.querySelectorAll('[class*="_col-time_"]')[1].querySelectorAll('input');
    endInputs[0].value = '12';
    endInputs[1].value = '00';
    vi.advanceTimersByTime(60000);

    expect(document.querySelector(`.${INFO_CLASS}`).textContent).toContain('Arbeit: 4h 0m');
  });

  test('reacts to new day containers being added to the DOM (week navigation)', async () => {
    observer = init();
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });

    await vi.advanceTimersByTimeAsync(500);

    expect(document.querySelector(`.${INFO_CLASS}`)?.textContent).toContain('Arbeit: 4h 0m');
  });

  test('answers a read-timesheet message with the week, without DOM elements', () => {
    buildWeekLabel('Woche 28');
    buildDayContainer({ date: '2026-07-07', rows: [{ start: '08:00', end: '12:00' }] });
    observer = init();

    const sendResponse = vi.fn();
    const keepOpen = messageListener({ type: READ_TIMESHEET_MESSAGE }, {}, sendResponse);

    expect(keepOpen).toBeUndefined();
    expect(sendResponse).toHaveBeenCalledTimes(1);
    const response = sendResponse.mock.calls[0][0];
    expect(response.weekNum).toBe(28);
    expect(response.days).toHaveLength(1);
    expect(response.days[0]).toEqual({
      date: '2026-07-07',
      weekdayIndex: 1,
      times: ['08:00', '12:00'],
      isToday: expect.any(Boolean),
    });
  });

  test('ignores messages of other types', () => {
    observer = init();
    const sendResponse = vi.fn();
    messageListener({ type: 'something-else' }, {}, sendResponse);
    expect(sendResponse).not.toHaveBeenCalled();
  });
});
