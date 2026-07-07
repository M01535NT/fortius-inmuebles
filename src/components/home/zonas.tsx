import { Marquee } from "@/components/magicui/marquee";

const ZONAS = [
  "Zona Río",
  "Otay",
  "Playas de Tijuana",
  "La Mesa",
  "Santa Fe",
  "El Florido",
  "Chapultepec",
  "Cacho",
  "Rosarito",
  "Tecate",
  "Ensenada",
];

/* Single marquee on the page: where the firm operates. */
export function Zonas() {
  return (
    <section aria-label="Zonas de operación" className="border-y border-border py-7">
      <Marquee pauseOnHover duration="44s" className="marquee-pause">
        {ZONAS.map((zona) => (
          <span
            key={zona}
            className="display-title mx-6 whitespace-nowrap text-[22px] text-foreground/25 transition-colors hover:text-foreground/70"
          >
            {zona}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
