import { Link } from "react-router-dom";
import { useState } from "react";
import { Minus, Plus, X, Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/format";
import ProductGrid from "@/components/product/ProductGrid";
import Seo from "@/components/layout/Seo";

export default function Cart() {
  const { t, lang, localizedPath } = useLanguage();
  const { items, updateItem, removeItem, subtotal, discount, total, applyCoupon } = useCart();
  const { data: impulse } = useProducts({ orderby: "popularity", perPage: 4 });
  const [code, setCode] = useState("");

  return (
    <>
      <Seo title={`${t.cart.title} · Zebiza.com`} path="/kurv" />
      <div className="container-z py-8">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t.cart.title}</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-muted-foreground">{t.cart.empty}</p>
            <p className="text-sm text-muted-foreground">{t.cart.emptyCta}</p>
            <Link
              to={localizedPath("/nyheder")}
              className="bg-foreground px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              {t.hero.ctaPrimary}
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Items */}
            <div className="divide-y divide-border border-y border-border">
              {items.map((item) => (
                <div key={item.key} className="flex gap-4 py-4">
                  <Link to={localizedPath(`/produkt/${item.slug}`)}>
                    <img src={item.image} alt={item.name} className="h-24 w-24 border border-border object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={localizedPath(`/produkt/${item.slug}`)} className="text-sm font-semibold hover:underline">
                        {item.name}
                      </Link>
                      <button onClick={() => removeItem(item.key)} aria-label={t.common.remove} className="text-muted-foreground hover:text-deal">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="mt-1 text-sm text-muted-foreground">{formatPrice(item.price, lang)}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button onClick={() => updateItem(item.key, item.quantity - 1)} className="p-2 hover:bg-section" aria-label="-">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateItem(item.key, item.quantity + 1)} className="p-2 hover:bg-section" aria-label="+">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-bold">{formatPrice(item.price * item.quantity, lang)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="h-fit border border-border p-5">
              <h2 className="mb-4 text-lg font-bold">{t.cart.orderSummary}</h2>
              <div className="mb-3 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t.common.couponPlaceholder}
                  className="flex-1 border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
                />
                <button onClick={() => applyCoupon(code)} className="border border-foreground px-4 text-sm font-semibold hover:bg-foreground hover:text-primary-foreground">
                  {t.common.apply}
                </button>
              </div>
              <div className="space-y-2 border-t border-border py-3 text-sm">
                <div className="flex justify-between">
                  <span>{t.common.subtotal}</span>
                  <span>{formatPrice(subtotal, lang)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-price">
                    <span>{t.common.couponPlaceholder}</span>
                    <span>-{formatPrice(discount, lang)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between border-t border-border py-3 text-lg font-bold">
                <span>{t.common.total}</span>
                <span>{formatPrice(total, lang)}</span>
              </div>
              <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="h-4 w-4 text-trend" /> {t.cart.deliveryMessage}
              </p>
              <Link
                to={localizedPath("/checkout")}
                className="block bg-foreground py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                {t.cart.goToCheckout}
              </Link>
            </aside>
          </div>
        )}

        {items.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 text-xl font-bold">{t.sections.maybeMissing}</h2>
            <ProductGrid products={impulse} skeletonCount={4} />
          </section>
        )}
      </div>
    </>
  );
}
