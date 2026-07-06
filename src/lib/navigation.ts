import type { Dictionary } from "@/i18n";

export interface NavItem {
  key: keyof Dictionary["nav"];
  path: string;
  accent?: "trend" | "beauty" | "deal";
}

// Main navigation — collection routes. Slugs use Danish-friendly URLs.
export const mainNav: NavItem[] = [
  { key: "nyheder", path: "/nyheder", accent: "trend" },
  { key: "populaert", path: "/populaert" },
  { key: "beauty", path: "/beauty", accent: "beauty" },
  { key: "livsstil", path: "/livsstil" },
  { key: "gaver", path: "/gaver" },
  { key: "saeson", path: "/saeson" },
  { key: "hjem", path: "/hjem" },
  { key: "pleje", path: "/personlig-pleje" },
  { key: "tilbud", path: "/tilbud", accent: "deal" },
];

// Maps a collection route slug to the catalog collection key used by the API layer.
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
