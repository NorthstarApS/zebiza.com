import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getPageBySlug } from "@/services/contentApi";
import Seo from "@/components/layout/Seo";
import TrustBar from "@/components/layout/TrustBar";

type PageKey = "about" | "delivery" | "terms" | "privacy" | "cookies" | "contact";

const slugMap: Record<PageKey, string> = {
  about: "om-zebiza",
  delivery: "levering-og-returnering",
  terms: "handelsbetingelser",
  privacy: "privatlivspolitik",
  cookies: "cookiepolitik",
  contact: "kontakt",
};

export default function StaticPage({ page }: { page: PageKey }) {
  const { t, lang } = useLanguage();
  const [remoteHtml, setRemoteHtml] = useState<string | null>(null);

  const title = t.pages[`${page}Title` as const];
  const body = t.pages[`${page}Body` as const];

  // Prefer WordPress-managed content when available; fall back to local copy.
  useEffect(() => {
    let active = true;
    getPageBySlug(slugMap[page], lang).then((res) => {
      if (active && res?.content?.rendered) setRemoteHtml(res.content.rendered);
    });
    return () => {
      active = false;
    };
  }, [page, lang]);

  return (
    <>
      <Seo title={`${title} · Zebiza.com`} description={body.slice(0, 155)} path={`/${slugMap[page]}`} />
      <div className="border-b border-border bg-section">
        <div className="container-z py-10">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        </div>
      </div>
      <article className="container-z max-w-3xl py-10">
        {remoteHtml ? (
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: remoteHtml }} />
        ) : (
          <p className="text-base leading-relaxed text-muted-foreground">{body}</p>
        )}
        {page === "contact" && (
          <p className="mt-6 font-medium">kundeservice@zebiza.com</p>
        )}
      </article>
      <TrustBar variant="row" />
    </>
  );
}
