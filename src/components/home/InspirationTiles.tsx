import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const tiles = [
  {
    title: "Hudpleje",
    path: "/kategori/hudpleje-ansigt",
    image: "https://zebiza.com/wp-content/uploads/2026/07/ansigtsrens.png",
  },
  {
    title: "Makeup",
    path: "/kategori/kosmetik-ansigt",
    image: "https://zebiza.com/wp-content/uploads/2026/05/7612017059433_S05127130_P00.jpg",
  },
  {
    title: "Hår",
    path: "/kategori/harpleje",
    image: "https://zebiza.com/wp-content/uploads/2026/05/5711914195144_S05127829_P00.jpg",
  },
  {
    title: "Parfume",
    path: "/kategori/parfume-dufte",
    image: "https://zebiza.com/wp-content/uploads/2026/05/8720181336614_S05128791_P00.jpg",
  },
];

export default function InspirationTiles() {
  const { t, localizedPath } = useLanguage();
  return (
    <section className="container-z py-10 sm:py-14">
      <div className="mb-6">
        <h2 className="text-xl font-bold sm:text-2xl">{t.sections.inspiration}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Gå direkte til Zebizas stærkeste beauty-universer.</p>
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
              alt={tile.title}
              loading="lazy"
              width={600}
              height={750}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-4 pt-16">
              <span className="text-lg font-bold text-primary-foreground">{tile.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
