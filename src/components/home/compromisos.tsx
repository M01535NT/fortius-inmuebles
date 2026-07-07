import { BlurFade } from "@/components/magicui/blur-fade";

/*
  Compromisos: prueba social honesta mientras no existan testimonios
  reales (guardrail: nada inventado). Del copy doc, sección 9.
*/
const COMPROMISOS = [
  "Información clara antes de cada decisión, no después.",
  "Seguimiento por escrito de tu propiedad o tu búsqueda.",
  "Comunicación directa durante todo el proceso.",
  "Cuidado con tus datos y tus documentos.",
];

export function Compromisos() {
  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-5 py-16 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-12">
          <BlurFade className="lg:col-span-4">
            <h2 className="display-soft text-2xl text-foreground">
              Lo que puedes esperar en cada operación
            </h2>
          </BlurFade>
          <div className="lg:col-span-7 lg:col-start-6">
            <ul className="divide-y divide-border border-y border-border">
              {COMPROMISOS.map((c, i) => (
                <BlurFade key={c} delay={0.05 * i}>
                  <li className="flex items-baseline gap-4 py-4">
                    <span className="font-mono text-[12px] text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] text-foreground/85">{c}</span>
                  </li>
                </BlurFade>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
