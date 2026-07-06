import { Link } from "react-router-dom";
import { CheckCircle2, Truck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import Seo from "@/components/layout/Seo";

export default function OrderConfirmation() {
  const { t, localizedPath } = useLanguage();
  const orderNo = `ZB-${Math.floor(100000 + Math.random() * 899999)}`;

  return (
    <>
      <Seo title={`${t.orderConfirmation.title} · Zebiza.com`} path="/tak" />
      <div className="container-z flex flex-col items-center py-20 text-center">
        <CheckCircle2 className="h-16 w-16 text-price" />
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">{t.orderConfirmation.title}</h1>
        <p className="mt-2 max-w-md text-muted-foreground">{t.orderConfirmation.sub}</p>
        <div className="mt-6 border border-border px-6 py-3 text-sm">
          <span className="text-muted-foreground">{t.orderConfirmation.orderNumber}: </span>
          <span className="font-bold">{orderNo}</span>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Truck className="h-4 w-4 text-trend" /> {t.orderConfirmation.deliveryInfo}
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
