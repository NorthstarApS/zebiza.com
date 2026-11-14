/** Decode HTML entities and strip tags for plain-text SEO fields. */

export function decodeHtml(input: string | undefined | null): string {
  if (!input) return "";
  if (typeof document !== "undefined") {
    const el = document.createElement("textarea");
    el.innerHTML = input;
    return el.value;
  }
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

export function stripTags(input: string | undefined | null): string {
  return decodeHtml(input)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove consecutive duplicate paragraphs from HTML or plain text. */
export function dedupeParagraphs(html: string): string {
  if (!html) return "";
  // Prefer splitting on block boundaries when HTML is present.
  if (/<[a-z][\s\S]*>/i.test(html)) {
    const parts = html.split(/(?=<(?:p|div|li|h[1-6])\b)/i);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const part of parts) {
      const key = stripTags(part).toLowerCase();
      if (!key) {
        out.push(part);
        continue;
      }
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(part);
    }
    return out.join("");
  }

  const paras = html.split(/\n{2,}/);
  const seen = new Set<string>();
  return paras
    .filter((p) => {
      const key = p.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n\n");
}
