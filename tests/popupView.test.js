// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { createPopup } from '../src/lib/popup.js';
import { mountPopup } from '../src/lib/popupView.js';
import { fakeBrowser, WEEK, WEDNESDAY_NOON } from './fixtures/fakeBrowser.js';

const html = readFileSync('src/popup.html', 'utf8');
const bodyHtml = html.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/, '');

const text = (id) => document.getElementById(id).textContent;
const hidden = (id) => document.getElementById(id).classList.contains('hidden');

async function mount(browserOptions) {
  document.body.innerHTML = bodyHtml;
  const browser = fakeBrowser(browserOptions);
  await mountPopup(document, createPopup({ browser, now: WEDNESDAY_NOON }));
  return browser;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('popup view', () => {
  test('paints today and updates on navigation', async () => {
    await mount({ week: WEEK });

    expect(text('day')).toBe('Mi 8.7 (Heute)');
    expect(text('work')).toBe('4h 0m');
    expect(text('status')).toBe('🔨 Arbeitest seit 08:00');
    expect(hidden('projectedEndRow')).toBe(false);

    document.getElementById('prev').click();

    expect(text('day')).toBe('Di 7.7');
    expect(text('pause')).toBe('1h 0m');
    expect(hidden('projectedEndRow')).toBe(true);
  });

  test('shows the error and the go-to-page button on the wrong page', async () => {
    const browser = await mount({ week: null });

    expect(text('status')).toBe('❌ Öffne zuerst die Zeiterfassung');
    expect(hidden('content')).toBe(true);
    expect(hidden('goToPage')).toBe(false);

    document.getElementById('goToPage').click();
    expect(browser.opened).toBe(1);
  });

  test('disables prev on Monday', async () => {
    await mount({ week: { days: [{ date: '2026-07-06', weekdayIndex: 0, isToday: false, periods: [] }] } });
    for (let i = 0; i < 2; i++) document.getElementById('prev').click();

    expect(document.getElementById('prev').disabled).toBe(true);
  });
});
