# Zebiza.com — production architecture

Verified 2026-11-14 (Europe/Copenhagen).

## Overview

```
Browser
  │
  ▼
Cloudflare CDN (zone zebiza.com, Free plan, orange-cloud proxy)
  │
  └─ Origin nginx @ 62.66.144.161 (mail.skoleudstyr.dk)
       ├─ Static frontend (Vite `dist/`, `/assets/*`, HTML shells)
       └─ WordPress / WooCommerce
            /wp-json/*   Store API + zebiza/v1 + zac/v1 + Reepay
            /wp-content/uploads/*
            /wp-includes/*, /wp-admin/*
```

DNS A records (proxied): `zebiza.com`, `www.zebiza.com` → `62.66.144.161`.

## Independent frontend pipeline (Cloudflare Pages)

| Item | Value |
|---|---|
| Pages project | `zebiza-com` |
| Production hostname | `https://zebiza-com.pages.dev` |
| Deploy | `npx wrangler pages deploy dist --project-name=zebiza-com --branch=main` |
| Secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |

**Apex custom domain is not attached to Pages.** Doing so without routing `/wp-*` to nginx would break WooCommerce.

Verified on Pages (2026-11-14):

- `/da/` prerender H1 + Zebiza meta (no Lovable)
- `/merchant-feed.xml` → `application/xml`
- unknown path → HTTP 404

## Frontend repo

- Vite 5 + React 18 + prerender (`npm run build`)
- Edge helpers in repo: `public/_redirects`, `public/_headers`, `public/404.html`
- CI: `.github/workflows/qa.yml`
- CD: `.github/workflows/deploy-cloudflare.yml` → Pages

## Commerce backends (WordPress host)

| System | Path / evidence |
|---|---|
| Woo Store API | `/wp-json/wc/store/v1/*` |
| Zebiza helpers | `/wp-json/zebiza/v1/*` |
| ZAC / CJ | checkout error `zac_delivery` (plugin source not in this repo) |
| Reepay | `reepay_checkout`, `reepay_mobilepay` |

## Cutover to apex

See `docs/DEPLOY.md`: sync `dist/` onto nginx **or** Worker that sends `/wp-*` to origin and HTML to Pages.
