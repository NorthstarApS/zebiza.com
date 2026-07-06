import { useMemo, useState } from "react";
import type { ProductQuery } from "@/types/woocommerce";

export type SortKey = ProductQuery["orderby"];

export interface FilterState {
  onSale: boolean;
  inStock: boolean;
  minPrice?: number;
  maxPrice?: number;
  orderby: SortKey;
}

const initial: FilterState = {
  onSale: false,
  inStock: false,
  minPrice: undefined,
  maxPrice: undefined,
  orderby: "popularity",
};

/** Manages category/collection filter + sort state and derives a ProductQuery. */
export function useFilters(base: Partial<ProductQuery> = {}) {
  const [filters, setFilters] = useState<FilterState>(initial);

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const reset = () => setFilters(initial);

  const query = useMemo<ProductQuery>(
    () => ({
      ...base,
      onSale: filters.onSale || base.onSale,
      inStock: filters.inStock,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      orderby: filters.orderby,
      perPage: 48,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, JSON.stringify(base)],
  );

  const activeCount =
    (filters.onSale ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0);

  return { filters, setFilter, reset, query, activeCount };
}
