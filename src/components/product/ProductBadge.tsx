import { useLanguage } from "@/context/LanguageContext";
import type { ZBadge } from "@/types/woocommerce";
import { cn } from "@/lib/utils";

const styles: Record<ZBadge, string> = {
  nyhed: "bg-trend text-trend-foreground",
  populaer: "bg-purple text-purple-foreground",
  beauty: "bg-beauty text-beauty-foreground",
  gavefund: "bg-campaign text-campaign-foreground",
  saeson: "bg-purple text-purple-foreground",
  prisvenligt: "bg-price text-price-foreground",
  trend: "bg-trend text-trend-foreground",
  tilbud: "bg-deal text-deal-foreground",
};

export default function ProductBadge({ badge, className }: { badge: ZBadge; className?: string }) {
  const { t } = useLanguage();
  const labels: Record<ZBadge, string> = {
    nyhed: t.badges.nyhed,
    populaer: t.badges.populaer,
    beauty: t.badges.beauty,
    gavefund: t.badges.gavefund,
    saeson: t.badges.saeson,
    prisvenligt: t.badges.prisvenligt,
    trend: t.badges.trend,
    tilbud: t.badges.tilbud,
  };
  return (
    <span
      className={cn(
        "inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
        styles[badge],
        className,
      )}
    >
      {labels[badge]}
    </span>
  );
}
