#!/usr/bin/env node
/**
 * Build-time sitemap + Google Merchant feed generator.
 * Uses the public WooCommerce Store API — no consumer keys required.
 *
 * Outputs:
 *   public/sitemap.xml
 *   public/merchant-feed.xml
 *   reports/merchant-validation.json
 *   reports/baseline-inventory.json
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ORIGIN = process.env.VITE_SITE_ORIGIN || "https://zebiza.com";
const API = (process.env.VITE_WP_API_BASE || ORIGIN).replace(/\/$/, "");

const INDEXABLE_LOCALES = ["da"]; // secondary locales intentionally omitted from sitemap
const STATIC_PATHS = [
  { path: "/", priority: "1.0" },
  { path: "/da", priority: "1.0" },
  { path: "/da/shop", priority: "0.9" },
  { path: "/da/tilbud", priority: "0.8" },
  { path: "/da/brands", priority: "0.7" },
  { path: "/da/om-zebiza", priority: "0.3" },
  { path: "/da/levering-og-returnering", priority: "0.3" },
  { path: "/da/handelsbetingelser", priority: "0.3" },
  { path: "/da/privatlivspolitik", priority: "0.3" },
  { path: "/da/cookiepolitik", priority: "0.3" },
  { path: "/da/kontakt", priority: "0.3" },
];

const NON_BEAUTY =
  /gasmaske|elastikbånd|elastikband|\bkontor\b|tandbørste|tandboerste|tandrens|vandflosser|water\s*floss|hårsteamere|haarsteamere|hårvaskemåtte|haarvaskemaatte|hårtølling|haartoelling|negleservicebord|nebulizer|kemisk beskyttelse/i;

const CATEGORY_CANONICAL = {
  nails: "nails",
  "nail-care": "nails",
  "beauty-tools-generelt": "beauty-tools",
  "facial-tools": "beauty-tools",
  "parfume-kvinder": "parfume-dufte",
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const total = res.headers.get("X-WP-Total") || res.headers.get("x-wp-total");
  return { data: await res.json(), total: total ? Number(total) : undefined };
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 30; page++) {
    const url = `${API}/wp-json/wc/store/v1/products?per_page=100&page=${page}&orderby=date&order=desc`;
    const { data } = await fetchJson(url);
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  // Also pull by major categories to catch items not in default listing
  const { data: cats } = await fetchJson(
    `${API}/wp-json/wc/store/v1/products/categories?per_page=100&hide_empty=true`,
  );
  for (const cat of cats) {
    const { data } = await fetchJson(
      `${API}/wp-json/wc/store/v1/products?per_page=100&category=${cat.id}`,
    );
    for (const p of data || []) {
      if (!all.some((x) => x.id === p.id)) all.push(p);
    }
  }
  return { products: all, categories: cats };
}

function decode(s = "") {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8211;/g, "–")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function minor(amount, unit = 2) {
  return Number(amount) / Math.pow(10, unit);
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function gtinFromProduct(p) {
  for (const img of p.images || []) {
    const m = (img.src || "").match(/(?:^|\/|_)(\d{8,14})(?:_|\.|-)/);
    if (m) return m[1];
  }
  return "";
}

function productUrl(slug) {
  return `${ORIGIN}/da/produkt/${slug}`;
}

function categoryOwnerSlug(slug) {
  return CATEGORY_CANONICAL[slug] || slug;
}

function buildSitemap(products, categories) {
  const urls = [...STATIC_PATHS];
  const seenCats = new Set();
  for (const c of categories) {
    if (!c.count) continue;
    const slug = categoryOwnerSlug(c.slug);
    if (seenCats.has(slug)) continue;
    seenCats.add(slug);
    urls.push({ path: `/da/kategori/${slug}`, priority: "0.8" });
  }
  for (const p of products) {
    if (!p.is_in_stock) continue;
    if (NON_BEAUTY.test(`${p.name} ${p.slug}`)) continue;
    urls.push({
      path: `/da/produkt/${p.slug}`,
      priority: "0.7",
      lastmod: new Date().toISOString(),
    });
  }

  const body = urls
    .map((u) => {
      const loc = u.path === "/" ? ORIGIN : `${ORIGIN}${u.path}`;
      return `  <url><loc>${xmlEscape(loc)}</loc>${
        u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""
      }<priority>${u.priority}</priority></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function buildMerchantFeed(products) {
  const items = [];
  const errors = {
    missingTitle: 0,
    missingImage: 0,
    missingBrand: 0,
    missingGtin: 0,
    invalidUrl: 0,
    duplicateId: 0,
    duplicateGtin: 0,
    nonBeautySkipped: 0,
    outOfStock: 0,
  };
  const seenIds = new Set();
  const seenGtins = new Set();

  for (const p of products) {
    if (NON_BEAUTY.test(`${p.name} ${p.slug}`)) {
      errors.nonBeautySkipped++;
      continue;
    }
    if (!p.is_in_stock) {
      errors.outOfStock++;
      // Still include OOS with availability out of stock for Merchant accuracy
    }

    const id = String(p.id);
    if (seenIds.has(id)) {
      errors.duplicateId++;
      continue;
    }
    seenIds.add(id);

    const title = decode(p.name);
    const description = decode(p.description || p.short_description || p.name).slice(0, 5000);
    const link = productUrl(p.slug);
    const image = p.images?.[0]?.src || "";
    const brand = p.brands?.[0]?.name ? decode(p.brands[0].name) : "";
    const gtin = gtinFromProduct(p);
    const price = minor(p.prices.price, p.prices.currency_minor_unit);
    const availability = p.is_in_stock ? "in_stock" : "out_of_stock";

    if (!title) errors.missingTitle++;
    if (!image) errors.missingImage++;
    if (!brand) errors.missingBrand++;
    if (!gtin) errors.missingGtin++;
    if (!link.startsWith("https://")) errors.invalidUrl++;
    if (gtin) {
      if (seenGtins.has(gtin)) errors.duplicateGtin++;
      seenGtins.add(gtin);
    }

    const googleCat = guessGoogleCategory(p);

    items.push(`  <item>
    <g:id>${xmlEscape(id)}</g:id>
    <g:title>${xmlEscape(title)}</g:title>
    <g:description>${xmlEscape(description)}</g:description>
    <g:link>${xmlEscape(link)}</g:link>
    <g:image_link>${xmlEscape(image)}</g:image_link>
    <g:availability>${availability}</g:availability>
    <g:price>${price.toFixed(2)} DKK</g:price>
    <g:condition>new</g:condition>
    <g:brand>${xmlEscape(brand || "Zebiza")}</g:brand>
    ${gtin ? `<g:gtin>${xmlEscape(gtin)}</g:gtin>` : ""}
    ${!gtin && p.sku ? `<g:mpn>${xmlEscape(p.sku)}</g:mpn>` : gtin && p.sku ? `<g:mpn>${xmlEscape(p.sku)}</g:mpn>` : ""}
    <g:identifier_exists>${gtin || p.sku ? "yes" : "no"}</g:identifier_exists>
    <g:google_product_category>${xmlEscape(googleCat)}</g:google_product_category>
  </item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Zebiza.com Merchant Feed</title>
  <link>${ORIGIN}</link>
  <description>Danish beauty product feed (DKK)</description>
${items.join("\n")}
</channel>
</rss>
`;

  return { xml, count: items.length, errors };
}

function guessGoogleCategory(p) {
  const slugs = (p.categories || []).map((c) => c.slug).join(" ");
  if (/parfume|duft/.test(slugs)) return "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne";
  if (/kosmetik|makeup|eyeliner|oejenskygge/.test(slugs)) return "Health & Beauty > Personal Care > Cosmetics";
  if (/haar|harpleje/.test(slugs)) return "Health & Beauty > Personal Care > Hair Care";
  if (/nail|negle/.test(slugs)) return "Health & Beauty > Personal Care > Cosmetics > Nail Care";
  if (/beauty-tools|facial|spejl|pensler/.test(slugs)) return "Health & Beauty > Personal Care";
  if (/barber|skaeg|grooming/.test(slugs)) return "Health & Beauty > Personal Care > Shaving & Grooming";
  return "Health & Beauty > Personal Care > Skin Care";
}

async function main() {
  console.log("Fetching catalog from", API);
  const { products, categories } = await fetchAllProducts();
  console.log(`Products: ${products.length}, categories: ${categories.length}`);

  const sitemap = buildSitemap(products, categories);
  const { xml: feed, count, errors } = buildMerchantFeed(products);

  mkdirSync(join(ROOT, "public"), { recursive: true });
  mkdirSync(join(ROOT, "reports"), { recursive: true });

  writeFileSync(join(ROOT, "public/sitemap.xml"), sitemap);
  writeFileSync(join(ROOT, "public/merchant-feed.xml"), feed);
  writeFileSync(
    join(ROOT, "reports/merchant-validation.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        feedUrl: `${ORIGIN}/merchant-feed.xml`,
        productCount: count,
        sourceProducts: products.length,
        errors,
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(ROOT, "reports/baseline-inventory.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        products: products.length,
        categories: categories.length,
        localesIndexable: INDEXABLE_LOCALES,
        sitemapNote: "DA-only canonical URLs; EN/SV/DE excluded until complete",
      },
      null,
      2,
    ),
  );

  console.log("Wrote public/sitemap.xml");
  console.log("Wrote public/merchant-feed.xml", count, "items");
  console.log("Validation:", errors);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
