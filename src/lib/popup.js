import { getWeekdayIndex, formatDayLabel } from './dateUtils.js';
import { summarizeDay } from './daySummary.js';

const LAST_WEEKDAY_INDEX = 6;

const WRONG_PAGE = { kind: 'error', message: 'Öffne zuerst die Zeiterfassung', offerOpenPage: true };
const NO_DAY = { kind: 'error', message: 'Seite nicht erkannt', offerOpenPage: false };

function errorView(message) {
  return { kind: 'error', message, offerOpenPage: false };
}

export function createPopup({ browser, allowedUrl, targetHours, now = () => new Date() }) {
  let weekdayIndex = getWeekdayIndex(now());
  let week = null;

  function view() {
    const day = week?.days.find((d) => d.weekdayIndex === weekdayIndex);
    if (!day) return NO_DAY;
    try {
      return {
        kind: 'day',
        label: formatDayLabel(day),
        isToday: day.isToday,
        canPrev: weekdayIndex > 0,
        canNext: weekdayIndex < LAST_WEEKDAY_INDEX,
        summary: summarizeDay({ ...day, targetHours, now: now() }),
      };
    } catch (error) {
      return errorView(error.message);
    }
  }

  return {
    async load() {
      try {
        const tab = await browser.currentTab();
        if (!tab?.url?.startsWith(allowedUrl)) return WRONG_PAGE;
        week = await browser.readTimesheet(tab.id);
        return view();
      } catch (error) {
        return errorView(error.message);
      }
    },

    navigate(direction) {
      const next = weekdayIndex + direction;
      if (next >= 0 && next <= LAST_WEEKDAY_INDEX) weekdayIndex = next;
      return view();
    },

    openPage() {
      browser.openPage();
    },
  };
}
