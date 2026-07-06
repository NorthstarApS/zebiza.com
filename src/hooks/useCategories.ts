import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { getCategories, getCategoryBySlug } from "@/services/woocommerce";

export function useCategories() {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ["categories", lang],
    queryFn: () => getCategories(lang),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCategory(slug: string | undefined) {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ["category", lang, slug],
    queryFn: () => (slug ? getCategoryBySlug(slug, lang) : null),
    enabled: !!slug,
  });
}
