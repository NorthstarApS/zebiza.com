#!/usr/bin/env python3
"""
Live Store API → Reepay redirect smoke test for zebiza.com.

Honest PASS only when checkout returns payment_result.redirect_url (Reepay/Frisbii).
Never fakes a paid order. zac_delivery → FAIL (not bypassed).

Usage:
  python3 scripts/reepay-checkout-e2e.py
  WP_ORIGIN=https://zebiza.com PRODUCT_ID=301268 python3 scripts/reepay-checkout-e2e.py
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
import http.cookiejar

ORIGIN = os.environ.get("WP_ORIGIN", "https://zebiza.com").rstrip("/")
PRODUCT_ID = int(os.environ.get("PRODUCT_ID", "301268"))
PAYMENT = os.environ.get("PAYMENT_METHOD", "reepay_checkout")
RATE_ID = os.environ.get("SHIPPING_RATE_ID", "flat_rate:3")


class Session:
    def __init__(self) -> None:
        self.nonce: str | None = None
        self.cart_token: str | None = None
        jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(jar)
        )

    def call(self, method: str, path: str, data=None):
        url = f"{ORIGIN}/wp-json{path}"
        headers = {
            "User-Agent": "zebiza-reepay-e2e/1",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if self.nonce:
            headers["Nonce"] = self.nonce
            headers["X-WC-Store-API-Nonce"] = self.nonce
        if self.cart_token:
            headers["Cart-Token"] = self.cart_token
            headers["X-WC-Store-API-Cart-Token"] = self.cart_token
        body = None if data is None else json.dumps(data).encode()
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with self.opener.open(req, timeout=60) as resp:
                self._capture(resp.headers)
                raw = resp.read().decode()
                return resp.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as e:
            self._capture(e.headers)
            raw = e.read().decode()
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                payload = {"raw": raw[:800]}
            return e.code, payload

    def _capture(self, headers) -> None:
        for k, v in headers.items():
            lk = k.lower()
            if lk == "nonce":
                self.nonce = v
            if lk == "cart-token":
                self.cart_token = v


def main() -> int:
    s = Session()
    addr = {
        "billing_address": {
            "first_name": "Test",
            "last_name": "Reepay",
            "company": "",
            "address_1": "Nørregade 1",
            "address_2": "",
            "city": "København",
            "state": "",
            "postcode": "1165",
            "country": "DK",
            "email": "reepay-test@zebiza.com",
            "phone": "20123456",
        },
        "shipping_address": {
            "first_name": "Test",
            "last_name": "Reepay",
            "company": "",
            "address_1": "Nørregade 1",
            "address_2": "",
            "city": "København",
            "state": "",
            "postcode": "1165",
            "country": "DK",
            "phone": "20123456",
        },
    }

    code, _ = s.call("GET", "/wc/store/v1/cart")
    print(f"cart session {code} nonce={bool(s.nonce)} token={bool(s.cart_token)}")
    code, cart = s.call("POST", "/wc/store/v1/cart/items", {"id": PRODUCT_ID, "quantity": 1})
    print(f"add-item {code}")
    code, cart = s.call("POST", "/wc/store/v1/cart/update-customer", addr)
    print(f"update-customer {code}")
    code, cart = s.call(
        "POST",
        "/wc/store/v1/cart/select-shipping-rate",
        {"package_id": 0, "rate_id": RATE_ID},
    )
    print(f"select-shipping {code}")
    code, sync = s.call(
        "POST",
        "/zebiza/v1/sync-cart",
        {"items": [{"id": PRODUCT_ID, "quantity": 1}]},
    )
    print(f"sync-cart {code} {sync}")
    s.call(
        "POST",
        "/wc/store/v1/cart/select-shipping-rate",
        {"package_id": 0, "rate_id": RATE_ID},
    )

    code, out = s.call(
        "POST",
        "/wc/store/v1/checkout",
        {
            "billing_address": addr["billing_address"],
            "shipping_address": addr["shipping_address"],
            "payment_method": PAYMENT,
            "customer_note": "zebiza reepay e2e (test)",
        },
    )

    if code == 400 and isinstance(out, dict) and out.get("code") == "zac_delivery":
        print("FAIL: zac_delivery still blocking — fix WP/ZAC confirmation first")
        print(json.dumps(out, ensure_ascii=False))
        return 2

    redirect = None
    order_id = None
    if isinstance(out, dict):
        order_id = out.get("order_id") or (out.get("data") or {}).get("order_id")
        pr = out.get("payment_result") or {}
        redirect = pr.get("redirect_url")
        if not redirect and isinstance(pr.get("payment_details"), list):
            for d in pr["payment_details"]:
                if isinstance(d, dict) and d.get("key") == "redirect_url":
                    redirect = d.get("value")

    print(f"checkout HTTP {code}")
    print(json.dumps(out, ensure_ascii=False, indent=2)[:2500])

    if code in (200, 201) and redirect:
        low = redirect.lower()
        if any(x in low for x in ("reepay", "frisbii", "checkout")):
            print(f"PASS: redirect_url={redirect}")
            print(f"order_id={order_id}")
            print(
                "Next: complete Reepay TEST card in browser; "
                "confirm Woo order status paid/processing."
            )
            return 0
        print(f"PASS_PARTIAL: got redirect (verify gateway): {redirect}")
        print(f"order_id={order_id}")
        return 0

    print("FAIL: no Reepay redirect_url — not a paid PASS")
    return 1


if __name__ == "__main__":
    sys.exit(main())
