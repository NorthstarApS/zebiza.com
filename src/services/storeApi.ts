import type { LanguageCode } from "@/i18n";
import { getWpApiBase } from "@/lib/site";

/**
 * WooCommerce Store API (wc/store/v1) — cart, checkout, nonce/cart-token session.
 */

const NONCE_KEY = "zebiza_wc_nonce";
const CART_TOKEN_KEY = "zebiza_wc_cart_token";

export const storeConfigured = true;

function storeUrl(path: string, lang?: LanguageCode) {
  const base = getWpApiBase();
  const url = new URL(
    `${base}/wp-json/wc/store/v1${path}`,
    typeof window !== "undefined" ? window.location.origin : "https://zebiza.com",
  );
  if (lang) url.searchParams.set("lang", lang);
  return url.toString();
}

function readStored(key: string) {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function captureSession(res: Response) {
  const nonce = res.headers.get("Nonce") ?? res.headers.get("X-WC-Store-API-Nonce");
  const token = res.headers.get("Cart-Token") ?? res.headers.get("X-WC-Store-API-Cart-Token");
  if (nonce) writeStored(NONCE_KEY, nonce);
  if (token) writeStored(CART_TOKEN_KEY, token);
}

async function storeFetch<T>(
  path: string,
  lang: LanguageCode | undefined,
  init?: RequestInit,
): Promise<{ data: T | null; ok: boolean; status: number; error?: string }> {
  if (!storeConfigured) return { data: null, ok: false, status: 0, error: "not configured" };
  try {
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    const nonce = readStored(NONCE_KEY);
    const token = readStored(CART_TOKEN_KEY);
    if (nonce) {
      headers.set("Nonce", nonce);
      headers.set("X-WC-Store-API-Nonce", nonce);
    }
    if (token) {
      headers.set("Cart-Token", token);
      headers.set("X-WC-Store-API-Cart-Token", token);
    }

    const res = await fetch(storeUrl(path, lang), {
      credentials: "include",
      ...init,
      headers,
    });
    captureSession(res);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        (body as { message?: string }).message ?? `Store API ${path}: ${res.status}`;
      return { data: null, ok: false, status: res.status, error: message };
    }

    if (res.status === 204) return { data: null, ok: true, status: 204 };
    const data = (await res.json()) as T;
    return { data, ok: true, status: res.status };
  } catch (err) {
    console.warn("[storeApi] request failed:", err);
    return { data: null, ok: false, status: 0, error: String(err) };
  }
}

export interface StoreCart {
  items: {
    key: string;
    id: number;
    quantity: number;
    name: string;
    images?: { src: string }[];
    prices?: { price: string; currency_minor_unit?: number };
    permalink?: string;
  }[];
  totals?: {
    total_items: string;
    total_price: string;
    currency_minor_unit?: number;
  };
  coupons?: { code: string }[];
}

export interface PaymentGateway {
  id: string;
  title: string;
  description?: string;
  enabled?: boolean;
}

export const storeApi = {
  async ensureSession(lang: LanguageCode = "da") {
    return storeFetch<StoreCart>("/cart", lang, { method: "GET" });
  },

  getCart: (lang: LanguageCode = "da") => storeFetch<StoreCart>("/cart", lang),

  addItem: (id: number, quantity: number, lang: LanguageCode = "da") =>
    storeFetch<StoreCart>("/cart/add-item", lang, {
      method: "POST",
      body: JSON.stringify({ id, quantity }),
    }),

  updateItem: (key: string, quantity: number, lang: LanguageCode = "da") =>
    storeFetch<StoreCart>("/cart/update-item", lang, {
      method: "POST",
      body: JSON.stringify({ key, quantity }),
    }),

  removeItem: (key: string, lang: LanguageCode = "da") =>
    storeFetch<StoreCart>("/cart/remove-item", lang, {
      method: "POST",
      body: JSON.stringify({ key }),
    }),

  applyCoupon: (code: string, lang: LanguageCode = "da") =>
    storeFetch<StoreCart>("/cart/apply-coupon", lang, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  selectShippingRate: (rateId: string, packageId = 0, lang: LanguageCode = "da") =>
    storeFetch<StoreCart>("/cart/select-shipping-rate", lang, {
      method: "POST",
      body: JSON.stringify({ rate_id: rateId, package_id: packageId }),
    }),

  checkout: (payload: unknown, lang: LanguageCode = "da") =>
    storeFetch<Record<string, unknown>>("/checkout", lang, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  async paymentGateways(): Promise<PaymentGateway[]> {
    try {
      const base = getWpApiBase();
      const url = new URL(
        `${base}/wp-json/zebiza/v1/payment-gateways`,
        typeof window !== "undefined" ? window.location.origin : "https://zebiza.com",
      );
      const res = await fetch(url.toString(), {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return [];
      return (await res.json()) as PaymentGateway[];
    } catch {
      return [];
    }
  },
};
