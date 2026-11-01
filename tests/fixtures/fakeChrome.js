// Just enough of chrome.runtime / chrome.tabs to connect a content script to a popup in one process.
export function fakeChrome({ activeTab } = {}) {
  const listeners = new Set();
  const runtime = {
    lastError: undefined,
    onMessage: {
      addListener: (fn) => listeners.add(fn),
      removeListener: (fn) => listeners.delete(fn),
    },
  };
  const created = [];
  const tabs = {
    query: (_queryInfo, callback) => callback(activeTab ? [activeTab] : []),
    create: (properties) => created.push(properties),
    sendMessage: (_tabId, message, callback) => {
      let response;
      for (const listener of listeners) listener(message, {}, (r) => { response = r; });
      runtime.lastError = listeners.size === 0
        ? { message: 'Could not establish connection. Receiving end does not exist.' }
        : undefined;
      callback(response);
      runtime.lastError = undefined;
    },
  };
  return { runtime, tabs, created, listenerCount: () => listeners.size };
}
