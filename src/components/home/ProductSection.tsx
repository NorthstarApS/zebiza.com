import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import type { ProductQuery } from "@/types/woocommerce";
import ProductGrid from "@/components/product/ProductGrid";

interface Props {
  title: string;
  query: ProductQuery;
  viewAllPath?: string;
  tone?: "default" | "section";
}

export default function ProductSection({ title, query, viewAllPath, tone = "default" }: Props) {
  const { t, localizedPath } = useLanguage();
  const { data, isLoading } = useProducts({ perPage: 8, ...query });

  return (
    <section className={tone === "section" ? "bg-section" : ""}>
      <div className="container-z py-10 sm:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          {viewAllPath && (
            <Link
              to={localizedPath(viewAllPath)}
              className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-trend"
            >
              {t.common.viewAll}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <ProductGrid products={data?.slice(0, 4)} isLoading={isLoading} skeletonCount={4} />
      </div>
    </section>
  );
}
