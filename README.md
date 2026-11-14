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

**Produktion i dag:** Cloudflare proxy → **nginx** på `62.66.144.161` (samme host som WordPress).

**CD-artifact / preview:** Cloudflare Pages-projekt `zebiza-com`  
→ `https://zebiza-com.pages.dev` (SSR + XML feed verificeret).

```sh
npm run build
npx wrangler pages deploy dist --project-name=zebiza-com --branch=main
```

Kræver `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.

**Vigtigt:** Tilknyt ikke apex `zebiza.com` til Pages, før `/wp-*` routes til nginx — ellers brydes WooCommerce. Apex-cutover: sync `dist/` til nginx **eller** Worker-split (se `docs/DEPLOY.md`).

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
