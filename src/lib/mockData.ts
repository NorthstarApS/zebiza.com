import type { WCCategory, WCProduct, ZBadge } from "@/types/woocommerce";

// Fallback catalog used when the WooCommerce backend is not reachable
// (e.g. before consumer keys are configured). The real service layer
// transparently falls back to this so the frontend is always browsable.

export const mockCategories: WCCategory[] = [
  { id: 1, name: "Beauty", slug: "beauty", count: 128 },
  { id: 2, name: "Livsstil", slug: "livsstil", count: 96 },
  { id: 3, name: "Personlig pleje", slug: "personlig-pleje", count: 74 },
  { id: 4, name: "Hjem", slug: "hjem", count: 112 },
  { id: 5, name: "Gaver", slug: "gaver", count: 63 },
  { id: 6, name: "Accessories", slug: "accessories", count: 88 },
  { id: 7, name: "Duft", slug: "duft", count: 41 },
  { id: 8, name: "Makeup", slug: "makeup", count: 57 },
];

const names = [
  "Silky Glow Serum", "Everyday Tote Bag", "Aroma Diffuser", "Velvet Lip Set",
  "Ceramic Mug Duo", "Soft Touch Hand Cream", "Trend Sunglasses", "Cozy Throw Blanket",
  "Mini Curling Wand", "Rose Body Oil", "Minimal Desk Lamp", "Gift Box Deluxe",
  "Daily Vitamin C", "Fresh Linen Candle", "Matte Nail Kit", "Travel Makeup Bag",
  "Wireless Earbuds", "Bamboo Toothbrush Set", "Hydra Sheet Masks", "Statement Earrings",
  "Comfort Slippers", "Glass Water Bottle", "Silk Scrunchie Pack", "Scented Reed Diffuser",
];

const brands = ["Nordlys", "Bella&Co", "Studio Zeb", "Kobenhavn", "Aura", "Frisk"];
const categoryPool = mockCategories;
const badgePool: ZBadge[] = [
  "nyhed", "populaer", "beauty", "gavefund", "saeson", "prisvenligt", "trend", "tilbud",
];

function img(seed: number): string {
  return `https://picsum.photos/seed/zebiza${seed}/700/700`;
}

export const mockProducts: WCProduct[] = names.map((name, i) => {
  const cat = categoryPool[i % categoryPool.length];
  const regular = 149 + (i % 12) * 40;
  const onSale = i % 3 === 0;
  const sale = onSale ? Math.round(regular * 0.75) : 0;
  const badges: ZBadge[] = [];
  badges.push(badgePool[i % badgePool.length]);
  if (onSale) badges.push("tilbud");
  return {
    id: 1000 + i,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    price: String(onSale ? sale : regular),
    regular_price: String(regular),
    sale_price: onSale ? String(sale) : "",
    on_sale: onSale,
    stock_status: i % 11 === 0 ? "outofstock" : "instock",
    average_rating: (4 + (i % 10) / 10).toFixed(1),
    rating_count: 12 + ((i * 7) % 240),
    short_description:
      "Et friskt hverdagsfund med tydelig anvendelse, fin kvalitet og en fair pris.",
    description:
      "Zebiza-favorit til hverdagen. Enkel at bruge, lækker i kvalitet og prisvenlig — perfekt til dig selv eller som en lille gave.",
    images: [
      { id: i * 2, src: img(i), alt: name },
      { id: i * 2 + 1, src: img(i + 100), alt: `${name} detalje` },
    ],
    categories: [{ id: cat.id, name: cat.name, slug: cat.slug }],
    badges: [...new Set(badges)],
    fitsWith: [brands[i % brands.length], cat.name, "Hverdagen"],
    goodFind:
      "Fin balance mellem kvalitet og pris — et af de fund vores kunder vender tilbage til.",
  };
});

// Collection slugs (nav) mapped to how we filter the fallback catalog.
export const collectionFilters: Record<string, (p: WCProduct) => boolean> = {
  nyheder: (p) => p.badges?.includes("nyhed") ?? false,
  populaert: (p) => p.badges?.includes("populaer") ?? false,
  beauty: (p) => p.categories.some((c) => c.slug === "beauty") || (p.badges?.includes("beauty") ?? false),
  livsstil: (p) => p.categories.some((c) => c.slug === "livsstil"),
  gaver: (p) => p.badges?.includes("gavefund") ?? false,
  saeson: (p) => p.badges?.includes("saeson") ?? false,
  hjem: (p) => p.categories.some((c) => c.slug === "hjem"),
  "personlig-pleje": (p) => p.categories.some((c) => c.slug === "personlig-pleje"),
  tilbud: (p) => p.on_sale,
};
