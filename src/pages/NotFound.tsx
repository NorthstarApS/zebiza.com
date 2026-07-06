import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import Seo from "@/components/layout/Seo";

export default function NotFound() {
  const { t, localizedPath } = useLanguage();
  return (
    <>
      <Seo title={`${t.notFound.title} · Zebiza.com`} path="/404" />
      <div className="container-z flex flex-col items-center py-24 text-center">
        <span className="text-6xl font-bold text-trend">404</span>
        <h1 className="mt-4 text-2xl font-bold">{t.notFound.title}</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">{t.notFound.sub}</p>
        <Link
          to={localizedPath("/")}
          className="mt-8 bg-foreground px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {t.notFound.cta}
        </Link>
      </div>
    </>
  );
}
