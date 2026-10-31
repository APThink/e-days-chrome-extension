export const ALLOWED_URL = 'https://example.e-days.com/TimeSubmission';

export function fakeBrowser({ url = ALLOWED_URL, week = { days: [] }, readError, noTab } = {}) {
  return {
    opened: 0,
    currentTab: async () => (noTab ? undefined : { id: 7, url }),
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
    { date: '2026-07-07', weekdayIndex: 1, isToday: false, times: ['08:00', '12:00', '13:00', '17:00'] },
    { date: '2026-07-08', weekdayIndex: 2, isToday: true, times: ['08:00'] },
  ],
};
export const WEDNESDAY_NOON = () => new Date(2026, 6, 8, 12, 0);
