import type { LanguageCode } from "@/i18n";
import { getWpApiBase } from "@/lib/site";

/**
 * WordPress content (pages) API — wp/v2.
 *
 * Fetches CMS-managed pages/content by slug so editorial content and legal
 * pages can be maintained in WordPress and translated via WPML / Polylang.
 * Falls back to null (components then use the local i18n copy).
 */

export interface WPPage {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
}

function pageUrl(path: string, lang: LanguageCode) {
  const base = getWpApiBase();
  const url = new URL(
    `${base}/wp-json/wp/v2${path}`,
    typeof window !== "undefined" ? window.location.origin : "https://zebiza.com",
  );
  url.searchParams.set("lang", lang);
  return url;
}

export async function getPageBySlug(slug: string, lang: LanguageCode = "da"): Promise<WPPage | null> {
  try {
    const url = pageUrl("/pages", lang);
    url.searchParams.set("slug", slug);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`WP ${res.status}`);
    const data = (await res.json()) as WPPage[];
    return data[0] ?? null;
  } catch (err) {
    console.warn("[contentApi] page fetch failed:", err);
    return null;
  }
}

export async function getMenu(location: string, lang: LanguageCode = "da"): Promise<unknown[] | null> {
  try {
    const url = pageUrl("/menu-items", lang);
    url.searchParams.set("menus", location);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`WP ${res.status}`);
    return (await res.json()) as unknown[];
  } catch {
    return null;
  }
}
