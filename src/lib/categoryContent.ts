/**
 * Curated Danish beauty category copy.
 * Overrides generic Furina/template text from WooCommerce without mutating the backend.
 */

export interface CategoryCopy {
  title?: string;
  h1?: string;
  metaDescription: string;
  intro: string;
  body?: string;
  relatedSlugs?: string[];
}

const GENERIC_BAD =
  /furina|bolig,?\s*livsstil|medarbejder|projektarbejde|elever|institution|reservedele|kontorer|teams\b/i;

export function isGenericCategoryHtml(html: string | undefined | null): boolean {
  if (!html) return true;
  return GENERIC_BAD.test(html);
}

export const CATEGORY_COPY: Record<string, CategoryCopy> = {
  "hudpleje-ansigt": {
    h1: "Hudpleje",
    metaDescription:
      "Køb ansigtspleje hos Zebiza — serum, creme, rens og masker fra kendte og spændende brands. Dansk webshop, fair priser.",
    intro: "Find ansigtsrens, serum, creme og masker til din hudtype — samlet ét sted.",
    body:
      "Hudpleje handler om at vælge produkter, der matcher din hud og din rutine. Start med rens, tilføj serum efter behov, og afslut med fugt. Hos Zebiza finder du både hverdagsfavoritter og mere målrettede formler.",
    relatedSlugs: ["ansigtsrens", "oejencreme", "kropspleje", "beauty-tools"],
  },
  ansigtsrens: {
    h1: "Ansigtsrens",
    metaDescription:
      "Ansigtsrens til gel, skum, olie og micellar — find den rigtige rens til din hud hos Zebiza.",
    intro: "Rens er første skridt i en god hudplejerutine. Vælg efter hudtype og følelse.",
    body:
      "Gel og skum passer ofte til normal og kombineret hud. Olie- og balm-rens er gode til tør eller makeup-tung hud. Micellarvand er praktisk til mild afrensning. Se også serum og øjencreme, når basis er på plads.",
    relatedSlugs: ["hudpleje-ansigt", "oejencreme", "kosmetik-ansigt"],
  },
  oejencreme: {
    h1: "Øjencreme",
    metaDescription: "Øjencremer og øjenpleje hos Zebiza — målrettet pleje til huden omkring øjnene.",
    intro: "Lettere formler til det tynde område omkring øjnene.",
    relatedSlugs: ["hudpleje-ansigt", "ansigtsrens"],
  },
  harpleje: {
    h1: "Hårpleje",
    metaDescription:
      "Shampoo, balsam, hårkur, farve og styling hos Zebiza. Kendte brands og hverdagsfavoritter.",
    intro: "Fra shampoo og balsam til farve, styling og redskaber — find det, dit hår har brug for.",
    body:
      "Vælg shampoo efter hårtype, og match med balsam eller kur. Skal du farve eller style, finder du også farver, børster og værktøjer i underkategorierne.",
    relatedSlugs: ["haarfarve", "haarstyling", "haarboerster-redskaber"],
  },
  haarfarve: {
    h1: "Hårfarve",
    metaDescription: "Permanent og halvpermanent hårfarve hos Zebiza — professionelle og hverdagsvenlige nuancer.",
    intro: "Farver til hjemmebrug og salon-inspirerede nuancer.",
    relatedSlugs: ["harpleje", "haarstyling"],
  },
  haarstyling: {
    h1: "Hårstyling",
    metaDescription: "Hårstyling — cremer, sprays og værktøjer hos Zebiza.",
    intro: "Hold, glans og form — find styling til hverdagen.",
    relatedSlugs: ["harpleje", "haarboerster-redskaber"],
  },
  "haarboerster-redskaber": {
    h1: "Hårbørster & redskaber",
    metaDescription: "Hårbørster, glattejern og stylingredskaber hos Zebiza.",
    intro: "Redskaber til redning, styling og finish.",
    relatedSlugs: ["harpleje", "haarstyling"],
  },
  "kosmetik-ansigt": {
    h1: "Makeup — ansigt",
    metaDescription: "Foundation, concealer og ansigtsmakeup hos Zebiza. Kendte brands, fair priser.",
    intro: "Foundation og ansigtsmakeup til en jævn base.",
    relatedSlugs: ["kosmetik-oejne", "kosmetik-laeber", "makeup-pensler"],
  },
  "kosmetik-oejne": {
    h1: "Makeup — øjne",
    metaDescription: "Mascara, eyeliner og øjenskygge hos Zebiza.",
    intro: "Øjenmakeup til hverdag og look.",
    relatedSlugs: ["eyeliner", "oejenskygge", "kosmetik-ansigt"],
  },
  "kosmetik-laeber": {
    h1: "Makeup — læber",
    metaDescription: "Læbestift, lipgloss og læbepleje hos Zebiza.",
    intro: "Farve og pleje til læberne.",
    relatedSlugs: ["kosmetik-ansigt", "kosmetik-oejne"],
  },
  eyeliner: {
    h1: "Eyeliner",
    metaDescription: "Eyeliner hos Zebiza — præcis linje til hverdagens look.",
    intro: "Find eyeliner til dit look.",
    relatedSlugs: ["kosmetik-oejne", "oejenskygge"],
  },
  oejenskygge: {
    h1: "Øjenskygge",
    metaDescription: "Øjenskygge hos Zebiza — nuancer til hverdag og aften.",
    intro: "Skygger og paletter til øjnene.",
    relatedSlugs: ["kosmetik-oejne", "eyeliner"],
  },
  nails: {
    h1: "Neglelak",
    title: "Neglelak & negle",
    metaDescription: "Neglelak og neglepleje hos Zebiza — farver og basisprodukter.",
    intro: "Neglelak og negleprodukter til farve og finish.",
    relatedSlugs: ["nail-care", "beauty-tools"],
  },
  "nail-care": {
    h1: "Neglepleje",
    metaDescription: "Neglepleje hos Zebiza — base, top og pleje omkring lakken.",
    intro: "Pleje og forberedelse til holdbare negle.",
    relatedSlugs: ["nails", "beauty-tools"],
  },
  "parfume-dufte": {
    h1: "Parfume & dufte",
    metaDescription: "Dame- og herreparfume hos Zebiza — EDP og EDT fra kendte brands.",
    intro: "Find en duft til dig selv eller som gave.",
    relatedSlugs: ["parfume-kvinder", "kropspleje"],
  },
  "parfume-kvinder": {
    h1: "Dameparfume",
    metaDescription: "Dameparfume hos Zebiza — populære dufte til fair priser.",
    intro: "Dufte til hverdag og særlige anledninger.",
    relatedSlugs: ["parfume-dufte"],
  },
  "beauty-tools": {
    h1: "Beauty tools",
    metaDescription: "Beauty tools hos Zebiza — børster, spejle, massager og stylingværktøj.",
    intro: "Redskaber der understøtter makeup, hudpleje og hår.",
    relatedSlugs: ["makeup-pensler", "facial-tools", "spejle", "harpleje"],
  },
  "beauty-tools-generelt": {
    h1: "Beauty tools",
    metaDescription: "Beauty tools hos Zebiza.",
    intro: "Praktiske beauty-redskaber til hverdagen.",
    relatedSlugs: ["beauty-tools"],
  },
  "facial-tools": {
    h1: "Ansigtsredskaber",
    metaDescription: "Ansigtsredskaber og facial tools hos Zebiza.",
    intro: "Massager, rensebørster og ansigtsværktøj.",
    relatedSlugs: ["beauty-tools", "hudpleje-ansigt"],
  },
  "makeup-pensler": {
    h1: "Makeupbørster",
    metaDescription: "Makeupbørster hos Zebiza — til ansigt, øjne og læber.",
    intro: "Børster til en mere præcis påføring.",
    relatedSlugs: ["beauty-tools", "kosmetik-ansigt"],
  },
  spejle: {
    h1: "Makeupspejle",
    metaDescription: "Makeupspejle hos Zebiza.",
    intro: "Spejle til makeup og hverdagspleje.",
    relatedSlugs: ["beauty-tools"],
  },
  "barbering-grooming": {
    h1: "Barbering & grooming",
    metaDescription: "Barbering, skægpleje og grooming til mænd hos Zebiza.",
    intro: "Grooming til ansigt og skæg — enkel hverdagspleje.",
    body:
      "Her finder du barbering, skægpleje og relateret pleje til mænd. Kig også under hudpleje, hvis du søger serum eller creme til ansigtet.",
    relatedSlugs: ["skaegpleje", "hudpleje-ansigt", "kropspleje"],
  },
  skaegpleje: {
    h1: "Skægpleje",
    metaDescription: "Skægpleje hos Zebiza — olie, balsam og grooming.",
    intro: "Pleje til skæg og barbering.",
    relatedSlugs: ["barbering-grooming"],
  },
  kropspleje: {
    h1: "Kropspleje",
    metaDescription: "Kropspleje hos Zebiza — creme, olie og hverdagspleje.",
    intro: "Pleje til kroppen — fra fugt til daglig friskhed.",
    relatedSlugs: ["bad-saebe", "hudpleje-ansigt"],
  },
  "bad-saebe": {
    h1: "Bad & sæbe",
    metaDescription: "Bad og sæbe hos Zebiza — shower gel og badeprodukter.",
    intro: "Shower gels og badeprodukter til hverdagen.",
    relatedSlugs: ["badeprodukter", "kropspleje"],
  },
  badeprodukter: {
    h1: "Badeprodukter",
    metaDescription: "Badeprodukter hos Zebiza.",
    intro: "Produkter til badet.",
    relatedSlugs: ["bad-saebe"],
  },
  fodpleje: {
    h1: "Fodpleje",
    metaDescription: "Fodpleje hos Zebiza.",
    intro: "Pleje til fødderne.",
    relatedSlugs: ["kropspleje"],
  },
  "beauty-oevrigt": {
    h1: "Øvrig beauty",
    metaDescription: "Flere beauty-produkter hos Zebiza.",
    intro: "Beauty-produkter uden for de primære kategorier.",
    relatedSlugs: ["hudpleje-ansigt", "harpleje", "beauty-tools"],
  },
};

export function getCategoryCopy(slug: string): CategoryCopy | undefined {
  return CATEGORY_COPY[slug];
}
