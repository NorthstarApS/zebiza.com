import { Link } from "react-router-dom";
import { Heart, Eye, ShoppingBag, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatPrice, savingPercent } from "@/lib/format";
import type { WCProduct } from "@/types/woocommerce";
import ProductBadge from "./ProductBadge";

export default function ProductCard({ product }: { product: WCProduct }) {
  const { t, lang, localizedPath } = useLanguage();
  const { addItem } = useCart();

  const price = Number(product.price);
  const regular = Number(product.regular_price);
  const saving = product.on_sale ? savingPercent(regular, price) : 0;
  const category = product.categories[0]?.name;
  const soldOut = product.stock_status === "outofstock";
  const productUrl = localizedPath(`/produkt/${product.slug}`);

  return (
    <article className="group flex flex-col border border-border bg-card">
      <div className="relative overflow-hidden bg-section">
        <Link to={productUrl} aria-label={product.name} className="block aspect-square">
          <img
            src={product.images[0]?.src}
            alt={product.images[0]?.alt ?? product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute left-0 top-0 flex flex-col gap-1 p-2">
          {product.badges?.slice(0, 2).map((b) => <ProductBadge key={b} badge={b} />)}
        </div>

        {saving > 0 && (
          <span className="absolute right-2 top-2 bg-deal px-2 py-1 text-[10px] font-bold uppercase text-deal-foreground">
            -{saving}%
          </span>
        )}

        {/* Hover actions */}
        <div className="absolute right-2 top-10 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            aria-label={t.header.wishlist}
            className="flex h-9 w-9 items-center justify-center border border-border bg-background text-foreground hover:bg-foreground hover:text-primary-foreground"
          >
            <Heart className="h-4 w-4" />
          </button>
          <Link
            to={productUrl}
            aria-label={t.common.quickView}
            className="flex h-9 w-9 items-center justify-center border border-border bg-background text-foreground hover:bg-foreground hover:text-primary-foreground"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>

        {soldOut && (
          <div className="absolute inset-x-0 bottom-0 bg-foreground/85 py-1.5 text-center text-xs font-medium text-primary-foreground">
            {t.common.outOfStock}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {category && (
          <span className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {category}
          </span>
        )}
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug">
          <Link to={productUrl} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        {/* Social proof */}
        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-campaign text-campaign" />
          <span className="font-medium text-foreground">{product.average_rating}</span>
          <span>({product.rating_count})</span>
        </div>

        <div className="mt-auto">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground">{formatPrice(price, lang)}</span>
            {saving > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(regular, lang)}
              </span>
            )}
          </div>
          <button
            disabled={soldOut}
            onClick={() => addItem(product)}
            className="flex w-full items-center justify-center gap-2 bg-foreground py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <ShoppingBag className="h-4 w-4" />
            {t.common.addToCart}
          </button>
        </div>
      </div>
    </article>
  );
}
