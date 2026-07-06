import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/context/LanguageContext";

interface SeoProps {
  title: string;
  description?: string;
  path?: string;
  jsonLd?: Record<string, unknown>;
}

export default function Seo({ title, description, path = "/", jsonLd }: SeoProps) {
  const { lang, localizedPath } = useLanguage();
  const canonical = localizedPath(path);
  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
