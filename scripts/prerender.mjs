#!/usr/bin/env node
/**
 * Build-time prerender for crawlable HTML (no JS required for indexing).
 *
 * After `vite build`, reads dist/index.html and writes static HTML for:
 *  - /da/
 *  - /da/kategori/:slug/
 *  - /da/produkt/:slug/
 *  - /da/brand/:slug/
 *  - key static pages
 *
 * Each page includes title, meta, canonical, JSON-LD, H1 and primary content
 * inside #root so HTTP clients without JavaScript still see indexable HTML.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const ORIGIN = process.env.VITE_SITE_ORIGIN || "https://zebiza.com";
const API = (process.env.VITE_WP_API_BASE || ORIGIN).replace(/\/$/, "");

const NON_BEAUTY =
  /gasmaske|elastikbånd|elastikband|\bkontor\b|tandbørste|tandboerste|tandrens|vandflosser|water\s*floss|hårsteamere|haarsteamere|hårvaskemåtte|haarvaskemaatte|hårtølling|haartoelling|negleservicebord|nebulizer|kemisk beskyttelse/i;

const CATEGORY_COPY = {
  "hudpleje-ansigt": {
    h1: "Hudpleje",
    title: "Hudpleje | Zebiza",
    description:
      "Køb ansigtspleje hos Zebiza — serum, creme, rens og masker fra kendte og spændende brands. Dansk webshop, fair priser.",
    intro: "Find ansigtsrens, serum, creme og masker til din hudtype — samlet ét sted.",
  },
  ansigtsrens: {
    h1: "Ansigtsrens",
    title: "Ansigtsrens | Zebiza",
    description: "Ansigtsrens til gel, skum, olie og micellar — find den rigtige rens til din hud hos Zebiza.",
    intro: "Rens er første skridt i en god hudplejerutine. Vælg efter hudtype og følelse.",
  },
  harpleje: {
    h1: "Hårpleje",
    title: "Hårpleje | Zebiza",
    description: "Shampoo, balsam, hårkur, farve og styling hos Zebiza. Kendte brands og hverdagsfavoritter.",
    intro: "Fra shampoo og balsam til farve, styling og redskaber.",
  },
  "kosmetik-ansigt": {
    h1: "Makeup — ansigt",
    title: "Makeup — ansigt | Zebiza",
    description: "Foundation, concealer og ansigtsmakeup hos Zebiza. Kendte brands, fair priser.",
    intro: "Foundation og ansigtsmakeup til en jævn base.",
  },
  "beauty-tools": {
    h1: "Beauty tools",
    title: "Beauty tools | Zebiza",
    description: "Beauty tools hos Zebiza — børster, spejle, massager og stylingværktøj.",
    intro: "Redskaber der understøtter makeup, hudpleje og hår.",
  },
  "parfume-dufte": {
    h1: "Parfume & dufte",
    title: "Parfume & dufte | Zebiza",
    description: "Dame- og herreparfume hos Zebiza — EDP og EDT fra kendte brands.",
    intro: "Find en duft til dig selv eller som gave.",
  },
  nails: {
    h1: "Neglelak",
    title: "Neglelak & negle | Zebiza",
    description: "Neglelak og neglepleje hos Zebiza — farver og basisprodukter.",
    intro: "Neglelak og negleprodukter til farve og finish.",
  },
  "barbering-grooming": {
    h1: "Barbering & grooming",
    title: "Barbering & grooming | Zebiza",
    description: "Barbering, skægpleje og grooming til mænd hos Zebiza.",
    intro: "Grooming til ansigt og skæg — enkel hverdagspleje.",
  },
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "ZebizaPrerender/1.0" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function decode(s = "") {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "–")
    .replace(/&#038;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function esc(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function minor(amount, unit = 2) {
  return Number(amount) / Math.pow(10, unit ?? 2);
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writePage(relPath, html) {
  const full = join(DIST, relPath);
  ensureDir(dirname(full));
  writeFileSync(full, html);
}

function inject(template, { title, description, canonical, robots = "index,follow", jsonLd = [], body }) {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  if (html.includes('name="description"')) {
    html = html.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${esc(description)}" />`,
    );
  } else {
    html = html.replace("</head>", `  <meta name="description" content="${esc(description)}" />\n</head>`);
  }
  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${esc(canonical)}" />`);
  } else {
    html = html.replace("</head>", `  <link rel="canonical" href="${esc(canonical)}" />\n</head>`);
  }
  html = html.replace(/<html[^>]*>/i, '<html lang="da">');
  const headExtras = [
    `<meta name="robots" content="${robots}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="da_DK" />`,
    ...jsonLd.map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`),
  ].join("\n  ");
  html = html.replace("</head>", `  ${headExtras}\n</head>`);
  html = html.replace(/<div id="root"><\/div>/i, `<div id="root">${body}</div>`);
  return html;
}

function navHtml() {
  const links = [
    ["/da/kategori/hudpleje-ansigt/", "Hudpleje"],
    ["/da/kategori/kosmetik-ansigt/", "Makeup"],
    ["/da/kategori/harpleje/", "Hår"],
    ["/da/kategori/nails/", "Negle"],
    ["/da/kategori/parfume-dufte/", "Parfume"],
    ["/da/kategori/beauty-tools/", "Beauty tools"],
    ["/da/kategori/barbering-grooming/", "Mænd"],
    ["/da/brands/", "Brands"],
    ["/da/tilbud/", "Tilbud"],
  ];
  return `<nav aria-label="Hovednavigation"><ul>${links
    .map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`)
    .join("")}</ul></nav>`;
}

function productCard(p) {
  const price = minor(p.prices.price, p.prices.currency_minor_unit).toFixed(2);
  const img = p.images?.[0]?.src || "";
  const name = decode(p.name);
  return `<article>
    <a href="/da/produkt/${esc(p.slug)}/">
      ${img ? `<img src="${esc(img)}" alt="${esc(name)}" width="400" height="400" loading="lazy" />` : ""}
      <h2>${esc(name)}</h2>
      <p>${esc(price)} kr.</p>
      <p>${p.is_in_stock ? "På lager" : "Udsolgt"}</p>
    </a>
  </article>`;
}

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 30; page++) {
    const data = await fetchJson(
      `${API}/wp-json/wc/store/v1/products?per_page=100&page=${page}&orderby=date&order=desc`,
    );
    if (!Array.isArray(data) || !data.length) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  const cats = await fetchJson(`${API}/wp-json/wc/store/v1/products/categories?per_page=100&hide_empty=true`);
  for (const cat of cats) {
    const data = await fetchJson(
      `${API}/wp-json/wc/store/v1/products?per_page=100&category=${cat.id}`,
    );
    for (const p of data || []) {
      if (!all.some((x) => x.id === p.id)) all.push(p);
    }
  }
  return { products: all, categories: cats };
}

async function fetchBrands() {
  try {
    return await fetchJson(`${API}/wp-json/wc/store/v1/products/brands?per_page=100`);
  } catch {
    return [];
  }
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    throw new Error("dist/index.html missing — run vite build first");
  }
  const template = readFileSync(join(DIST, "index.html"), "utf8");
  console.log("Prerender: fetching catalog…");
  const { products, categories } = await fetchAllProducts();
  const brands = await fetchBrands();
  console.log(`Products ${products.length}, categories ${categories.length}, brands ${brands.length}`);

  const beautyProducts = products.filter((p) => !NON_BEAUTY.test(`${p.name} ${p.slug}`));

  // Homepage
  const homeProducts = beautyProducts.filter((p) => p.is_in_stock).slice(0, 12);
  writePage(
    "da/index.html",
    inject(template, {
      title: "Zebiza — beautyfavoritter, kendte brands og hverdagsfund",
      description:
        "Dansk beauty-webshop med hudpleje, makeup, hårpleje, negle, parfume og beauty tools. Fair priser, tryg betaling og levering til Danmark.",
      canonical: `${ORIGIN}/da`,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          "@id": `${ORIGIN}/#org`,
          name: "Zebiza.com",
          url: ORIGIN,
          address: { "@type": "PostalAddress", addressCountry: "DK" },
          currenciesAccepted: "DKK",
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Zebiza.com",
          url: ORIGIN,
          potentialAction: {
            "@type": "SearchAction",
            target: `${ORIGIN}/da/soeg?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
      ],
      body: `<header><p><strong>Zebiza</strong></p>${navHtml()}</header>
        <main>
          <h1>Beautyfavoritter, kendte brands og spændende hverdagsfund</h1>
          <p>Hudpleje, makeup, hår, negle, parfume og beauty tools — samlet i én dansk webshop med fair priser.</p>
          <p><a href="/da/kategori/hudpleje-ansigt/">Shop hudpleje</a> · <a href="/da/kategori/kosmetik-ansigt/">Shop makeup</a></p>
          <section><h2>Udvalgte produkter</h2><div>${homeProducts.map(productCard).join("")}</div></section>
        </main>
        <footer><p>Dansk ejet webshop · Levering typisk 3-6 hverdage · 30 dages returret</p>
          <p><a href="/da/om-zebiza/">Om Zebiza</a> · <a href="/da/levering-og-returnering/">Levering</a> · <a href="/da/kontakt/">Kontakt</a></p></footer>`,
    }),
  );

  // Categories
  for (const cat of categories) {
    if (!cat.count) continue;
    const copy = CATEGORY_COPY[cat.slug] || {
      h1: decode(cat.name),
      title: `${decode(cat.name)} | Zebiza`,
      description: `${decode(cat.name)} hos Zebiza — dansk beauty-webshop med fair priser.`,
      intro: `Se udvalget i ${decode(cat.name)}.`,
    };
    const catProducts = beautyProducts
      .filter((p) => (p.categories || []).some((c) => c.id === cat.id || c.slug === cat.slug))
      .slice(0, 48);
    const path = `da/kategori/${cat.slug}/index.html`;
    writePage(
      path,
      inject(template, {
        title: copy.title,
        description: copy.description,
        canonical: `${ORIGIN}/da/kategori/${cat.slug}`,
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Forside", item: `${ORIGIN}/da` },
              {
                "@type": "ListItem",
                position: 2,
                name: copy.h1,
                item: `${ORIGIN}/da/kategori/${cat.slug}`,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: copy.h1,
            description: copy.description,
            url: `${ORIGIN}/da/kategori/${cat.slug}`,
          },
        ],
        body: `<header>${navHtml()}</header>
          <main>
            <nav aria-label="Breadcrumb"><a href="/da/">Forside</a> / <span>${esc(copy.h1)}</span></nav>
            <h1>${esc(copy.h1)}</h1>
            <p>${esc(copy.intro)}</p>
            <p>${catProducts.length} produkter</p>
            <section>${catProducts.map(productCard).join("")}</section>
          </main>`,
      }),
    );
  }

  // Products
  let productPages = 0;
  for (const p of beautyProducts) {
    if (!p.slug) continue;
    const name = decode(p.name);
    const desc = decode(p.short_description || p.description || name).slice(0, 160);
    const price = minor(p.prices.price, p.prices.currency_minor_unit);
    const brand = p.brands?.[0] ? decode(p.brands[0].name) : "";
    const cat = p.categories?.[0];
    const img = p.images?.[0]?.src || "";
    const offer = {
      "@type": "Offer",
      url: `${ORIGIN}/da/produkt/${p.slug}`,
      price: price.toFixed(2),
      priceCurrency: "DKK",
      availability: p.is_in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    };
    const productLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      description: decode(p.description || p.short_description || name).slice(0, 5000),
      image: (p.images || []).map((i) => i.src),
      sku: p.sku || undefined,
      offers: offer,
      url: `${ORIGIN}/da/produkt/${p.slug}`,
    };
    if (brand) productLd.brand = { "@type": "Brand", name: brand };

    writePage(
      `da/produkt/${p.slug}/index.html`,
      inject(template, {
        title: `${name} | Zebiza`,
        description: desc,
        canonical: `${ORIGIN}/da/produkt/${p.slug}`,
        jsonLd: [
          productLd,
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Forside", item: `${ORIGIN}/da` },
              ...(cat
                ? [
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: decode(cat.name),
                      item: `${ORIGIN}/da/kategori/${cat.slug}`,
                    },
                  ]
                : []),
              {
                "@type": "ListItem",
                position: cat ? 3 : 2,
                name,
                item: `${ORIGIN}/da/produkt/${p.slug}`,
              },
            ],
          },
        ],
        body: `<header>${navHtml()}</header>
          <main>
            <nav aria-label="Breadcrumb">
              <a href="/da/">Forside</a>
              ${cat ? ` / <a href="/da/kategori/${esc(cat.slug)}/">${esc(decode(cat.name))}</a>` : ""}
              / <span>${esc(name)}</span>
            </nav>
            ${brand ? `<p><a href="/da/brand/${esc(p.brands[0].slug)}/">${esc(brand)}</a></p>` : ""}
            <h1>${esc(name)}</h1>
            ${img ? `<img src="${esc(img)}" alt="${esc(name)}" width="800" height="800" />` : ""}
            <p><strong>${esc(price.toFixed(2))} kr.</strong></p>
            <p>${p.is_in_stock ? "På lager" : "Udsolgt"}</p>
            ${p.sku ? `<p>SKU: ${esc(p.sku)}</p>` : ""}
            <div>${esc(decode(p.description || p.short_description || "")).slice(0, 4000)}</div>
            <p>Levering typisk 3-6 hverdage. 30 dages returret.</p>
            ${cat ? `<p><a href="/da/kategori/${esc(cat.slug)}/">Se flere i ${esc(decode(cat.name))}</a></p>` : ""}
          </main>`,
      }),
    );
    productPages++;
  }

  // Brands
  writePage(
    "da/brands/index.html",
    inject(template, {
      title: "Brands hos Zebiza — kendte beauty-mærker",
      description: "Udforsk brands hos Zebiza: hudpleje, makeup, hårpleje, parfume og beauty tools.",
      canonical: `${ORIGIN}/da/brands`,
      body: `<header>${navHtml()}</header><main><h1>Brands</h1><ul>${brands
        .map((b) => `<li><a href="/da/brand/${esc(b.slug)}/">${esc(decode(b.name))}</a></li>`)
        .join("")}</ul></main>`,
    }),
  );
  for (const b of brands) {
    const brandProducts = beautyProducts
      .filter((p) => (p.brands || []).some((x) => x.slug === b.slug))
      .slice(0, 48);
    writePage(
      `da/brand/${b.slug}/index.html`,
      inject(template, {
        title: `${decode(b.name)} — shop brandet hos Zebiza`,
        description: `Shop ${decode(b.name)} hos Zebiza — beautyprodukter med fair priser og levering til Danmark.`,
        canonical: `${ORIGIN}/da/brand/${b.slug}`,
        body: `<header>${navHtml()}</header>
          <main>
            <h1>${esc(decode(b.name))}</h1>
            <p>Shop ${esc(decode(b.name))} hos Zebiza.</p>
            <section>${brandProducts.map(productCard).join("")}</section>
          </main>`,
      }),
    );
  }

  // Static pages
  const staticPages = [
    ["om-zebiza", "Om Zebiza", "Zebiza.com er en dansk ejet beauty-webshop."],
    ["levering-og-returnering", "Levering & returnering", "Vi sender typisk inden for 1-2 hverdage. Levering normalt 3-6 hverdage. 30 dages returret."],
    ["handelsbetingelser", "Handelsbetingelser", "Handelsbetingelser for køb på Zebiza.com. Priser i DKK inkl. moms."],
    ["privatlivspolitik", "Privatlivspolitik", "Vi behandler personoplysninger i overensstemmelse med GDPR."],
    ["cookiepolitik", "Cookiepolitik", "Vi bruger cookies til at få hjemmesiden til at fungere."],
    ["kontakt", "Kontakt", "Kontakt Zebiza på kundeservice@zebiza.com."],
    ["tilbud", "Tilbud", "Aktuelle beauty-tilbud hos Zebiza."],
    ["shop", "Shop", "Shop beauty hos Zebiza."],
  ];
  for (const [slug, title, desc] of staticPages) {
    writePage(
      `da/${slug}/index.html`,
      inject(template, {
        title: `${title} · Zebiza.com`,
        description: desc,
        canonical: `${ORIGIN}/da/${slug}`,
        robots: ["tilbud", "shop"].includes(slug) ? "index,follow" : "index,follow",
        body: `<header>${navHtml()}</header><main><h1>${esc(title)}</h1><p>${esc(desc)}</p></main>`,
      }),
    );
  }

  // Ensure root index redirects conceptually — keep SPA shell but DA-first content hint
  writePage(
    "index.html",
    inject(template, {
      title: "Zebiza — beautyfavoritter, kendte brands og hverdagsfund",
      description:
        "Dansk beauty-webshop med hudpleje, makeup, hårpleje, negle, parfume og beauty tools.",
      canonical: `${ORIGIN}/da`,
      body: `<main><h1>Zebiza</h1><p><a href="/da/">Fortsæt til den danske shop</a></p></main>`,
    }),
  );

  // Copy public feed/sitemap if present (vite usually already copied)
  for (const f of ["merchant-feed.xml", "sitemap.xml", "robots.txt", "_redirects"]) {
    const src = join(ROOT, "public", f);
    if (existsSync(src)) cpSync(src, join(DIST, f));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    productPages,
    categoryPages: categories.filter((c) => c.count).length,
    brandPages: brands.length,
    note: "Prerendered HTML includes H1, price, availability, canonical and JSON-LD without JavaScript.",
  };
  ensureDir(join(ROOT, "reports"));
  writeFileSync(join(ROOT, "reports/prerender.json"), JSON.stringify(report, null, 2));
  console.log("Prerender complete", report);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
