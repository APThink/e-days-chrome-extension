# Glossary

Domain terms for the e-days Tracker. Use these in code, tests and reviews.

**Timesheet**: the weekly e-days page (`/TimeSubmission`) showing one Day per weekday, with a "Woche N" label.

**Day**: one `timesheet-day-<yyyy-mm-dd>` container on the Timesheet. Has a date, a weekday, and a list of Periods.

**Period**: one start/end row inside a Day. The end may be empty while the Period is open.

**Time entry**: a single start or end value (`HH:MM`) of a Period. A Day's times are its Time entries in order: start, end, start, end, …

**Timesheet reader**: the module that turns the Timesheet DOM into data (`weekNum`, Days with Time entries and `isToday`). The only module that knows the e-days page layout.
