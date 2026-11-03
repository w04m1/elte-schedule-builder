# Contributing

Thanks for helping improve ELTE Schedule Builder. Real students use it during
registration, so small, behavior-preserving changes are easier to review and
safer to ship. A focused PR with a regression test and the exact commands you
ran is the easiest kind to review.

## Before starting

1. Search existing issues and PRs for related work.
2. For a bug, include a minimal reproduction — `DEMO-1` through `DEMO-6` work
   without live Tanrend data.
3. For something bigger, describe the outcome, scope, compatibility risks, and
   acceptance criteria.
4. Read [AGENTS.md](../AGENTS.md) — its architecture, safety, and verification
   rules apply to human and automated contributors alike.
5. Picking up unfinished work? Start from the
   [task handoff template](../docs/task-handoff-template.md).

## Set up

Node.js 24.15–24.x and npm 11.17+. `.nvmrc` pins the Node major — `nvm use`
gets it.

```bash
npm install --global npm@11.17.0
nvm use
npm ci
npx playwright install chromium
```

A pre-commit hook (Husky + lint-staged) formats staged files with Prettier and
applies ESLint autofixes. It installs with `npm ci` — nothing to configure.

```bash
npm run dev
```

Frontend on 5173, API on 3000. Use `dev:frontend` and `dev:api` only to debug
the processes separately. Don't add another lockfile — use npm for dependency
changes and commit the `package-lock.json` update.

## Find the right place

- `src/components/` — Svelte UI; `src/utils/` — reusable browser logic.
- `server/` — Express API, Tanrend adapter, queue, rate limiter, SQLite cache.
- `config/` — Vite, Playwright, shared runtime config.
- `tests/` — mirrors those boundaries; `e2e/` — browser coverage.
- `docs/` — user guide, deployment, decisions, design QA. Community files stay
  in `.github/`.

Keep `README.md`, `LICENSE`, `package.json`, `Dockerfile` at the root. Record
compatibility-sensitive changes in [docs/decisions.md](../docs/decisions.md).

## Make a change

- Keep it focused — no unrelated cleanup.
- Reusable schedule logic goes in `src/utils/`, not duplicated in components
  or tests.
- Svelte 5 runes and callback props, per `AGENTS.md`.
- Keep old `localStorage` data and `/import/<base64>` links working unless you
  ship a migration and compatibility tests.
- Local calendar dates — no `toISOString()` UTC conversion.
- Keep the Tanrend queue, delay, and SQLite cache.
- Never commit credentials, local config, cache databases, `coverage/`,
  `dist/`, or other generated output.

## Add evidence

Add or strengthen a regression test before touching risky schedule behavior.
Tests import production utilities — don't re-implement them.

Run focused tests while you work. Before a PR:

```bash
npm run check
npm test -- --run
npm run build
npm run test:e2e
git diff --check
```

Dependency changes: also `npm audit --omit=dev`. Backend changes: check
`/api/subject/DEMO-1` returns 200 with demo rows.

## Open a pull request

- Explain the user-visible outcome and why it's needed.
- Call out compatibility or migration concerns.
- List exactly what you ran.
- Screenshots for visible UI changes.
- Mention anything deliberately deferred.
- Keep commits reviewable — separate unrelated docs, tooling, and behavior
  changes.
