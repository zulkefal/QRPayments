# Deployment

The Shopify app is a container built from the **repository root**, not from
`shopify/` — it imports `core/` through a `file:` reference,
so the image needs both directories in the same relative layout as the repo.

```sh
docker build -t qrpay-app .
```

## Environment

| Variable | Where it comes from |
| --- | --- |
| `DATABASE_URL` | Your Postgres instance. Required. |
| `SHOPIFY_API_KEY` | The app's client ID, in `shopify/shopify.app.scan-to-pay.toml` |
| `SHOPIFY_API_SECRET` | Partner dashboard → app → API credentials |
| `SHOPIFY_APP_URL` | The public HTTPS URL this deployment serves on |
| `SCOPES` | empty — the app needs no Admin API scopes |

Migrations run at container start, not at build — the database is not reachable
while the image is built.

## Health check

`GET /healthz` returns `{"ok":true}`, or `503` when Postgres is unreachable.
Point the platform's health check at it. It queries the database on purpose: an
instance that serves pages but cannot reach Postgres is not healthy, and a check
that ignores that keeps traffic flowing to a broken instance.

## After deploying

The app URL must match the deployment, or Shopify will send merchants to the
wrong host:

1. Set `application_url` and the `auth.redirect_urls` entry in
   `shopify/shopify.app.scan-to-pay.toml` to the deployed URL.
2. `shopify app deploy` to publish that configuration.

## Hosting

Any platform that runs a container with a managed Postgres works — Railway,
Render, Fly, or a VPS. Expect roughly $5–20/month at early volumes.

**Do not use a filesystem database.** The schema targets Postgres for a reason:
container filesystems are ephemeral on these platforms, so a SQLite file loses
every merchant's settings and access tokens on each redeploy.

One thing to verify before launch: the host must be reachable from Pakistani
networks. Local ISPs have been observed failing to resolve some hostnames, and
a merchant who cannot open the app cannot set it up.

## Local development

```sh
docker run --name qrpay-db -e POSTGRES_PASSWORD=devpass -p 5432:5432 -d postgres:16
```

Then in `shopify/.env`:

```
DATABASE_URL="postgresql://postgres:devpass@localhost:5432/postgres"
```

```sh
npx prisma migrate dev
shopify app dev
```


## Keeping a free host awake

A free Render service sleeps after ~15 minutes idle and shows a cold-start
screen for ~50s on the next request. The shopper-facing QR does not depend on
the server, but the admin settings page and app review do, so the server must
stay warm.

Two ways, use either (or both):

1. **Uptime monitor (recommended, most reliable).** Create a free monitor at
   uptimerobot.com or cron-job.org pointing at `/healthz`, interval 5 minutes.
   Purpose-built and fires on time.
2. **GitHub Actions** — `.github/workflows/keep-alive.yml` pings every 10
   minutes. In-repo and free, but GitHub throttles scheduled runs and disables
   them after 60 days with no commits, so treat it as a backup.

The better long-term fix is a paid instance (no sleep); the keep-alive is for
the free tier.
