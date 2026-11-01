export const ALLOWED_URL = 'https://example.e-days.com/TimeSubmission';

// `week: null` models the active tab not being the Timesheet.
export function fakeBrowser({ week = { days: [] }, readError } = {}) {
  return {
    opened: 0,
    readTimesheet: async () => {
      if (readError) throw new Error(readError);
      return week;
    },
    openPage() {
      this.opened += 1;
    },
  };
}

// 2026-07-08 is a Wednesday (weekdayIndex 2)
export const WEEK = {
  days: [
    { date: '2026-07-07', weekdayIndex: 1, isToday: false, periods: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ] },
    { date: '2026-07-08', weekdayIndex: 2, isToday: true, periods: [{ start: '08:00', end: null }] },
  ],
};
export const WEDNESDAY_NOON = () => new Date(2026, 6, 8, 12, 0);
