import { serveTimesheet, requestTimesheet } from '../src/lib/timesheetLink.js';
import { fakeChrome } from './fixtures/fakeChrome.js';

const DAY = { date: '2026-07-07', weekdayIndex: 1, times: ['08:00', '12:00'], isToday: false };

describe('Timesheet link', () => {
  test('a request is answered with the days the page serves', async () => {
    const chrome = fakeChrome();
    serveTimesheet({ runtime: chrome.runtime, read: () => ({ days: [DAY] }) });

    await expect(requestTimesheet(chrome, 42)).resolves.toEqual({ days: [DAY] });
  });

  test('only the days cross the link', async () => {
    const chrome = fakeChrome();
    serveTimesheet({ runtime: chrome.runtime, read: () => ({ days: [DAY], anchors: [{}] }) });

    expect(Object.keys(await requestTimesheet(chrome, 42))).toEqual(['days']);
  });

  test('rejects with a reload hint when no page is listening', async () => {
    await expect(requestTimesheet(fakeChrome(), 42)).rejects.toThrow('Seite neu laden');
  });

  test('rejects with a reload hint when the page sends no answer', async () => {
    const chrome = fakeChrome();
    chrome.runtime.onMessage.addListener(() => {});

    await expect(requestTimesheet(chrome, 42)).rejects.toThrow('Seite neu laden');
  });

  test('stop ends the answers', async () => {
    const chrome = fakeChrome();
    const stop = serveTimesheet({ runtime: chrome.runtime, read: () => ({ days: [DAY] }) });

    stop();

    expect(chrome.listenerCount()).toBe(0);
    await expect(requestTimesheet(chrome, 42)).rejects.toThrow('Seite neu laden');
  });
});
