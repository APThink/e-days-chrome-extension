import { ChromeService } from '../src/services/chromeService.js';
import { serveTimesheet } from '../src/lib/timesheetLink.js';
import { fakeChrome } from './fixtures/fakeChrome.js';
import { ALLOWED_URL } from './fixtures/fakeBrowser.js';

const DAY = { date: '2026-07-07', weekdayIndex: 1, periods: [{ start: '08:00', end: '12:00' }], isToday: false };

function serviceWith(chrome) {
  globalThis.chrome = chrome;
  return new ChromeService(ALLOWED_URL);
}

afterEach(() => {
  delete globalThis.chrome;
});

describe('ChromeService', () => {
  test('reads the days of the active tab when it is the Timesheet', async () => {
    const chrome = fakeChrome({ activeTab: { id: 7, url: `${ALLOWED_URL}?week=28` } });
    serveTimesheet({ runtime: chrome.runtime, read: () => ({ days: [DAY] }) });

    await expect(serviceWith(chrome).readTimesheet()).resolves.toEqual({ days: [DAY] });
  });

  test('returns null, without messaging the tab, when the active tab is another page', async () => {
    const chrome = fakeChrome({ activeTab: { id: 7, url: 'https://example.com/' } });
    const sendMessage = vi.spyOn(chrome.tabs, 'sendMessage');

    await expect(serviceWith(chrome).readTimesheet()).resolves.toBeNull();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('returns null when there is no active tab', async () => {
    await expect(serviceWith(fakeChrome()).readTimesheet()).resolves.toBeNull();
  });

  test('rejects with a reload hint when the Timesheet tab does not answer', async () => {
    const chrome = fakeChrome({ activeTab: { id: 7, url: ALLOWED_URL } });

    await expect(serviceWith(chrome).readTimesheet()).rejects.toThrow('Seite neu laden');
  });

  test('openPage opens a tab at the Timesheet URL', () => {
    const chrome = fakeChrome();

    serviceWith(chrome).openPage();

    expect(chrome.created).toEqual([{ url: ALLOWED_URL }]);
  });
});
