# Deploy Zebiza frontend

## Production reality (verified 2026-11-14 Europe/Copenhagen)

| Layer | Fact |
|---|---|
| DNS / CDN | Cloudflare zone `zebiza.com` (proxied) |
| Origin | **nginx** on `62.66.144.161` (`mail.skoleudstyr.dk`) |
| Apex A record | `zebiza.com` → `62.66.144.161` (proxied) |
| WordPress | Same origin (`/wp-json`, `/wp-content`, `/wp-admin`) |
| Cloudflare Pages | Project `zebiza-com` used for **preview / CD artifacts**, not yet apex |

Do **not** attach the apex custom domain to Pages until `/wp-*` is routed to the nginx origin (Worker / Origin Rule). Attaching apex alone would break WooCommerce.

## Preview deploy (safe, already working)

```sh
npm ci
npm run build
npx wrangler pages deploy dist --project-name=zebiza-com
```

Requires env:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Latest example: `https://86c99d73.zebiza-com.pages.dev`

## Production cutover options

### A. Preferred — publish `dist/` to nginx origin (reuse existing infra)

On `mail.skoleudstyr.dk` (webroot under `/mnt/webdata/www/…`):

1. Build `dist/` (or pull artifact from CI / Pages).
2. Sync static files into the Zebiza vhost docroot **without** overwriting WordPress (`wp-admin`, `wp-content`, `wp-includes`, PHP).
3. Ensure nginx serves:
   - prerendered HTML under `/da/...`
   - `/merchant-feed.xml` as XML
   - real 404 for unknown paths
   - `/wp-json` → PHP/WordPress
4. Purge Cloudflare cache for HTML/feed.

### B. Cloudflare Pages as HTML origin + Worker for WP

1. Keep Pages project `zebiza-com`.
2. Add a Worker / Origin Rule: `/wp-*` → `62.66.144.161`, everything else → Pages.
3. Only then attach custom domain `zebiza.com`.

## GitHub Actions

`.github/workflows/deploy-cloudflare.yml` deploys to Pages on push to `main` when repository secrets match the names above.

## Rollback

- Pages: Deployments → previous deployment → Rollback (preview / Pages hostname).
- nginx: restore previous `dist/` from backup / previous rsync.

## Health checks

```sh
npm run qa:prod   # against https://zebiza.com after cutover
# Preview:
curl -sI https://<deployment>.zebiza-com.pages.dev/merchant-feed.xml
```
