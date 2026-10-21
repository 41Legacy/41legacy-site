# 41legacy.com

The 41 Legacy website: enterprise value focused fractional CFO and value growth advisory.

Hosted on a Cloudflare Worker (`legacy-site`) with a D1 database (`legacy-site-db`).
Forms, the owner check and the advisor check write to GoHighLevel (41 Legacy sub-account).

## How deploys work

`app/source.json` pins a release archive of the full site (code, film, images and the
216 migrated blog articles) by URL and SHA-256. On every push, Cloudflare runs:

- Root directory: `app`
- Build command: `bun install && bun run build` (runs `bootstrap.mjs`, which downloads,
  verifies and unpacks the release, then installs and builds it)
- Deploy command: `npx wrangler deploy`

To ship a change, a new release is published and `app/source.json` is updated.

## Secrets (Worker > Settings > Variables and Secrets)

- `GHL_PRIVATE_TOKEN`: GoHighLevel Private Integration token (contacts, opportunities, blogs read)
- `ADMIN_KEY`: passphrase for /admin
- `LEAD_WEBHOOK_URL` (optional): extra webhook copy of each submission

Strategic and Architectural Partner, 41 Legacy.
