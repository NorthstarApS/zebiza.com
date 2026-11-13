# Zebiza.com

Dansk headless beauty-webshop: Vite + React frontend, WooCommerce Store API, Cloudflare edge, Reepay-betalinger.

## Arkitektur

| Lag | Rolle |
|---|---|
| **Frontend** (dette repo) | React/Vite SPA med build-time prerender, sitemap, Merchant feed |
| **WordPress / WooCommerce** | Produkter, lager, kurv (Store API), ordrer — samme domæne via Cloudflare |
| **ZAC / CJ** | Server-side leveringsvalidering (`zac_delivery`) — WordPress-plugin |
| **Reepay** | Kort + MobilePay |
| **Cloudflare** | DNS + CDN/edge foran frontend og WP |

Produktion (`zebiza.com`) proxyes via Cloudflare. Frontend-assets ligger under `/assets/`; WooCommerce under `/wp-json`, `/wp-content`, `/wp-includes`.

## Lokal udvikling

```sh
npm ci
npm run dev
```

Dev-serveren proxyer `/wp-json` og `/wp-content` til `https://zebiza.com`.

## Build

```sh
npm run build        # seo:assets → vite build → prerender
npm run typecheck
npm run qa:ssr       # crawl-signaler i dist/ uden JS
npm run qa:products  # PASS/REVIEW/BLOCKED mod Store API
npm run qa:prod      # HTTP-audit af produktion
```

`npm run build` genererer bl.a.:

- `dist/da/**/index.html` — prerenderet HTML
- `dist/sitemap.xml`, `dist/merchant-feed.xml`, `dist/robots.txt`

## Deployment (uden tredjeparts app-builders)

Anbefalet: **Cloudflare Pages** knyttet til dette GitHub-repo.

1. Opret Pages-projekt med build command `npm run build` og output `dist`.
2. Tilknyt custom domain `zebiza.com` (eller hold DNS i Cloudflare og peg Pages).
3. Sørg for at WP-stier (`/wp-json/*`, `/wp-admin/*`, `/wp-content/*`, `/wp-includes/*`) fortsat går til WordPress-origin (Cloudflare Worker/Route eller origin-rules).
4. GitHub Actions workflow `.github/workflows/deploy-cloudflare.yml` kan deploye ved push til `main` når secrets er sat:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - valgfrit `CLOUDFLARE_PROJECT_NAME` (default `zebiza-com`)

### Rollback

- Cloudflare Pages → tidligere deployment → Retry/Rollback, **eller**
- `git revert` på `main` og lad CI redeploye.

### Health checks efter deploy

```sh
npm run qa:prod
# Forvent: merchant-feed.xml = application/xml, /da/ har H1 uden Linea-branding
```

## Checkout / ZAC

Se `reports/zac-delivery-root-cause.md`. Store API checkout kan blokeres af WordPress-pluginet med kode `zac_delivery` før Reepay nås. Rettes i WP — ikke ved at fjerne validering i frontend.

## Rapporter

- `reports/PHASE2_REVENUE_RECOVERY.md`
- `reports/PHASE3_PRODUCTION_LAUNCH.md`
- `reports/PHASE4_INFRASTRUCTURE_COMMERCE.md`
