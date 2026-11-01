# Glossary

Domain terms for the e-days Tracker. Use these in code, tests and reviews.

**Timesheet**: the weekly e-days page (`/TimeSubmission`) showing one Day per weekday.

**Day**: one `timesheet-day-<yyyy-mm-dd>` container on the Timesheet. Has a date, a weekday, and a list of Periods.

**Period**: one start/end row inside a Day. It always has a start; the end is empty while the Period is open. Rows without a start are not Periods.

**Time entry**: the start or end value (`HH:MM`) of a Period.

**Timesheet reader**: the module that turns the Timesheet DOM into plain data (Days with date, weekday, Periods and `isToday`, no DOM references) and locates the Info row anchor. The only module that knows the e-days page layout.

**Info row anchor**: the element of a Day after which its Info row is mounted (the Day's header). Located by the Timesheet reader; a Day without one is skipped.

**Day summary**: what both views (injected page row, popup) show for a Day: Work, Pause, status, optional break warning, optional Feierabend. Produced by `summarizeDay`, as display-ready strings.

**Work**: time between a Period's start and end (an open Period counts up to now, today only).

**Pause**: total time between one Period's end and the next Period's start.

**Qualifying break**: a gap of at least 15 minutes. Only these count towards the legal break requirement (30 min above 6h, 45 min above 9h of Work).

**Feierabend**: the projected end of today's workday: now plus the remaining Work to reach that weekday's target hours.

**Target hours**: the per-weekday Soll-Arbeitszeit, as hours (`8`) or `"HH:MM"` (`'07:28'`). Read from config only at the entry points (`popup.js`, `contentEntry.js`) and injected; Day summary falls back to defaults (Mo–Fr 8h, Sa/So 0) for missing days.

**Info row**: the line injected under a Day's header on the Timesheet (Work, Pause, status, Feierabend).

**Warning row**: the blinking break warning injected directly under the Info row. Hidden when there is nothing to warn about.

**Page decorator**: the module that keeps the Info row and Warning row of every Day in sync with the Timesheet. `decoratePage({ targetHours, root })` decorates once, then watches the page (DOM observer, a 10s fallback poll for typed values, a 60s refresh) and returns `stop`; `decorateTimesheet({ targetHours, root, now })` is the single pass it repeats. Takes Target hours as a parameter; never reads config itself.

**Popup**: the toolbar popup module (`createPopup`). Owns the selected weekday and the loaded Timesheet, and decides what the popup shows: a Day summary with navigation limits, or an error (wrong page, reload hint, Day not found). Returns plain view models; knows nothing about the DOM or `chrome`.

**Browser port**: what the Popup needs from the browser: `readTimesheet()` (the active tab's `{ days }`, or `null` when it is not the Timesheet; rejects with the reload hint when the page does not answer) and `openPage()`. `ChromeService` is the Chrome adapter and the only owner of the Timesheet URL (`allowedUrl`, matched with `startsWith`); the manifest's `matches` pattern states the same page in Chrome's syntax and is kept in step by hand. Tests use an in-memory port (`tests/fixtures/fakeBrowser.js`).

**Timesheet link**: the module (`serveTimesheet`, `requestTimesheet`) that owns both ends of the content script ↔ popup exchange: the message, the `{ days }` response and the reload hint when no page answers. Takes `runtime`/`tabs` and the reader as parameters; knows nothing about the page layout.

**Config**: `config.js` in the extension folder (`allowedUrl`, optional Target hours). Defined once, in `src/config.example.js`. Both entry points read the same file at runtime (the popup by import, the content script via `chrome.runtime.getURL`, hence `web_accessible_resources` in the manifest), so editing `dist/config.js` after a build changes the popup and the Info row alike. Never bundled into `content.js`.

**Config loader**: the module (`loadConfig(importModule)`) that turns `config.js` into `{ allowedUrl, targetHours }` for both entry points. The way the file is fetched is passed in (popup: `import('./config.js')`; content script: `import(chrome.runtime.getURL('config.js'))`; tests: in-memory). Validates `allowedUrl` and the Target hours values (invalid days are dropped with a warning so Day summary defaults apply); rejects with a readable message when the file is unusable. The content script then falls back to default Target hours; the popup shows the message through `failedPopup`.
