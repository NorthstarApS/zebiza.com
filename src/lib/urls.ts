/**
 * Normalize legacy WooCommerce / multilingual paths to the SPA canonical routes.
 * Internal links must never point at redirects.
 */

import type { LanguageCode } from "@/i18n";
import { DEFAULT_LOCALE } from "./site";

const LEGACY_PRODUCT = /^\/(?:[a-z]{2}\/)?(?:product|produkt)\/([^/?#]+)/i;
const LEGACY_CATEGORY = /^\/(?:[a-z]{2}\/)?(?:product-category|produkt-kategori|kategori)\/(?:.+\/)?([^/?#]+)/i;
const LEGACY_BRAND = /^\/(?:[a-z]{2}\/)?(?:varemærke|varemaerke|brand|product-brand)\/([^/?#]+)/i;

/** Map English/legacy category slugs to the Danish canonical category slug. */
export const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  skincare: "hudpleje-ansigt",
  haircare: "harpleje",
  "hair-care": "harpleje",
  nails: "negle",
  "nail-care": "neglepleje",
  makeup: "kosmetik-ansigt",
  cosmetics: "kosmetik-ansigt",
  perfume: "parfume-dufte",
  "beauty-tools-generelt": "beauty-tools",
  "facial-tools": "beauty-tools",
};

/** Categories that should consolidate onto a stronger owner URL. */
export const CATEGORY_CANONICAL_OWNER: Record<string, string> = {
  nails: "negle",
  "nail-care": "negle",
  "beauty-tools-generelt": "beauty-tools",
  "facial-tools": "beauty-tools",
  "makeup-pensler": "beauty-tools",
  spejle: "beauty-tools",
  "parfume-kvinder": "parfume-dufte",
};

export function resolveCategorySlug(slug: string): string {
  const alias = CATEGORY_SLUG_ALIASES[slug] ?? slug;
  return CATEGORY_CANONICAL_OWNER[alias] ?? alias;
}

/**
 * Rewrite an href (absolute or relative) to an internal SPA path when possible.
 * Returns a locale-prefixed path starting with /da|en|... or null if unknown.
 */
export function rewriteInternalHref(href: string, lang: LanguageCode = DEFAULT_LOCALE): string | null {
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }

  let path = href;
  try {
    if (href.startsWith("http")) {
      const u = new URL(href);
      if (!u.hostname.endsWith("zebiza.com")) return null;
      path = u.pathname;
    }
  } catch {
    return null;
  }

  path = path.replace(/\/+$/, "") || "/";

  const product = path.match(LEGACY_PRODUCT);
  if (product) return `/${lang}/produkt/${product[1]}`;

  const brand = path.match(LEGACY_BRAND);
  if (brand) return `/${lang}/brand/${brand[1]}`;

  const category = path.match(LEGACY_CATEGORY);
  if (category) {
    const slug = resolveCategorySlug(category[1]);
    return `/${lang}/kategori/${slug}`;
  }

  // Already a SPA path without locale
  if (path.startsWith("/kategori/") || path.startsWith("/produkt/") || path.startsWith("/brand/")) {
    return `/${lang}${path}`;
  }

  return null;
}

/** Strip query/hash and trailing slash for comparison. */
export function normalizePath(path: string): string {
  return path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
}
