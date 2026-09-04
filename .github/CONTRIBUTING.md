# Contributing 🛠️

Thanks for helping improve ELTE Schedule Builder. The application is used by
students during registration, so small, behavior-preserving changes are easier
to review and safer to release.

> [!TIP]
> A focused pull request with a regression test and exact verification commands
> is the easiest kind to review.

## Before starting

1. Search existing issues and pull requests for related work.
2. For a bug, include a minimal reproduction. Prefer `DEMO-1` through `DEMO-6`
   when the problem can be reproduced without live Tanrend data.
3. For a larger change, describe the user outcome, scope, compatibility risks,
   and acceptance criteria in the issue or pull request.
4. Read [AGENTS.md](../AGENTS.md) for the current architecture, safety boundaries,
   and verification requirements. Those rules are canonical for both human and
   automated contributors.
5. If you are continuing someone else's unfinished work, start from the
   [task handoff template](../docs/task-handoff-template.md).

## Set up the project

Use Node.js 24.15 through 24.x and npm 11.17 or newer. The `.nvmrc` pins the
Node major line, so `nvm use` selects the correct version.

```bash
npm install --global npm@11.17.0
nvm use
npm ci
npx playwright install chromium
```

Commits are kept tidy by a pre-commit hook (Husky + lint-staged) that formats
staged files with Prettier and applies ESLint autofixes before each commit. It
runs automatically after `npm ci`; you do not need to configure anything.

Start the complete development stack:

```bash
npm run dev
```

This starts the frontend on port 5173 and the API on port 3000. Use
`npm run dev:frontend` and `npm run dev:api` only when debugging the two
processes separately.

Do not add another lockfile. If dependencies change, use npm and include the
resulting `package-lock.json` update.

## Find the right place

- `src/components/` contains Svelte UI; `src/utils/` contains reusable browser
  logic.
- `server/` contains the Express API, Tanrend adapter, queue, rate limiter, and
  SQLite cache.
- `config/` contains Vite, Playwright, and shared runtime configuration.
- `tests/` mirrors those boundaries; end-to-end browser coverage lives in
  `e2e/`.
- `docs/` contains user, deployment, architecture-decision, and design-QA
  documentation. GitHub community files stay in `.github/`.

Keep conventional entry files such as `README.md`, `LICENSE`, `package.json`,
and `Dockerfile` at the repository root. Record compatibility-sensitive changes
in [docs/decisions.md](../docs/decisions.md).

## Make a change

- Keep each change focused and avoid unrelated cleanup.
- Put reusable schedule parsing, event, date, conflict, and sharing logic in
  `src/utils/` rather than duplicating it in components or tests.
- Use Svelte 5 runes and callback props as described in `AGENTS.md`.
- Preserve old `localStorage` data and `/import/<base64>` links unless the
  change includes a migration and compatibility tests.
- Treat schedule dates as local calendar dates; do not introduce UTC conversion
  through `toISOString()`.
- Preserve the Tanrend request queue, delay, and SQLite cache.
- Never commit credentials, local configuration, cache databases, `coverage/`,
  `dist/`, Playwright results, or other generated output.

## Add evidence

Add or strengthen a regression test before changing risky schedule behavior.
Tests must import production utilities rather than reproducing their
implementation.

Run focused tests while working. Before opening a pull request, run:

```bash
npm run check
npm test -- --run
npm run build
npm run test:e2e
git diff --check
```

For dependency changes, also run:

```bash
npm audit --omit=dev
```

For backend changes, verify that `/api/subject/DEMO-1` returns HTTP 200 and demo
course rows.

## Open a pull request

- Explain the user-visible outcome and why the change is needed.
- Identify compatibility or migration concerns.
- List the exact verification performed.
- Add screenshots for visible UI changes.
- Call out anything intentionally deferred.
- Keep commits reviewable; separate unrelated documentation, tooling, and
  behavior changes.
