import type { LanguageCode } from "@/i18n";

/**
 * WooCommerce Store API (wc/store/v1) client — cart & checkout.
 *
 * The Store API uses cookie/nonce sessions rather than consumer keys.
 * These helpers are wired to the real endpoints and used by useCart; when
 * the backend is unreachable the cart falls back to local state so the UI
 * remains fully functional during design/preview.
 */

const API_BASE = (import.meta.env.VITE_WP_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

export const storeConfigured = Boolean(API_BASE);

function storeUrl(path: string, lang: LanguageCode) {
  const url = new URL(`${API_BASE}/wp-json/wc/store/v1${path}`);
  url.searchParams.set("lang", lang);
  return url.toString();
}

async function storeFetch<T>(
  path: string,
  lang: LanguageCode,
  init?: RequestInit,
): Promise<T | null> {
  if (!storeConfigured) return null;
  try {
    const res = await fetch(storeUrl(path, lang), {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
    if (!res.ok) throw new Error(`Store API ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.warn("[storeApi] request failed, using local cart:", err);
    return null;
  }
}

export const storeApi = {
  getCart: (lang: LanguageCode = "da") => storeFetch("/cart", lang),

  addItem: (id: number, quantity: number, lang: LanguageCode = "da") =>
    storeFetch("/cart/add-item", lang, {
      method: "POST",
      body: JSON.stringify({ id, quantity }),
    }),

  updateItem: (key: string, quantity: number, lang: LanguageCode = "da") =>
    storeFetch("/cart/update-item", lang, {
      method: "POST",
      body: JSON.stringify({ key, quantity }),
    }),

  removeItem: (key: string, lang: LanguageCode = "da") =>
    storeFetch("/cart/remove-item", lang, {
      method: "POST",
      body: JSON.stringify({ key }),
    }),

  applyCoupon: (code: string, lang: LanguageCode = "da") =>
    storeFetch("/cart/apply-coupon", lang, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  checkout: (payload: unknown, lang: LanguageCode = "da") =>
    storeFetch("/checkout", lang, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
