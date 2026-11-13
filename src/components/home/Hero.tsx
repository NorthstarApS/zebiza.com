import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

export default function Hero() {
  const { t, localizedPath } = useLanguage();
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(350_40%_92%)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_left,_hsl(30_30%_94%)_0%,_hsl(var(--section))_60%)]"
        aria-hidden
      />
      <div className="container-z relative grid min-h-[70vh] items-center gap-8 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-20">
        <div className="max-w-xl">
          <p className="mb-3 text-sm font-semibold tracking-wide text-trend">Zebiza</p>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-[3.25rem]">
            {t.hero.headline}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t.hero.sub}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={localizedPath("/kategori/hudpleje-ansigt")}
              className="bg-foreground px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary-hover"
            >
              {t.hero.ctaPrimary}
            </Link>
            <Link
              to={localizedPath("/kategori/kosmetik-ansigt")}
              className="border border-foreground px-6 py-3 text-sm font-semibold transition-colors duration-150 hover:bg-foreground hover:text-primary-foreground"
            >
              {t.hero.ctaSecondary}
            </Link>
          </div>
        </div>
        <div className="relative min-h-[280px] md:min-h-[420px]">
          <img
            src="https://zebiza.com/wp-content/uploads/2026/05/5028197981105_S05123239_P00.jpg"
            alt="Beautyfavoritter hos Zebiza"
            width={1000}
            height={1000}
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
