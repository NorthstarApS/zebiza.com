import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { dictionaries } from "@/i18n";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, languages, switchLangPath } = useLanguage();
  return (
    <div className={cn("flex items-center gap-1 text-xs font-medium", className)}>
      {languages.map((code, i) => (
        <span key={code} className="flex items-center gap-1">
          {i > 0 && <span className="text-border">/</span>}
          <Link
            to={switchLangPath(code)}
            aria-current={code === lang ? "true" : undefined}
            className={cn(
              "uppercase transition-colors hover:text-foreground",
              code === lang ? "text-foreground font-bold" : "text-muted-foreground",
            )}
            title={dictionaries[code].meta.langName}
          >
            {code}
          </Link>
        </span>
      ))}
    </div>
  );
}
