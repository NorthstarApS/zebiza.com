# Zebiza.com — Phase 3: Production Launch & First Verified Order

**Report time:** 2026-11-13 22:40 Europe/Copenhagen  
**Branch:** `cursor/beauty-seo-commerce-recovery-4eca`  
**PR:** https://github.com/NorthstarApS/zebiza.com/pull/1  
**Head SHA:** `42ea2c08be83a2df4c425ad2b7de444ca66e5f84` (+ Phase 3 follow-up commit if present)

**Phase 3 verdict: NOT PASS** — merge-ready frontend is verified; production deploy and paid order remain BLOCKED on human/Lovable publish and ZAC WordPress plugin access.

---

## A. Git and deployment

| Item | Status | Evidence |
|---|---|---|
| Phase 2 commits on PR | **PASS** | PR lists **2 commits**: `451f5be` (Phase 1 recovery) + `42ea2c0` (Phase 2 prerender/checkout). Not “one commit / SSR missing”. |
| Files present on remote | **PASS** | `scripts/prerender.mjs`, `ssr-verify.mjs`, `product-quality.mjs`, `reports/PHASE2_REVENUE_RECOVERY.md`, `public/merchant-feed.xml` |
| Mergeable | **PASS** | `mergeable: true`, `mergeable_state: clean` |
| CI workflows | **N/A → added** | Repo had **0** GitHub Actions; Phase 3 adds build/typecheck/qa workflow |
| Production deploy | **BLOCKED** | Hosting = **Lovable Publish** → Cloudflare (`server: cloudflare`). Agent cannot merge or click Lovable Share → Publish. `gh` is read-only for writes. |
| Verified production version | **FAIL** | Live `Last-Modified: Sat, 07 Nov 2026 22:27:56 GMT`; HTML still contains **Linea**; beauty nav not in initial HTML |

### Rollback plan
1. Lovable → republish previous known-good commit / restore prior publish.  
2. Or `git revert` merge commit on `main` and republish.  
3. Keep WooCommerce / Reepay / ZAC plugins untouched by frontend rollback.

### Exact human deploy steps
1. Review & **merge PR #1** into `main`.  
2. Open [Lovable project](https://lovable.dev/projects/a8e59680-e4fc-4735-a797-36af2f7e2875) → ensure `main` synced → **Share → Publish**.  
3. Confirm build runs `npm run build` (includes `seo:assets` + `prerender`).  
4. Run `AUDIT_ORIGIN=https://zebiza.com npm run qa:prod` — expect feed XML + H1 on `/da/`.

---

## B. SSR

### Local (`dist/`)
| Check | Result |
|---|---|
| `npm run build` | PASS |
| `npm run qa:ssr` | **31/31 PASS** |
| Prerender counts | 206 products, 29 categories, 73 brands |

### Production (`https://zebiza.com`) — `npm run qa:prod`
| Check | Result |
|---|---|
| `/merchant-feed.xml` | **FAIL** — HTTP 200 `text/html` (SPA soft-404) |
| `/da/` crawlable beauty HTML | **FAIL** — Linea shell / no prerender |
| Sitemap | Partial — XML exists but not this PR’s DA set until republish |

Full machine output: `reports/prod-audit.json` (regenerated each audit run).

---

## C. Checkout / `zac_delivery` / Reepay

See `reports/zac-delivery-root-cause.md` and updated `reports/checkout-test-matrix.json`.

| Step | Result |
|---|---|
| Add to cart + address + `flat_rate:3` (59 kr) | PASS |
| Free shipping ≥999 | PASS (Phase 2) |
| `zebiza/v1/sync-cart` | PASS `{success:true}` |
| Store API checkout | **BLOCKED** `zac_delivery` 400 |
| Reepay redirect | NOT REACHED |
| Paid order in WooCommerce | **BLOCKED** |
| Frontend change | Calls `sync-cart` before checkout; still no bypass |

**Root cause:** Custom **ZAC/CJ** WooCommerce plugin validates delivery on Store API checkout and rejects before payment. Plugin source is not in this repo; requires WP admin grep + fix of external confirmation (credentials/API/stock). Diagnostic MU-plugin provided under `wordpress/mu-plugins/zac-delivery-diagnostics.php` (logging only).

---

## D. Merchant

| Item | Status |
|---|---|
| Feed in PR build | 206 items, valid XML in `dist/merchant-feed.xml` |
| Production feed | **FAIL** soft-404 HTML |
| Google approved/disapproved | **UNKNOWN** — no Merchant Center access; feed not live |

After deploy: point MC to `https://zebiza.com/merchant-feed.xml` and record real statuses.

---

## E. Products

| Status | Count |
|---|---|
| PASS | 186 |
| REVIEW | 19 |
| BLOCKED | 13 |

BLOCKED SKUs (must be fixed **in WooCommerce**, not only hidden in SPA): gasmaske, dental/tandrens/vandflosser, salon furniture (hårsteamere, hårtølling, negleservicebord), elastikbånd, Cartier parfume missing image.  
Remediation list: `reports/product-quality-blocked.json`.

---

## F. Action list (only real remaining work)

| # | Owner | Access needed | Next action |
|---|---|---|---|
| 1 | Repo maintainer | GitHub merge | Merge PR #1 |
| 2 | Lovable publisher | Lovable project | Publish `main`; verify feed `Content-Type` XML |
| 3 | Woo/ZAC admin | WP files + logs + CJ credentials | Fix `zac_delivery` confirmation per root-cause doc |
| 4 | Payments | Reepay testmode | Complete card (+ MobilePay) test; save order id + WC status |
| 5 | Merchandising | Woo admin | Unpublish/reclassify 13 BLOCKED; fix missing image |
| 6 | SEO/Marketing | Merchant Center + Ahrefs | Connect feed; replace UNKNOWN volumes |

---

## Definition of Done scorecard

| Criterion | Met? |
|---|---|
| Phase 2 in correct PR | **YES** |
| Production deploy verified | **NO** |
| SSR on public domain | **NO** |
| Sitemap + Merchant feed live | **NO** (feed) |
| `zac_delivery` unblocked | **NO** |
| Verified Reepay test payment | **NO** |
| Woo paid order | **NO** |
| Shipping/prices consistent in code | **YES** (awaiting deploy) |
| No open P0 | **NO** |

**Do not start ads until rows 2–7 are YES.**
