import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useSearch } from "@/hooks/useSearch";
import { formatPrice } from "@/lib/format";

/**
 * Lightweight autocomplete for header search — shows top beauty matches after 2+ chars.
 */
export default function SearchSuggest({
  query,
  onPick,
}: {
  query: string;
  onPick: () => void;
}) {
  const { lang, localizedPath } = useLanguage();
  const q = query.trim();
  const enabled = q.length >= 2;
  const { data, isLoading } = useSearch(enabled ? q : "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(enabled);
  }, [enabled, q]);

  if (!open || !enabled) return null;

  const items = (data ?? []).slice(0, 6);

  return (
    <div
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto border border-border bg-background shadow-sm"
      role="listbox"
    >
      {isLoading && (
        <p className="px-3 py-2 text-xs text-muted-foreground">Søger…</p>
      )}
      {!isLoading && items.length === 0 && (
        <p className="px-3 py-2 text-xs text-muted-foreground">Ingen matches</p>
      )}
      {items.map((p) => (
        <Link
          key={p.id}
          to={localizedPath(`/produkt/${p.slug}`)}
          role="option"
          onClick={onPick}
          className="flex items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-0 hover:bg-section"
        >
          {p.images[0]?.src ? (
            <img
              src={p.images[0].src}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 object-cover"
            />
          ) : (
            <span className="h-10 w-10 bg-section" />
          )}
          <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
          <span className="shrink-0 text-xs font-semibold">
            {formatPrice(Number(p.price), lang)}
          </span>
        </Link>
      ))}
    </div>
  );
}
