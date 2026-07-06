import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

interface Tile {
  titleKey: keyof ReturnType<typeof labels>;
  path: string;
  seed: string;
  overlay: string;
}

function labels(t: ReturnType<typeof useLanguage>["t"]) {
  return {
    beauty: t.nav.beauty,
    gaver: t.nav.gaver,
    livsstil: t.nav.livsstil,
    saeson: t.nav.saeson,
  };
}

const tiles: Tile[] = [
  { titleKey: "beauty", path: "/beauty", seed: "beautytile", overlay: "bg-beauty/80" },
  { titleKey: "gaver", path: "/gaver", seed: "gifttile", overlay: "bg-purple/80" },
  { titleKey: "livsstil", path: "/livsstil", seed: "lifetile", overlay: "bg-trend/80" },
  { titleKey: "saeson", path: "/saeson", seed: "seasontile", overlay: "bg-foreground/70" },
];

export default function InspirationTiles() {
  const { t, localizedPath } = useLanguage();
  const l = labels(t);
  return (
    <section className="container-z py-10 sm:py-14">
      <div className="mb-6">
        <h2 className="text-xl font-bold sm:text-2xl">{t.sections.inspiration}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.path}
            to={localizedPath(tile.path)}
            className="group relative aspect-[4/5] overflow-hidden"
          >
            <img
              src={`https://picsum.photos/seed/${tile.seed}/600/750`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className={`absolute inset-x-0 bottom-0 ${tile.overlay} p-4`}>
              <span className="text-lg font-bold text-primary-foreground">{l[tile.titleKey]}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
