import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const tiles = [
  {
    title: "Hudpleje",
    path: "/kategori/hudpleje-ansigt",
    image: "/brand/hero-hudpleje.webp",
    blurb: "Serum, creme og ansigtsrens",
  },
  {
    title: "Makeup",
    path: "/kategori/kosmetik-ansigt",
    image: "/brand/hero-makeup.webp",
    blurb: "Foundation, mascara og mere",
  },
  {
    title: "Hårpleje",
    path: "/kategori/harpleje",
    image: "/brand/hero-har.webp",
    blurb: "Shampoo, styling og tools",
  },
  {
    title: "Parfume",
    path: "/kategori/parfume-dufte",
    image: "/brand/hero-parfume.webp",
    blurb: "Dame- og herreparfume",
  },
];

export default function InspirationTiles() {
  const { t, localizedPath } = useLanguage();
  return (
    <section className="container-z py-10 sm:py-14">
      <div className="mb-6">
        <h2 className="text-xl font-bold sm:text-2xl">{t.sections.inspiration}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shop Zebizas stærkeste kategorier — hudpleje, makeup, hårpleje og parfume.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.path}
            to={localizedPath(tile.path)}
            className="group relative aspect-[4/5] overflow-hidden bg-section"
          >
            <img
              src={tile.image}
              alt={`${tile.title} hos Zebiza — ${tile.blurb}`}
              loading="lazy"
              width={600}
              height={750}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-4 pt-16">
              <span className="text-lg font-bold text-primary-foreground">{tile.title}</span>
              <p className="mt-0.5 text-xs text-primary-foreground/85">{tile.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
