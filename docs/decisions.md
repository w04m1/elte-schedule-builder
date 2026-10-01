# Architecture decisions

Why the compatibility-sensitive choices are what they are. Change them only
with an explicit migration and regression coverage.

## Local calendar dates

**Decision:** Treat schedule and export dates as local calendar dates, built
from local year, month, and day — never round-tripped through
`Date.prototype.toISOString()`.

**Why:** A class belongs to a Budapest day and wall-clock time, not a UTC
instant. UTC conversion can shift the displayed day in other time zones.

**Alternative considered:** Normalize to UTC. Fine for absolute timestamps,
wrong for calendar-date semantics.

**Consequence:** Date utilities and export need tests around local week and
year boundaries.

## Full-calendar export packs

**Decision:** Export every enabled meeting in one file — recurring iCalendar
as the primary format, Google's CSV as a complete non-recurring alternative.

**Why:** A timetable is imported as a unit. Per-event pop-ups made users repeat
the same step and could leave a calendar half imported.

**Consequence:** iCalendar is recommended because it keeps weekly recurrence.
The export dialog must say that CSV holds only each meeting's next occurrence.

## Stable shared-schedule URLs

**Decision:** Keep the `/import/<base64>` format and keep decoding links from
older versions.

**Why:** Shared links sit in messages and bookmarks long after the app changes.
Breaking the decoder silently breaks them.

**Alternative considered:** Replace the payload when the schedule model
changes — allowed only with versioning or a compatibility decoder.

**Consequence:** The payload holds enabled class codes and the
lecture-exemption setting, not the whole schedule. Base64 is encoding, not
encryption — anyone with the URL can read it.

## Browser storage migration

**Decision:** Store named schedules under the current key while keeping the
legacy `savedSubjects` and `lectureExemption` migration path.

**Why:** Users can return after an update with old `localStorage` data;
misreading it would wipe their saved schedule without warning.

**Alternative considered:** Clear incompatible state. Simpler, but
unacceptable without a user-facing migration policy.

**Consequence:** New fields need safe defaults, storage keys stay stable, and
migrations need tests built on old saved objects.

## Tanrend proxy, throttling, and cache

**Decision:** Send subject requests through the Express backend, serialize
upstream work with a delay, merge matching requests, and cache in SQLite with
bounded resource use.

**Why:** The browser shouldn't depend on Tanrend's cross-origin behavior.
Caching and throttling cut repeat traffic; request and cache limits keep the
service from doing unbounded work.

**Alternative considered:** Fetch Tanrend directly or fire parallel upstream
requests — simpler, but less reliable and harder on the upstream service.

**Consequence:** Refactors must preserve queueing and caching. Integration
tests use an injected upstream and in-memory SQLite, never live Tanrend. The
browser and API stay same-origin in production (Vite proxies `/api` in dev),
so the backend needs no permissive CORS.

## Deployment-specific cache adapters

**Decision:** One Express app, with a cache store injected at the composition
boundary — SQLite locally and in containers, bounded in-memory TTL on Vercel.

**Why:** Vercel filesystems are ephemeral and native SQLite isn't a portable
serverless contract. The cache is an optimization, not the source of truth, so
a warm-instance cache keeps correctness without an external database.

**Alternative considered:** Proxy to another deployment's API (adds an outside
dependency) or a managed cache (adds credentials, cost, and ops work the
traffic doesn't justify).

**Consequence:** Cold starts have an empty cache; rate limiting is per
instance. Queue, validation, and API contract are shared everywhere. A managed
cache can replace the adapter later without touching the browser or Tanrend.

## Deterministic DEMO subjects

**Decision:** Serve `DEMO-1` through `DEMO-6` locally without calling Tanrend.

**Why:** Contributors and users need a reproducible way to exercise search,
selection, persistence, conflicts, and browser flows when live data is missing
or Tanrend is down.

**Alternative considered:** Mock each layer independently — useful, but can't
prove the assembled flow.

**Consequence:** DEMO responses are part of the dev/test contract. Browser and
backend smoke checks stay offline.

## Unified Tanrend search

**Decision:** One search field checks Tanrend by code (`m=keres_kod_azon`) and
name (`m=keresnevre`), then merges distinct matches by normalized subject and
class identity.

**Why:** Students shouldn't have to know whether what they remember is a code
or a title. One query surfaces both.

**Alternative considered:** An explicit mode selector — fewer upstream
requests, but an extra decision up front and hidden matches from the other
mode.

**Consequence:** The proxy still validates, queues, and caches each mode
separately. The client drops invalid code-shaped requests, combines responses,
and deduplicates before display.

## Ranked subject autocomplete

**Decision:** After two characters, debounce the combined search and show at
most three ranked suggestions: exact code/title matches first, then prefixes,
then substrings. First option is active; arrows move it, Escape closes, Enter
opens that subject's classes.

**Why:** Students reach a likely subject without a broad search and a long
result list. Opening the subject rather than adding it keeps the class
consequences visible.

**Consequence:** The input follows the ARIA combobox/listbox pattern with a
300 ms debounce. Explicit searches and imports behave as before.

## Compact planner control hierarchy

**Decision:** Three visible zones: schedule management, a two-pane course
workspace, and the timetable. The timetable heading owns the legend,
lecture-conflict option, suggestions, export, and sharing controls.

**Why:** Each action sits next to what it changes. Full-width rows for single
controls made the page taller and hid the order of work: pick subjects, refine,
then export or share.

**Consequence:** Wide screens show search and selection side by side with the
calendar full-width below. Narrow screens keep the same DOM order, stack
everything, and swap the grid for the agenda.

## Semantic accessible color system

**Decision:** Light and dark palettes via shared semantic tokens — green for
create/add, blue for import/export/share, amber for suggestions, red for
destructive, neutral for editing/cancel/help.

**Why:** Color communicates the action category without replacing labels.
Status text and filled controls need separate tokens — the same hue can't stay
readable as both text and a filled button in dark mode.

**Alternative considered:** One value per hue with theme-adjusted opacity —
produced weak dark-mode text and inconsistent borders.

**Consequence:** Text and filled-control combos must keep ≥4.5:1 contrast in
both themes; control borders ≥3:1. `tests/utils/theme.test.js` enforces it.

## Dependency install scripts

**Decision:** npm's strict install-script policy, approving only the locked
`esbuild` and `sqlite3` versions, explicitly denying optional `fsevents`, and
pinning the policy-capable npm version in metadata, CI, and Docker.

**Why:** `esbuild` needs postinstall to provision its platform binary;
`sqlite3` needs its script for the prebuilt or compiled N-API binding.
Allowing every transitive script grants more install-time execution than
needed. `fsevents` is a macOS-only optional watcher — the portable fallback
works without it.

**Alternative considered:** Disable all lifecycle scripts (breaks the two
required native tools) or warning mode (lets new scripts in unreviewed).

**Consequence:** Updates that change an approved version or add a script make
`npm ci` fail. Review, then `npm approve-scripts <package>` to approve.
CI/Docker keep using the pinned npm version.

## Professor and typo-tolerant name search

**Decision:** Tanrend's `keres_okt` tutor-name mode runs alongside code and
name searches. When both name modes return nothing, run one bounded prefix
lookup and keep titles or professor names within a small edit distance. Never
apply the fallback to code-like input.

**Why:** Tanrend returns every course a professor teaches, but its name lookup
doesn't recover typos. A bounded fallback gives a small candidate set without
a parallel course catalog, and code behavior stays exact.

**Alternative considered:** Fuzzy-match only the misspelled query's rows —
often nothing to rank. Generating many spelling variants would multiply
traffic and queue latency.

**Consequence:** Name searches tolerate small typos. The fallback only recovers
names whose prefix still reaches a Tanrend candidate. All upstream requests
keep the existing throttle and per-mode cache.

## Direct class-row selection

**Decision:** Each Tanrend class row is a native button — no nested action
button. Desktop rows reserve the same columns for time, code, room, professor,
and status. Selected uses the success treatment, conflicts use danger, and
both carry text and icons.

**Why:** The row itself is the target students scan. A second "Choose class"
control duplicated it and crowded dense lists. A reserved status column stops
rows shifting sideways when selected.

**Consequence:** Rows activate with click, Enter, or Space and expose
`aria-pressed`. Selecting keeps results open. Course titles get the strongest
hierarchy; codes stay secondary.

## Stable class identity

**Decision:** A class is identified by code, weekday, start/end time, real
stored type (`extendedProps.type`), room, and instructor. A same-slot refresh
fallback applies only when it matches exactly one existing event. New share
links carry exact identities in a versioned payload; the decoder still accepts
legacy code-only payloads.

**Why:** Type lives in `extendedProps`, so the unused top-level `type` made a
same-time lecture and practice look identical. Tanrend can also return two
rows identical except for instructor — code-only matching made both look
selected and collapsed them in suggestions.

**Consequence:** Lecture and non-lecture choices stay independent at the same
time; instructor variants stay separate. Exact identities drive selection,
suggestions, row state, and new share links. The guarded fallback preserves
old saved choices when Tanrend changes one unambiguous row. Loading repairs
the old state where two variants of one slot were both enabled.

## English and Hungarian interface

**Decision:** A dependency-free en/hu catalog in `src/utils/i18n.js`. First
load picks Hungarian only when the device's primary language starts with `hu`.
An explicit header choice persists, updates `html[lang]`, and recreates
Schedule-X so its dates and controls match.

**Why:** Two languages don't justify a localization framework — a small
catalog is easier for student contributors to review. Primary device language
avoids guessing from location or secondary languages.

**Consequence:** Controls, dialogs, Help, calendar labels, agenda text, and
accessible names switch together. Course titles, names, codes, rooms, and
user-named schedules stay untouched — they're data. New copy needs both
languages plus tests.

## Unified local startup

**Decision:** `npm run dev` starts Express and Vite in one process; `npm run
preview` builds and serves everything through Express. `dev:frontend` and
`dev:api` exist only for deliberate separate debugging. Vite's API target
derives from `PORT` when no proxy URL is set.

**Why:** Vite alone leaves the UI up while every Tanrend call fails with a
proxy 502 — looks like broken search. One command makes the dependency
explicit and keeps custom ports aligned.

**Consequence:** Dev and preview always include the API. Docker Compose uses
separate containers, so it calls `dev:frontend` and waits for the backend's
demo health check first.

## Fixed recurring week

**Decision:** One Monday–Friday grid, 08:00–21:00 labels visible, no date
navigation or day view. Phones get the day-grouped agenda instead.

**Why:** ELTE classes repeat by weekday. Events are projected onto one
representative week, so another calendar week shows an empty grid. A day view
would duplicate the mobile agenda and imply unsupported date behavior.

**Consequence:** The desktop calendar is a stable weekly timetable, not a date
browser. Export still computes real recurring dates; mobile keeps the full
chronological list.

## Schedule suggestion ranking

**Decision:** One choice variable per enabled subject's lecture and practice
section (every non-lecture label counts as practice). Rank complete
combinations by conflict count, then replacement count. Keep searching past
conflict-free combos, pruning only when a branch can't improve either score.

**Why:** Stopping at the first five conflict-free combos made results depend on
Tanrend row order and could hide a one-replacement solution behind
three-replacement ones. Separate variables for labels like room reservations
selected extra practices. Duplicate rows inflated conflict counts; enabled
groups could be silently dropped while described as no replacement.

**Consequence:** Suggestions share the class picker's lecture/practice model,
collapse exact duplicates, and name every group an option would replace. The
node cap still bounds huge imports. Scoring counts overlaps within a selected
group too, so the shown count matches the result. The UI omits the unchanged
timetable and equally conflicting swaps — if nothing improves, it says so.

## Neptun import group selection

**Decision:** A Neptun Registered subjects workbook is a subject list, not
exact class selections. Keep every Tanrend class for those subjects but enable
only the first deterministic group per lecture/practice section. Re-imports
preserve an existing selection.

**Why:** The workbook has base codes, no group identities. Enabling everything
dumped all alternatives on the calendar at once — 31 meetings for a real
10-code file — and created walls of false conflicts. Dropping alternatives
would block later group editing and suggestions.

**Consequence:** Imports give a readable draft with all alternatives still in
the editor. Exact duplicates enable once, multi-meeting variants stay
together, and toggling subject visibility no longer erases class choices.
