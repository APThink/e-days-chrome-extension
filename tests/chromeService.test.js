import { ChromeService } from '../src/services/chromeService.js';
import { READ_TIMESHEET_MESSAGE } from '../src/lib/timesheetReader.js';

function fakeChrome({ response, lastError } = {}) {
  const sendMessage = vi.fn((tabId, message, callback) => {
    globalThis.chrome.runtime.lastError = lastError;
    callback(response);
    globalThis.chrome.runtime.lastError = undefined;
  });
  globalThis.chrome = { runtime: {}, tabs: { sendMessage } };
  return sendMessage;
}

afterEach(() => {
  delete globalThis.chrome;
});

describe('ChromeService.readTimesheet', () => {
  const service = new ChromeService('https://example.e-days.com/TimeSubmission');

  test('asks the tab\'s content script and resolves with its answer', async () => {
    const week = { weekNum: 28, days: [{ date: '2026-07-07', weekdayIndex: 1, times: [], isToday: false }] };
    const sendMessage = fakeChrome({ response: week });

    await expect(service.readTimesheet(42)).resolves.toEqual(week);
    expect(sendMessage).toHaveBeenCalledWith(42, { type: READ_TIMESHEET_MESSAGE }, expect.any(Function));
  });

  test('rejects with a reload hint when no content script is listening', async () => {
    fakeChrome({ lastError: { message: 'Could not establish connection. Receiving end does not exist.' } });

    await expect(service.readTimesheet(42)).rejects.toThrow('Seite neu laden');
  });

  test('rejects with a reload hint when the content script sends no answer', async () => {
    fakeChrome({ response: undefined });

    await expect(service.readTimesheet(42)).rejects.toThrow('Seite neu laden');
  });
});
