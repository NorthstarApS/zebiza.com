import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { getBrandBySlug, getProducts } from "@/services/woocommerce";
import ProductGrid from "@/components/product/ProductGrid";
import Seo from "@/components/layout/Seo";
import { stripTags } from "@/lib/html";

export default function Brand() {
  const { slug = "" } = useParams();
  const { t, lang, localizedPath } = useLanguage();

  const { data: brand, isLoading: brandLoading } = useQuery({
    queryKey: ["brand", lang, slug],
    queryFn: () => getBrandBySlug(slug, lang),
    enabled: Boolean(slug),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["brand-products", lang, slug],
    queryFn: async () => {
      // Store API may not filter by brand slug; fetch and filter client-side for now.
      const all = await getProducts({ perPage: 100, orderby: "date", beautyOnly: true }, lang);
      return all.filter(
        (p) => p.brand?.slug === slug || p.brands?.some((b) => b.slug === slug),
      );
    },
    enabled: Boolean(slug),
  });

  const name = brand?.name ?? slug;
  const description =
    stripTags(brand?.description) ||
    `Shop ${name} hos Zebiza — beautyprodukter med fair priser og levering til Danmark.`;

  return (
    <>
      <Seo
        title={`${name} — shop brandet hos Zebiza`}
        description={description.slice(0, 160)}
        path={`/brand/${slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name,
          description,
          url: `https://zebiza.com/da/brand/${slug}`,
        }}
      />
      <div className="border-b border-border bg-section">
        <div className="container-z py-8">
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link to={localizedPath("/")} className="hover:text-foreground">
              {t.common.home}
            </Link>
            <span className="mx-1">/</span>
            <Link to={localizedPath("/brands")} className="hover:text-foreground">
              Brands
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground">{name}</span>
          </nav>
          <h1 className="text-2xl font-bold sm:text-3xl">{brandLoading ? "…" : name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="container-z py-8">
        {!isLoading && products.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">{t.common.noResults}</p>
        ) : (
          <ProductGrid products={products} isLoading={isLoading} skeletonCount={8} />
        )}
      </div>
    </>
  );
}
