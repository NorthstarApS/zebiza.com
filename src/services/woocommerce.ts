import type { LanguageCode } from "@/i18n";
import type {
  ProductQuery,
  StoreProduct,
  WCBrand,
  WCCategory,
  WCProduct,
} from "@/types/woocommerce";
import { mockCategories, mockProducts, collectionFilters } from "@/lib/mockData";
import { decodeHtml } from "@/lib/html";
import { getWpApiBase } from "@/lib/site";
import { isLikelyNonBeautyProduct } from "@/lib/beautyCatalog";
import { sanitizeProductHtml } from "@/lib/contentSanitize";

/**
 * Product/catalog client via WooCommerce Store API (public, no consumer keys).
 * Falls back to local mock catalog when the backend is unreachable.
 */

export const wcConfigured = true;

function storeUrl(path: string, params: Record<string, string | number | boolean | undefined>, lang?: LanguageCode) {
  const base = getWpApiBase();
  const url = new URL(`${base}/wp-json/wc/store/v1${path}`, typeof window !== "undefined" ? window.location.origin : "https://zebiza.com");
  if (lang) url.searchParams.set("lang", lang);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function storeGet<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
  lang?: LanguageCode,
): Promise<{ data: T | null; total?: number }> {
  try {
    const res = await fetch(storeUrl(path, params, lang), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Store ${res.status}`);
    const totalHeader = res.headers.get("X-WP-Total") ?? res.headers.get("x-wp-total");
    const data = (await res.json()) as T;
    return { data, total: totalHeader ? Number(totalHeader) : undefined };
  } catch (err) {
    console.warn("[woocommerce] store fetch failed:", err);
    return { data: null };
  }
}

function minorToMajor(amount: string, minorUnit: number): number {
  return Number(amount) / Math.pow(10, minorUnit ?? 2);
}

export function mapStoreProduct(p: StoreProduct, lang: LanguageCode = "da"): WCProduct {
  const unit = p.prices.currency_minor_unit ?? 2;
  const price = minorToMajor(p.prices.price, unit);
  const regular = minorToMajor(p.prices.regular_price, unit);
  const sale = p.on_sale ? minorToMajor(p.prices.sale_price, unit) : price;
  const brand = p.brands?.[0];

  // Prefer GTIN encoded in image filename when present (common in this catalog).
  const gtinFromImage = p.images
    .map((img) => img.src.match(/(?:^|\/|_)(\d{8,14})(?:_|\.|-)/)?.[1])
    .find(Boolean);

  return {
    id: p.id,
    name: decodeHtml(p.name),
    slug: p.slug,
    permalink: p.permalink,
    sku: p.sku,
    price: String(price),
    regular_price: String(regular),
    sale_price: p.on_sale ? String(sale) : "",
    on_sale: p.on_sale,
    stock_status: p.is_in_stock ? "instock" : p.is_on_backorder ? "onbackorder" : "outofstock",
    average_rating: p.average_rating || "0",
    rating_count: p.review_count ?? 0,
    short_description: sanitizeProductHtml(p.short_description ?? "", lang),
    description: sanitizeProductHtml(p.description ?? "", lang),
    images: (p.images ?? []).map((img) => ({
      id: img.id,
      src: img.src,
      alt: decodeHtml(img.alt || p.name),
    })),
    categories: (p.categories ?? []).map((c) => ({
      id: c.id,
      name: decodeHtml(c.name),
      slug: c.slug,
    })),
    brand: brand ? { id: brand.id, name: decodeHtml(brand.name), slug: brand.slug } : undefined,
    brands: (p.brands ?? []).map((b) => ({ id: b.id, name: decodeHtml(b.name), slug: b.slug })),
    gtin: gtinFromImage,
    badges: deriveBadges(p),
  };
}

function deriveBadges(p: StoreProduct): WCProduct["badges"] {
  const badges: NonNullable<WCProduct["badges"]> = [];
  if (p.on_sale) badges.push("tilbud");
  const catSlugs = (p.categories ?? []).map((c) => c.slug);
  if (catSlugs.some((s) => /hudpleje|kosmetik|harpleje|beauty|parfume|nail|negle/.test(s))) {
    badges.push("beauty");
  }
  return badges;
}

// ---- Local fallback --------------------------------------------------------

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
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.short_description.toLowerCase().includes(s) ||
        p.sku?.toLowerCase().includes(s) ||
        p.brand?.name.toLowerCase().includes(s),
    );
  }
  if (q.onSale) list = list.filter((p) => p.on_sale);
  if (q.inStock) list = list.filter((p) => p.stock_status === "instock");
  if (q.beautyOnly) list = list.filter((p) => !isLikelyNonBeautyProduct(p.name, p.slug));
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
          Number(b.regular_price) - Number(b.price) - (Number(a.regular_price) - Number(a.price)),
      );
      break;
    default:
      list.sort((a, b) => b.rating_count - a.rating_count);
  }

  if (q.perPage) list = list.slice(0, q.perPage);
  return list;
}

let categoryCache: { lang: string; at: number; cats: WCCategory[] } | null = null;

export async function getCategories(lang: LanguageCode = "da"): Promise<WCCategory[]> {
  if (categoryCache && categoryCache.lang === lang && Date.now() - categoryCache.at < 5 * 60_000) {
    return categoryCache.cats;
  }
  const { data } = await storeGet<
    {
      id: number;
      name: string;
      slug: string;
      count: number;
      description?: string;
      parent?: number;
      image?: { id: number; src: string; alt?: string } | null;
    }[]
  >("/products/categories", { per_page: 100, hide_empty: true }, lang);

  if (!data) return mockCategories;
  const cats: WCCategory[] = data.map((c) => ({
    id: c.id,
    name: decodeHtml(c.name),
    slug: c.slug,
    count: c.count,
    description: c.description,
    parent: c.parent,
    image: c.image ? { id: c.image.id, src: c.image.src, alt: c.image.alt ?? c.name } : null,
  }));
  categoryCache = { lang, at: Date.now(), cats };
  return cats;
}

export async function getCategoryBySlug(slug: string, lang: LanguageCode = "da"): Promise<WCCategory | null> {
  const cats = await getCategories(lang);
  return cats.find((c) => c.slug === slug) ?? null;
}

export async function getBrands(lang: LanguageCode = "da"): Promise<WCBrand[]> {
  const { data } = await storeGet<
    { id: number; name: string; slug: string; count?: number; description?: string }[]
  >("/products/brands", { per_page: 100 }, lang);
  if (!data) return [];
  return data.map((b) => ({
    id: b.id,
    name: decodeHtml(b.name),
    slug: b.slug,
    count: b.count,
    description: b.description,
  }));
}

export async function getBrandBySlug(slug: string, lang: LanguageCode = "da"): Promise<WCBrand | null> {
  const brands = await getBrands(lang);
  return brands.find((b) => b.slug === slug) ?? null;
}

async function resolveCategoryId(q: ProductQuery, lang: LanguageCode): Promise<number | undefined> {
  if (q.categoryId) return q.categoryId;
  if (!q.category) return undefined;
  if (/^\d+$/.test(q.category)) return Number(q.category);
  // Collection keys are not Woo categories — handled locally / via search heuristics
  if (collectionFilters[q.category]) return undefined;
  const cat = await getCategoryBySlug(q.category, lang);
  return cat?.id;
}

export async function getProducts(q: ProductQuery = {}, lang: LanguageCode = "da"): Promise<WCProduct[]> {
  // Collection merchandising keys (nyheder, beauty, …) use local heuristics on fetched lists
  if (q.category && collectionFilters[q.category]) {
    const { data } = await storeGet<StoreProduct[]>(
      "/products",
      {
        per_page: Math.min(q.perPage ?? 24, 100),
        orderby: "date",
        order: "desc",
      },
      lang,
    );
    const mapped = (data ?? []).map((p) => mapStoreProduct(p, lang));
    const source = data ? mapped : mockProducts;
    return applyLocalQuery(source, q);
  }

  const categoryId = await resolveCategoryId(q, lang);
  const orderMap: Record<string, { orderby: string; order?: string }> = {
    popularity: { orderby: "popularity" },
    date: { orderby: "date", order: "desc" },
    price: { orderby: "price", order: "asc" },
    "price-desc": { orderby: "price", order: "desc" },
    saving: { orderby: "price", order: "asc" },
    relevance: { orderby: "date" },
  };
  const o = q.orderby ? orderMap[q.orderby] : { orderby: "date", order: "desc" };

  const { data } = await storeGet<StoreProduct[]>(
    "/products",
    {
      category: categoryId,
      search: q.search,
      on_sale: q.onSale || undefined,
      min_price: q.minPrice,
      max_price: q.maxPrice,
      stock_status: q.inStock ? "instock" : undefined,
      per_page: q.perPage ?? 24,
      page: q.page ?? 1,
      orderby: o?.orderby,
      order: o?.order,
    },
    lang,
  );

  if (!data) return applyLocalQuery(mockProducts, q);

  let products = data.map((p) => mapStoreProduct(p, lang));
  if (q.beautyOnly) products = products.filter((p) => !isLikelyNonBeautyProduct(p.name, p.slug));
  if (q.orderby === "saving") {
    products.sort(
      (a, b) =>
        Number(b.regular_price) - Number(b.price) - (Number(a.regular_price) - Number(a.price)),
    );
  }
  return products;
}

export async function getAllProducts(lang: LanguageCode = "da", maxPages = 20): Promise<WCProduct[]> {
  const all: WCProduct[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const { data } = await storeGet<StoreProduct[]>(
      "/products",
      { per_page: 100, page, orderby: "date", order: "desc" },
      lang,
    );
    if (!data?.length) break;
    all.push(...data.map((p) => mapStoreProduct(p, lang)));
    if (data.length < 100) break;
  }
  return all;
}

export async function getProductBySlug(slug: string, lang: LanguageCode = "da"): Promise<WCProduct | null> {
  const { data } = await storeGet<StoreProduct[]>("/products", { slug, per_page: 1 }, lang);
  if (data?.length) return mapStoreProduct(data[0], lang);
  return mockProducts.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: number, lang: LanguageCode = "da"): Promise<WCProduct | null> {
  const { data } = await storeGet<StoreProduct>(`/products/${id}`, {}, lang);
  if (data && !Array.isArray(data)) return mapStoreProduct(data, lang);
  return mockProducts.find((p) => p.id === id) ?? null;
}

export async function getProductVariations(id: number, lang: LanguageCode = "da") {
  const { data } = await storeGet<unknown[]>(`/products/${id}/variations`, {}, lang);
  return data ?? [];
}
