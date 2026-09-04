# User guide 🧭

ELTE Schedule Builder helps compare class groups before registration and keep a
personal schedule in one browser. It does not register classes and is not an
official ELTE service.

[Try DEMO data](#try-it-with-demo-data) ·
[Build a schedule](#build-a-schedule-from-a-code-course-or-professor) ·
[Share](#share-a-schedule) · [Export](#export-a-timetable) ·
[Troubleshoot](#storage-and-troubleshooting)

> [!IMPORTANT]
> Always verify your final timetable in Neptun or another official ELTE system.

## Language

The planner is available in English and Hungarian. On a first visit, Hungarian
is selected only when the device's primary language is Hungarian; every other
device language starts in English. Use the **EN/HU** selector beside the theme
and Help controls to switch at any time. The selected language is saved in the
current browser and also updates the calendar, dialogs, status messages, Help,
and screen-reader labels.

## Try it with DEMO data

Use `DEMO-1` through `DEMO-6` when you want to explore the application without
depending on live Tanrend data. DEMO subjects follow the same application flow
as real subject codes but are served locally by the backend.

## Build a schedule from a code, course, or professor

1. Enter a subject code, course name, or professor in **Add courses from Tanrend**.
   The finder checks all three kinds of match automatically. Course and professor
   names tolerate small typing errors, while subject codes remain exact. A professor
   search returns the different courses taught by that person.
2. After two characters, choose one of the three ranked suggestions. The first
   is selected automatically; use the arrow keys to change it and **Enter** to
   open its classes. Select **Find courses** when you want to review every
   returned match instead.
3. Review lectures first, followed by practices. Each section is sorted Monday
   to Friday and then by start time. Class time, group, instructor, and location
   stay visible inline.
4. Click or press a class row to select one meeting, or use **Add all groups**
   to keep every returned option available. Bulk addition selects one initial
   group in each lecture/practice section instead of placing every alternative
   on the timetable. Selected rows have a green border; rows that would overlap
   the timetable have a red border and conflict label. Choosing one class keeps
   the result card open so additional lectures or practices can be selected
   immediately.
5. Selected subjects are listed alphabetically. Select a subject's name to
   review its lectures first and practices second; use its checkbox only to
   show or hide that subject in the timetable. Each class section is sorted
   Monday to Friday and then by time. Rows show the meeting time and instructor
   without repeating the section type or course code. Selecting another class
   in one section replaces its current choice while preserving the other
   section.

Only enabled events appear in the calendar and in sharing or export actions.
The calendar is a recurring Monday-Friday timetable from 08:00 through 21:00;
it intentionally has no date navigation or alternate day view. Phones use the
same data in a day-grouped chronological list.

The combined results can include several subjects. The planner removes duplicate
classes and groups lecture and practice rows under their normalized subject
title so each result can be reviewed independently.

Neptun's **Registered subjects** workbook contains subject codes, not the exact
course groups selected during registration. Import therefore keeps every
Tanrend alternative available but chooses one deterministic initial group in
each lecture/practice section. Review those groups manually or use **Suggest
schedules** before relying on the timetable. Re-importing preserves an existing
group selection when it is still available.

## Search and select a class

1. Enter a subject code such as `DEMO-1` and press **Enter** to open the
   top-ranked suggestion.
2. Review the available time, group, instructor, and location.
3. Click or press the class row you want.

Selecting a different group of the same type replaces the enabled group while
preserving the rest of that subject.

## Conflicts and lecture exemption

Enabled events that overlap are marked as conflicts. The lecture-exemption
**Ignore lecture conflicts** lets the planner omit lectures when computing
conflicts. Enable it only when lecture attendance is not required.

## Schedule suggestions

Select **Suggest schedules** to compare alternative group combinations. On
wide screens, options appear in separate columns; they stack on smaller
screens. Options are ranked by the fewest conflicts first, then by the fewest
replacements to the current selection. Each option is grouped by the weekday
of its proposed classes and shows only the groups that would change, with the
current group beside its replacement. Select **Apply** on the preferred option
to update the timetable. The planner does not present the unchanged timetable
or an equally conflicting swap as a recommendation. If no available group
change lowers the conflict count, it says so instead of offering a no-op.

## Multiple schedules

Use the **Schedule** toolbar to create, switch, rename, or delete local schedules. Each
schedule keeps its own subjects and lecture-exemption setting. The last
remaining schedule cannot be deleted.

## Share a schedule

**Copy link** copies a URL containing the enabled class codes and
lecture-exemption setting. Opening it creates a new local schedule instead of
overwriting schedules already saved in that browser.

Treat share links as readable information: anyone with the URL can recover the
class codes it contains.

## Export a timetable

**Export calendar** downloads every enabled class together as one pack; it does
not extract individual courses. Choose the format that matches the destination:

- **iCalendar (.ics)** is the recommended option. It contains the complete
  timetable as weekly recurring events and can be imported into Apple Calendar,
  Outlook, Google Calendar, and other calendar apps.
- **Google Calendar (.csv)** contains the next occurrence of every enabled
  meeting in Google's import format. CSV imports do not preserve weekly
  recurrence, so use iCalendar when recurring classes are required.

Both files are created locally in the browser. Review imported dates, times,
recurrence, and the semester end in the destination calendar.

## Storage and troubleshooting

Schedules are stored only in the current browser's `localStorage`. Clearing site
data, using private browsing, or changing browsers can remove or hide them.

If a subject is missing, Tanrend may not have published it yet, the code may be
incorrect, or the upstream service may be unavailable. Try a `DEMO-*` code to
distinguish an application problem from unavailable live data.
