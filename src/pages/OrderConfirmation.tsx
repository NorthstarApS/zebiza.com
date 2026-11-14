import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock3, Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import Seo from "@/components/layout/Seo";

export default function OrderConfirmation() {
  const { t, localizedPath } = useLanguage();
  const [params] = useSearchParams();
  const orderNo = params.get("order")?.trim() || "";
  const status = (params.get("status") || "").toLowerCase();
  const pending =
    !orderNo ||
    status === "pending" ||
    status === "failed" ||
    status === "checkout-draft" ||
    status === "";

  return (
    <>
      <Seo title={`${t.orderConfirmation.title} · Zebiza.com`} path="/tak" noindex />
      <div className="container-z flex flex-col items-center py-20 text-center">
        {pending ? (
          <Clock3 className="h-16 w-16 text-muted-foreground" aria-hidden />
        ) : (
          <CheckCircle2 className="h-16 w-16 text-price" aria-hidden />
        )}
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
          {pending ? "Ordre modtaget — afventer bekræftelse" : t.orderConfirmation.title}
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          {pending
            ? "Vi viser kun et ordrenummer, når det kommer fra WooCommerce. Betaling er ikke markeret som gennemført, medmindre status er bekræftet."
            : t.orderConfirmation.sub}
        </p>
        {orderNo ? (
          <div className="mt-6 border border-border px-6 py-3 text-sm">
            <span className="text-muted-foreground">{t.orderConfirmation.orderNumber}: </span>
            <span className="font-bold">{orderNo}</span>
          </div>
        ) : (
          <p className="mt-6 max-w-md border border-border px-4 py-3 text-sm text-muted-foreground">
            Intet ordrenummer i URL. Hvis du har betalt, tjek din e-mail eller kontakt kundeservice.
          </p>
        )}
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Truck className="h-4 w-4 text-trend" aria-hidden /> {t.orderConfirmation.deliveryInfo}
        </p>
        <Link
          to={localizedPath("/")}
          className="mt-8 bg-foreground px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {t.orderConfirmation.continue}
        </Link>
      </div>
    </>
  );
}
