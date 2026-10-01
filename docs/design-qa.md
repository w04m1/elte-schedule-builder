# Design QA

The current visual and interaction contract, written as reproducible checks
rather than links to local screenshots.

## Design contract

- Desktop has three levels: schedule management, a two-pane course workspace,
  and a full-width timetable.
- Course finder and selected subjects sit side by side when there's room, and
  stack before controls can overlap.
- Timetable: Schedule-X five-day week on wide screens, day-grouped agenda on
  mobile.
- The calendar is a fixed Monday–Friday week — no date navigation — with the
  08:00 and 21:00 axis labels visible.
- Green = lectures/create, blue = practices/transfer, amber = suggestions,
  red = conflicts/destructive. Text and icons carry the same meaning without
  color.
- Course rows are the selection controls. Selected/conflicting states don't
  move the time, room, or instructor columns. In the subject editor, section
  headings carry the class type and rows show time plus instructor.
- Calendar cards show title, time, and room; event details add professor,
  code, and group.

## Responsive checks

Check the empty and populated planner in light and dark at:

- 1440 px — two-pane workspace, five-day calendar.
- 1053 px — stacked workspace, wrapped timetable actions, no horizontal
  overflow.
- 390 px — full-width controls, collapsed subject details, mobile agenda.

At every width: suggestions stay attached to the input, Find courses and
Import Neptun don't shift on click, and dialogs fit the viewport.

## Interaction checks

1. Search `DEMO-1`; use Arrow Down/Up, Escape, and Enter in the autocomplete.
2. Open a result, select one lecture and one practice — a new pick in a
   section replaces only that section's choice.
3. Rows with the same code and time but different instructors stay
   independent.
4. Create a conflict; check its text, icon, border, card, and details in both
   themes.
5. Open schedule suggestions — each option shows only the groups it would
   replace.
6. Switch language and theme, then test Help, export, share, and the mobile
   agenda keyboard-only.
7. Desktop calendar shows one fixed Monday–Friday week — no Today, prev/next,
   or view switcher — with 08:00 and 21:00 labels fully visible.

## 2026-08-31 visual verification

- 1440 x 1000, dark: fixed five-day week, compact cards, same-color details,
  full 08:00–21:00 axis, no horizontal overflow.
- Default desktop, light: result columns, subject editor, and action hierarchy
  pass. A new lecture replaced only the previous lecture.
- 390 x 844, light and dark: controls, finder, editor, action stack, agenda,
  and footer pass without overflow.

## Automated verification

```bash
npm run check
npm test -- --run
npm run build
npm run test:e2e
git diff --check
```

The e2e suite uses local `DEMO-*` data, so it doesn't depend on Tanrend. Add a
regression test before changing a layout or interaction that has failed
before.
