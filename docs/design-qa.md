# Design QA

This document records the current visual and interaction contract for ELTE
Schedule Builder. It intentionally contains reproducible checks rather than
links to one contributor's local screenshots.

## Design contract

- The desktop page has three levels: schedule management, a two-pane course
  workspace, and a full-width timetable.
- The course finder and selected subjects sit side by side when space allows and
  stack before controls can overlap.
- The timetable uses the Schedule-X five-day week on wide screens and a
  day-grouped agenda on mobile.
- The calendar is a recurring Monday-Friday timetable. It has no date
  navigation or alternate day view, and its time axis visibly includes the
  08:00 and 21:00 boundaries.
- Green identifies lecture and create actions, blue identifies practice and
  transfer actions, amber identifies suggestions, and red identifies conflicts
  or destructive actions. Text and icons continue to communicate meaning when
  color is unavailable.
- Course rows are the selection controls. Selected and conflicting states do
  not move the time, room, or instructor columns. In the selected-subject
  editor, section headings carry the class type and rows show time plus
  instructor instead of repeating the type or code.
- Calendar cards show title, time, and room. Event details add professor, code,
  and group information without repeating an eyebrow or the calendar card
  verbatim.

## Responsive checks

Verify the empty and populated planner in both light and dark themes at these
representative widths:

- 1440 px: two-pane course workspace and five-day calendar.
- 1053 px: stacked course workspace, wrapped timetable actions, and no
  horizontal overflow.
- 390 px: full-width controls, collapsed subject details, and the mobile agenda.

At every width, confirm that search suggestions remain attached to the input,
Find courses and Import Neptun do not shift during a click, and dialogs fit
within the viewport.

## Interaction checks

1. Search for `DEMO-1` and use Arrow Down, Arrow Up, Escape, and Enter in the
   autocomplete list.
2. Open a result and select one lecture and one practice. Selecting a different
   row in either section must replace only the previous choice in that section.
3. Confirm that rows with the same code and time but different instructors
   remain independent.
4. Create a conflict and verify its text, icon, border, calendar card, and event
   details in both themes.
5. Open schedule suggestions and confirm that each option shows only the groups
   it would replace.
6. Switch English/Hungarian and light/dark modes, then test Help, export, share,
   and the mobile agenda with keyboard-only navigation.
7. Confirm the desktop calendar exposes one fixed Monday-Friday week, no Today,
   previous/next, or view-switch controls, and fully visible 08:00 and 21:00
   boundary labels.

## 2026-08-31 visual verification

- 1440 x 1000, dark: fixed five-day week, compact event cards, same-color event
  details, and complete 08:00-21:00 axis passed without horizontal overflow.
- Default desktop, light: Tanrend result columns, selected-subject editor, and
  timetable action hierarchy passed. Selecting a new lecture replaced only the
  previous lecture and preserved the selected practice.
- 390 x 844, light and dark: schedule controls, finder, subject editor, action
  stack, day-grouped agenda, and footer passed without page overflow.

## Automated verification

Run the project checks from the repository root:

```bash
npm run check
npm test -- --run
npm run build
npm run test:e2e
git diff --check
```

The end-to-end suite uses local `DEMO-*` data so its core design checks do not
depend on Tanrend availability. Add a focused regression before changing a
layout or interaction that previously failed.
