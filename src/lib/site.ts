/** Site-wide constants and absolute URL helpers for SEO. */

export const SITE_ORIGIN = (
  (import.meta.env.VITE_SITE_ORIGIN as string | undefined) ?? "https://zebiza.com"
).replace(/\/$/, "");

export const DEFAULT_LOCALE = "da" as const;

export const INDEXABLE_LOCALES = ["da"] as const;
export type IndexableLocale = (typeof INDEXABLE_LOCALES)[number];

/**
 * WooCommerce API origin. Resolved at call-time so local preview can use the
 * Vite `/wp-json` proxy (same-origin) instead of a build-time absolute URL that
 * trips CORS and falls back to mock data.
 */
export function getWpApiBase(): string {
  const fromEnv = import.meta.env.VITE_WP_API_BASE as string | undefined;
  if (fromEnv !== undefined) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith("zebiza.com")
    ) {
      return "";
    }
  }
  return SITE_ORIGIN;
}

/** @deprecated Prefer getWpApiBase() — kept for older imports. */
export const WP_API_BASE = SITE_ORIGIN;

/** Absolute URL for a path that already includes a locale prefix, or a root path. */
export function absoluteUrl(path: string): string {
  if (!path) return SITE_ORIGIN;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${clean === "/" ? "" : clean}`;
}

/** Canonical Danish product URL. */
export function productCanonicalPath(slug: string, lang = DEFAULT_LOCALE): string {
  return `/${lang}/produkt/${slug}`;
}

/** Canonical Danish category URL. */
export function categoryCanonicalPath(slug: string, lang = DEFAULT_LOCALE): string {
  return `/${lang}/kategori/${slug}`;
}

export function brandCanonicalPath(slug: string, lang = DEFAULT_LOCALE): string {
  return `/${lang}/brand/${slug}`;
}
