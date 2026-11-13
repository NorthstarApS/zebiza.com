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
): Promise<{ data: T | null; ok: boolean; status: number; error?: string; code?: string }> {
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
      const code = (body as { code?: string }).code;
      return { data: null, ok: false, status: res.status, error: message, code };
    }

    if (res.status === 204) return { data: null, ok: true, status: 204 };
    const data = (await res.json()) as T;
    return { data, ok: true, status: res.status };
  } catch (err) {
    console.warn("[storeApi] request failed:", err);
    return { data: null, ok: false, status: 0, error: String(err) };
  }
}

export interface StoreShippingRate {
  rate_id: string;
  name: string;
  description?: string;
  delivery_time?: string;
  price: string;
  taxes?: string;
  selected?: boolean;
  currency_minor_unit?: number;
  currency_code?: string;
}

export interface StoreShippingPackage {
  package_id: number;
  name?: string;
  destination?: Record<string, string>;
  shipping_rates: StoreShippingRate[];
}

export interface StoreCartTotals {
  total_items: string;
  total_items_tax?: string;
  total_discount?: string;
  total_shipping?: string | null;
  total_shipping_tax?: string | null;
  total_price: string;
  total_tax?: string;
  currency_code?: string;
  currency_minor_unit?: number;
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
  totals?: StoreCartTotals;
  coupons?: { code: string }[];
  shipping_rates?: StoreShippingPackage[];
  has_calculated_shipping?: boolean;
  needs_shipping?: boolean;
  payment_methods?: string[];
}

export interface PaymentGateway {
  id: string;
  title: string;
  description?: string;
  enabled?: boolean;
}

export interface CheckoutResult {
  order_id?: number;
  order_number?: string;
  status?: string;
  order_key?: string;
  payment_method?: string;
  payment_result?: {
    payment_status?: string;
    payment_details?: { key: string; value: string }[];
    redirect_url?: string;
  } | null;
}

export function minorToMajor(amount: string | number | null | undefined, minor = 2): number {
  if (amount == null || amount === "") return 0;
  return Number(amount) / Math.pow(10, minor);
}

export function shippingRateMajor(rate: StoreShippingRate): number {
  const minor = rate.currency_minor_unit ?? 2;
  return minorToMajor(rate.price, minor) + minorToMajor(rate.taxes ?? "0", minor);
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

  updateCustomer: (
    payload: {
      billing_address?: Record<string, string>;
      shipping_address?: Record<string, string>;
    },
    lang: LanguageCode = "da",
  ) =>
    storeFetch<StoreCart>("/cart/update-customer", lang, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  selectShippingRate: (rateId: string, packageId = 0, lang: LanguageCode = "da") =>
    storeFetch<StoreCart>("/cart/select-shipping-rate", lang, {
      method: "POST",
      body: JSON.stringify({ rate_id: rateId, package_id: packageId }),
    }),

  checkout: (payload: unknown, lang: LanguageCode = "da") =>
    storeFetch<CheckoutResult>("/checkout", lang, {
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
