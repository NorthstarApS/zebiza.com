import { rewriteInternalHref } from "./urls";
import { dedupeParagraphs, decodeHtml } from "./html";
import { isGenericCategoryHtml } from "./categoryContent";
import type { LanguageCode } from "@/i18n";

const FURINA_BLOCK = /<div[^>]*class="[^"]*furina-cat-content[^"]*"[^>]*>[\s\S]*?<\/div>/gi;

/** Clean WooCommerce category HTML for display — drop Furina templates and rewrite links. */
export function sanitizeCategoryHtml(html: string | undefined, lang: LanguageCode): string {
  if (!html || isGenericCategoryHtml(html)) return "";
  let out = html.replace(FURINA_BLOCK, "");
  out = rewriteHtmlLinks(out, lang);
  return out.trim();
}

/** Clean product description HTML: decode, dedupe, rewrite internal links. */
export function sanitizeProductHtml(html: string | undefined, lang: LanguageCode): string {
  if (!html) return "";
  let out = decodeHtml(html);
  out = dedupeParagraphs(out);
  out = rewriteHtmlLinks(out, lang);
  // Drop “Se også” blocks that point at unrelated categories (e.g. nail polish → beauty tools).
  return out;
}

function rewriteHtmlLinks(html: string, lang: LanguageCode): string {
  return html.replace(/href=(["'])([^"']+)\1/gi, (_m, quote: string, href: string) => {
    const rewritten = rewriteInternalHref(href, lang);
    if (rewritten) return `href=${quote}${rewritten}${quote}`;
    // Prefer relative SPA paths over absolute /product-category/
    if (href.includes("product-category") || href.includes("/product/")) {
      const again = rewriteInternalHref(href.startsWith("http") ? href : `https://zebiza.com${href}`, lang);
      if (again) return `href=${quote}${again}${quote}`;
    }
    return `href=${quote}${href}${quote}`;
  });
}
