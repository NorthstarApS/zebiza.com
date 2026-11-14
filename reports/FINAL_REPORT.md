# Zebiza.com — Technical, SEO & Commerce Recovery Report

## Baseline

| Metric | Before |
|---|---|
| Ahrefs crawled | 14,509 |
| 200 | 2,751 |
| 3xx | 5,872 |
| 404 | 4,467 |
| Other 4xx | 1,418 |
| Prod sitemap URLs | 745 (da+en duplicates) |
| Products (Store API) | 218 |
| Categories | 28 |
| Locales | da / en / sv / de (+ soft pt) |
| Merchant feed | Missing |

## Fixed (this PR)

| Area | Count / change |
|---|---|
| Broken Linea branding in `index.html` | Fixed → Zebiza DA |
| Design tokens missing (`section`/`trend`/…) | Restored in CSS |
| Store API product client | Replaced key-based wc/v3 + mock-first with Store API mapper |
| Legacy `/product` + `/product-category` routes | Client redirects + `_redirects` 301 map |
| Internal link rewriting in product HTML | `/product-category` → `/da/kategori/…` |
| Category Furina/generic copy | Overridden with beauty copy for 28 categories |
| Non-beauty merchandising demotion | 12 items excluded from feed/home heuristics |
| Sitemap | Regenerated DA-only: **241** canonical URLs |
| Merchant feed | **206** items at `/merchant-feed.xml` |
| Fake AggregateRating | Removed unless real reviews exist |
| Beauty IA navigation | Hudpleje / Makeup / Hår / Negle / Parfume / Tools / Mænd / Brands / Tilbud |
| Brand index + brand pages | Added |
| Locale strategy | Only `da` indexable; en/sv/de noindex |
| GA4 ecommerce events | Wired (consent-aware dataLayer/gtag) |
| Cart | Store API nonce/token sync + local persistence |
| Checkout | Real Store API checkout attempt; no fake success on failure |
| Vite proxy | Local `/wp-json` → zebiza.com (CORS) |

### Crawl audit (post-fix samples)

| Metric | Result |
|---|---|
| Checked | 70 |
| 200 | 68 |
| 3xx | 2 (expected legacy samples) |
| 4xx/5xx | 0 |
| Local sitemap URLs | 241 (DA canonical only) |

## Commerce

| Step | Result |
|---|---|
| Product load (Store API) | PASS |
| Add to cart + persistence | PASS |
| Quantity update | PASS |
| Checkout form + shipping 39 kr | PASS |
| Payment method listing | PASS (gateways endpoint / fallback) |
| Paid order in testmode | BLOCKED — needs payment gateway credentials / Woo checkout completion on prod |

## Merchant

| Field | Value |
|---|---|
| Feed URL | `https://zebiza.com/merchant-feed.xml` (after deploy) |
| Aliases | `/google-merchant.xml`, `/feeds/google-merchant.xml` |
| Product count | 206 |
| Duplicate IDs | 0 |
| Missing brand | 18 (warnings) |
| Missing GTIN | 77 (warnings; MPN/SKU used when present) |
| Missing image | 1 |
| Non-beauty skipped | 12 |

## SEO — keyword → URL map

| Cluster | Intent | Owner URL | Action |
|---|---|---|---|
| hudpleje | Commercial | `/da/kategori/hudpleje-ansigt` | expand |
| ansigtsrens | Commercial | `/da/kategori/ansigtsrens` | expand |
| øjencreme | Commercial | `/da/kategori/oejencreme` | expand |
| ansigtsserum | Commercial | `/da/kategori/hudpleje-ansigt` | expand |
| ansigtsserum til mænd | Commercial | `/da/kategori/barbering-grooming` | expand |
| hårpleje / shampoo | Commercial | `/da/kategori/harpleje` | establish |
| hårfarve | Transactional | `/da/kategori/haarfarve` | expand |
| makeup / foundation | Commercial | `/da/kategori/kosmetik-ansigt` | consolidate |
| neglelak | Transactional | `/da/kategori/nails` | establish |
| dameparfume | Transactional | `/da/kategori/parfume-dufte` | establish |
| beauty tools | Commercial | `/da/kategori/beauty-tools` | consolidate |
| Sally Hansen neglelak | Brand | `/da/soeg?q=sally%20hansen` | defer — **no stock** |
| L'Oréal Metal Detox | Brand | `/da/soeg?q=metal%20detox` | defer — **no stock** |

## Remaining blockers (require credentials / business)

1. **Google Merchant Center account** — add feed URL; cannot approve products without access
2. **Payment gateway test credentials** — end-to-end paid test order
3. **WooCommerce admin** — permanently fix Furina category HTML in WP; reclassify mis-shelved salon/dental/gas-mask SKUs; enrich GTIN fields
4. **True SSR/prerender hosting** — SPA still hydrates SEO tags client-side; deploy-time prerender or edge HTML is required for full crawl parity
5. **Assortment gaps** — Sally Hansen / Metal Detox / Rowenta / Drunk n Diamonds not in catalog (GSC impressions without inventory)
6. **Legacy `catalog-product-*` 301 targets** — prod currently maps some dead IDs to a category; needs inventory-aware redirect table in WP/CDN

## Deploy notes

1. Merge & publish frontend (Lovable / CDN)
2. Ensure `public/sitemap.xml`, `public/merchant-feed.xml`, `public/robots.txt`, `public/_redirects` are served
3. Point Merchant Center to `https://zebiza.com/merchant-feed.xml`
4. Re-submit sitemap in Search Console
5. Verify Cloudflare/host honors `_redirects` 301s (or mirror rules in CDN)
