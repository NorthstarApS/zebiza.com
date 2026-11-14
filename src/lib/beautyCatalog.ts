/**
 * Beauty positioning helpers: merchandising filters, taxonomy owners, junk demotion.
 * Does not delete WooCommerce data — only controls frontend visibility.
 */

/** Top-level beauty universes used in primary navigation. */
export const BEAUTY_NAV = [
  { key: "hudpleje", path: "/kategori/hudpleje-ansigt", label: "Hudpleje" },
  { key: "makeup", path: "/kategori/kosmetik-ansigt", label: "Makeup" },
  { key: "haar", path: "/kategori/harpleje", label: "Hår" },
  { key: "negle", path: "/kategori/negle", label: "Negle", fallback: "/kategori/nails" },
  { key: "parfume", path: "/kategori/parfume-dufte", label: "Parfume" },
  { key: "tools", path: "/kategori/beauty-tools", label: "Beauty tools" },
  { key: "maend", path: "/kategori/barbering-grooming", label: "Mænd" },
  { key: "brands", path: "/brands", label: "Brands" },
  { key: "tilbud", path: "/tilbud", label: "Tilbud" },
] as const;

/** Category slugs that belong in the beauty shopfront. */
export const BEAUTY_CATEGORY_SLUGS = new Set([
  "hudpleje-ansigt",
  "ansigtsrens",
  "oejencreme",
  "kosmetik-ansigt",
  "kosmetik-laeber",
  "kosmetik-oejne",
  "eyeliner",
  "oejenskygge",
  "harpleje",
  "haarfarve",
  "haarstyling",
  "haarboerster-redskaber",
  "nails",
  "nail-care",
  "negle",
  "neglepleje",
  "neglelak",
  "parfume-dufte",
  "parfume-kvinder",
  "beauty-tools",
  "beauty-tools-generelt",
  "facial-tools",
  "makeup-pensler",
  "spejle",
  "barbering-grooming",
  "skaegpleje",
  "kropspleje",
  "bad-saebe",
  "badeprodukter",
  "fodpleje",
  "beauty-oevrigt",
]);

/**
 * Products that look misclassified / non-beauty for a curated Danish beauty shop.
 * Matched against name+slug; demoted from homepage/merchandising, still reachable by direct URL.
 */
const NON_BEAUTY_PATTERNS: RegExp[] = [
  /gasmaske/i,
  /elastikbånd|elastikband/i,
  /\bkontor\b/i,
  /tandbørste|tandboerste|tandrens|vandflosser|water\s*floss/i,
  /hårsteamere|haarsteamere|hårvaskemåtte|haarvaskemaatte/i,
  /hårtølling|haartoelling|negleservicebord/i,
  /nebulizer/i,
  /kemisk beskyttelse/i,
  /salgsbord|frisørbord|frisoerbord/i,
];

export function isLikelyNonBeautyProduct(name: string, slug = ""): boolean {
  const hay = `${name} ${slug}`;
  return NON_BEAUTY_PATTERNS.some((re) => re.test(hay));
}

export function isBeautyCategorySlug(slug: string): boolean {
  return BEAUTY_CATEGORY_SLUGS.has(slug);
}

export function productInBeautyUniverse(categories: { slug: string }[]): boolean {
  return categories.some((c) => isBeautyCategorySlug(c.slug));
}

/**
 * Inventory-aware keyword → owner URL map (Danish market).
 * Only intents with real stock/category support get owners.
 */
export const KEYWORD_URL_MAP: {
  cluster: string;
  intent: string;
  ownerPath: string;
  page: string;
  action: string;
}[] = [
  { cluster: "hudpleje", intent: "Commercial", ownerPath: "/da/kategori/hudpleje-ansigt", page: "kategori", action: "expand" },
  { cluster: "ansigtsrens", intent: "Commercial", ownerPath: "/da/kategori/ansigtsrens", page: "kategori", action: "expand" },
  { cluster: "øjencreme", intent: "Commercial", ownerPath: "/da/kategori/oejencreme", page: "kategori", action: "expand" },
  { cluster: "ansigtsserum", intent: "Commercial", ownerPath: "/da/kategori/hudpleje-ansigt", page: "kategori", action: "expand" },
  {
    cluster: "ansigtsserum til mænd",
    intent: "Commercial",
    ownerPath: "/da/kategori/barbering-grooming",
    page: "kategori",
    action: "expand",
  },
  { cluster: "hårpleje", intent: "Commercial", ownerPath: "/da/kategori/harpleje", page: "kategori", action: "expand" },
  { cluster: "shampoo", intent: "Transactional", ownerPath: "/da/kategori/harpleje", page: "kategori", action: "establish" },
  { cluster: "hårfarve", intent: "Transactional", ownerPath: "/da/kategori/haarfarve", page: "kategori", action: "expand" },
  { cluster: "makeup", intent: "Commercial", ownerPath: "/da/kategori/kosmetik-ansigt", page: "kategori", action: "consolidate" },
  { cluster: "foundation", intent: "Transactional", ownerPath: "/da/kategori/kosmetik-ansigt", page: "kategori", action: "establish" },
  { cluster: "neglelak", intent: "Transactional", ownerPath: "/da/kategori/nails", page: "kategori", action: "establish" },
  { cluster: "dameparfume", intent: "Transactional", ownerPath: "/da/kategori/parfume-dufte", page: "kategori", action: "establish" },
  { cluster: "beauty tools", intent: "Commercial", ownerPath: "/da/kategori/beauty-tools", page: "kategori", action: "consolidate" },
  { cluster: "barbering", intent: "Commercial", ownerPath: "/da/kategori/barbering-grooming", page: "kategori", action: "expand" },
  // GSC impressions without current stock: keep as search owners, do not invent pages
  { cluster: "Sally Hansen neglelak", intent: "Brand + transactional", ownerPath: "/da/soeg?q=sally%20hansen", page: "search", action: "defer-until-stock" },
  { cluster: "L'Oréal Metal Detox", intent: "Brand + transactional", ownerPath: "/da/soeg?q=metal%20detox", page: "search", action: "defer-until-stock" },
];
