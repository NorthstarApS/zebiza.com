import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

export default function Hero() {
  const { t, localizedPath } = useLanguage();
  return (
    <section className="bg-section">
      <div className="container-z grid items-stretch gap-0 py-0 md:grid-cols-2">
        <div className="flex flex-col justify-center py-12 pr-0 md:py-20 md:pr-10">
          <span className="mb-4 inline-block w-fit bg-trend px-3 py-1 text-xs font-bold uppercase tracking-wide text-trend-foreground">
            {t.hero.eyebrow}
          </span>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            {t.hero.headline}
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">{t.hero.sub}</p>
          <p className="mt-2 text-sm font-medium text-foreground">{t.hero.micro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={localizedPath("/nyheder")}
              className="bg-foreground px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              {t.hero.ctaPrimary}
            </Link>
            <Link
              to={localizedPath("/populaert")}
              className="border border-foreground px-6 py-3 text-sm font-semibold hover:bg-foreground hover:text-primary-foreground"
            >
              {t.hero.ctaSecondary}
            </Link>
          </div>
        </div>
        <div className="relative min-h-[280px] md:min-h-[460px]">
          <img
            src="https://picsum.photos/seed/zebizahero/1000/1000"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute bottom-4 right-4 bg-campaign px-3 py-1.5 text-xs font-bold uppercase text-campaign-foreground">
            {t.sections.saeson}
          </span>
        </div>
      </div>
    </section>
  );
}
