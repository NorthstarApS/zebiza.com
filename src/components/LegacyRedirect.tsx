import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { rewriteInternalHref } from "@/lib/urls";
import { DEFAULT_LANGUAGE, isLanguage } from "@/i18n";

/**
 * Catch legacy Woo paths (/product/..., /product-category/...) and send users
 * to the canonical SPA URL in one hop.
 */
export default function LegacyRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const lang = isLanguage(params.lang) ? params.lang : DEFAULT_LANGUAGE;

  const target =
    rewriteInternalHref(`${location.pathname}${location.search}`, lang) ??
    rewriteInternalHref(location.pathname, lang) ??
    `/${DEFAULT_LANGUAGE}`;

  useEffect(() => {
    navigate(target, { replace: true });
  }, [target, navigate]);

  return (
    <Helmet>
      <meta httpEquiv="refresh" content={`0;url=${target}`} />
      <link rel="canonical" href={`https://zebiza.com${target}`} />
      <meta name="robots" content="noindex,follow" />
    </Helmet>
  );
}
