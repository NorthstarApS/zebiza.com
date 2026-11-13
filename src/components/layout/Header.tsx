import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { mainNav } from "@/lib/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import SearchSuggest from "./SearchSuggest";
import logo from "@/assets/zebiza_logo.png.asset.json";
import { cn } from "@/lib/utils";

export default function Header() {
  const { t, localizedPath } = useLanguage();
  const { count, openCart } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(localizedPath(`/soeg?q=${encodeURIComponent(query.trim())}`));
      setMobileOpen(false);
    }
  };

  const accentClass = (accent?: string) =>
    accent === "trend"
      ? "text-trend"
      : accent === "beauty"
        ? "text-beauty"
        : accent === "deal"
          ? "text-deal"
          : "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      {/* Top row */}
      <div className="container-z flex items-center gap-4 py-3">
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={t.header.menu}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link to={localizedPath("/")} aria-label="Zebiza" className="shrink-0">
          <img src={logo.url} alt="Zebiza.com" className="h-7 w-auto sm:h-9" />
        </Link>

        {/* Search (desktop) */}
        <form onSubmit={submitSearch} className="relative hidden flex-1 lg:flex">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.header.searchPlaceholder}
            className="w-full border border-border border-r-0 px-4 py-2.5 text-sm outline-none focus:border-foreground"
            aria-label={t.header.searchPlaceholder}
            autoComplete="off"
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-foreground px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            <Search className="h-4 w-4" />
          </button>
          <SearchSuggest query={query} onPick={() => setQuery("")} />
        </form>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <LanguageSwitcher className="hidden sm:flex" />
          <Link
            to={localizedPath("/kontakt")}
            aria-label="Kundeservice"
            className="hidden text-sm font-medium hover:text-trend sm:inline"
          >
            Hjælp
          </Link>
          <button onClick={openCart} aria-label={t.header.cart} className="relative hover:text-trend">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-trend px-1 text-[10px] font-bold text-trend-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search (mobile) */}
      <form onSubmit={submitSearch} className="container-z relative flex pb-3 lg:hidden">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.header.searchPlaceholder}
          className="w-full border border-border border-r-0 px-3 py-2.5 text-sm outline-none focus:border-foreground"
          aria-label={t.header.searchPlaceholder}
          autoComplete="off"
        />
        <button type="submit" className="bg-foreground px-4 text-primary-foreground" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
        <SearchSuggest
          query={query}
          onPick={() => {
            setQuery("");
            setMobileOpen(false);
          }}
        />
      </form>

      {/* Main nav (desktop) */}
      <nav className="hidden border-t border-border lg:block" aria-label="Hovednavigation">
        <div className="container-z flex items-center gap-6 overflow-x-auto py-2.5 text-sm font-semibold">
          {mainNav.map((item) => (
            <Link
              key={item.key}
              to={localizedPath(item.path)}
              className={cn("whitespace-nowrap transition-colors duration-150 hover:text-trend", accentClass(item.accent))}
            >
              {item.label ?? (item.dictKey ? t.nav[item.dictKey] : item.key)}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="border-t border-border lg:hidden" aria-label="Mobilnavigation">
          <div className="container-z flex flex-col divide-y divide-border">
            {mainNav.map((item) => (
              <Link
                key={item.key}
                to={localizedPath(item.path)}
                onClick={() => setMobileOpen(false)}
                className={cn("py-3 text-sm font-semibold", accentClass(item.accent))}
              >
                {item.label ?? (item.dictKey ? t.nav[item.dictKey] : item.key)}
              </Link>
            ))}
            <Link
              to={localizedPath("/kontakt")}
              onClick={() => setMobileOpen(false)}
              className="py-3 text-sm font-semibold"
            >
              Hjælp / kontakt
            </Link>
            <div className="py-3">
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
