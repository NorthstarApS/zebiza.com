# Zebiza.com — Phase 4: Infrastructure, Ownership & Checkout Recovery

**Report time:** 2026-11-13 22:55 Europe/Copenhagen  
**Branch:** `cursor/beauty-seo-commerce-recovery-4eca`  
**PR:** https://github.com/NorthstarApS/zebiza.com/pull/1  

**Verdict: NOT PASS for production sales.** Frontend is Lovable-free and deployable via Cloudflare Pages; live site still serves the Nov 7 SPA; `zac_delivery` still blocks Reepay without WordPress plugin access.

---

## 1. Actual hosting architecture

| Fact | Evidence |
|---|---|
| DNS | Cloudflare NS `algin.ns.cloudflare.com` / `eve.ns.cloudflare.com` |
| Edge | `server: cloudflare`, `/cdn-cgi/trace` OK |
| Frontend | Static Vite assets `/assets/*`, HTML shells, `Last-Modified: Sat, 07 Nov 2026 22:27:56 GMT` |
| WordPress | Same host: `/wp-json`, `/wp-includes`, `/wp-content/uploads` (media 200), `/wp-admin` → login |
| App-builder | Live HTML still has `author=Lovable`, `@lovable_dev`, Linea OG image — **legacy publish**, not an active dependency in this branch after Phase 4 cleanup |
| GitHub Pages | Not enabled |
| Deploy secrets in Actions | Not configured yet (`CLOUDFLARE_*` must be added) |

Full map: `docs/ARCHITECTURE.md` · Deploy runbook: `docs/DEPLOY.md`

Sister Northstar SPA repos still ship Lovable README boilerplate; they do **not** provide a better independent deploy pattern to copy. Zebiza now defines its own Cloudflare Pages path.

---

## 2. Lovable removal (this PR)

| Item | Action |
|---|---|
| `lovable-tagger` dependency | **Removed** from `package.json` / lockfile |
| `vite.config.ts` `componentTagger` | **Removed** |
| `README.md` | **Rewritten** for Zebiza + Cloudflare |
| Live meta on production | Still Lovable until deploy of this branch |
| Historical reports (Phase 2/3) | Left as historical; superseded by this doc + `docs/DEPLOY.md` |

Build/typecheck verified after removal.

---

## 3. Git / PR verification (not the public one-commit UI)

Authoritative checks:

```text
git log --oneline origin/main..origin/cursor/beauty-seo-commerce-recovery-4eca
gh pr view 1 --json commits,headRefOid
```

| Commit | Summary |
|---|---|
| `451f5be` | Phase 1 recovery (beauty SEO, Store API, feed) |
| `42ea2c0` | Phase 2 prerender / shipping / QA |
| `448417b` | Phase 3 prod audit / zac RCA / CI |
| *(this push)* | Phase 4 Lovable removal + Cloudflare deploy path |

`gh` reports **3 commits** before this push; head was `448417b`. Public anonymous GitHub UI may lag or collapse; use API/git above.

CI: QA workflow green on `448417b` (2/2 checks).

---

## 4. Independent deployment

Implemented in-repo:

- `wrangler.toml` — Pages project `zebiza-com`
- `.github/workflows/deploy-cloudflare.yml` — build + `wrangler pages deploy dist`
- `public/_headers` — XML Content-Type for feed/sitemap
- `public/404.html` + tightened `_redirects` — reduce domain-wide SPA soft-404
- `docs/DEPLOY.md` — Cloudflare Pages + WP path split

**Cannot complete live cutover from this agent:** no Cloudflare API credentials in GitHub Actions; merge to `main` requires human approval; WP route split must preserve existing `/wp-json` origin.

### Exact approval actions

1. Merge PR #1 → `main`
2. Cloudflare: connect Pages to repo **or** add GitHub secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` and run Deploy workflow
3. Confirm WP paths still hit WordPress origin
4. `npm run qa:prod` until feed is XML and `/da/` has prerender H1

---

## 5. ZAC / CJ root cause (unchanged blocker)

| Item | Status |
|---|---|
| Error | `zac_delivery` HTTP 400 — *Leveringen kan ikke bekræftes lige nu…* |
| Layer | WordPress plugin (ZAC/CJ), not frontend |
| Plugin source in this repo / org code search | **Not available** |
| Safe frontend change | `sync-cart` before checkout (already in Phase 3) |
| WP diagnostic MU-plugin | `wordpress/mu-plugins/zac-delivery-diagnostics.php` (logging only, no bypass) |
| Fix | WP admin: `grep -R zac_delivery wp-content/plugins` → repair CJ/delivery confirmation |

Details: `reports/zac-delivery-root-cause.md`

---

## 6. Checkout / Reepay E2E

| Step | Result |
|---|---|
| Cart + DK address + `flat_rate:3` (59 kr) | PASS (Store API) |
| Free shipping ≥999 | PASS |
| Checkout → Reepay | **BLOCKED** (`zac_delivery`) |
| Paid test order | **BLOCKED** |
| GA4 `purchase` | NOT VERIFIED |

No payment marked PASS.

---

## 7. SEO / Merchant on production

| Check | Production now | After this deploy |
|---|---|---|
| SSR H1 on `/da/` | FAIL (Linea shell) | Expected PASS |
| `/merchant-feed.xml` | FAIL HTML soft-404 | Expected XML 200 |
| Real 404 | FAIL (SPA 200) | Expected `/404.html` 404 for unknown |
| Google MC statuses | UNKNOWN | Still needs MC account after feed live |

---

## 8. Remaining blockers

| # | Blocker | Owner | Access | Next action |
|---|---|---|---|---|
| 1 | PR not on production | Maintainer | GitHub merge | Merge PR #1 |
| 2 | Cloudflare Pages cutover | Infra | CF dashboard / API token | Follow `docs/DEPLOY.md` |
| 3 | `zac_delivery` | WP/ZAC admin | WP filesystem + logs + CJ creds | Fix plugin confirmation |
| 4 | Reepay verified order | Payments | Reepay testmode | After #3 |
| 5 | Merchant approvals | Marketing | MC account | After feed XML live |
| 6 | BLOCKED catalog SKUs | Merchandising | Woo admin | Unpublish/reclassify 13 SKUs |

---

## Definition of Done

| Criterion | Met? |
|---|---|
| Independent of Lovable in source | **YES** |
| Documented real hosting architecture | **YES** |
| Deploy path without Lovable | **YES** (config ready; live cutover pending secrets/merge) |
| Production serving new commit | **NO** |
| `zac_delivery` fixed | **NO** |
| Verified Reepay payment | **NO** |
| Merchant feed XML live | **NO** |
| SSR on public domain | **NO** |

**Primary goal status:** ownership/cleanup done in git; **runtime sales goal not yet achieved**.
