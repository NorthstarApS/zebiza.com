import { X, Minus, Plus, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export default function MiniCart() {
  const { t, lang, localizedPath } = useLanguage();
  const { isOpen, closeCart, items, updateItem, removeItem, subtotal, applyCoupon } = useCart();
  const [code, setCode] = useState("");

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-foreground/40 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label={t.header.cart}
      >
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold">{t.cart.title}</h2>
          <button onClick={closeCart} aria-label={t.header.close} className="p-1 hover:text-trend">
            <X className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="text-muted-foreground">{t.cart.empty}</p>
            <button
              onClick={closeCart}
              className="bg-foreground px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {t.common.continueShopping}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-3 border-b border-border pb-4">
                    <Link to={localizedPath(`/produkt/${item.slug}`)} onClick={closeCart}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 shrink-0 border border-border object-cover"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold leading-snug">{item.name}</span>
                        <button
                          onClick={() => removeItem(item.key)}
                          aria-label={t.common.remove}
                          className="text-muted-foreground hover:text-deal"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="mt-1 text-sm font-bold">{formatPrice(item.price, lang)}</span>
                      <div className="mt-auto flex items-center border border-border">
                        <button
                          onClick={() => updateItem(item.key, item.quantity - 1)}
                          className="p-1.5 hover:bg-section"
                          aria-label="-"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.key, item.quantity + 1)}
                          className="p-1.5 hover:bg-section"
                          aria-label="+"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-border p-4">
              <div className="mb-3 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t.common.couponPlaceholder}
                  className="flex-1 border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
                />
                <button
                  onClick={() => applyCoupon(code)}
                  className="border border-foreground px-4 text-sm font-semibold hover:bg-foreground hover:text-primary-foreground"
                >
                  {t.common.apply}
                </button>
              </div>
              <div className="mb-3 flex items-center justify-between text-base font-bold">
                <span>{t.common.subtotal}</span>
                <span>{formatPrice(subtotal, lang)}</span>
              </div>
              <Link
                to={localizedPath("/checkout")}
                onClick={closeCart}
                className="mb-2 block bg-foreground py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                {t.common.checkout}
              </Link>
              <Link
                to={localizedPath("/kurv")}
                onClick={closeCart}
                className="mb-3 block border border-border py-3 text-center text-sm font-semibold hover:bg-section"
              >
                {t.common.continueShopping}
              </Link>
              <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-price" />
                {t.trust.boxLine}
              </p>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
