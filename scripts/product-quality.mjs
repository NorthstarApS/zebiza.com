#!/usr/bin/env node
/**
 * Product quality scoring against live Store API catalog.
 * PASS / REVIEW / BLOCKED — never invents GTIN/brand.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const API = (process.env.VITE_WP_API_BASE || "https://zebiza.com").replace(/\/$/, "");

const NON_BEAUTY =
  /gasmaske|elastikbånd|elastikband|\bkontor\b|tandbørste|tandboerste|tandrens|vandflosser|water\s*floss|hårsteamere|haarsteamere|hårvaskemåtte|haarvaskemaatte|hårtølling|haartoelling|negleservicebord|nebulizer|kemisk beskyttelse|salgsbord/i;

const BAD_DANISH = /velsmagende|dyringredienser|skønhedspleje til damehænder|hårtølling|øjenbrynhælder|øjenbrynsvælder/i;

function decode(s = "") {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function gtinFromProduct(p) {
  for (const img of p.images || []) {
    const m = (img.src || "").match(/(?:^|\/|_)(\d{8,14})(?:_|\.|-)/);
    if (m) return m[1];
  }
  return "";
}

async function fetchAll() {
  const all = [];
  const cats = await (await fetch(`${API}/wp-json/wc/store/v1/products/categories?per_page=100&hide_empty=true`)).json();
  for (let page = 1; page <= 30; page++) {
    const data = await (
      await fetch(`${API}/wp-json/wc/store/v1/products?per_page=100&page=${page}&orderby=date&order=desc`)
    ).json();
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  for (const cat of cats) {
    const data = await (
      await fetch(`${API}/wp-json/wc/store/v1/products?per_page=100&category=${cat.id}`)
    ).json();
    for (const p of data || []) if (!all.some((x) => x.id === p.id)) all.push(p);
  }
  return { products: all, categories: cats };
}

function score(p) {
  const reasons = [];
  const name = decode(p.name);
  const desc = decode(p.description || "");
  const short = decode(p.short_description || "");
  const brand = p.brands?.[0]?.name ? decode(p.brands[0].name) : "";
  const gtin = gtinFromProduct(p);
  const hasImage = Boolean(p.images?.[0]?.src);
  const price = Number(p.prices?.price || 0);
  const cats = (p.categories || []).map((c) => c.slug);

  let status = "PASS";
  let points = 100;

  if (NON_BEAUTY.test(`${name} ${p.slug}`)) {
    status = "BLOCKED";
    reasons.push("Ikke beauty-relevant / misclassified merchandising");
    points -= 50;
  }
  if (!p.is_in_stock) {
    reasons.push("Ikke på lager");
    points -= 15;
    if (status === "PASS") status = "REVIEW";
  }
  if (!brand) {
    reasons.push("Mangler brand");
    points -= 10;
    if (status === "PASS") status = "REVIEW";
  }
  if (!hasImage) {
    reasons.push("Mangler billede");
    points -= 25;
    status = "BLOCKED";
  }
  if (price <= 0) {
    reasons.push("Ugyldig pris");
    status = "BLOCKED";
  }
  if (!gtin && !p.sku) {
    reasons.push("Mangler GTIN og SKU");
    points -= 5;
    if (status === "PASS") status = "REVIEW";
  } else if (!gtin) {
    reasons.push("Mangler GTIN (SKU findes)");
    points -= 2;
  }
  if (BAD_DANISH.test(`${name} ${desc} ${short}`)) {
    reasons.push("Mistænkelig/dårlig dansk produkttekst");
    points -= 20;
    if (status !== "BLOCKED") status = "REVIEW";
  }
  if (short.length < 40 && desc.length < 80) {
    reasons.push("Tynd beskrivelse");
    points -= 10;
    if (status === "PASS") status = "REVIEW";
  }
  if (!cats.length) {
    reasons.push("Ingen kategori");
    points -= 15;
    if (status === "PASS") status = "REVIEW";
  }
  // Duplicate paragraph heuristic
  const paras = desc.split(/(?<=\.)\s+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  const uniq = new Set(paras);
  if (paras.length >= 2 && uniq.size < paras.length) {
    reasons.push("Duplikerede afsnit i beskrivelse");
    points -= 10;
    if (status === "PASS") status = "REVIEW";
  }

  return {
    id: p.id,
    name,
    slug: p.slug,
    sku: p.sku || "",
    brand,
    gtin,
    price: price / Math.pow(10, p.prices?.currency_minor_unit ?? 2),
    inStock: p.is_in_stock,
    categories: cats,
    status,
    score: Math.max(0, points),
    reasons,
    url: `https://zebiza.com/da/produkt/${p.slug}`,
  };
}

async function main() {
  const { products } = await fetchAll();
  const scored = products.map(score);
  const summary = {
    total: scored.length,
    PASS: scored.filter((s) => s.status === "PASS").length,
    REVIEW: scored.filter((s) => s.status === "REVIEW").length,
    BLOCKED: scored.filter((s) => s.status === "BLOCKED").length,
    missingBrand: scored.filter((s) => !s.brand).length,
    missingGtin: scored.filter((s) => !s.gtin).length,
    missingImage: scored.filter((s) => s.reasons.some((r) => r.includes("billede"))).length,
  };
  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(
    join(ROOT, "reports/product-quality.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), summary, products: scored }, null, 2),
  );
  writeFileSync(
    join(ROOT, "reports/product-quality-blocked.json"),
    JSON.stringify(
      scored.filter((s) => s.status === "BLOCKED"),
      null,
      2,
    ),
  );
  console.log(summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
