# Root cause: `zac_delivery` HTTP 400

**Status:** BLOCKED — cannot complete fix without WordPress/ZAC plugin admin access  
**Observed:** 2026-11-13 (Europe/Copenhagen)  
**Endpoint:** `POST https://zebiza.com/wp-json/wc/store/v1/checkout`

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

## Correct fix location (WP admin)

1. SSH/SFTP or WP file manager → search:
   ```bash
   grep -R "zac_delivery" wp-content/plugins wp-content/mu-plugins wp-content/themes
   grep -R "Leveringen kan ikke bekræftes" wp-content
   ```
2. Open the matching plugin file. Identify the Store API hook, typically near:
   - `woocommerce_store_api_checkout_update_order_from_request`
   - `rest_pre_dispatch` / custom `CheckoutSchema` extension
   - CJ/dropship “confirm delivery” HTTP client
3. Check WooCommerce → Status → Logs around the failed attempt (API keys, timeouts, 4xx from CJ).
4. Fix the **underlying confirmation failure** (credentials, endpoint, stock, address mapping).  
   **Do not** remove the validation gate to force checkout through.
5. Optional: install `wordpress/mu-plugins/zac-delivery-diagnostics.php` from this repo to log shipping/payment context (does not disable validation).
6. Re-run Store API reproduction; expect `payment_result.redirect_url` to Reepay.

## Frontend changes made (this PR)

- Checkout calls `zebiza/v1/sync-cart` then re-selects shipping before Store API checkout.
- Clearer user-facing error when `code === zac_delivery`.
- Still **never** fakes a paid order.

## Owner & next action

| Role | Action |
|---|---|
| WooCommerce / ZAC plugin owner | Locate plugin via grep; fix CJ/delivery confirmation; verify Store API checkout returns redirect |
| Payments owner | After fix: Reepay testmode card + MobilePay; record order id + WC status |
| Frontend | Already merge-ready for deploy; no further workaround without bypassing validation |
