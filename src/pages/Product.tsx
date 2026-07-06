import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, Star, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useProduct } from "@/hooks/useProduct";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import { formatPrice, savingPercent } from "@/lib/format";
import ProductBadge from "@/components/product/ProductBadge";
import ProductGrid from "@/components/product/ProductGrid";
import Seo from "@/components/layout/Seo";
import type { WCProduct } from "@/types/woocommerce";

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
  const { data: related } = useProducts({ category: category?.slug, perPage: 8 });

  useEffect(() => {
    setQty(1);
    setActiveImg(0);
  }, [slug]);

  useEffect(() => {
    if (!product) return;
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
      </div>
    );
  }

  const price = Number(product.price);
  const regular = Number(product.regular_price);
  const saving = product.on_sale ? savingPercent(regular, price) : 0;
  const soldOut = product.stock_status === "outofstock";

  const buyNow = () => {
    addItem(product, qty);
    navigate(localizedPath("/checkout"));
  };

  return (
    <>
      <Seo
        title={`${product.name} – Køb hos Zebiza.com`}
        description={product.short_description.replace(/<[^>]+>/g, "")}
        path={`/produkt/${product.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          image: product.images.map((i) => i.src),
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "DKK",
            availability: soldOut ? "OutOfStock" : "InStock",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.average_rating,
            reviewCount: product.rating_count,
          },
        }}
      />

      <div className="container-z py-6">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to={localizedPath("/")} className="hover:text-foreground">{t.common.home}</Link>
          <span className="mx-1">/</span>
          {category && (
            <>
              <Link to={localizedPath(`/kategori/${category.slug}`)} className="hover:text-foreground">
                {category.name}
              </Link>
              <span className="mx-1">/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden border border-border bg-section">
              <img
                src={product.images[activeImg]?.src}
                alt={product.images[activeImg]?.alt ?? product.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-2 top-2 flex flex-col gap-1">
                {product.badges?.map((b) => <ProductBadge key={b} badge={b} />)}
              </div>
              {saving > 0 && (
                <span className="absolute right-2 top-2 bg-deal px-2 py-1 text-xs font-bold text-deal-foreground">
                  -{saving}%
                </span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`h-20 w-20 border ${i === activeImg ? "border-foreground" : "border-border"}`}
                  >
                    <img src={img.src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {category && (
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {category.name}
              </span>
            )}
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.name}</h1>

            <div className="mt-2 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-campaign text-campaign" />
              <span className="font-semibold">{product.average_rating}</span>
              <span className="text-muted-foreground">({product.rating_count})</span>
            </div>

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

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.short_description.replace(/<[^>]+>/g, "")}
            </p>
            <p className="mt-2 text-sm font-medium">{t.product.micro}</p>

            {/* Quantity + actions */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:bg-section" aria-label="-">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-10 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="p-3 hover:bg-section" aria-label="+">
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
                className="flex flex-1 items-center justify-center gap-2 bg-foreground py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground"
              >
                <ShoppingBag className="h-4 w-4" />
                {t.common.addToCart}
              </button>
              <button
                disabled={soldOut}
                onClick={buyNow}
                className="flex-1 border-2 border-foreground py-3.5 text-sm font-semibold hover:bg-foreground hover:text-primary-foreground disabled:opacity-40"
              >
                {t.common.buyNow}
              </button>
            </div>

            {/* Trust box */}
            <div className="mt-6 space-y-2 border border-border bg-section p-4 text-sm">
              <p className="flex items-center gap-2"><Truck className="h-4 w-4 text-trend" /> {t.product.deliveryEstimate}</p>
              <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-price" /> {t.trust.securePayment}</p>
              <p className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-purple" /> {t.trust.easyReturn}</p>
            </div>

            {/* Details accordion */}
            <div className="mt-6 divide-y divide-border border-y border-border">
              <details open className="py-3">
                <summary className="cursor-pointer font-semibold">{t.product.kortFortalt}</summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.short_description.replace(/<[^>]+>/g, "")}
                </p>
              </details>
              <details className="py-3">
                <summary className="cursor-pointer font-semibold">{t.product.goodFind}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{product.goodFind ?? t.trust.service}</p>
              </details>
              <details className="py-3">
                <summary className="cursor-pointer font-semibold">{t.product.fitsWith}</summary>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(product.fitsWith ?? []).map((f) => (
                    <span key={f} className="border border-border px-2 py-1 text-xs">{f}</span>
                  ))}
                </div>
              </details>
              <details className="py-3">
                <summary className="cursor-pointer font-semibold">{t.product.details}</summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.description.replace(/<[^>]+>/g, "")}
                </p>
              </details>
              <details className="py-3">
                <summary className="cursor-pointer font-semibold">{t.product.deliveryReturn}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{t.pages.deliveryBody}</p>
              </details>
            </div>
          </div>
        </div>

        {/* Related */}
        <section className="mt-16">
          <h2 className="mb-5 text-xl font-bold">{t.sections.relatedProducts}</h2>
          <ProductGrid products={related?.filter((p) => p.id !== product.id).slice(0, 4)} skeletonCount={4} />
        </section>

        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 text-xl font-bold">{t.sections.recentlyViewed}</h2>
            <ProductGrid products={recent} skeletonCount={4} />
          </section>
        )}
      </div>

      {/* Sticky mobile add-to-cart bar */}
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
