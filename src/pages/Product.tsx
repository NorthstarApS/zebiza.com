import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProduct } from "@/hooks/useProduct";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import { formatPrice, savingPercent } from "@/lib/format";
import ProductBadge from "@/components/product/ProductBadge";
import ProductGrid from "@/components/product/ProductGrid";
import Seo from "@/components/layout/Seo";
import type { WCProduct } from "@/types/woocommerce";
import { stripTags } from "@/lib/html";
import { absoluteUrl } from "@/lib/site";
import { analytics } from "@/lib/analytics";

const RECENT_KEY = "zebiza_recent_v1";

export default function Product() {
  const { slug } = useParams();
  const { t, lang, localizedPath } = useLanguage();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [recent, setRecent] = useState<WCProduct[]>([]);

  const category = product?.categories[0];
  const { data: related } = useProducts({
    category: category?.slug,
    perPage: 8,
    beautyOnly: true,
  });

  useEffect(() => {
    setQty(1);
    setActiveImg(0);
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    analytics.viewItem(product);
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const prev: WCProduct[] = raw ? JSON.parse(raw) : [];
      setRecent(prev.filter((p) => p.id !== product.id).slice(0, 4));
      const next = [product, ...prev.filter((p) => p.id !== product.id)].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="container-z grid gap-8 py-10 md:grid-cols-2">
        <div className="aspect-square skeleton" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 skeleton" />
          <div className="h-6 w-1/3 skeleton" />
          <div className="h-24 w-full skeleton" />
          <div className="h-12 w-full skeleton" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-z py-20 text-center">
        <p className="text-muted-foreground">{t.common.noResults}</p>
        <Link to={localizedPath("/")} className="mt-4 inline-block text-sm font-semibold underline">
          {t.notFound.cta}
        </Link>
      </div>
    );
  }

  const price = Number(product.price);
  const regular = Number(product.regular_price);
  const saving = product.on_sale ? savingPercent(regular, price) : 0;
  const soldOut = product.stock_status === "outofstock";
  const plainShort = stripTags(product.short_description);
  const plainDesc = stripTags(product.description);
  const brand = product.brand;

  const buyNow = () => {
    addItem(product, qty);
    navigate(localizedPath("/checkout"));
  };

  const productLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.src),
    description: plainShort || plainDesc,
    sku: product.sku,
    url: absoluteUrl(localizedPath(`/produkt/${product.slug}`)),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(localizedPath(`/produkt/${product.slug}`)),
      price,
      priceCurrency: "DKK",
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
  if (brand) productLd.brand = { "@type": "Brand", name: brand.name };
  if (product.gtin) productLd.gtin = product.gtin;
  if (product.mpn) productLd.mpn = product.mpn;
  // Ratings only when real reviews exist
  if (product.rating_count > 0 && Number(product.average_rating) > 0) {
    productLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.average_rating,
      reviewCount: product.rating_count,
    };
  }

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Forside",
        item: absoluteUrl(localizedPath("/")),
      },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: category.name,
              item: absoluteUrl(localizedPath(`/kategori/${category.slug}`)),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 3 : 2,
        name: product.name,
        item: absoluteUrl(localizedPath(`/produkt/${product.slug}`)),
      },
    ],
  };

  return (
    <>
      <Seo
        title={`${product.name} | Zebiza`}
        description={(plainShort || plainDesc || product.name).slice(0, 160)}
        path={`/produkt/${product.slug}`}
        ogType="product"
        ogImage={product.images[0]?.src}
        jsonLd={[productLd, breadcrumbLd]}
      />

      <div className="container-z py-6">
        <nav className="mb-4 text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link to={localizedPath("/")} className="hover:text-foreground">
            {t.common.home}
          </Link>
          <span className="mx-1">/</span>
          {category && (
            <>
              <Link
                to={localizedPath(`/kategori/${category.slug}`)}
                className="hover:text-foreground"
              >
                {category.name}
              </Link>
              <span className="mx-1">/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="relative aspect-square overflow-hidden border border-border bg-section">
              <img
                src={product.images[activeImg]?.src}
                alt={product.images[activeImg]?.alt ?? product.name}
                width={800}
                height={800}
                className="h-full w-full object-cover"
                fetchPriority="high"
              />
              <div className="absolute left-2 top-2 flex flex-col gap-1">
                {product.badges?.map((b) => (
                  <ProductBadge key={b} badge={b} />
                ))}
              </div>
              {saving > 0 && (
                <span className="absolute right-2 top-2 bg-deal px-2 py-1 text-xs font-bold text-deal-foreground">
                  -{saving}%
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`h-20 w-20 shrink-0 border transition-colors duration-150 ${
                      i === activeImg ? "border-foreground" : "border-border"
                    }`}
                    aria-label={`Billede ${i + 1}`}
                  >
                    <img src={img.src} alt="" width={80} height={80} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {brand ? (
              <Link
                to={localizedPath(`/brand/${brand.slug}`)}
                className="text-xs font-semibold uppercase tracking-wide text-trend hover:underline"
              >
                {brand.name}
              </Link>
            ) : (
              category && (
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {category.name}
                </span>
              )
            )}
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.name}</h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-bold">{formatPrice(price, lang)}</span>
              {saving > 0 && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(regular, lang)}
                  </span>
                  <span className="bg-deal px-2 py-0.5 text-sm font-bold text-deal-foreground">
                    {t.common.save} {saving}%
                  </span>
                </>
              )}
            </div>

            <p className="mt-3 text-sm font-medium">
              {soldOut ? (
                <span className="text-destructive">{t.common.outOfStock}</span>
              ) : (
                <span className="text-price">{t.common.inStock}</span>
              )}
              {product.sku ? (
                <span className="ml-3 text-muted-foreground">SKU: {product.sku}</span>
              ) : null}
            </p>

            {plainShort && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{plainShort}</p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center border border-border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-3 transition-colors duration-150 hover:bg-section"
                  aria-label="Mindsk antal"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-10 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="p-3 transition-colors duration-150 hover:bg-section"
                  aria-label="Øg antal"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                aria-label={t.header.wishlist}
                className="flex h-12 w-12 items-center justify-center border border-border hover:border-foreground"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                disabled={soldOut}
                onClick={() => addItem(product, qty)}
                className="flex flex-1 items-center justify-center gap-2 bg-foreground py-3.5 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground"
              >
                <ShoppingBag className="h-4 w-4" />
                {t.common.addToCart}
              </button>
              <button
                disabled={soldOut}
                onClick={buyNow}
                className="flex-1 border-2 border-foreground py-3.5 text-sm font-semibold transition-colors duration-150 hover:bg-foreground hover:text-primary-foreground disabled:opacity-40"
              >
                {t.common.buyNow}
              </button>
            </div>

            <div className="mt-6 space-y-2 border border-border bg-section p-4 text-sm">
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-trend" /> {t.product.deliveryEstimate}
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-price" /> {t.trust.securePayment}
              </p>
              <p className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-purple" /> {t.trust.easyReturn} · 30 dage
              </p>
            </div>

            <div className="mt-6 divide-y divide-border border-y border-border">
              <details open className="py-3">
                <summary className="cursor-pointer font-semibold">{t.product.details}</summary>
                {product.description ? (
                  <div
                    className="prose-zebiza mt-2 text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">{plainShort}</p>
                )}
              </details>
              <details className="py-3">
                <summary className="cursor-pointer font-semibold">{t.product.deliveryReturn}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{t.pages.deliveryBody}</p>
              </details>
            </div>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="mb-5 text-xl font-bold">{t.sections.relatedProducts}</h2>
          <ProductGrid
            products={related?.filter((p) => p.id !== product.id).slice(0, 4)}
            skeletonCount={4}
          />
        </section>

        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 text-xl font-bold">{t.sections.recentlyViewed}</h2>
            <ProductGrid products={recent} skeletonCount={4} />
          </section>
        )}
      </div>

      <div className="sticky bottom-0 z-30 border-t border-border bg-background p-3 md:hidden">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">{formatPrice(price, lang)}</span>
          <button
            disabled={soldOut}
            onClick={() => addItem(product, qty)}
            className="flex flex-1 items-center justify-center gap-2 bg-foreground py-3 text-sm font-semibold text-primary-foreground disabled:bg-muted"
          >
            <ShoppingBag className="h-4 w-4" />
            {t.product.stickyAdd}
          </button>
        </div>
      </div>
    </>
  );
}
