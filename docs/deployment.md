# Releases and deployment

## Public fork on Vercel

The `unnobatroo/elte-schedule-builder` fork is live at
[elte-schedule.jismailov.com](https://elte-schedule.jismailov.com). Vercel
builds the Vite frontend; `api/subject/[query].js` is the serverless adapter
for the Express app.

The adapter keeps the shared Tanrend validation, request queue, rate limit,
demo data, and security headers. Only the cache differs: a bounded in-memory
TTL cache, since Vercel functions have no durable storage. Entries last while
an instance is warm and vanish on cold start — a speed issue, not a
correctness one. Local and container deployments keep SQLite.

Deploy from the repo root:

```bash
vercel deploy
vercel deploy --prod
```

Then check the SPA and API:

```bash
curl --fail https://elte-schedule.jismailov.com/
curl --fail https://elte-schedule.jismailov.com/api/subject/DEMO-1
```

The `/import/*` and `/tanrend` rewrites in `vercel.json` keep SPA deep links
working without swallowing `/api`. The custom domain
`elte-schedule.jismailov.com` points at Vercel.

## Upstream container releases

Releases are built from version tags — a tag like `v0.1.0` must match the
version in `package.json`. The release workflow runs the full test suite,
publishes a multi-platform image to GHCR, and creates a GitHub release.
Dokploy deploys outside GitHub Actions, so no deployment credentials live in
this repo.

## Automatic deployment triggers

Dokploy runs two environments:

- **Development — [schedule-dev.w04m1.dev](https://schedule-dev.w04m1.dev):**
  rebuilds and deploys on every push to `dev`.
- **Production — [schedule.w04m1.dev](https://schedule.w04m1.dev):** pushing to
  `main` alone doesn't deploy. A version tag runs the release workflow; once
  the new image and GitHub release are published, Dokploy deploys it.

No manual step is needed in the normal flow. Manual image selection below is
for first-time setup, recovery, and rollbacks.

Each release publishes two image tags:

- `ghcr.io/w04m1/elte-schedule-builder:0.1.0` — the release version.
- `ghcr.io/w04m1/elte-schedule-builder:sha-<full-commit-sha>` — the exact
  commit.

The GitHub release also records the image digest. Use it for a strictly
immutable deployment:

```text
ghcr.io/w04m1/elte-schedule-builder@sha256:<image-digest>
```

## Create a release

Once version and changelog changes pass CI on `main`:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Never move or reuse a release tag — cut a new version instead.

## Configure Dokploy

Set up production as an image-based deployment watching for release-workflow
images:

- Image: the digest from the GitHub release (the commit-SHA tag works as a
  fallback).
- Container port: `3000`.
- Persistent volume: mount at `/app/data`.
- Cache: leave `CACHE_DB_PATH` unset to use `/app/data/cache.db`, or set it to
  that path.
- Environment: copy only what you need from `.env.example`. The published
  image sets `NODE_ENV=production`, which enables HSTS — set it yourself when
  running the server without the container. Set `TRUST_PROXY_HOPS=1` only with
  exactly one trusted reverse proxy in front.

Public GHCR packages need no credentials; private ones need a GitHub token
with `read:packages`.

After deploying, request `/` and `/api/subject/DEMO-1`. Both should return
`Strict-Transport-Security: max-age=31536000`, and the API response should
contain `Introduction to Web Development`. That checks security mode, server,
database, and demo data without touching Tanrend.

## Roll back

Redeploy the digest (or commit-SHA tag) from the previous GitHub release in
Dokploy. Keep the SQLite cache volume mounted — it's compatible across these
releases.
