import { useLanguage } from "@/context/LanguageContext";
import Seo, { organizationJsonLd, websiteJsonLd } from "@/components/layout/Seo";
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
        jsonLd={[organizationJsonLd(), websiteJsonLd(t.meta.homeDescription)]}
      />

      <Hero />
      <TrustBar variant="row" />

      <ProductSection
        title={t.sections.nyheder}
        query={{ orderby: "date", perPage: 8, beautyOnly: true }}
        viewAllPath="/kategori/hudpleje-ansigt"
      />

      <ProductSection
        title={t.sections.beauty}
        query={{ category: "hudpleje-ansigt", perPage: 8, beautyOnly: true }}
        viewAllPath="/kategori/hudpleje-ansigt"
        tone="section"
      />

      <InspirationTiles />

      <ProductSection
        title="Makeup"
        query={{ category: "kosmetik-ansigt", perPage: 8, beautyOnly: true }}
        viewAllPath="/kategori/kosmetik-ansigt"
      />

      <ProductSection
        title="Hårpleje"
        query={{ category: "harpleje", perPage: 8, beautyOnly: true }}
        viewAllPath="/kategori/harpleje"
        tone="section"
      />

      <ProductSection
        title="Parfume & dufte"
        query={{ category: "parfume-dufte", perPage: 8, beautyOnly: true }}
        viewAllPath="/kategori/parfume-dufte"
      />

      <ProductSection
        title="Beauty tools"
        query={{ category: "beauty-tools", perPage: 8, beautyOnly: true }}
        viewAllPath="/kategori/beauty-tools"
        tone="section"
      />

      <ProductSection
        title={t.sections.prisvenlige}
        query={{ onSale: true, perPage: 8, beautyOnly: true, orderby: "saving" }}
        viewAllPath="/tilbud"
      />

      <section className="container-z py-12">
        <h2 className="mb-6 text-xl font-bold sm:text-2xl">{t.trust.title}</h2>
        <TrustBar variant="grid" />
      </section>

      <Newsletter />
    </>
  );
}
