# ELTE Schedule Builder

Schedule planner for ELTE students. Search courses by code, name, or professor — compare groups, spot conflicts, export to your calendar.

**[Open the planner](https://elte-schedule.jismailov.com)**

Independent student project, not affiliated with ELTE. Tanrend is the official
source — always double-check your final schedule there. Your schedules stay in
the browser's local storage; no account, no analytics.

## Run locally

```bash
npm install --global npm@11.17.0
npm ci
npm run dev
```

Open <http://localhost:5173>. Needs Node.js 24.x. `DEMO-1` to `DEMO-6` work
without live Tanrend data.

## Docs

- [User guide](docs/user-guide.md) — the full workflow
- [Contributing](.github/CONTRIBUTING.md) — setup, rules, verification
- [Support](.github/SUPPORT.md) — bugs and questions
- [Deployment](docs/deployment.md) · [Decisions](docs/decisions.md) ·
  [Changelog](CHANGELOG.md)
