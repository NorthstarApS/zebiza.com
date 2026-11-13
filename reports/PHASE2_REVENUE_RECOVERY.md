# Zebiza.com — Phase 2: Production, SEO & Revenue Recovery

**Branch:** `cursor/beauty-seo-commerce-recovery-4eca`  
**PR:** https://github.com/NorthstarApS/zebiza.com/pull/1  
**Report time:** 2026-11-13 (Europe/Copenhagen)  
**Rule:** No PASS without evidence. No invented volumes, GTINs, paid orders, or Merchant approvals.

---

## 1. Executive summary

PR #1 is still **not deployed**. Public `zebiza.com` serves the pre-recovery SPA: `merchant-feed.xml` returns **HTTP 200 with `text/html`** (soft 404), and HTML contains residual **Linea** branding. Beauty IA, crawlable prerender, corrected shipping UI, and Merchant XML exist **only in this branch** until merge + publish.

**Technical sale-ready status: NOT MET.**

| Gate | Status |
|---|---|
| Crawlable HTML for products/categories (in-repo build) | **PASS** (31/31 SSR checks on `dist/`) |
| Same on public production | **FAIL** — PR not live |
| Sitemap + Merchant feed HTTP 200 XML on production | **FAIL** — feed is HTML soft-404 |
| Cart + shipping from Woo | **PASS** (Store API) |
| Paid test order in WooCommerce | **BLOCKED** (`zac_delivery` 400 before Reepay) |
| Merchant Center approvals | **UNKNOWN** — no MC access; feed not live |
| Documented DK keyword volumes | **UNKNOWN** — Ahrefs/GSC ZIP not in workspace |
| Product quality gate | **PARTIAL** — 186 PASS / 19 REVIEW / 13 BLOCKED |

Do **not** start paid ads until: deploy → feed XML live → `zac_delivery` fixed → paid test order verified → MC ingest green.

---

## 2. What was actually implemented (this phase)

### SSR / crawlability
- `scripts/prerender.mjs` — build-time HTML for `/da/`, categories, **206** products, **73** brands, static pages
- Wired into `npm run build` (`seo:assets && vite build && prerender`)
- Each page: `<title>`, meta description, canonical, H1, primary content in `#root`, JSON-LD (products)
- `scripts/ssr-verify.mjs` — **31/31 PASS** on local `dist/` without JavaScript
- `_redirects` updated for static feed/sitemap precedence + trailing-slash + legacy 301s

### Commerce / checkout honesty
- Checkout reads **live Store API shipping rates** (no hardcoded 39 kr)
- Confirmed Woo rates: **`flat_rate:3` = 59 kr**; **`free_shipping:2` ≥ 999 kr** after discount
- Payment methods default to **`reepay_checkout` / `reepay_mobilepay`**
- Handles gateway `redirect_url`; **does not fire `purchase` until payment confirmed**
- Surfaces `zac_delivery` errors clearly; never fakes success
- Order confirmation uses **URL order id only** (removed random fake order numbers)
- Trust copy corrected (free shipping threshold 999, not 499)

### Catalog / Merchant / SEO assets
- Regenerated `public/sitemap.xml` (**241** DA URLs) and `public/merchant-feed.xml` (**206** items)
- `scripts/product-quality.mjs` → `reports/product-quality.json`
- Keyword map with **UNKNOWN** volumes: `reports/keyword-analysis.md`
- Checkout evidence: `reports/checkout-test-matrix.json`

### CRO
- Removed dead account/wishlist buttons; help link to kontakt
- Search autocomplete (`SearchSuggest`)
- Sticky mobile ATC retained; shipping trust aligned with Woo

---

## 3. Baseline vs new status

| Metric | Baseline / public | This PR (local build) |
|---|---|---|
| Ahrefs organic keywords | 0 | unchanged (not deploy-dependent) |
| GSC 3 months | 1 click (MY→/en/), 47 impr., 0 DK clicks | unchanged until indexable DA pages live |
| Store API products | 218 | 218 |
| Feed products | missing / soft-404 on prod | **206** XML in `dist/` |
| Sitemap | 745 mixed / stale on prod | **241** DA canonical |
| SSR | client Helmet only | prerendered HTML in `dist/da/**` |
| Shipping UI | 39 kr hardcoded | live Woo rates (59 / free ≥999) |
| Paid order | not verified | still **BLOCKED** |

---

## 4. Crawl & SSR results

### Local (`npm run build` + `npm run qa:ssr`)
- Checked: **31** representative prerendered pages
- Passed: **31**
- Failed: **0**
- Signals verified: H1, title, meta description, canonical; products also price + availability + JSON-LD

### Production (live HTTP)
| URL | Status | Content-Type | Notes |
|---|---|---|---|
| `https://zebiza.com/merchant-feed.xml` | 200 | `text/html` | Soft 404 — SPA shell |
| `https://zebiza.com/sitemap.xml` | 200 | `application/xml` | Exists but not this PR’s DA-only set until redeploy |
| `https://zebiza.com/da/` | 200 | HTML | Residual Linea in shell; beauty nav not in initial HTML |

**Acceptance for production crawlability: FAIL until PR published.**

---

## 5. Søgeordsanalyse (datakilder)

See `reports/keyword-analysis.md`.

- **Sources used:** live Store API inventory, existing category URLs, Ahrefs baseline (0 keywords), GSC summary from brief.
- **Missing:** Ahrefs Keywords Explorer export, GSC ZIP in workspace.
- **Volumes / KD:** all marked **UNKNOWN** — not invented.
- **No thin pages** created for Sally Hansen / Metal Detox / Rowenta / Drunk n Diamonds (0 stock).

---

## 6. Keyword → URL mapping (owners)

| Cluster | Destination | Action |
|---|---|---|
| Hudpleje | `/da/kategori/hudpleje-ansigt/` | Forbedr |
| Ansigtsrens | `/da/kategori/ansigtsrens/` | Forbedr |
| Serum | `/da/kategori/hudpleje-ansigt/` | Forbedr (ingen separat thin side) |
| Makeup / foundation | `/da/kategori/kosmetik-ansigt/` | Forbedr / undersøg |
| Mascara / øjne | `/da/kategori/kosmetik-oejne/` | Forbedr |
| Læber | `/da/kategori/kosmetik-laeber/` | Forbedr |
| Neglelak | `/da/kategori/nails/` | Forbedr |
| Hårpleje / shampoo | `/da/kategori/harpleje/` | Forbedr |
| Hårstyling | `/da/kategori/haarstyling/` | Forbedr |
| Parfume | `/da/kategori/parfume-dufte/` | Forbedr |
| Beauty tools | `/da/kategori/beauty-tools/` | Forbedr |
| Mænd / grooming | `/da/kategori/barbering-grooming/` | Forbedr |
| Out-of-stock brand queries | — | **Defer** |

Implemented via `categoryContent.ts`, beauty nav, prerender titles/H1/meta, breadcrumbs, internal links.

---

## 7. Produktkvalitetsrapport

From `npm run qa:products` → `reports/product-quality.json`:

| Status | Count |
|---|---|
| PASS | 186 |
| REVIEW | 19 |
| BLOCKED | 13 |
| Missing brand | 29 |
| Missing GTIN | 88 |
| Missing image | 1 |

**BLOCKED examples (must not be marketed as core beauty):** gasmaske, elastikbånd, dental/tandrens/vandflosser, salon furniture (hårsteamere, hårtølling, negleservicebord), Cartier parfume missing image.

Frontend demotes non-beauty from merchandising/feed heuristics; **Woo admin must reclassify/unpublish at source** so catalog/feed/sitemap stay consistent.

---

## 8. Merchant validation & Google statuses

### Feed build (this branch)
| Check | Result |
|---|---|
| Items | 206 |
| Duplicate IDs | 0 |
| Missing title | 0 |
| Missing image | 1 |
| Missing brand | 18 |
| Missing GTIN | 77 (SKU/MPN used when present — never invented) |
| Non-beauty skipped | 12 |

### Google Merchant Center
| Metric | Status |
|---|---|
| Products in Woo | 218 |
| Products in feed (branch) | 206 |
| Products fetched by Google | **UNKNOWN** — feed not live as XML |
| Approved / limited / disapproved | **UNKNOWN** — no MC API/account access |

**Do not report approvals.** After deploy: point MC to `https://zebiza.com/merchant-feed.xml` and record real statuses.

---

## 9. Checkout test matrix

Full evidence: `reports/checkout-test-matrix.json`.

| Step | Result |
|---|---|
| Product + add to cart | PASS |
| Cart session nonce/token | PASS |
| Address → calculated shipping | PASS |
| Rate `flat_rate:3` = 59 kr | PASS |
| Free shipping ≥999 | PASS |
| Gateways Reepay card + MobilePay listed | PASS |
| Checkout → payment redirect | **BLOCKED** `zac_delivery` HTTP 400 |
| Paid order in Woo | **BLOCKED** |
| Failed payment / refund | NOT RUN (blocked upstream) |

**Owner:** WooCommerce / ZAC plugin admin must fix delivery confirmation validation that rejects Store API checkout before Reepay runs.

---

## 10. GA4 test results

| Event | Implementation | Verified live |
|---|---|---|
| view_item_list / select_item / view_item | Wired | Code review |
| add_to_cart / view_cart / begin_checkout | Wired | Code review |
| add_shipping_info / add_payment_info | Wired on checkout submit | Code review |
| purchase | Only after confirmed payment status | **NOT VERIFIED** — no paid order |

Consent-aware `dataLayer`/`gtag` push; no purchase on failed checkout.

---

## 11. Remaining blockers

| # | Blocker | Owner | Next action |
|---|---|---|---|
| 1 | PR #1 not published | Frontend deploy (Lovable/CDN) | Merge + deploy; verify feed `Content-Type: application/xml` |
| 2 | `zac_delivery` 400 on checkout | Woo / ZAC | Fix plugin validation or document required Store API `extensions` |
| 3 | Paid Reepay test | Payments + #2 | Complete testmode card/MobilePay; record order id + status |
| 4 | Merchant Center | Marketing/SEO | Add feed URL; export approved/disapproved counts |
| 5 | Ahrefs + GSC volumes | SEO | Provide exports; replace UNKNOWN in keyword table |
| 6 | Woo catalog hygiene | Merchandising | Unpublish/reclassify 13 BLOCKED SKUs; fix image on Cartier; enrich brand/GTIN |
| 7 | Cache invalidation | Hosting | Invalidate CDN on product/stock/price changes after deploy |

---

## 12. Prioritized plan — first organic visits & sales

1. **Merge + deploy PR #1** — beauty nav, prerender, feed, sitemap go live  
2. **Fix `zac_delivery`** — complete one verified paid test order  
3. **Submit sitemap** in GSC; request indexing for top category URLs  
4. **Connect Merchant feed**; clear disapprovals (image/brand/GTIN)  
5. **Import Ahrefs volumes**; expand only clusters with stock + documented demand  
6. **MAMI editorial** only for clusters with demand + inventory (guides with real internal links)  
7. **Measure** GSC DK clicks, MC approved count, CVR cart→checkout→purchase — not vanity code diffs  

---

## Definition of Done — current score

| Requirement | Met? |
|---|---|
| Critical pages crawlable HTML | In-repo **yes** / production **no** |
| Canonical product/category URLs | In-repo **yes** |
| Sitemap + Merchant feed 200 XML | Production feed **no** |
| Cart/checkout real tests | Partial — shipping **yes**, payment **blocked** |
| Paid test order | **no** |
| Product quality | Partial |
| Keyword clusters mapped | **yes** (volumes UNKNOWN) |
| GA4 purchase verified | **no** |
| No open P0 | **no** — deploy + zac_delivery + payment |

**Zebiza is not yet technically sale-ready.** This PR makes sale-readiness *achievable* once deploy and Woo delivery validation are unblocked.
