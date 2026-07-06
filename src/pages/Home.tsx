import { useLanguage } from "@/context/LanguageContext";
import Seo from "@/components/layout/Seo";
import Hero from "@/components/home/Hero";
import InspirationTiles from "@/components/home/InspirationTiles";
import ProductSection from "@/components/home/ProductSection";
import Newsletter from "@/components/home/Newsletter";
import TrustBar from "@/components/layout/TrustBar";

export default function Home() {
  const { t } = useLanguage();

  return (
    <>
      <Seo
        title={t.meta.homeTitle}
        description={t.meta.homeDescription}
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Zebiza.com",
          description: t.meta.homeDescription,
        }}
      />

      <Hero />
      <TrustBar variant="row" />

      <ProductSection
        title={t.sections.nyheder}
        query={{ category: "nyheder" }}
        viewAllPath="/nyheder"
      />
      <ProductSection
        title={t.sections.populaert}
        query={{ category: "populaert" }}
        viewAllPath="/populaert"
        tone="section"
      />

      <InspirationTiles />

      <ProductSection
        title={t.sections.beauty}
        query={{ category: "beauty" }}
        viewAllPath="/beauty"
        tone="section"
      />
      <ProductSection
        title={t.sections.livsstil}
        query={{ category: "livsstil" }}
        viewAllPath="/livsstil"
      />
      <ProductSection
        title={t.sections.gavefund}
        query={{ category: "gaver" }}
        viewAllPath="/gaver"
        tone="section"
      />
      <ProductSection
        title={t.sections.saeson}
        query={{ category: "saeson" }}
        viewAllPath="/saeson"
      />
      <ProductSection
        title={t.sections.prisvenlige}
        query={{ category: "tilbud", orderby: "saving" }}
        viewAllPath="/tilbud"
        tone="section"
      />
      <ProductSection
        title={t.sections.bestsellere}
        query={{ orderby: "popularity" }}
        viewAllPath="/shop"
      />

      <section className="container-z py-12">
        <h2 className="mb-6 text-xl font-bold sm:text-2xl">{t.trust.title}</h2>
        <TrustBar variant="grid" />
      </section>

      <Newsletter />
    </>
  );
}
