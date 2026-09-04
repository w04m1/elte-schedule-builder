# Architecture decisions

This document records the reasons behind the project's compatibility-sensitive
choices. Change these decisions only with explicit migration and regression
coverage.

## Local calendar dates

**Decision:** Treat schedule dates and calendar export dates as local
calendar dates. Construct them from local year, month, and day values and do not
round-trip them through `Date.prototype.toISOString()`.

**Why:** A class belongs to a Budapest calendar day and wall-clock time, not a
UTC instant. UTC conversion can shift the displayed day for contributors and
users in different time zones.

**Alternative considered:** Normalize dates to UTC. This is useful for absolute
timestamps but does not match the schedule's calendar-date semantics.

**Consequence:** Date utilities and export behavior need tests around week and
year boundaries in the local timezone.

## Full-calendar export packs

**Decision:** Export every enabled meeting in one file. Use recurring iCalendar
as the primary cross-platform format and offer Google's documented CSV format
as a complete, non-recurring alternative.

**Why:** A timetable is imported as a unit. Per-event browser pop-ups made users
repeat the same operation and could leave a calendar partially imported.

**Consequence:** iCalendar is the recommended format because it preserves weekly
recurrence. The export dialog must explain that CSV contains only each meeting's
next occurrence.

## Stable shared-schedule URLs

**Decision:** Preserve the `/import/<base64>` format and continue decoding links
created by older versions.

**Why:** Shared links may remain in messages or bookmarks after the application
changes. Breaking the decoder silently loses the value of those links.

**Alternative considered:** Replace the payload whenever the schedule model
changes. A new format may be introduced only with versioning or a compatibility
decoder.

**Consequence:** The payload contains enabled class codes and the lecture-
exemption setting, not the complete internal schedule. Base64 is transport
encoding, not encryption; anyone with the URL can read it.

## Browser storage migration

**Decision:** Store named schedules under the current schedule-store key while
retaining the legacy `savedSubjects` and `lectureExemption` migration path.

**Why:** Existing users can return after an update with older `localStorage`.
Discarding or misreading it would erase their saved schedule without warning.

**Alternative considered:** Clear or replace incompatible browser state. That
would simplify loading but is unacceptable without an explicit user-facing
migration policy.

**Consequence:** New fields must have safe defaults, storage keys remain stable,
and migrations require tests using old saved objects.

## Tanrend proxy, throttling, and cache

**Decision:** Send subject requests through the Express backend, serialize
upstream work with a delay, coalesce matching requests, and cache responses in
SQLite with bounded resource use.

**Why:** The browser should not depend directly on Tanrend's cross-origin
behavior. Caching and throttling reduce repeated upstream traffic, while request
and cache limits protect this service from unbounded work.

**Alternative considered:** Fetch Tanrend directly or issue upstream requests in
parallel. Both are simpler locally but make the application less reliable and
can place unnecessary load on the upstream service.

**Consequence:** Refactors must preserve queueing and cache behavior. Integration
tests use an injected upstream function and temporary or in-memory SQLite rather
than the live Tanrend service. The browser and API remain same-origin in
production, while Vite proxies `/api` during development; the backend therefore
does not expose a permissive cross-origin API.

## Deployment-specific cache adapters

**Decision:** Keep one Express application and inject a cache store at its
composition boundary. Local and container deployments use the SQLite adapter;
Vercel functions use a bounded in-memory TTL adapter.

**Why:** Vercel function filesystems are ephemeral, and the native SQLite build
is not a portable serverless contract. The cache is an optimization rather than
the source of schedule truth, so a warm-instance cache preserves correctness
without adding an external database service.

**Alternative considered:** Proxy the fork to another deployment's API or add a
managed cache dependency. The former makes this deployment depend on another
owner; the latter adds credentials, cost, and operational work that current
traffic does not justify.

**Consequence:** Cold starts begin with an empty cache and rate limiting remains
per function instance. The Tanrend queue, validation, and API response contract
are shared across environments. A managed cache can replace the in-memory
adapter later without changing the browser or Tanrend service.

## Deterministic DEMO subjects

**Decision:** Serve `DEMO-1` through `DEMO-6` locally without calling Tanrend.

**Why:** Contributors and users need a reproducible way to exercise searching,
selection, persistence, conflicts, and browser flows when live data is missing
or the upstream service is unavailable.

**Alternative considered:** Mock every layer independently. Unit mocks remain
useful, but they do not prove the assembled frontend and backend flow.

**Consequence:** DEMO responses are part of the development and testing contract.
The browser happy path and backend smoke checks should remain independent of the
network.

## Unified Tanrend search

**Decision:** Use one course-search field that automatically checks Tanrend by
both code (`m=keres_kod_azon`) and name (`m=keresnevre`), then merges distinct
matches by normalized subject and class identity.

**Why:** Students should not need to know whether a remembered value is a code
or a title before searching. One query should expose either kind of match.

**Alternative considered:** Keep the explicit mode selector. It reduced upstream
requests but added a decision before the primary task and hid valid matches from
the other mode.

**Consequence:** The proxy still validates, queues, and caches each mode as a
distinct request. The client suppresses invalid code-shaped requests, combines
both responses, and removes duplicate classes before display.

## Ranked subject autocomplete

**Decision:** After two typed characters, debounce the existing combined
Tanrend search and present at most three ranked subject suggestions. Exact code
and title matches rank first, followed by code prefixes, title prefixes, word
prefixes, and substring matches. The first option is active by default; arrow
keys move the active option, Escape closes the popup, and Enter opens the active
subject's class results.

**Why:** Students can reach a likely subject without submitting a broad search
and scanning a long result list. Opening the subject rather than adding it keeps
class and group consequences visible before the timetable changes.

**Consequence:** The input follows the ARIA combobox/listbox pattern and limits
network churn with a 300 ms delay. Explicit searches and Neptun/shared imports
retain their existing behavior.

## Compact planner control hierarchy

**Decision:** Keep the page in three visible zones: schedule management, a
two-pane course workspace, and the timetable. Course search and selected
subjects share the upper workspace. The timetable heading owns its legend,
lecture-conflict option, schedule suggestions, export, and sharing controls.

**Why:** Each action should sit beside the object it changes. Separate full-width
rows for one button or one setting made the page taller and obscured the order of
work: choose subjects, refine the timetable, then export or share it.

**Consequence:** Wide screens keep search and selection visible side by side,
then give the calendar the full page width. Narrow screens preserve the same DOM
order, stack the workspace and actions, and replace the dense time grid with a
day-grouped agenda.

## Semantic accessible color system

**Decision:** Define light and dark palettes through shared semantic tokens.
Green represents create/add actions, blue represents import/export/share,
amber represents suggestions and caution, red represents destructive actions,
and neutral controls cover editing, cancellation, help, and dismissal.

**Why:** Colors should communicate action category without replacing the text or
icon label. Foreground status colors and solid button colors need separate
tokens because the same red, amber, or blue cannot remain readable both as text
on a surface and as a filled control in dark mode.

**Alternative considered:** Keep one value per hue and adjust opacity by theme.
That produced weak dark-theme status text and inconsistent control boundaries.

**Consequence:** Normal text and filled-control combinations must retain at
least 4.5:1 contrast in both themes, and interactive control borders must retain
at least 3:1 against their surface. `tests/utils/theme.test.js` enforces these ratios.

## Dependency install scripts

**Decision:** Use npm's strict install-script policy and approve only the locked
`esbuild` and `sqlite3` versions. Explicitly deny the optional `fsevents`
installers, and pin the policy-capable npm version in local metadata, CI, and
Docker.

**Why:** `esbuild` needs its postinstall script to provision and validate the
platform-specific executable used by Vite. `sqlite3` needs its install script to
load a prebuilt native N-API binding or compile one when no compatible binary is
available. Allowing every transitive dependency script would grant more install-
time execution than the application requires. The macOS-only `fsevents`
packages are optional watcher accelerators, so the application can use its
portable fallback without running their native installers.

**Alternative considered:** Disable all lifecycle scripts. That prevents both
required native tools from installing correctly. Leaving npm's policy in warning
mode would allow newly introduced scripts without review.

**Consequence:** Dependency updates that change either approved version, or add
another install script, make `npm ci` fail. Review the new script and then run
`npm approve-scripts <package>` to record a version-pinned approval. CI and
Docker must continue using the npm version declared in `package.json`.

## Professor and typo-tolerant name search

**Decision:** Use Tanrend's `keres_okt` tutor-name mode alongside subject code
and course-name searches. When both human-name modes return nothing, issue one
bounded prefix lookup and retain only course titles or professor names within a
small edit distance of the original query. Never apply this fallback to
code-like input.

**Why:** Tanrend can return every course taught by a professor, but its normal
name lookup does not recover spelling errors. A bounded fallback supplies a
small candidate set without downloading or maintaining a parallel course
catalog, and exact code behavior stays predictable.

**Alternative considered:** Fuzzy-match only the rows returned by the original
misspelled query. Tanrend returns no candidates for many spelling errors, so
there would be nothing to rank. Querying many generated spelling variants would
also amplify traffic and queue latency.

**Consequence:** Course and professor searches tolerate a small number of
insertions, deletions, or substitutions. The fallback can only recover names
whose selected prefix still reaches a candidate in Tanrend, and all upstream
requests continue through the existing throttle and mode-specific cache.

## Direct class-row selection

**Decision:** Make each Tanrend class row a native button instead of placing a
separate action button inside the row. Reserve the same desktop columns for
time, code, room, professor, and status on every row. Selected rows use the
success treatment, predicted conflicts use the danger treatment, and both
states include text and icons as well as color.

**Why:** The row itself is the target students are scanning. A second “Choose
class” control duplicated that target and made dense result lists harder to use
with a mouse, touch, or keyboard. Reserving the status column prevents selected
or conflicting rows from shifting the other details horizontally.

**Consequence:** Rows activate with click, Enter, or Space and expose
`aria-pressed`. Selecting a row keeps the results open. Course titles have the
strongest hierarchy in each result card, while codes remain secondary.

## Stable class identity

**Decision:** Identify a Tanrend class by code, weekday, start time, end time,
its real stored type (`extendedProps.type`), room, and instructor. Use a
same-slot fallback during refresh only when it matches exactly one existing
event. New share links carry these exact event identities in a versioned
payload; the decoder continues to accept every legacy code-only payload.

**Why:** Calendar events keep their type in `extendedProps`, so comparing the
unused top-level `type` field made a lecture and practice at the same time look
identical. Tanrend can also return two rows with the same code, type, weekday,
time, and room but different instructors. Code-only or time-only matching made
both rows appear selected and also collapsed them in schedule suggestions.

**Consequence:** Lecture and non-lecture choices remain independent even when
they share a weekday and time, and duplicate-code instructor variants remain
separate choices. Exact identities drive selection, suggestions, visible row
state, and new share links. The guarded refresh fallback preserves older saved
choices if Tanrend changes one unambiguous row. Loading a schedule repairs the
old invalid state where two variants of the same exact subject slot were both
enabled.

## English and Hungarian interface

**Decision:** Keep a dependency-free English/Hungarian message catalog in
`src/utils/i18n.js`. On first load, choose Hungarian only when the device's
primary language starts with `hu`; otherwise choose English. Persist an explicit
header selection, update the document language, and recreate Schedule-X when
the language changes so its dates and controls use the same locale.

**Why:** The planner needs only two languages, so a small explicit catalog is
easier for student contributors to review than a localization framework. Using
the primary device language follows the requested behavior without guessing
from location or secondary browser languages.

**Consequence:** Application controls, feedback, dialogs, Help, calendar labels,
agenda text, and accessible names switch together. Course titles, professor
names, codes, rooms, and existing user-named schedules remain unchanged because
they are source or user data. Future interface copy must add both English and
Hungarian entries and corresponding tests.

## Unified local startup

**Decision:** Make `npm run dev` start the Express API and Vite frontend in one
process, and make `npm run preview` build and serve the complete application
through Express. Keep `dev:frontend` and `dev:api` only for contributors who
intentionally need separate processes. When no explicit proxy URL is supplied,
derive Vite's API target from `PORT`.

**Why:** Running Vite alone leaves the interface available while every Tanrend
request fails with a proxy 502, which looks like a broken search feature. A
single default command makes the frontend/API dependency explicit and keeps
custom local ports aligned automatically.

**Consequence:** The normal development and preview commands always include the
API. Docker Compose still uses separate containers, so it calls
`dev:frontend` explicitly and waits for the backend's local demo health check
before starting the frontend.

## Fixed recurring week

**Decision:** Expose one Monday-Friday week grid with no date navigation or
alternate day view. Keep the 08:00-21:00 boundary labels visible and use the
existing day-grouped agenda instead of the grid on phones.

**Why:** ELTE classes repeat by weekday. Moving Schedule-X to another calendar
week produces an empty grid because events are intentionally projected onto one
representative week, while a day-view selector duplicates the mobile agenda and
suggests unsupported date-specific behavior.

**Consequence:** The desktop calendar is a stable weekly timetable rather than
a date browser. Export continues to calculate real future recurring dates
separately, and mobile users retain the complete chronological class list.

## Schedule suggestion ranking

**Decision:** Build one choice variable for each enabled subject's lecture and
practice section, treating every non-lecture Tanrend label as a practice. Rank
complete combinations by conflict count first and replacement count second.
Continue the bounded search after finding conflict-free combinations, pruning
only when a branch cannot improve either score.

**Why:** Stopping after the first five conflict-free combinations made results
depend on Tanrend row order and could hide a later one-replacement solution
behind several three-replacement solutions. Separate variables for labels such
as classroom reservations also selected more than one practice. Exact duplicate
rows inflated conflict counts, while multiple enabled groups could be silently
removed despite being described as no replacement.

**Consequence:** Suggestions now follow the same lecture/practice model as the
class picker, collapse exact duplicate meetings for evaluation, and describe
every enabled group that applying an option will replace. The existing node cap
still bounds work for unusually large imported schedules. Conflict scoring also
includes overlaps among distinct meetings inside one selected group, so the
number shown before applying an option matches the resulting timetable. The UI
omits the unchanged timetable and equally conflicting alternatives; if no
available swap improves the current score, it explains that directly.

## Neptun import group selection

**Decision:** Treat a Neptun Registered subjects workbook as a subject list,
not a source of exact class selections. Keep every Tanrend class returned for
those subjects, but initially enable only the first deterministic course group
in each normalized subject's lecture and practice sections. Preserve an existing
selection when the same subject is imported again.

**Why:** The workbook contains base subject codes but no registered course-group
identities. Enabling every Tanrend result placed all alternatives on the calendar
at once—31 meetings for a real 10-code workbook—and created dense stacks of
false-choice conflicts. Discarding alternatives would prevent later group
editing and schedule suggestions.

**Consequence:** Imports produce an immediately readable draft while retaining
all alternatives in the selected-subject editor. Exact duplicate Tanrend rows
are enabled once, multi-meeting variants stay together, and subject visibility
changes no longer erase or re-enable class choices.
