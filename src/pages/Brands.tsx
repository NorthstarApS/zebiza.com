import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { getBrands } from "@/services/woocommerce";
import Seo from "@/components/layout/Seo";

export default function Brands() {
  const { t, lang, localizedPath } = useLanguage();
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brands", lang],
    queryFn: () => getBrands(lang),
    staleTime: 1000 * 60 * 10,
  });

  const sorted = [...brands].sort((a, b) => a.name.localeCompare(b.name, "da"));

  return (
    <>
      <Seo
        title="Brands hos Zebiza — kendte beauty-mærker"
        description="Udforsk brands hos Zebiza: hudpleje, makeup, hårpleje, parfume og beauty tools fra kendte og spændende mærker."
        path="/brands"
      />
      <div className="border-b border-border bg-section">
        <div className="container-z py-8">
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link to={localizedPath("/")} className="hover:text-foreground">
              {t.common.home}
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground">Brands</span>
          </nav>
          <h1 className="text-2xl font-bold sm:text-3xl">Brands</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Kendte beauty-brands og spændende hverdagsfavoritter — vælg et mærke for at se sortimentet.
          </p>
        </div>
      </div>
      <div className="container-z py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-14 skeleton" />
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {sorted.map((b) => (
              <li key={b.id}>
                <Link
                  to={localizedPath(`/brand/${b.slug}`)}
                  className="flex h-full items-center justify-between border border-border px-4 py-3 text-sm font-semibold transition-colors duration-150 hover:border-foreground"
                >
                  <span>{b.name}</span>
                  {typeof b.count === "number" && (
                    <span className="text-xs font-normal text-muted-foreground">{b.count}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
