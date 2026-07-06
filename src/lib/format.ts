import type { LanguageCode } from "@/i18n";

const locales: Record<LanguageCode, string> = {
  da: "da-DK",
  en: "en-GB",
  de: "de-DE",
  sv: "sv-SE",
};

// Store currency is DKK (Danish-owned webshop). Display formatting adapts to language.
export function formatPrice(value: number | string, lang: LanguageCode = "da"): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "";
  return new Intl.NumberFormat(locales[lang], {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(num);
}

export function savingPercent(regular: number, price: number): number {
  if (!regular || regular <= price) return 0;
  return Math.round(((regular - price) / regular) * 100);
}
