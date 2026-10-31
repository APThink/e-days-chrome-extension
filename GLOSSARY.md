# Glossary

Domain terms for the e-days Tracker. Use these in code, tests and reviews.

**Timesheet**: the weekly e-days page (`/TimeSubmission`) showing one Day per weekday.

**Day**: one `timesheet-day-<yyyy-mm-dd>` container on the Timesheet. Has a date, a weekday, and a list of Periods.

**Period**: one start/end row inside a Day. The end may be empty while the Period is open.

**Time entry**: a single start or end value (`HH:MM`) of a Period. A Day's times are its Time entries in order: start, end, start, end, …

**Timesheet reader**: the module that turns the Timesheet DOM into plain data (Days with date, weekday, Time entries and `isToday`, no DOM references) and locates the Info row anchor. The only module that knows the e-days page layout.

**Info row anchor**: the element of a Day after which its Info row is mounted (the Day's header). Located by the Timesheet reader; a Day without one is skipped.

**Day summary**: what both views (injected page row, popup) show for a Day: Work, Pause, status, optional break warning, optional Feierabend. Produced by `summarizeDay`, as display-ready strings.

**Work**: time between a Period's start and end (an open Period counts up to now, today only).

**Pause**: total time between one Period's end and the next Period's start.

**Qualifying break**: a gap of at least 15 minutes. Only these count towards the legal break requirement (30 min above 6h, 45 min above 9h of Work).

**Feierabend**: the projected end of today's workday: now plus the remaining Work to reach that weekday's target hours.

**Info row**: the line injected under a Day's header on the Timesheet (Work, Pause, status, Feierabend).

**Warning row**: the blinking break warning injected directly under the Info row. Hidden when there is nothing to warn about.

**Page decorator**: the module that keeps the Info row and Warning row of every Day in sync with the Timesheet (`decorateTimesheet`).
