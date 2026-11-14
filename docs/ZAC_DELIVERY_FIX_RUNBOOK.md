# ZAC delivery fix → Reepay test order

**Goal:** Store API checkout returns `payment_result.redirect_url` (Reepay/Frisbii), then a real test payment. Never bypass `zac_delivery`; never fake paid PASS.

## Blocker (managed cloud)

| Need | Status |
|---|---|
| Host FS `/mnt/webdata/www` or `/home/Northstar/web/zebiza.com/public_html` | Only on worker `aed9c789-6a5d-5a1c-a633-34c8cb270f63` |
| Task placement on that worker | Not available from managed `Task` (`same_machine` \| `new_cloud_vm` only) |
| SSH `:22` to `62.66.144.161` | Filtered from cloud |
| Secrets `ZEBIZA_SSH_*` / `WP_ADMIN_*` | Requested via environment setup + secure form |

## On the host (preferred)

```bash
# On worker: /mnt/webdata/www @ mail.skoleudstyr.dk
cd /path/to/zebiza.com   # this git checkout, or copy scripts + mu-plugin
bash scripts/host-zac-delivery-fix.sh
```

Then:

1. Open every PHP hit for `zac_delivery` / `Leveringen kan ikke bekræftes` (start `wp-content/plugins/zac/` — README is AI-only; CJ webhook `zac/v1/cj/webhook` proves fulfillment code is also there or in a sibling).
2. Fix the **confirmation** failure (API keys, endpoint, timeout, stock, address mapping).
3. Reproduce a failing checkout once with MU-plugin installed → WooCommerce → Status → Logs (`zac-delivery`).
4. From any machine with HTTPS:

```bash
python3 scripts/reepay-checkout-e2e.py
# expect PASS + redirect_url containing reepay/frisbii
```

5. Open `redirect_url`, pay with Reepay **test** card, confirm Woo order `processing`/`completed`.

## Observed (2026-11-14 Europe/Copenhagen)

- Live apex storefront OK; Store API cart/shipping OK; `zebiza/v1/sync-cart` with `{id,quantity}` → `count:1`.
- Checkout still **HTTP 400 `zac_delivery`** (~1.6s — looks like a real confirm call, not an instant schema reject).
- Extensions guesses do not help; do not treat that as a frontend bug.
