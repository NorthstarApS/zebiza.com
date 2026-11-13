import { useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { storeApi } from "@/services/storeApi";
import { formatPrice } from "@/lib/format";
import Seo from "@/components/layout/Seo";
import { analytics } from "@/lib/analytics";
import { toast } from "sonner";

function Field({
  label,
  error,
  ...props
}: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        {...props}
        className="border border-border px-3 py-2.5 text-sm outline-none focus:border-foreground"
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

export default function Checkout() {
  const { t, lang, localizedPath } = useLanguage();
  const { items, subtotal, discount, total, clear } = useCart();
  const navigate = useNavigate();
  const [sameAddress, setSameAddress] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [delivery, setDelivery] = useState("flat_rate");
  const [payment, setPayment] = useState("bacs");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");

  const { data: gateways = [] } = useQuery({
    queryKey: ["payment-gateways"],
    queryFn: () => storeApi.paymentGateways(),
    staleTime: 60_000,
  });

  const paymentOptions = useMemo(
    () =>
      gateways.length > 0
        ? gateways
        : [
            { id: "bacs", title: t.checkout.cardPayment, description: t.checkout.trust },
            { id: "cod", title: t.checkout.mobilepay },
          ],
    [gateways, t.checkout.cardPayment, t.checkout.mobilepay, t.checkout.trust],
  );

  useEffect(() => {
    if (items.length) {
      analytics.beginCheckout(
        total,
        items.map((i) => ({
          id: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (paymentOptions.length && !paymentOptions.some((g) => g.id === payment)) {
      setPayment(paymentOptions[0].id);
    }
  }, [paymentOptions, payment]);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return;
    setFormError(null);
    setSubmitting(true);

    analytics.addShippingInfo(total, delivery);
    analytics.addPaymentInfo(total, payment);

    const payload = {
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        company: "",
        address_1: address,
        address_2: "",
        city,
        state: "",
        postcode,
        country: "DK",
        email,
        phone,
      },
      shipping_address: sameAddress
        ? {
            first_name: firstName,
            last_name: lastName,
            company: "",
            address_1: address,
            address_2: "",
            city,
            state: "",
            postcode,
            country: "DK",
          }
        : undefined,
      payment_method: payment,
      customer_note: "",
    };

    const res = await storeApi.checkout(payload, lang);
    setSubmitting(false);

    if (res.ok && res.data) {
      const orderId =
        String(
          (res.data as { order_id?: number; order_number?: string }).order_id ??
            (res.data as { order_number?: string }).order_number ??
            `local-${Date.now()}`,
        );
      analytics.purchase(
        orderId,
        total,
        items.map((i) => ({
          id: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      );
      clear();
      navigate(localizedPath(`/tak?order=${encodeURIComponent(orderId)}`));
      return;
    }

    // Store API may reject without a fully synced cart / payment plugin.
    // Do not fake a successful paid order — surface the error.
    const message =
      res.error ??
      "Kunne ikke gennemføre ordren lige nu. Tjek oplysninger og prøv igen, eller kontakt kundeservice.";
    setFormError(message);
    toast.error?.(message);
  };

  if (items.length === 0) {
    return (
      <div className="container-z py-20 text-center">
        <p className="mb-4 text-muted-foreground">{t.cart.empty}</p>
        <Link
          to={localizedPath("/kategori/hudpleje-ansigt")}
          className="bg-foreground px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          {t.hero.ctaPrimary}
        </Link>
      </div>
    );
  }

  const shippingCost = delivery === "flat_rate" ? 39 : 0;
  const grandTotal = total + shippingCost;

  return (
    <>
      <Seo title={`${t.checkout.title} · Zebiza.com`} path="/checkout" noindex />
      <div className="container-z py-8">
        <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t.checkout.title}</h1>

        <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-bold">{t.checkout.customerInfo}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={t.checkout.email}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <Field
                  label={t.checkout.phone}
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">{t.checkout.delivery}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label={t.checkout.firstName}
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
                <Field
                  label={t.checkout.lastName}
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
                <div className="sm:col-span-2">
                  <Field
                    label={t.checkout.address}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    autoComplete="street-address"
                  />
                </div>
                <Field
                  label={t.checkout.postcode}
                  required
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  autoComplete="postal-code"
                />
                <Field
                  label={t.checkout.city}
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                />
                <Field label={t.checkout.country} defaultValue="Danmark" required readOnly />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sameAddress}
                  onChange={(e) => setSameAddress(e.target.checked)}
                />
                {t.checkout.sameAsDelivery}
              </label>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">{t.checkout.deliveryMethod}</h2>
              <label className="flex items-center gap-2 border border-border p-3 text-sm">
                <input
                  type="radio"
                  name="delivery"
                  checked={delivery === "flat_rate"}
                  onChange={() => setDelivery("flat_rate")}
                />
                {t.checkout.standardShipping} — 39 kr.
              </label>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">{t.checkout.paymentMethod}</h2>
              <div className="space-y-2">
                {paymentOptions.map((g) => (
                  <label key={g.id} className="flex items-start gap-2 border border-border p-3 text-sm">
                    <input
                      type="radio"
                      name="payment"
                      className="mt-1"
                      checked={payment === g.id}
                      onChange={() => setPayment(g.id)}
                    />
                    <span>
                      <span className="font-medium">{g.title}</span>
                      {g.description && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {g.description}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                required
              />
              <span>
                {t.checkout.terms}{" "}
                <Link to={localizedPath("/handelsbetingelser")} className="underline">
                  {t.footer.terms}
                </Link>
              </span>
            </label>

            {formError && (
              <p className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {formError}
              </p>
            )}
          </div>

          <aside className="h-fit border border-border bg-section p-5">
            <h2 className="mb-4 text-lg font-bold">{t.cart.orderSummary}</h2>
            <ul className="mb-4 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.key} className="flex justify-between gap-3">
                  <span>
                    {i.name} × {i.quantity}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatPrice(i.price * i.quantity, lang)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <span>{t.common.subtotal}</span>
                <span>{formatPrice(subtotal, lang)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-deal">
                  <span>Rabat</span>
                  <span>-{formatPrice(discount, lang)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Fragt</span>
                <span>{formatPrice(shippingCost, lang)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold">
                <span>{t.common.total}</span>
                <span>{formatPrice(grandTotal, lang)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Inkl. moms</p>
            </div>
            <button
              type="submit"
              disabled={!accepted || submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 bg-foreground py-3.5 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {submitting ? t.common.loading : t.checkout.placeOrder}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">{t.checkout.trust}</p>
          </aside>
        </form>
      </div>
    </>
  );
}
