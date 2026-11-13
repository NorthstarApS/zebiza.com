import type { Dictionary } from "@/i18n";

export interface NavItem {
  key: string;
  path: string;
  label?: string;
  accent?: "trend" | "beauty" | "deal";
  dictKey?: keyof Dictionary["nav"];
}

/**
 * Primary navigation — beauty universes with real inventory.
 * Lifestyle/home collections are demoted out of the main bar.
 */
export const mainNav: NavItem[] = [
  { key: "hudpleje", path: "/kategori/hudpleje-ansigt", label: "Hudpleje", accent: "beauty" },
  { key: "makeup", path: "/kategori/kosmetik-ansigt", label: "Makeup" },
  { key: "haar", path: "/kategori/harpleje", label: "Hår" },
  { key: "negle", path: "/kategori/nails", label: "Negle" },
  { key: "parfume", path: "/kategori/parfume-dufte", label: "Parfume" },
  { key: "tools", path: "/kategori/beauty-tools", label: "Beauty tools" },
  { key: "maend", path: "/kategori/barbering-grooming", label: "Mænd" },
  { key: "brands", path: "/brands", label: "Brands" },
  { key: "tilbud", path: "/tilbud", label: "Tilbud", accent: "deal", dictKey: "tilbud" },
];

/** Secondary / footer merchandising collections still routable. */
export const collectionSlugMap: Record<string, string> = {
  nyheder: "nyheder",
  populaert: "populaert",
  beauty: "beauty",
  livsstil: "livsstil",
  gaver: "gaver",
  saeson: "saeson",
  hjem: "hjem",
  "personlig-pleje": "personlig-pleje",
  tilbud: "tilbud",
};
