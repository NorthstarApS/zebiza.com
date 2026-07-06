import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { mainNav } from "@/lib/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import logo from "@/assets/zebiza_logo.png.asset.json";

export default function Footer() {
  const { t, localizedPath } = useLanguage();

  return (
    <footer className="mt-4 border-t border-border bg-section">
      <div className="container-z grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <img src={logo.url} alt="Zebiza.com" className="mb-3 h-8 w-auto" />
          <p className="max-w-xs text-sm text-muted-foreground">{t.footer.tagline}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">{t.footer.shopping}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {mainNav.slice(0, 6).map((item) => (
              <li key={item.key}>
                <Link to={localizedPath(item.path)} className="hover:text-foreground">
                  {t.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">{t.footer.service}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to={localizedPath("/om-zebiza")} className="hover:text-foreground">{t.footer.aboutZebiza}</Link></li>
            <li><Link to={localizedPath("/levering-og-returnering")} className="hover:text-foreground">{t.footer.delivery}</Link></li>
            <li><Link to={localizedPath("/kontakt")} className="hover:text-foreground">{t.footer.contact}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">{t.footer.legal}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to={localizedPath("/handelsbetingelser")} className="hover:text-foreground">{t.footer.terms}</Link></li>
            <li><Link to={localizedPath("/privatlivspolitik")} className="hover:text-foreground">{t.footer.privacy}</Link></li>
            <li><Link to={localizedPath("/cookiepolitik")} className="hover:text-foreground">{t.footer.cookies}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-z flex flex-col items-center justify-between gap-3 py-4 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Zebiza.com · {t.footer.rights}</span>
          <div className="flex items-center gap-2">
            <span>{t.footer.language}:</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
