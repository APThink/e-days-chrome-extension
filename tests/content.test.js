// @vitest-environment jsdom
import { init } from '../src/content.js';
import { INFO_CLASS } from '../src/lib/pageDecorator.js';
import { requestTimesheet } from '../src/lib/timesheetLink.js';
import { fakeChrome } from './fixtures/fakeChrome.js';
import { buildDayContainer } from './fixtures/timesheetDom.js';

const infoText = () => document.querySelector(`.${INFO_CLASS}`)?.textContent;

describe('init', () => {
  let stop;
  let chrome;

  beforeEach(() => {
    vi.useFakeTimers();
    chrome = fakeChrome();
    globalThis.chrome = chrome;
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

  test('passes the target hours on to the page decorator', () => {
    buildDayContainer({ rows: [{ start: '09:00' }], date: '2026-07-06' }); // Monday
    vi.setSystemTime(new Date('2026-07-06T10:30:00'));
    stop = init({ targetHours: { Mo: 6 } });
    expect(infoText()).toContain('Feierabend ca. 15:00');
  });

  test('answers popup requests with the days, without DOM elements', async () => {
    buildDayContainer({ date: '2026-07-07', rows: [{ start: '08:00', end: '12:00' }] });
    stop = init();

    const { days } = await requestTimesheet(chrome, 42);

    expect(days).toEqual([
      { date: '2026-07-07', weekdayIndex: 1, periods: [{ start: '08:00', end: '12:00' }], isToday: expect.any(Boolean) },
    ]);
  });

  test('stop ends both the page decorator and the popup answering', async () => {
    stop = init();
    expect(chrome.listenerCount()).toBe(1);

    stop();
    expect(chrome.listenerCount()).toBe(0);

    buildDayContainer({ rows: [{ start: '08:00', end: '12:00' }] });
    await vi.advanceTimersByTimeAsync(60000);
    expect(infoText()).toBeUndefined();
  });
});
