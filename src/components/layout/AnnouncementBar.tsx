import { useLanguage } from "@/context/LanguageContext";

export default function AnnouncementBar() {
  const { t } = useLanguage();
  return (
    <div className="bg-foreground text-primary-foreground">
      <div className="container-z py-2 text-center text-[11px] sm:text-xs font-medium tracking-wide">
        {t.announcement}
      </div>
    </div>
  );
}
