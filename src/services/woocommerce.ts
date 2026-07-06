import type { LanguageCode } from "@/i18n";
import type { WCCategory, WCProduct, ProductQuery } from "@/types/woocommerce";
import { mockCategories, mockProducts, collectionFilters } from "@/lib/mockData";

/**
 * WooCommerce REST API (wc/v3) client.
 *
 * Reads products & categories. Auth via consumer key/secret query params.
 * All requests append ?lang=<code> so WPML / Polylang can return translated
 * content. When the backend is unreachable or keys are missing, we fall back
 * to a local catalog so the frontend stays fully browsable during design.
 */

const API_BASE = (import.meta.env.VITE_WP_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";
const CONSUMER_KEY = (import.meta.env.VITE_WC_CONSUMER_KEY as string | undefined) ?? "";
const CONSUMER_SECRET = (import.meta.env.VITE_WC_CONSUMER_SECRET as string | undefined) ?? "";

export const wcConfigured = Boolean(API_BASE && CONSUMER_KEY && CONSUMER_SECRET);

function buildUrl(path: string, params: Record<string, string | number | boolean | undefined>, lang: LanguageCode) {
  const url = new URL(`${API_BASE}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", CONSUMER_KEY);
  url.searchParams.set("consumer_secret", CONSUMER_SECRET);
  url.searchParams.set("lang", lang); // WPML / Polylang language switch
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function wcFetch<T>(path: string, params: Record<string, string | number | boolean | undefined>, lang: LanguageCode): Promise<T | null> {
  if (!wcConfigured) return null;
  try {
    const res = await fetch(buildUrl(path, params, lang));
    if (!res.ok) throw new Error(`WC ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.warn("[woocommerce] falling back to local catalog:", err);
    return null;
  }
}

// ---- Local fallback query engine ------------------------------------------

function applyLocalQuery(products: WCProduct[], q: ProductQuery): WCProduct[] {
  let list = [...products];

  if (q.category) {
    const collection = collectionFilters[q.category];
    list = collection
      ? list.filter(collection)
      : list.filter((p) => p.categories.some((c) => c.slug === q.category));
  }
  if (q.search) {
    const s = q.search.toLowerCase();
    list = list.filter(
      (p) => p.name.toLowerCase().includes(s) || p.short_description.toLowerCase().includes(s),
    );
  }
  if (q.onSale) list = list.filter((p) => p.on_sale);
  if (q.inStock) list = list.filter((p) => p.stock_status === "instock");
  if (q.tag) list = list.filter((p) => p.badges?.includes(q.tag as never));
  if (q.minPrice != null) list = list.filter((p) => Number(p.price) >= q.minPrice!);
  if (q.maxPrice != null) list = list.filter((p) => Number(p.price) <= q.maxPrice!);

  switch (q.orderby) {
    case "price":
      list.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case "price-desc":
      list.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case "date":
      list.sort((a, b) => b.id - a.id);
      break;
    case "saving":
      list.sort(
        (a, b) =>
          (Number(b.regular_price) - Number(b.price)) - (Number(a.regular_price) - Number(a.price)),
      );
      break;
    default:
      list.sort((a, b) => b.rating_count - a.rating_count);
  }

  if (q.perPage) list = list.slice(0, q.perPage);
  return list;
}

// ---- Public API ------------------------------------------------------------

export async function getProducts(q: ProductQuery = {}, lang: LanguageCode = "da"): Promise<WCProduct[]> {
  const orderMap: Record<string, { orderby: string; order?: string }> = {
    popularity: { orderby: "popularity" },
    date: { orderby: "date" },
    price: { orderby: "price", order: "asc" },
    "price-desc": { orderby: "price", order: "desc" },
    saving: { orderby: "popularity" },
    relevance: { orderby: "relevance" },
  };
  const o = q.orderby ? orderMap[q.orderby] : undefined;

  const data = await wcFetch<WCProduct[]>(
    "/products",
    {
      category: q.category,
      search: q.search,
      on_sale: q.onSale,
      featured: q.featured,
      min_price: q.minPrice,
      max_price: q.maxPrice,
      stock_status: q.inStock ? "instock" : undefined,
      per_page: q.perPage ?? 24,
      orderby: o?.orderby,
      order: o?.order,
      tag: q.tag,
    },
    lang,
  );

  if (data) return data;
  return applyLocalQuery(mockProducts, q);
}

export async function getProductBySlug(slug: string, lang: LanguageCode = "da"): Promise<WCProduct | null> {
  const data = await wcFetch<WCProduct[]>("/products", { slug, per_page: 1 }, lang);
  if (data && data.length) return data[0];
  return mockProducts.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: number, lang: LanguageCode = "da"): Promise<WCProduct | null> {
  const data = await wcFetch<WCProduct>(`/products/${id}`, {}, lang);
  if (data) return data;
  return mockProducts.find((p) => p.id === id) ?? null;
}

export async function getProductVariations(id: number, lang: LanguageCode = "da") {
  const data = await wcFetch<unknown[]>(`/products/${id}/variations`, {}, lang);
  return data ?? [];
}

export async function getCategories(lang: LanguageCode = "da"): Promise<WCCategory[]> {
  const data = await wcFetch<WCCategory[]>("/products/categories", { per_page: 100, hide_empty: true }, lang);
  return data ?? mockCategories;
}

export async function getCategoryBySlug(slug: string, lang: LanguageCode = "da"): Promise<WCCategory | null> {
  const cats = await getCategories(lang);
  return cats.find((c) => c.slug === slug) ?? null;
}
