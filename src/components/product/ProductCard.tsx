import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatPrice, savingPercent } from "@/lib/format";
import type { WCProduct } from "@/types/woocommerce";
import ProductBadge from "./ProductBadge";
import { analytics } from "@/lib/analytics";
import { stripTags } from "@/lib/html";

export default function ProductCard({ product }: { product: WCProduct }) {
  const { t, lang, localizedPath } = useLanguage();
  const { addItem } = useCart();

  const price = Number(product.price);
  const regular = Number(product.regular_price);
  const saving = product.on_sale ? savingPercent(regular, price) : 0;
  const soldOut = product.stock_status === "outofstock";
  const productUrl = localizedPath(`/produkt/${product.slug}`);
  const brand = product.brand?.name;
  const sizeHint = stripTags(product.short_description).match(/\b\d+[.,]?\d*\s?(ml|g|stk)\b/i)?.[0];

  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden bg-section">
        <Link
          to={productUrl}
          aria-label={product.name}
          className="block aspect-square"
          onClick={() => analytics.selectItem(product, "product-grid")}
        >
          <img
            src={product.images[0]?.src}
            alt={product.images[0]?.alt ?? product.name}
            loading="lazy"
            width={700}
            height={700}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </Link>

        <div className="absolute left-0 top-0 flex flex-col gap-1 p-2">
          {product.badges?.slice(0, 2).map((b) => (
            <ProductBadge key={b} badge={b} />
          ))}
        </div>

        {saving > 0 && (
          <span className="absolute right-2 top-2 bg-deal px-2 py-1 text-[10px] font-bold uppercase text-deal-foreground">
            -{saving}%
          </span>
        )}

        {soldOut && (
          <div className="absolute inset-x-0 bottom-0 bg-foreground/85 py-1.5 text-center text-xs font-medium text-primary-foreground">
            {t.common.outOfStock}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-3">
        {brand && (
          <span className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {brand}
          </span>
        )}
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug">
          <Link to={productUrl} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {sizeHint && <p className="mb-2 text-xs text-muted-foreground">{sizeHint}</p>}

        <div className="mt-auto">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground">{formatPrice(price, lang)}</span>
            {saving > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(regular, lang)}
              </span>
            )}
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            {soldOut ? t.common.outOfStock : t.common.inStock}
          </p>
          <button
            disabled={soldOut}
            onClick={() => addItem(product)}
            className="flex w-full items-center justify-center gap-2 bg-foreground py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <ShoppingBag className="h-4 w-4" />
            {t.common.addToCart}
          </button>
        </div>
      </div>
    </article>
  );
}
