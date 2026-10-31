const READ_TIMESHEET_MESSAGE = 'edays:readTimesheet';
const RELOAD_HINT = 'Seite neu laden';

export function serveTimesheet({ runtime, read }) {
  const listener = (message, _sender, sendResponse) => {
    if (message?.type !== READ_TIMESHEET_MESSAGE) return;
    const { days } = read();
    sendResponse({ days });
  };
  runtime.onMessage.addListener(listener);
  return () => runtime.onMessage.removeListener(listener);
}

export function requestTimesheet({ tabs, runtime }, tabId) {
  return new Promise((resolve, reject) => {
    tabs.sendMessage(tabId, { type: READ_TIMESHEET_MESSAGE }, (response) => {
      if (runtime.lastError || !response) {
        reject(new Error(RELOAD_HINT));
        return;
      }
      resolve(response);
    });
  });
}
