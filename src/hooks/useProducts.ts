import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { getProducts } from "@/services/woocommerce";
import type { ProductQuery } from "@/types/woocommerce";

export function useProducts(query: ProductQuery = {}) {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ["products", lang, query],
    queryFn: () => getProducts(query, lang),
    staleTime: 1000 * 60 * 5,
  });
}
