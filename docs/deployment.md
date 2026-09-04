# Releases and deployment

## Public fork on Vercel

The `unnobatroo/elte-schedule-builder` fork is published at
[schedule.jalols.page](https://schedule.jalols.page). Vercel builds the Vite
frontend and exposes `api/subject/[query].js` as the serverless adapter for the
existing Express application.

The adapter preserves the shared Tanrend validation, request queue, rate limit,
demo data, and security headers. It substitutes a bounded in-memory TTL cache
because Vercel function instances do not provide durable local storage. Cache
entries survive while an instance stays warm and disappear on a cold start;
this affects performance, not schedule correctness. Local and container
deployments continue to use SQLite.

Deploy from the repository root:

```bash
vercel deploy
vercel deploy --prod
```

Verify both the SPA and API after deployment:

```bash
curl --fail https://schedule.jalols.page/
curl --fail https://schedule.jalols.page/api/subject/DEMO-1
```

The `/import/*` and `/tanrend` rewrites in `vercel.json` preserve SPA deep links
without intercepting the `/api` function route. The custom domain uses an `A`
record for `schedule.jalols.page` pointing to Vercel.

## Upstream container releases

Production releases are built from version tags. A tag such as `v0.1.0` must
match the version in `package.json`. The release workflow runs the complete test
suite, publishes a multi-platform container to GitHub Container Registry
(GHCR), and creates a GitHub release. Dokploy instance handles deployment outside GitHub
Actions, so application deployment credentials do not need to be stored in this
repository.

## Automatic deployment triggers

Dokploy maintains two independently triggered environments:

- **Development — [schedule-dev.w04m1.dev](https://schedule-dev.w04m1.dev):**
  Dokploy watches the `dev` branch and automatically rebuilds and deploys this
  instance after every push to `dev`.
- **Production — [schedule.w04m1.dev](https://schedule.w04m1.dev):** Pushing to
  `main` does not deploy production by itself. A version tag starts the release
  workflow; after that workflow successfully publishes the new Docker image and
  GitHub release, Dokploy detects the new production image and deploys it
  automatically.

No manual deployment step is required during the normal development or release
flow. The manual image selection described below is for initial configuration,
recovery, and rollback.

Each release publishes two image tags:

- `ghcr.io/w04m1/elte-schedule-builder:0.1.0` for the release version.
- `ghcr.io/w04m1/elte-schedule-builder:sha-<full-commit-sha>` for the exact
  source commit.

The GitHub release also records the image digest. Use the digest reference for
strictly immutable deployments:

```text
ghcr.io/w04m1/elte-schedule-builder@sha256:<image-digest>
```

## Create a release

After the version and changelog changes have passed CI on `main`, create and
push the matching tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Do not move or reuse an existing release tag. Prepare a new semantic version
instead.

## Configure Dokploy

Configure the production application as an image-based deployment that watches
for images published by the release workflow, using these values:

- Image: the digest reference from the GitHub release. The full commit-SHA tag
  is a practical fallback if Dokploy requires a tag.
- Container port: `3000`.
- Persistent volume: mount persistent storage at `/app/data`.
- Cache database: leave `CACHE_DB_PATH` unset to use `/app/data/cache.db`, or
  set it explicitly to that path.
- Environment: copy only the production values needed from `.env.example`.
  The published image defaults `NODE_ENV` to `production`, which enables HSTS
  on every application response. Set `NODE_ENV=production` explicitly when
  deploying the server without the published container.
  Set `TRUST_PROXY_HOPS=1` only when exactly one trusted reverse proxy sits in
  front of the application.

Public GHCR packages need no registry credentials. For a private package,
configure Dokploy with a GitHub token that has `read:packages` permission.

After deployment, request `/` and `/api/subject/DEMO-1`. Confirm both responses
include `Strict-Transport-Security: max-age=31536000`, and confirm that the API
response contains `Introduction to Web Development`. This checks the production
security mode, server, database, and bundled demo data without relying on
Tanrend.

## Roll back

Select the digest (or full commit-SHA tag) from the previous successful GitHub
release and redeploy it in Dokploy. The SQLite cache volume is compatible across
these releases and should remain mounted during the rollback.
