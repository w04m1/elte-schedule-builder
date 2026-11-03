# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Full-timetable iCalendar and Google Calendar CSV downloads generated locally
  as one pack instead of separate per-class calendar links.
- English and Hungarian interface localization with device-language defaults.
- Universal course, code, and professor search with ranked autocomplete and
  typo-tolerant human-name matching.
- Responsive schedule suggestions, direct class-row selection, and compact
  event details for the weekly timetable.
- Contributor templates, repository guidance, and regression coverage grouped
  by application boundary.

### Changed

- Reworked the planner into a responsive two-pane workspace and full-width
  timetable with accessible light and dark semantic color systems.
- Grouped lectures before practices, sorted classes by weekday and time, and
  made same-type selection mutually exclusive using stable class identities.
- Organized application, server, configuration, deployment, test, and
  documentation files by responsibility.
- Made local startup include both the frontend and API and kept the backend
  same-origin instead of exposing permissive cross-origin responses.

### Fixed

- Prevented lecture/practice and duplicate-code instructor variants from
  appearing falsely selected.
- Prevented intermediate and mobile layouts from overlapping, shifting search
  actions, or switching away from the intended calendar presentation.
- Restored reproducible Docker installs by retaining `package-lock.json` in the
  build context.

## [1.0.3] - 2026-08-30

### Added

- Group numbers in the subject event dropdown, presented in aligned group,
  type, day, and time columns with responsive overflow handling.
- Legacy-compatible group parsing for older saved events that only contain the
  full subject code in their description.

### Changed

- Updated compatible Preact, Schedule-X plugin, Svelte, Vite, Vitest, ESLint,
  and GitHub Actions dependencies.

## [1.0.2] - 2026-08-28

### Changed

- Updated the footer Telegram contact link to a stable redirect.

## [1.0.1] - 2026-08-25

### Added

- Restored production analytics, session recording, and heatmap collection.

### Security

- Allowed the analytics service's exact HTTPS origin for script loading and
  event reporting while retaining the remaining Content Security Policy.

## [1.0.0] - 2026-08-06

### Added

- Regression coverage for Tanrend queue timing, schedule sharing, lecture
  exemption, export, schedule management, and blocked calendar popups.
- A reusable contributor and agent handoff template with acceptance criteria,
  verification evidence, deferred risks, and resume steps.

### Changed

- Split header, footer, sharing, and export coordination out of `App.svelte`.
- Normalized repository text files to LF for consistent Windows and Linux
  formatting checks.
- Adopted Node.js 24 LTS as the supported production and development runtime.
- Upgraded the Vite, Vitest, ESLint, Schedule-X events service, and GitHub
  Actions toolchains for the first stable release.

### Security

- Enabled production HSTS and documented deployment verification for the app
  and DEMO API.
- Confined static responses to the resolved production build directory and
  rejected dotfile, file-like, API-like, and encoded traversal fallback paths.
- Restricted dependency install scripts to reviewed, version-pinned packages
  and aligned npm policy across local development, CI, and Docker.
- Protected `main` with required pull requests and CI checks, and enabled
  private vulnerability reporting plus Dependabot vulnerability alerts and
  security updates.

## [0.1.0] - 2026-08-05

### Added

- Schedule planning from Tanrend subject data with conflict detection, multiple
  saved schedules, share links, and Google Calendar export.
- Deterministic demo subjects, automated tests, browser tests, and CI checks.
- Request throttling, SQLite caching, server safeguards, and security headers.
- Automated dependency update checks and production-container smoke testing.

### Changed

- Upgraded the application to Express 5, Marked 18, and Schedule-X 3.
- Pinned the production Node.js container image by digest for reproducible builds.

[Unreleased]: https://github.com/w04m1/elte-schedule-builder/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/w04m1/elte-schedule-builder/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/w04m1/elte-schedule-builder/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/w04m1/elte-schedule-builder/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/w04m1/elte-schedule-builder/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/w04m1/elte-schedule-builder/releases/tag/v0.1.0
