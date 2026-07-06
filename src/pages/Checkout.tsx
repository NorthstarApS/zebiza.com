import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { storeApi } from "@/services/storeApi";
import { formatPrice } from "@/lib/format";
import Seo from "@/components/layout/Seo";

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        {...props}
        className="border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
      />
    </label>
  );
}

export default function Checkout() {
  const { t, lang, localizedPath } = useLanguage();
  const { items, subtotal, discount, total, clear } = useCart();
  const navigate = useNavigate();
  const [sameAddress, setSameAddress] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [delivery, setDelivery] = useState("standard");
  const [payment, setPayment] = useState("card");

  const placeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return;
    void storeApi.checkout({ delivery, payment }, lang);
    clear();
    navigate(localizedPath("/tak"));
  };

  if (items.length === 0) {
    return (
      <div className="container-z py-20 text-center">
        <p className="mb-4 text-muted-foreground">{t.cart.empty}</p>
        <Link to={localizedPath("/nyheder")} className="bg-foreground px-6 py-3 text-sm font-semibold text-primary-foreground">
          {t.hero.ctaPrimary}
        </Link>
      </div>
    );
  }

  return (
    <>
      <Seo title={`${t.checkout.title} · Zebiza.com`} path="/checkout" />
      <div className="container-z py-8">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t.checkout.title}</h1>

        <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            {/* Customer */}
            <section>
              <h2 className="mb-3 text-lg font-bold">{t.checkout.customerInfo}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.checkout.email} type="email" required className="" />
                <Field label={t.checkout.phone} type="tel" required />
              </div>
            </section>

            {/* Delivery */}
            <section>
              <h2 className="mb-3 text-lg font-bold">{t.checkout.delivery}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t.checkout.firstName} required />
                <Field label={t.checkout.lastName} required />
                <div className="sm:col-span-2"><Field label={t.checkout.address} required /></div>
                <Field label={t.checkout.postcode} required />
                <Field label={t.checkout.city} required />
                <Field label={t.checkout.country} defaultValue="Danmark" required />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
                {t.checkout.sameAsDelivery}
              </label>
            </section>

            {!sameAddress && (
              <section>
                <h2 className="mb-3 text-lg font-bold">{t.checkout.billing}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Field label={t.checkout.address} /></div>
                  <Field label={t.checkout.postcode} />
                  <Field label={t.checkout.city} />
                </div>
              </section>
            )}

            {/* Delivery method */}
            <section>
              <h2 className="mb-3 text-lg font-bold">{t.checkout.deliveryMethod}</h2>
              <label className="flex items-center gap-2 border border-border p-3 text-sm">
                <input type="radio" name="delivery" checked={delivery === "standard"} onChange={() => setDelivery("standard")} />
                {t.checkout.standardShipping}
              </label>
            </section>

            {/* Payment method */}
            <section>
              <h2 className="mb-3 text-lg font-bold">{t.checkout.paymentMethod}</h2>
              <div className="space-y-2">
                <label className="flex items-center gap-2 border border-border p-3 text-sm">
                  <input type="radio" name="payment" checked={payment === "card"} onChange={() => setPayment("card")} />
                  {t.checkout.cardPayment}
                </label>
                <label className="flex items-center gap-2 border border-border p-3 text-sm">
                  <input type="radio" name="payment" checked={payment === "mobilepay"} onChange={() => setPayment("mobilepay")} />
                  {t.checkout.mobilepay}
                </label>
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="h-fit border border-border p-5">
            <h2 className="mb-4 text-lg font-bold">{t.cart.orderSummary}</h2>
            <ul className="mb-3 space-y-2 border-b border-border pb-3 text-sm">
              {items.map((item) => (
                <li key={item.key} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{item.quantity}× {item.name}</span>
                  <span>{formatPrice(item.price * item.quantity, lang)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>{t.common.subtotal}</span><span>{formatPrice(subtotal, lang)}</span></div>
              {discount > 0 && <div className="flex justify-between text-price"><span>{t.common.couponPlaceholder}</span><span>-{formatPrice(discount, lang)}</span></div>}
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-bold">
              <span>{t.common.total}</span><span>{formatPrice(total, lang)}</span>
            </div>

            <label className="mt-4 flex items-start gap-2 text-xs">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
              {t.checkout.terms}
            </label>

            <button
              type="submit"
              disabled={!accepted}
              className="mt-4 w-full bg-foreground py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.checkout.placeOrder}
            </button>
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-price" /> {t.checkout.trust}
            </p>
          </aside>
        </form>
      </div>
    </>
  );
}
