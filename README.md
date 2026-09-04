# ELTE Schedule Builder 🎓

A small schedule planner for ELTE students. Search by subject code, course name, or professor, compare groups, spot conflicts, hide classes you do not want, and export the complete timetable to a calendar app.

[Open the planner](https://schedule.jalols.page) · [Read the user guide](docs/user-guide.md) · [Get help](.github/SUPPORT.md) · [Contribute](.github/CONTRIBUTING.md)

The useful bit is that you can plan ahead. Tanrend exposes the underlying course data through an endpoint before it shows that data in its regular frontend. This project uses that endpoint to make upcoming schedule information available earlier and in a much nicer format.

Requests go through a tiny Express API with a SQLite cache. Your schedule stays in your browser's local storage.

> [!IMPORTANT]
> This is an independent student project. It is not affiliated with, endorsed
> by, or operated by Eötvös Loránd University (ELTE). Tanrend remains the
> authoritative source for course information.

## Use the planner

Search Tanrend directly in the one-page planner by subject code, course name,
or professor, then add a specific class, all available groups, or a Neptun
subject export. Use `DEMO-1` through `DEMO-6` to try the complete workflow
without depending on live Tanrend results.

The planner can compare groups, mark overlapping classes, hide individual
events, keep multiple local schedules, create share links, and download the
complete visible timetable as an iCalendar or Google Calendar CSV pack. See the
[user guide](docs/user-guide.md) for the full workflow and limitations.

The interface is available in English and Hungarian. On the first visit it
uses Hungarian only when Hungarian is the device's primary language; otherwise
it starts in English. The language selector in the header saves an explicit
choice in this browser.

## Status and support

The application is actively maintained on a best-effort basis and is used by
students during registration. Course data can be incomplete or stale, so always
verify the final schedule in official ELTE systems.

Use [SUPPORT.md](.github/SUPPORT.md) for help, bug reports, and feature requests.
Report security concerns privately through
[SECURITY.md](.github/SECURITY.md), not through a public issue.

## Data and privacy

Saved schedules remain in your browser's local storage instead of being synced
to an account. The application does not include analytics or session recording.

- No account is required.
- Subject-code and subject-name searches are sent to this application's Express
  API, which requests Tanrend and keeps a bounded response cache.
- Schedules and interface preferences are stored in the browser's
  `localStorage` and are not synchronized between devices.
- Share links contain the enabled class codes and lecture-exemption setting.
  Anyone with a link can read that information.
- Calendar exports are generated locally. A calendar provider receives the
  event details only when the downloaded file is imported there.

## Run it locally

You need Node.js 24.15 through 24.x and npm 11.17 or newer. The supported npm
version is pinned in `package.json` because installs enforce an explicit
dependency-script policy.

```bash
npm install --global npm@11.17.0
npm ci
npm run dev
```

Open <http://localhost:5173>. The development command starts both the frontend
and API, and Vite proxies `/api` requests to the API on port 3000. Stop both
servers together with <kbd>Ctrl</kbd>+<kbd>C</kbd>.

Optional local configuration lives in `.env`. Copy `.env.example` and adjust the
documented ports, proxy target, cache path, and backend safeguards as needed.
Invalid port or proxy URL values stop startup with a clear error.
Set `DEBUG_SERVER=true` when you need verbose request, queue, and cache logs.

Want Docker instead?

```bash
docker compose -f deploy/compose.dev.yml up --build
```

Production images and the Dokploy release procedure are documented in
[docs/deployment.md](docs/deployment.md). Published changes are listed in the
[changelog](CHANGELOG.md).

The public fork is deployed to Vercel at
[schedule.jalols.page](https://schedule.jalols.page). Vercel serves the Vite
frontend and runs the same Express API through a thin adapter. Warm function
instances use a bounded in-memory cache; local and container deployments keep
the persistent SQLite cache.

## Useful commands

```bash
npm run check          # verify formatting and lint rules
npm test -- --run      # run the test suite once
npm run test:coverage  # run tests and enforce coverage thresholds
npm run test:e2e       # run the browser happy path
npm run build          # create a production build
npm run preview        # build and preview the complete app, including search
npm start              # serve the API and built frontend
```

The browser happy-path test uses Chromium. Install it once, then run the test:

```bash
npx playwright install chromium
npm run test:e2e
```

The E2E command builds the production frontend, starts the Express server with
an in-memory SQLite cache, and exercises only the local `DEMO-*` data.

## How it is put together

| Part     | Technology                 |
| -------- | -------------------------- |
| Frontend | Svelte 5 and Vite          |
| Calendar | Schedule-X                 |
| API      | Express                    |
| Cache    | SQLite                     |
| Tests    | Vitest and Testing Library |

The repository is grouped by responsibility:

- `src/` contains the single-page frontend, with UI in `components/` and shared
  logic in `utils/`.
- `server/` contains the Express API, Tanrend integration, queue, cache, and
  security middleware.
- `config/` contains frontend and test-runner configuration; `deploy/` contains
  local deployment definitions.
- `tests/` mirrors the application boundaries through `components/`, `utils/`,
  `server/`, `integration/`, and `config/`; browser tests live in `e2e/`.
- `docs/` contains project documentation, while GitHub community and support
  files live in `.github/`.

The compatibility-sensitive design choices are recorded in
[docs/decisions.md](docs/decisions.md), and the latest visual verification is in
[docs/design-qa.md](docs/design-qa.md).

Contributions are welcome. Please read
[CONTRIBUTING.md](.github/CONTRIBUTING.md) and keep behavior changes covered by
tests—the app is used by real students during registration. Participation is
governed by the
[Code of Conduct](.github/CODE_OF_CONDUCT.md).

Using a coding agent? Start it from the repository root so it picks up
[AGENTS.md](AGENTS.md), which contains the architecture notes, safety rules, and
verification commands for this project. Use the
[task handoff template](docs/task-handoff-template.md) when work will continue in
another session or with another contributor.
