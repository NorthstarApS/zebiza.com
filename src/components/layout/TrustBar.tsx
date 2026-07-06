import { ShieldCheck, Truck, RotateCcw, Headphones, BadgeDollarSign, Flag } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function TrustBar({ variant = "row" }: { variant?: "row" | "grid" }) {
  const { t } = useLanguage();
  const items = [
    { icon: Flag, label: t.trust.danishOwned },
    { icon: BadgeDollarSign, label: t.trust.fairPrices },
    { icon: Truck, label: t.trust.delivery },
    { icon: ShieldCheck, label: t.trust.securePayment },
    { icon: RotateCcw, label: t.trust.easyReturn },
    { icon: Headphones, label: t.trust.support },
  ];

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 bg-card p-4">
            <Icon className="h-5 w-5 shrink-0 text-trend" />
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border-y border-border bg-section">
      <div className="container-z flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 text-xs font-medium text-foreground sm:text-sm">
        {items.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-trend" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
