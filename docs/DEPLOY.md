# Deploy Zebiza frontend (Cloudflare Pages)

This project is **not** deployed via Lovable. Use Cloudflare + GitHub.

## Prerequisites

1. Domain `zebiza.com` already on Cloudflare DNS (confirmed).
2. WordPress/WooCommerce origin reachable for `/wp-*` paths.
3. GitHub repo `NorthstarApS/zebiza.com`.

## One-time Cloudflare setup

### A. Pages project for the SPA

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
2. Select `NorthstarApS/zebiza.com`, production branch `main`.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `20`
4. Environment variables (optional):
   - `VITE_SITE_ORIGIN=https://zebiza.com`
   - `VITE_WP_API_BASE=https://zebiza.com`
5. After first deploy, attach custom domain `zebiza.com` / `www`.

### B. Keep WordPress on the same hostname

Pages must **not** intercept WP API/admin/media. Configure Cloudflare so these paths hit the WP origin (existing host that already serves `/wp-json` today):

- `/wp-json/*`
- `/wp-admin/*`
- `/wp-login.php`
- `/wp-content/*`
- `/wp-includes/*`
- `/xmlrpc.php` (prefer blocked)

Use **Origin Rules**, **Workers routes**, or a **Cloudflare Load Balancer / reverse proxy** already in place. Do not point these paths at the Pages project.

### C. GitHub Actions deploy (optional alternative to CF Git integration)

Repository secrets:

- `CLOUDFLARE_API_TOKEN` — token with Pages Edit
- `CLOUDFLARE_ACCOUNT_ID` — account id

Workflow: `.github/workflows/deploy-cloudflare.yml` (runs on push to `main`).

## Release checklist

1. Merge PR to `main`.
2. Wait for Pages deploy (or Actions deploy) to succeed.
3. Run:

```sh
npm run qa:prod
```

Expect:

- `/merchant-feed.xml` → XML (`application/xml` or `text/xml`), not HTML
- `/da/` → H1 present, no `Lovable` / Linea OG image
- Unknown path → HTTP 404 (`/404.html`), not SPA 200

## Rollback

Cloudflare Pages → Deployments → select previous deployment → Rollback.

## Cache invalidation

- HTML/feed: short cache via `public/_headers` (5 minutes for feed/sitemap).
- After catalog changes that affect prerender: trigger a new Pages build (push empty commit, workflow_dispatch, or scheduled rebuild).
- Product price/stock in the live SPA still comes from Store API at runtime; prerendered HTML can lag until rebuild.
