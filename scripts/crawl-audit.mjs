#!/usr/bin/env node
/**
 * Local crawl audit of sitemap URLs + critical internal paths.
 * Checks for 200 / 3xx / 4xx and that sitemap entries are not redirects.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ORIGIN = process.env.AUDIT_ORIGIN || "https://zebiza.com";

async function probe(url) {
  try {
    const res = await fetch(url, { redirect: "manual", headers: { "User-Agent": "ZebizaCrawlAudit/1.0" } });
    return { url, status: res.status, location: res.headers.get("location") || null };
  } catch (err) {
    return { url, status: 0, error: String(err) };
  }
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const sitemapPath = join(ROOT, "public/sitemap.xml");
  const xml = readFileSync(sitemapPath, "utf8");
  const locs = parseSitemap(xml);

  const samples = [
    `${ORIGIN}/da`,
    `${ORIGIN}/da/kategori/hudpleje-ansigt`,
    `${ORIGIN}/da/kategori/harpleje`,
    `${ORIGIN}/da/kategori/nails`,
    `${ORIGIN}/product-category/skincare`,
    `${ORIGIN}/product/catalog-product-15691`,
    `${ORIGIN}/merchant-feed.xml`,
    `${ORIGIN}/sitemap.xml`,
    `${ORIGIN}/robots.txt`,
  ];

  // Sample up to 40 product URLs from local sitemap
  const productSamples = locs.filter((u) => u.includes("/produkt/")).slice(0, 40);
  const categorySamples = locs.filter((u) => u.includes("/kategori/"));
  const toCheck = [...new Set([...samples, ...categorySamples, ...productSamples])];

  console.log(`Auditing ${toCheck.length} URLs against ${ORIGIN}`);
  const results = [];
  for (const url of toCheck) {
    // For local sitemap product URLs, rewrite host if needed
    const target = url.startsWith("http") ? url : `${ORIGIN}${url}`;
    const r = await probe(target);
    results.push(r);
    const mark = r.status === 200 ? "OK" : r.status >= 300 && r.status < 400 ? "REDIR" : "FAIL";
    console.log(mark, r.status, r.url, r.location || "");
  }

  const summary = {
    checked: results.length,
    ok200: results.filter((r) => r.status === 200).length,
    redirect3xx: results.filter((r) => r.status >= 300 && r.status < 400).length,
    client4xx: results.filter((r) => r.status >= 400 && r.status < 500).length,
    server5xx: results.filter((r) => r.status >= 500).length,
    errors: results.filter((r) => r.status === 0).length,
    sitemapUrlCount: locs.length,
  };

  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(
    join(ROOT, "reports/crawl-audit.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, results }, null, 2),
  );
  console.log("Summary", summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
