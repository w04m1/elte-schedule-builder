# User guide

Compare class groups before registration and keep a schedule in one browser.
Not an official ELTE service — always check your final timetable in Neptun.

## Language and demo data

English and Hungarian. First visit picks your device's primary language;
switch anytime with EN/HU in the header. `DEMO-1` through `DEMO-6` run the
whole app without live Tanrend data.

## Build a schedule

1. Type a subject code, course name, or professor into **Add courses from
   Tanrend**. Codes must be exact; names forgive small typos.
2. Pick a suggestion (arrow keys, then Enter) or hit **Find courses** for every
   match.
3. Lectures first, then practices, sorted by weekday and time. Click a row to
   pick it, or **Add all groups** to keep every option.
4. Click a subject's name to edit its classes. The checkbox only shows or
   hides it on the timetable.

The calendar is a fixed Monday–Friday week, 08:00–21:00. On phones it becomes
a day-by-day list.

**Neptun import:** the Registered subjects `.xlsx` has subject codes, not your
exact groups — the planner picks one starting group per section. Review them
or run **Suggest schedules**. Re-importing keeps picks that are still
available.

## Conflicts and suggestions

Overlapping classes are marked red. **Ignore lecture conflicts** skips
lectures when checking — only if attendance is optional.

**Suggest schedules** ranks combinations by fewest conflicts, then fewest
swaps from your current picks. Each option shows only what would change;
**Apply** updates the timetable.

## Multiple schedules

The **Schedule** toolbar creates, renames, switches, and deletes plans. Each
keeps its own subjects and settings. The last one can't be deleted.

## Share and export

**Copy link** puts your enabled class codes into a URL — anyone with it can
read them. Opening a link adds a new local plan without touching existing
ones.

**Export calendar** downloads everything enabled in one file:

- **iCalendar (.ics)** — weekly recurring events, works in most calendar apps.
  Recommended.
- **Google CSV** — only the next occurrence of each class, no recurrence.

## Storage

Schedules live in this browser's `localStorage` — clearing site data or
switching browsers can hide them.

Missing subject? Tanrend may not have published it yet, or the service may be
down. Try `DEMO-1` — if it works, the problem is the live data, not the app.
