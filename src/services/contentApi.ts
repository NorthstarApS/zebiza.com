import type { LanguageCode } from "@/i18n";

/**
 * WordPress content (pages) API — wp/v2.
 *
 * Fetches CMS-managed pages/content by slug so editorial content and legal
 * pages can be maintained in WordPress and translated via WPML / Polylang.
 * Falls back to null (components then use the local i18n copy).
 */

const API_BASE = (import.meta.env.VITE_WP_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

export interface WPPage {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
}

export async function getPageBySlug(slug: string, lang: LanguageCode = "da"): Promise<WPPage | null> {
  if (!API_BASE) return null;
  try {
    const url = new URL(`${API_BASE}/wp-json/wp/v2/pages`);
    url.searchParams.set("slug", slug);
    url.searchParams.set("lang", lang);
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
  if (!API_BASE) return null;
  try {
    const url = new URL(`${API_BASE}/wp-json/wp/v2/menu-items`);
    url.searchParams.set("menus", location);
    url.searchParams.set("lang", lang);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`WP ${res.status}`);
    return (await res.json()) as unknown[];
  } catch {
    return null;
  }
}
