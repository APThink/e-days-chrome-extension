// @vitest-environment jsdom
import { init } from '../src/content.js';
import { INFO_CLASS } from '../src/lib/pageDecorator.js';
import { READ_TIMESHEET_MESSAGE } from '../src/lib/timesheetReader.js';
import { buildDayContainer, buildWeekLabel } from './fixtures/timesheetDom.js';

const infoText = () => document.querySelector(`.${INFO_CLASS}`)?.textContent;

function setEndTime(container, hh, mm) {
  const endInputs = container.querySelectorAll('[class*="_col-time_"]')[1].querySelectorAll('input');
  endInputs[0].value = hh;
  endInputs[1].value = mm;
}

describe('init', () => {
  let stop;
  let messageListener;
  let removedListener;

  beforeEach(() => {
    vi.useFakeTimers();
    messageListener = undefined;
    removedListener = undefined;
    globalThis.chrome = {
      runtime: {
        onMessage: {
          addListener: (fn) => { messageListener = fn; },
          removeListener: (fn) => { removedListener = fn; },
        },
      },
    };
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    delete globalThis.chrome;
    document.body.innerHTML = '';
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  test('decorates the page immediately', () => {
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
    stop = init();
    expect(infoText()).toContain('Arbeit: 4h 0m');
  });

  test('fallback polling picks up a value change within the first 10 seconds', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00' }] });
    stop = init();
    expect(infoText()).toContain('Keine Einträge');

    setEndTime(container, '12', '00');
    vi.advanceTimersByTime(500);

    expect(infoText()).toContain('Arbeit: 4h 0m');
  });

  test('keeps updating every 60 seconds after the fallback window ends', () => {
    const container = buildDayContainer({ rows: [{ start: '08:00' }] });
    stop = init();
    vi.advanceTimersByTime(11000);
    expect(infoText()).toContain('Keine Einträge');

    setEndTime(container, '12', '00');
    vi.advanceTimersByTime(60000);

    expect(infoText()).toContain('Arbeit: 4h 0m');
  });

  test('reacts to new day containers being added to the DOM (week navigation)', async () => {
    stop = init();
    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });

    await vi.advanceTimersByTimeAsync(500);

    expect(infoText()).toContain('Arbeit: 4h 0m');
  });

  test('answers a read-timesheet message with the week, without DOM elements', () => {
    buildWeekLabel('Woche 28');
    buildDayContainer({ date: '2026-07-07', rows: [{ start: '08:00', end: '12:00' }] });
    stop = init();

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
    stop = init();
    const sendResponse = vi.fn();
    messageListener({ type: 'something-else' }, {}, sendResponse);
    expect(sendResponse).not.toHaveBeenCalled();
  });

  describe('stop', () => {
    test('ends the timers: later value changes are no longer picked up', () => {
      const container = buildDayContainer({ rows: [{ start: '08:00' }] });
      stop = init();

      stop();
      setEndTime(container, '12', '00');
      vi.advanceTimersByTime(120000);

      expect(infoText()).toContain('Keine Einträge');
    });

    test('ends the DOM observer: new day containers are no longer decorated', async () => {
      stop = init();
      stop();

      buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
      await vi.advanceTimersByTimeAsync(0);

      expect(infoText()).toBeUndefined();
    });

    test('stops answering popup requests', () => {
      stop = init();
      const registered = messageListener;

      stop();

      expect(removedListener).toBe(registered);
    });
  });
});
