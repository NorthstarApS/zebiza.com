import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useSearch } from "@/hooks/useSearch";
import ProductGrid from "@/components/product/ProductGrid";
import Seo from "@/components/layout/Seo";

export default function Search() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const { data, isLoading, enabled } = useSearch(q);

  return (
    <>
      <Seo title={`${q} – ${t.nav.shop} · Zebiza.com`} description={t.category.intro} path="/soeg" />
      <div className="container-z py-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {t.header.searchPlaceholder.replace("…", "")}: <span className="text-trend">{q}</span>
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          {enabled ? `${data?.length ?? 0} ${t.common.results}` : t.common.empty}
        </p>
        {enabled && !isLoading && (data?.length ?? 0) === 0 ? (
          <p className="py-16 text-center text-muted-foreground">{t.common.noResults}</p>
        ) : (
          <ProductGrid products={data} isLoading={isLoading && enabled} skeletonCount={8} />
        )}
      </div>
    </>
  );
}
