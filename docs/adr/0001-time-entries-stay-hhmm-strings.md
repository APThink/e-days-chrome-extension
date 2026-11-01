# Time entries stay `HH:MM` strings across the Timesheet reader seam

Status: accepted (2026-11-01)

## Context

An architecture review suggested having the Timesheet reader emit minutes-of-day instead of `HH:MM` strings, so Day summary would never parse a Time entry.

## Decision

Periods keep carrying Time entries as `HH:MM` strings. The Timesheet reader only normalises the page's hour/minute inputs into that form; Day summary is the single module that parses and formats clock times.

## Why

- Day summary needs the `HH:MM` format regardless: it parses `"HH:MM"` Target hours from config and formats minutes back to `HH:MM` for the status text and Feierabend. Emitting minutes from the reader would add a format step there and keep both in Day summary, so format knowledge would sit in two modules instead of one (fails the deletion test: complexity moves, it does not concentrate).
- The Timesheet link carries Days as JSON between content script and popup; `HH:MM` strings stay readable on the wire and match the glossary's Time entry.
- Roughly 45 fixture lines across the reader, decorator, content and popup tests would change for no gain in locality or leverage.

## Revisit if

Day summary stops needing `HH:MM` itself (config and display both move to minutes), or a second consumer needs to do arithmetic on Periods outside Day summary.
