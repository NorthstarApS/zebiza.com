import { useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useFilters, type SortKey } from "@/hooks/useFilters";
import ProductGrid from "@/components/product/ProductGrid";
import TrustBar from "@/components/layout/TrustBar";
import Seo from "@/components/layout/Seo";

type Kind = "all" | "category" | "collection";

const sortKeys: { key: SortKey; labelKey: keyof ReturnType<typeof sortLabels> }[] = [
  { key: "popularity", labelKey: "popular" },
  { key: "date", labelKey: "newest" },
  { key: "price", labelKey: "priceLow" },
  { key: "price-desc", labelKey: "priceHigh" },
  { key: "saving", labelKey: "biggestSaving" },
  { key: "relevance", labelKey: "bestMatch" },
];

function sortLabels(t: ReturnType<typeof useLanguage>["t"]) {
  return {
    popular: t.sort.popular,
    newest: t.sort.newest,
    priceLow: t.sort.priceLow,
    priceHigh: t.sort.priceHigh,
    biggestSaving: t.sort.biggestSaving,
    bestMatch: t.sort.bestMatch,
  };
}

export default function Collection({ kind, slug: fixedSlug }: { kind: Kind; slug?: string }) {
  const { t, localizedPath } = useLanguage();
  const { slug: routeSlug } = useParams();
  const slug = fixedSlug ?? routeSlug;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const base = useMemo(() => {
    if (kind === "all") return {};
    if (kind === "collection") return { category: slug };
    return { category: slug };
  }, [kind, slug]);

  const { filters, setFilter, reset, query, activeCount } = useFilters(base);
  const { data, isLoading } = useProducts(query);
  const { data: categories } = useCategories();

  const title =
    kind === "all"
      ? t.nav.shop
      : (t.nav as Record<string, string>)[slug ?? ""] ??
        categories?.find((c) => c.slug === slug)?.name ??
        (slug ?? "");

  const sl = sortLabels(t);

  const FilterControls = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">{t.filters.price}</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder={t.filters.minPrice}
            value={filters.minPrice ?? ""}
            onChange={(e) => setFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-border px-2 py-2 text-sm outline-none focus:border-foreground"
          />
          <input
            type="number"
            placeholder={t.filters.maxPrice}
            value={filters.maxPrice ?? ""}
            onChange={(e) => setFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
            className="w-full border border-border px-2 py-2 text-sm outline-none focus:border-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.onSale}
            onChange={(e) => setFilter("onSale", e.target.checked)}
          />
          {t.filters.sale}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.inStock}
            onChange={(e) => setFilter("inStock", e.target.checked)}
          />
          {t.filters.inStock}
        </label>
      </div>

      {/* Placeholders for backend-driven attribute filters */}
      <div>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">{t.filters.category}</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {categories?.slice(0, 8).map((c) => (
            <li key={c.id}>
              <Link to={localizedPath(`/kategori/${c.slug}`)} className="hover:text-foreground">
                {c.name} <span className="text-xs">({c.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">{t.filters.brand}</p>
        <p className="font-semibold text-foreground">{t.filters.color}</p>
        <p className="font-semibold text-foreground">{t.filters.gift}</p>
        <p className="font-semibold text-foreground">{t.filters.type}</p>
      </div>

      <button
        onClick={reset}
        className="w-full border border-foreground py-2 text-sm font-semibold hover:bg-foreground hover:text-primary-foreground"
      >
        {t.filters.clear}
      </button>
    </div>
  );

  return (
    <>
      <Seo
        title={`${title} – Find trends og prisvenlige favoritter hos Zebiza.com`}
        description={t.category.intro}
        path={kind === "all" ? "/shop" : `/${slug}`}
      />

      {/* Header */}
      <div className="border-b border-border bg-section">
        <div className="container-z py-8">
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link to={localizedPath("/")} className="hover:text-foreground">{t.common.home}</Link>
            <span className="mx-1">/</span>
            <span className="text-foreground">{title}</span>
          </nav>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t.category.intro}</p>
        </div>
      </div>

      <div className="container-z py-8">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 border border-foreground px-4 py-2 text-sm font-semibold lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t.filters.title}
            {activeCount > 0 && (
              <span className="bg-trend px-1.5 text-xs text-trend-foreground">{activeCount}</span>
            )}
          </button>
          <span className="hidden text-sm text-muted-foreground lg:block">
            {data?.length ?? 0} {t.common.results}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-muted-foreground">{t.sort.label}:</label>
            <select
              value={filters.orderby}
              onChange={(e) => setFilter("orderby", e.target.value as SortKey)}
              className="border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              {sortKeys.map((s) => (
                <option key={s.key} value={s.key}>
                  {sl[s.labelKey]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* Desktop filters */}
          <aside className="hidden lg:block">
            <h2 className="mb-4 text-lg font-bold">{t.filters.title}</h2>
            <FilterControls />
          </aside>

          <div>
            {!isLoading && (data?.length ?? 0) === 0 ? (
              <p className="py-16 text-center text-muted-foreground">{t.common.noResults}</p>
            ) : (
              <ProductGrid products={data} isLoading={isLoading} skeletonCount={9} />
            )}

            {/* Inspiration / related categories */}
            <section className="mt-12">
              <h2 className="mb-4 text-lg font-bold">{t.sections.relatedCategories}</h2>
              <div className="flex flex-wrap gap-2">
                {categories?.map((c) => (
                  <Link
                    key={c.id}
                    to={localizedPath(`/kategori/${c.slug}`)}
                    className="border border-border px-3 py-1.5 text-sm hover:border-foreground"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* SEO text block */}
        <section className="mt-14 border-t border-border pt-10">
          <h2 className="mb-3 text-lg font-bold">{t.category.seoBlockTitle}</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {title} hos Zebiza.com samler et bredt udvalg af trends, beauty og livsstil til fair
            priser. {t.category.intro} Vi opdaterer løbende med nyheder, sæsonfavoritter og
            prisvenlige fund, så du nemt kan finde noget godt til hverdagen — til dig selv eller som
            en lille gave.
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">{t.category.faqTitle}</h2>
          <div className="max-w-3xl space-y-3 text-sm">
            <details className="border border-border p-4">
              <summary className="cursor-pointer font-semibold">Hvornår kommer min pakke?</summary>
              <p className="mt-2 text-muted-foreground">{t.trust.delivery}. {t.product.deliveryEstimate}.</p>
            </details>
            <details className="border border-border p-4">
              <summary className="cursor-pointer font-semibold">Kan jeg returnere?</summary>
              <p className="mt-2 text-muted-foreground">{t.pages.deliveryBody}</p>
            </details>
            <details className="border border-border p-4">
              <summary className="cursor-pointer font-semibold">Er Zebiza en dansk webshop?</summary>
              <p className="mt-2 text-muted-foreground">{t.trust.danishOwned}. {t.trust.support}.</p>
            </details>
          </div>
        </section>
      </div>

      <TrustBar variant="row" />

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-foreground/40" onClick={() => setDrawerOpen(false)} />
          <aside className="fixed left-0 top-0 z-50 h-full w-full max-w-xs overflow-y-auto bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t.filters.title}</h2>
              <button onClick={() => setDrawerOpen(false)} aria-label={t.header.close}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterControls />
            <button
              onClick={() => setDrawerOpen(false)}
              className="mt-6 w-full bg-foreground py-3 text-sm font-semibold text-primary-foreground"
            >
              {t.filters.apply}
            </button>
          </aside>
        </>
      )}
    </>
  );
}
