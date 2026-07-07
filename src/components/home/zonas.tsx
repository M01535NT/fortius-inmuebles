import { Marquee } from "@/components/magicui/marquee";

const ZONAS_A = [
  "Zona Río",
  "Otay",
  "Playas de Tijuana",
  "La Mesa",
  "Santa Fe",
  "El Florido",
];

const ZONAS_B = ["Chapultepec", "Cacho", "Rosarito", "Tecate", "Ensenada", "Colinas"];

/*
  Banda de zonas: doble fila contra-rotante en tipografía display outline
  que se rellena de verde al hover. Una sola unidad marquee en la página.
*/
export function Zonas() {
  return (
    <section aria-label="Zonas de operación" className="overflow-hidden border-y border-border py-8">
      <Marquee pauseOnHover duration="52s" className="marquee-pause marquee-mask">
        {ZONAS_A.map((zona) => (
          <span
            key={zona}
            className="display-title text-outline mx-7 whitespace-nowrap text-[44px] md:text-[56px]"
          >
            {zona}
          </span>
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover duration="60s" className="marquee-pause marquee-mask mt-2">
        {ZONAS_B.map((zona) => (
          <span
            key={zona}
            className="display-title text-outline mx-7 whitespace-nowrap text-[44px] md:text-[56px]"
          >
            {zona}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
