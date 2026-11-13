# Zebiza.com — production architecture

Verified from live HTTP/DNS on 2026-11-13 (Europe/Copenhagen).

## Overview

```
Browser
  │
  ▼
Cloudflare (DNS NS: algin/eve.ns.cloudflare.com)
  │
  ├─ Static frontend (Vite build under /assets/, HTML shells, sitemap, feed)
  │    Last known publish fingerprint: Last-Modified Sat, 07 Nov 2026 22:27:56 GMT
  │    Still contains legacy Lovable/Linea meta on live HTML until this PR is deployed
  │
  └─ WordPress / WooCommerce (same hostname)
       /wp-json/*   Store API + zebiza/v1 + zac/v1 + Reepay/Billwerk namespaces
       /wp-content/uploads/*  product media (e.g. zac-bb3/*)
       /wp-includes/*         WP core assets
       /wp-admin/*            admin (auth redirect)
```

## Frontend repo (this repository)

- **Stack:** Vite 5 + React 18 + React Router + Tailwind
- **Build:** `seo:assets` → `vite build` → `prerender` → `dist/`
- **Edge config in repo:** `public/_redirects`, `public/_headers`, `public/404.html`, `wrangler.toml`
- **CI:** `.github/workflows/qa.yml` (typecheck/build/ssr/products)
- **CD:** `.github/workflows/deploy-cloudflare.yml` (requires GitHub secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)

## Commerce backends (not in this repo)

| System | Evidence on production | Owned where |
|---|---|---|
| WooCommerce Store API | `/wp-json/wc/store/v1/*` | WordPress host |
| Zebiza helpers | `/wp-json/zebiza/v1/sync-cart`, `payment-gateways` | WP plugin |
| ZAC / CJ | `/wp-json/zac/v1/*`, checkout error `zac_delivery` | WP plugin (source not in GitHub org search) |
| Reepay | Gateways `reepay_checkout`, `reepay_mobilepay` | WP + Reepay account |
| RankMath / MAMI / AdTribes | `/wp-json/rankmath/*`, `mami/v1`, `adtribes/v1` | WP plugins |

## Routing rules required at Cloudflare

After switching off any legacy app-builder publish pipeline:

1. **Pages / static origin** serves `dist/` for HTML, `/assets/*`, `/sitemap.xml`, `/merchant-feed.xml`, `/robots.txt`.
2. **WordPress origin** continues to receive `/wp-json/*`, `/wp-admin/*`, `/wp-login.php`, `/wp-content/*`, `/wp-includes/*`.
3. Do not send `/wp-json` to the static Pages project.

## Deployed commit verification

Live SPA cannot expose git SHA by default. After Cloudflare Pages deploy, verify:

- Response `Last-Modified` / Pages deployment ID
- `/merchant-feed.xml` `Content-Type: application/xml`
- Absence of `author=Lovable` / `@lovable_dev` / Linea OG image
- Presence of prerender H1 on `/da/kategori/hudpleje-ansigt`

## Git / PR status (authoritative)

```
git log --oneline origin/main..origin/cursor/beauty-seo-commerce-recovery-4eca
```

Expected Phase 1–3 commits:

1. `451f5be` Recover Zebiza beauty SEO…
2. `42ea2c0` Phase 2 prerender…
3. `448417b` Phase 3 prod audit… (+ Phase 4 commit once pushed)
