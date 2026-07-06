import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { getProductBySlug } from "@/services/woocommerce";

export function useProduct(slug: string | undefined) {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ["product", lang, slug],
    queryFn: () => (slug ? getProductBySlug(slug, lang) : null),
    enabled: !!slug,
  });
}
