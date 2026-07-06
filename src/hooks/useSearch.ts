import { useEffect, useMemo, useState } from "react";
import { useProducts } from "./useProducts";

/** Debounced product search hook. */
export function useSearch(term: string) {
  const [debounced, setDebounced] = useState(term);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(id);
  }, [term]);

  const query = useMemo(
    () => ({ search: debounced.trim(), orderby: "relevance" as const, perPage: 24 }),
    [debounced],
  );

  const result = useProducts(query);
  return { ...result, term: debounced, enabled: debounced.trim().length > 0 };
}
