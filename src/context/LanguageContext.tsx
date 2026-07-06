import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  DEFAULT_LANGUAGE,
  dictionaries,
  isLanguage,
  SUPPORTED_LANGUAGES,
  type Dictionary,
  type LanguageCode,
} from "@/i18n";

interface LanguageContextValue {
  lang: LanguageCode;
  t: Dictionary;
  languages: LanguageCode[];
  localizedPath: (path: string) => string;
  switchLangPath: (target: LanguageCode) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const location = useLocation();

  const lang: LanguageCode = isLanguage(params.lang) ? params.lang : DEFAULT_LANGUAGE;

  const value = useMemo<LanguageContextValue>(() => {
    const localizedPath = (path: string) => {
      const clean = path.startsWith("/") ? path : `/${path}`;
      return `/${lang}${clean === "/" ? "" : clean}`;
    };

    const switchLangPath = (target: LanguageCode) => {
      const segments = location.pathname.split("/").filter(Boolean);
      if (isLanguage(segments[0])) {
        segments[0] = target;
      } else {
        segments.unshift(target);
      }
      return `/${segments.join("/")}${location.search}`;
    };

    return {
      lang,
      t: dictionaries[lang],
      languages: SUPPORTED_LANGUAGES,
      localizedPath,
      switchLangPath,
    };
  }, [lang, location.pathname, location.search]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useTranslatedPath() {
  const { localizedPath } = useLanguage();
  return localizedPath;
}
