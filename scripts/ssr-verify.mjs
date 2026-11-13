#!/usr/bin/env node
/**
 * Verify prerendered HTML contains crawl-critical signals without executing JS.
 * Run after `npm run build` against local dist/ via file:// or preview origin.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");
const ORIGIN = process.env.AUDIT_ORIGIN || "";

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name === "index.html") acc.push(p);
  }
  return acc;
}

function checkHtml(html, path) {
  const fails = [];
  if (!/<h1[\s>]/i.test(html)) fails.push("missing H1");
  if (!/<title>[^<]{3,}<\/title>/i.test(html)) fails.push("missing title");
  if (!/rel="canonical"/i.test(html)) fails.push("missing canonical");
  if (!/name="description"/i.test(html)) fails.push("missing meta description");
  if (path.includes("/produkt/") && !/application\/ld\+json/i.test(html)) fails.push("missing JSON-LD");
  if (path.includes("/produkt/") && !/På lager|Udsolgt|InStock|OutOfStock/i.test(html)) {
    fails.push("missing availability signal");
  }
  if (path.includes("/produkt/") && !/\d+[.,]?\d*\s*kr/i.test(html)) fails.push("missing price text");
  return fails;
}

async function main() {
  const files = walk(join(DIST, "da"));
  const sample = [
    ...files.filter((f) => f.includes("/produkt/")).slice(0, 20),
    ...files.filter((f) => f.includes("/kategori/")).slice(0, 10),
    ...files.filter((f) => f.endsWith("/da/index.html") || f.includes("/da/index.html")),
  ];
  const unique = [...new Set(sample)];
  const results = [];
  for (const file of unique) {
    const html = readFileSync(file, "utf8");
    const fails = checkHtml(html, file);
    results.push({ file: file.replace(DIST, ""), ok: fails.length === 0, fails });
  }

  // Optional live HTTP checks against preview/prod
  const live = [];
  if (ORIGIN) {
    const urls = [
      `${ORIGIN}/da/`,
      `${ORIGIN}/da/kategori/hudpleje-ansigt/`,
      `${ORIGIN}/merchant-feed.xml`,
      `${ORIGIN}/sitemap.xml`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "ZebizaSSRVerify/1.0", Accept: "*/*" },
          redirect: "manual",
        });
        const ct = res.headers.get("content-type") || "";
        const text = await res.text();
        live.push({
          url,
          status: res.status,
          contentType: ct,
          hasH1: /<h1[\s>]/i.test(text),
          isXml: ct.includes("xml") || text.trimStart().startsWith("<?xml"),
        });
      } catch (err) {
        live.push({ url, error: String(err) });
      }
    }
  }

  const summary = {
    checked: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    failures: results.filter((r) => !r.ok),
    live,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.failed > 0) process.exitCode = 1;
}

main();
