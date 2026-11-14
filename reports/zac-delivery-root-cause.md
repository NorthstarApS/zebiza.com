# Root cause: `zac_delivery` HTTP 400

**Status:** BLOCKED on host access — runbook + scripts ready (`docs/ZAC_DELIVERY_FIX_RUNBOOK.md`)  
**Observed:** 2026-11-13; **reconfirmed** 2026-11-14 ~21:30 Europe/Copenhagen (Store API still HTTP 400, no Reepay redirect; ~1.6s latency)  
**Endpoint:** `POST https://zebiza.com/wp-json/wc/store/v1/checkout`

## Host access (2026-11-14)

| Check | Result |
|---|---|
| This agent `runtime` | `managed` (`source=AS_SUBAGENT_FROM_CLOUD`) — **not** on self-hosted worker |
| `/mnt/webdata/www` | Missing on managed VM |
| SSH `mail.skoleudstyr.dk:22` (`62.66.144.161`) | Timeout from cloud (HTTP/HTTPS open; no tunnel) |
| Required worker | `aed9c789-6a5d-5a1c-a633-34c8cb270f63` — displayName `/mnt/webdata/www @ mail.skoleudstyr.dk` |
| Origin WP API | Reachable (Store API + `zac/v1/*`); plugin **PHP** paths return nginx 404 (not browsable) |
| Store API retest | Still **400 `zac_delivery`** (DK + `flat_rate:3` + `reepay_checkout`, product `301268`) |

### Confirmed on-host paths (from public plugin README)

| Item | Path |
|---|---|
| Webroot | `/home/Northstar/web/zebiza.com/public_html` |
| ZAC plugin dir | `wp-content/plugins/zac/` (README.md publicly readable; documents AI content queue + `zac/v1`, AI host `10.0.0.10:8893`) |
| Also check | `/mnt/webdata/www/zebiza.com` (worker mount) if present as alias/bind |

Public readmes also confirm sibling plugins: `woocommerce`, `reepay-checkout-gateway`, `polylang`, `seo-by-rank-math`. CJ webhook surface (`zac/v1/cj/webhook`) lives under the ZAC namespace — delivery confirmation is almost certainly in this plugin tree (or an mu-plugin), but **PHP source is not HTTP-readable**.

**Unblock (pick one):**

1. **Preferred:** relaunch Task/CreateAgent with machine placement onto worker `aed9c789-6a5d-5a1c-a633-34c8cb270f63` (do **not** omit `machine` / private-worker targeting — plain `task_v2` lands on managed cloud again).
2. Or inject secrets `ZEBIZA_SSH_HOST` / `ZEBIZA_SSH_USER` / `ZEBIZA_SSH_PRIVATE_KEY` (optional `ZEBIZA_SSH_PORT`) so a managed agent can SSH to the host.

Then on the host:

```bash
ROOT=/home/Northstar/web/zebiza.com/public_html
# fallback: ROOT=/mnt/webdata/www/zebiza.com
ls "$ROOT" | head
grep -R "zac_delivery\|Leveringen kan ikke bekræftes" \
  "$ROOT/wp-content/plugins" "$ROOT/wp-content/mu-plugins"
# install logging-only MU-plugin from this repo:
#   wordpress/mu-plugins/zac-delivery-diagnostics.php
# → $ROOT/wp-content/mu-plugins/zac-delivery-diagnostics.php
```

## Exact error

```json
{
  "code": "zac_delivery",
  "message": "Leveringen kan ikke bekræftes lige nu. Prøv igen om et øjeblik.",
  "data": { "status": 400 }
}
```

Reproduced for both `reepay_checkout` and `reepay_mobilepay`.  
Never reaches Reepay redirect. No `order_id` created.

## What was ruled out (frontend / Store API)

| Hypothesis | Result |
|---|---|
| Missing nonce / cart-token | FAIL — session established; cart add works |
| Missing shipping rate | FAIL — `flat_rate:3` selected, totals `total_shipping=4720` (+ tax 1180 = 59 kr) |
| Shipping selection lost before checkout | FAIL — GET `/cart` immediately before checkout still shows selected rate |
| Missing Danish address fields | FAIL — full DK address with postcode/city/phone |
| Missing `extensions.zac_delivery` | FAIL — guessed payloads still 400 with same code |
| `zebiza/v1/sync-cart` not called | FAIL — sync returns `{success:true}` then checkout still 400 |
| Wrong payment method | FAIL — Reepay methods listed; `bacs` separately disabled |
| Transient API glitch | FAIL — retries still 400 |

## What `zac_delivery` is

Public WordPress surface shows a custom **ZAC** plugin namespace:

- `zac/v1/status` (401 without auth)
- `zac/v1/cj/webhook` → `{ "ok": true, "service": "zac-cj-webhook" }`
- `zac/v1/resolve-product/{catalog_product_id}` — catalog AI publish pipeline
- Product HTML uses `class="zac-desc"` (ZAC-generated descriptions)
- Companion storefront API: `zebiza/v1/sync-cart`, `zebiza/v1/payment-gateways`

**Conclusion:** `zac_delivery` is a **server-side WooCommerce Store API checkout validation** from the ZAC/CJ fulfillment stack (not a Woo core shipping method ID). It runs after shipping is selected and rejects checkout before payment gateways execute. The customer message implies an external delivery/fulfillment confirmation that failed or timed out — not a missing flat-rate method.

Plugin PHP is **not** in `NorthstarApS/zebiza.com` (frontend SPA only). Org-wide GitHub code search found **0** matches for `zac_delivery`.

## Reproduction sequence (sanitized)

1. `GET /wc/store/v1/cart` → Nonce + Cart-Token  
2. `POST /cart/add-item` `{id: <in-stock>, quantity:1}`  
3. `POST /cart/update-customer` with DK shipping/billing  
4. Confirm rates include `flat_rate:3` selected  
5. `POST /cart/select-shipping-rate` `{rate_id:"flat_rate:3", package_id:0}`  
6. Optional: `POST /zebiza/v1/sync-cart` `{items:[…]}` → success  
7. `POST /checkout` with Reepay → **400 zac_delivery**

## Correct fix location (WP host filesystem)

1. On worker/SSH, open webroot above and search:
   ```bash
   grep -R "zac_delivery" wp-content/plugins wp-content/mu-plugins wp-content/themes
   grep -R "Leveringen kan ikke bekræftes" wp-content
   ```
2. Start in `wp-content/plugins/zac/` (confirmed present). Identify the Store API hook, typically near:
   - `woocommerce_store_api_checkout_update_order_from_request`
   - `rest_pre_dispatch` / custom `CheckoutSchema` extension
   - CJ/dropship “confirm delivery” HTTP client (`zac/v1/cj/webhook` companion)
3. Check WooCommerce → Status → Logs around the failed attempt (API keys, timeouts, 4xx from CJ). Also check AI/CJ reachability to whatever host the confirm client calls (may differ from `ZAC_AI_BASE_URL`).
4. Fix the **underlying confirmation failure** (credentials, endpoint, stock, address mapping).  
   **Do not** remove the validation gate to force checkout through.
5. Install `wordpress/mu-plugins/zac-delivery-diagnostics.php` from this repo into `wp-content/mu-plugins/` (logging only; no behaviour change).
6. Re-run Store API reproduction; expect `payment_result.redirect_url` to Reepay.

## Frontend changes made (this PR)

- Checkout calls `zebiza/v1/sync-cart` then re-selects shipping before Store API checkout.
- Clearer user-facing error when `code === zac_delivery`.
- Still **never** fakes a paid order.

## Setup landed in this repo (2026-11-14)

| Artifact | Purpose |
|---|---|
| `scripts/host-zac-delivery-fix.sh` | On-host: find ROOT, grep `zac_delivery`, install diagnostics MU-plugin |
| `scripts/reepay-checkout-e2e.py` | After fix: honest PASS only with Reepay `redirect_url` |
| `docs/ZAC_DELIVERY_FIX_RUNBOOK.md` | Operator steps; no validation bypass |
| `wordpress/mu-plugins/zac-delivery-diagnostics.php` | Logging-only MU-plugin |

`sync-cart` with `{items:[{id,quantity}]}` returns `count:1` and still fails checkout — not a frontend sync bug.

## Owner & next action

| Role | Action |
|---|---|
| Host access | Place agent on worker `aed9c789…` **or** inject `ZEBIZA_SSH_*` + `WP_ADMIN_*` into Cloud Agent env |
| WooCommerce / ZAC plugin owner | Run `host-zac-delivery-fix.sh`; fix CJ/delivery confirmation; verify Store API checkout returns redirect |
| Payments owner | `python3 scripts/reepay-checkout-e2e.py` then Reepay test card; record order id + WC status |
| Frontend | Already merge-ready for deploy; no further workaround without bypassing validation |
