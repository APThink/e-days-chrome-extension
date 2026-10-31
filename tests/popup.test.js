import { createPopup } from '../src/lib/popup.js';
import { fakeBrowser, ALLOWED_URL, WEEK, WEDNESDAY_NOON } from './fixtures/fakeBrowser.js';

function popupFor(browserOptions) {
  const browser = fakeBrowser(browserOptions);
  const popup = createPopup({ browser, allowedUrl: ALLOWED_URL, now: WEDNESDAY_NOON });
  return { browser, popup };
}

describe('Popup', () => {
  test('opens on today with its summary', async () => {
    const { popup } = popupFor({ week: WEEK });

    const view = await popup.load();

    expect(view).toMatchObject({
      kind: 'day',
      label: 'Mi 8.7 (Heute)',
      isToday: true,
      canPrev: true,
      canNext: true,
    });
    expect(view.summary.work).toBe('4h 0m');
    expect(view.summary.status).toBe('🔨 Arbeitest seit 08:00');
  });

  test('navigates to other days and shows their summary', async () => {
    const { popup } = popupFor({ week: WEEK });
    await popup.load();

    const view = popup.navigate(-1);

    expect(view).toMatchObject({ kind: 'day', label: 'Di 7.7', isToday: false });
    expect(view.summary.work).toBe('8h 0m');
    expect(view.summary.pause).toBe('1h 0m');
  });

  test('reports a Day missing from the Timesheet', async () => {
    const { popup } = popupFor({ week: WEEK });
    await popup.load();

    expect(popup.navigate(1)).toEqual({ kind: 'error', message: 'Seite nicht erkannt', offerOpenPage: false });
  });

  test('stops navigating at the ends of the week', async () => {
    const { popup } = popupFor({ week: { days: [{ date: '2026-07-06', weekdayIndex: 0, isToday: false, times: [] }] } });
    await popup.load();

    popup.navigate(-1);
    popup.navigate(-1);
    const view = popup.navigate(-1);

    expect(view).toMatchObject({ kind: 'day', canPrev: false, canNext: true });
    expect(view.label).toBe('Mo 6.7');
  });

  test('offers to open the page when the tab is not the Timesheet', async () => {
    const { popup } = popupFor({ url: 'https://example.com/' });

    expect(await popup.load()).toEqual({
      kind: 'error',
      message: 'Öffne zuerst die Zeiterfassung',
      offerOpenPage: true,
    });
  });

  test('treats a missing tab as the wrong page', async () => {
    const { popup } = popupFor({ noTab: true });

    expect(await popup.load()).toMatchObject({ kind: 'error', offerOpenPage: true });
  });

  test('surfaces a read failure without offering to open the page', async () => {
    const { popup } = popupFor({ readError: 'Seite neu laden' });

    expect(await popup.load()).toEqual({ kind: 'error', message: 'Seite neu laden', offerOpenPage: false });
  });

  test('openPage asks the browser to open the Timesheet', () => {
    const { browser, popup } = popupFor();

    popup.openPage();

    expect(browser.opened).toBe(1);
  });
});
