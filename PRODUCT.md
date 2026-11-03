<!-- impeccable:product-schema: 1 -->

# ELTE Schedule Builder

## Platform

web

## Users

ELTE students comparing lecture and practice groups while planning a semester.

## Product Purpose

Build a usable weekly timetable from Tanrend courses or a Neptun registered-subject spreadsheet. Compare alternatives, inspect conflicts, save separate local schedules, and export or share the result.

## Operating Context

Students search by subject code, name or professor, select groups and judge the resulting week. The application is unofficial; official university information remains authoritative.

## Capabilities and Constraints

There are two class types: lecture and practice. A subject offering both requires one group of each; a subject offering only one requires that type. A group can have multiple meetings. Existing saved schedules and `/import/<base64>` links must remain compatible. Preserve local calendar dates and throttled Tanrend requests.

## Brand Commitments

Keep the green identity. The user approved a calendar-centered workspace and less competing visual emphasis on 2026-11-03. English and Hungarian remain supported.

## Evidence on Hand

The existing application, DEMO-1 through DEMO-6, automated tests, and the 2026-11-03 Impeccable audit. No commercial claims or new assets are needed.

## Product Principles

- Keep the effect on the week visible while selecting groups.
- Preserve existing schedules and user control.
- Use explicit class types and conflict information.
- Keep the implementation approachable for student contributors.
