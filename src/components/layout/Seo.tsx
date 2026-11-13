import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/context/LanguageContext";
import { absoluteUrl, INDEXABLE_LOCALES, SITE_ORIGIN } from "@/lib/site";
import type { LanguageCode } from "@/i18n";

interface SeoProps {
  title: string;
  description?: string;
  /** Path without locale prefix, e.g. /produkt/slug or / */
  path?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  ogImage?: string;
  ogType?: string;
}

export default function Seo({
  title,
  description,
  path = "/",
  jsonLd,
  noindex,
  ogImage,
  ogType = "website",
}: SeoProps) {
  const { lang, localizedPath, languages } = useLanguage();
  const localized = localizedPath(path);
  const canonical = absoluteUrl(localized);

  // Secondary locales are kept for UX but not indexed until content is complete.
  const shouldNoindex =
    noindex || !(INDEXABLE_LOCALES as readonly string[]).includes(lang);

  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {shouldNoindex ? (
        <meta name="robots" content="noindex,follow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}

      {/* hreflang: only emit for indexable locales + x-default → da */}
      {INDEXABLE_LOCALES.map((l) => (
        <link
          key={l}
          rel="alternate"
          hrefLang={l}
          href={absoluteUrl(pathWithLang(path, l))}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={absoluteUrl(pathWithLang(path, "da"))} />

      {/* Keep alternate links for UI locales that exist, but they are noindex */}
      {languages
        .filter((l) => !(INDEXABLE_LOCALES as readonly string[]).includes(l))
        .map((l) => (
          <link key={`ui-${l}`} rel="alternate" hrefLang={l} href={absoluteUrl(pathWithLang(path, l))} />
        ))}

      <meta property="og:site_name" content="Zebiza.com" />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content={ogLocale(lang)} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}

function pathWithLang(path: string, lang: LanguageCode): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${clean === "/" ? "" : clean}`;
}

function ogLocale(lang: LanguageCode): string {
  switch (lang) {
    case "da":
      return "da_DK";
    case "sv":
      return "sv_SE";
    case "de":
      return "de_DE";
    default:
      return "en_US";
  }
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${SITE_ORIGIN}/#org`,
    name: "Zebiza.com",
    url: SITE_ORIGIN,
    image: `${SITE_ORIGIN}/wp-content/uploads/2026/07/zebiza_logo_100.webp`,
    parentOrganization: { "@id": "https://viniko.dk/#org" },
    address: {
      "@type": "PostalAddress",
      addressCountry: "DK",
    },
    currenciesAccepted: "DKK",
    paymentAccepted: "Credit Card, MobilePay",
  };
}

export function websiteJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    name: "Zebiza.com",
    url: SITE_ORIGIN,
    description,
    inLanguage: "da-DK",
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_ORIGIN}/da/soeg?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
