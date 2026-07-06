import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

export default function Newsletter() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success(t.newsletter.title);
      setEmail("");
    }
  };

  return (
    <section className="bg-foreground text-primary-foreground">
      <div className="container-z flex flex-col items-center gap-6 py-14 text-center">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t.newsletter.title}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-primary-foreground/80">
            {t.newsletter.sub}
          </p>
        </div>
        <form onSubmit={submit} className="flex w-full max-w-md">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.newsletter.placeholder}
            className="w-full bg-background px-4 py-3 text-sm text-foreground outline-none"
            aria-label={t.newsletter.placeholder}
          />
          <button
            type="submit"
            className="bg-trend px-6 py-3 text-sm font-bold text-trend-foreground hover:opacity-90"
          >
            {t.newsletter.cta}
          </button>
        </form>
        <p className="max-w-md text-xs text-primary-foreground/60">{t.newsletter.consent}</p>
      </div>
    </section>
  );
}
