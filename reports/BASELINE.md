# Zebiza recovery — baseline (Phase 0)

Captured 2026-11-13 (Europe/Copenhagen).

## Repository

- Framework: Vite + React SPA (Lovable origin, formerly Linea jewelry template)
- Branch base: `main`
- WooCommerce backend: `https://zebiza.com` (Store API public)
- No SSR in current architecture (critical SEO constraint)

## Production crawl (Ahrefs, provided)

| Metric | Count |
|---|---|
| Crawled | 14,509 |
| 200 | 2,751 |
| 3xx | 5,872 |
| 404 | 4,467 |
| Other 4xx | 1,418 |
| 5xx | 1 |

≈ 81% of crawl set was non-200.

## Live inventory (Store API)

| Metric | Count |
|---|---|
| Products | 218 |
| Categories | 28 |
| Brands | ~73 |
| Sitemap (prod, before fix) | 745 (da+en duplicated) |

## Locales

| Locale | Status |
|---|---|
| `da` | Primary market, indexable |
| `en` | Incomplete / thin — noindex |
| `sv` / `de` / `pt` | Present as routes or soft 200 shells — noindex / excluded from sitemap |

## Critical defects found

1. Client-only SPA — weak SSR HTML (Linea jewelry leftovers in `index.html`)
2. Internal/legacy Woo paths (`/product/`, `/product-category/`) still in data
3. Generic Furina category copy (“bolig, livsstil…”)
4. Homepage merchandising included non-beauty / misclassified items
5. Fake AggregateRating schema when review_count = 0
6. No Google Merchant feed endpoint
7. Checkout previously cleared cart and faked success without Store API order
8. GSC queries (Sally Hansen, Metal Detox, Rowenta, Drunk n Diamonds) have **no matching stock**
9. English category slugs competing with Danish owners (`nails` / `nail-care`, `skincare`, etc.)
10. Design tokens (`bg-section`, `text-trend`, …) missing from CSS

## Merchant

- No working Merchant XML/CSV feed found at common plugin paths before this work
- Feed now generated at `/merchant-feed.xml` (build artifact)
