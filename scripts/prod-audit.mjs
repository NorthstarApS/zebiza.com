#!/usr/bin/env node
/**
 * Production HTTP audit — SSR signals, feed MIME, redirects, branding.
 * Usage: node scripts/prod-audit.mjs [origin]
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ORIGIN = (process.argv[2] || process.env.AUDIT_ORIGIN || "https://zebiza.com").replace(
  /\/$/,
  "",
);

const URLS = [
  { path: "/da/", expect: { status: 200, hasH1: true, noLinea: true }, follow: true },
  {
    path: "/da/kategori/hudpleje-ansigt/",
    expect: { status: 200, hasH1: true, titleIncludes: "Hudpleje", noLinea: true },
    follow: true,
  },
  { path: "/da/kategori/harpleje/", expect: { status: 200, hasH1: true }, follow: true },
  { path: "/da/kategori/nails/", expect: { status: 200, hasH1: true }, follow: true },
  { path: "/da/brands/", expect: { status: 200, hasH1: true }, follow: true },
  { path: "/sitemap.xml", expect: { status: 200, xml: true } },
  { path: "/robots.txt", expect: { status: 200, text: true } },
  { path: "/merchant-feed.xml", expect: { status: 200, xml: true, notHtml: true } },
  { path: "/google-merchant.xml", expect: { status: [200, 301, 302], allowRedirect: true } },
  { path: "/product-category/hudpleje-ansigt", expect: { status: [301, 302], allowRedirect: true } },
  { path: "/this-path-should-not-exist-zebiza-qa-404", expect: { soft404Check: true } },
];

async function fetchOne(path, { follow = false } = {}) {
  const url = `${ORIGIN}${path}`;
  const res = await fetch(url, {
    redirect: follow ? "follow" : "manual",
    headers: {
      "User-Agent": "ZebizaProdAudit/1.0",
      Accept: "*/*",
    },
  });
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  const location = res.headers.get("location") || "";
  return {
    url,
    finalUrl: res.url || url,
    status: res.status,
    contentType: ct,
    location,
    lastModified: res.headers.get("last-modified") || "",
    isXml: ct.includes("xml") || text.trimStart().startsWith("<?xml"),
    isHtml: ct.includes("text/html") || text.trimStart().toLowerCase().startsWith("<!doctype"),
    hasH1: /<h1[\s>]/i.test(text),
    hasCanonical: /rel=["']canonical["']/i.test(text),
    hasJsonLd: /application\/ld\+json/i.test(text),
    hasLinea: /Linea/i.test(text),
    hasBeautyNav: /Hudpleje/i.test(text) && /Makeup/i.test(text),
    title: (text.match(/<title>([^<]*)<\/title>/i) || [])[1] || "",
    bodySnippet: text.slice(0, 180).replace(/\s+/g, " "),
  };
}

function check(row, expect) {
  const fails = [];
  const statuses = Array.isArray(expect.status) ? expect.status : [expect.status];
  if (expect.status != null && !statuses.includes(row.status) && !expect.allowRedirect) {
    fails.push(`status ${row.status} != ${statuses.join("|")}`);
  }
  if (expect.xml && !row.isXml) fails.push("expected XML");
  if (expect.notHtml && row.isHtml) fails.push("HTML soft-404 (got HTML instead of asset)");
  if (expect.hasH1 && !row.hasH1) fails.push("missing H1 in response body");
  if (expect.noLinea && row.hasLinea) fails.push("Linea branding present");
  if (expect.titleIncludes && !row.title.includes(expect.titleIncludes)) {
    fails.push(`title missing "${expect.titleIncludes}"`);
  }
  if (expect.soft404Check) {
    // Soft-404 if SPA returns 200 HTML for unknown path
    if (row.status === 200 && row.isHtml) fails.push("unknown URL returns 200 HTML (soft-404 risk)");
  }
  return fails;
}

async function main() {
  const results = [];
  for (const u of URLS) {
    try {
      const row = await fetchOne(u.path, { follow: Boolean(u.follow) });
      const fails = check(row, u.expect || {});
      results.push({ path: u.path, ok: fails.length === 0, fails, ...row });
    } catch (err) {
      results.push({ path: u.path, ok: false, fails: [String(err)] });
    }
  }

  // Sample a product from sitemap if XML
  const feed = results.find((r) => r.path === "/merchant-feed.xml");
  const summary = {
    origin: ORIGIN,
    generatedAt: new Date().toISOString(),
    checked: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    feedIsXml: Boolean(feed?.isXml && !feed?.isHtml),
    results,
  };

  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(join(ROOT, "reports/prod-audit.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ origin: ORIGIN, passed: summary.passed, failed: summary.failed, feedIsXml: summary.feedIsXml }, null, 2));
  for (const r of results.filter((x) => !x.ok)) {
    console.log("FAIL", r.path, r.fails?.join("; "), `status=${r.status}`, `ct=${r.contentType}`);
  }
  if (summary.failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
