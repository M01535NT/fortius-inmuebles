import Link from "next/link";

import { Container } from "@/components/layout/container";
import { BlurFade } from "@/components/magicui/blur-fade";

type Segment = "residencial" | "comercial" | "industrial";

const details: Record<Segment, { intro: string; checks: { title: string; body: string }[]; decision: string }> = {
  residencial: {
    intro: "Una vivienda debe funcionar para la vida diaria y para el presupuesto completo de quien la compra o renta.",
    checks: [
      { title: "Habitarla", body: "Distribución, luz, conservación observable, servicios y entorno inmediato. Lo que importa cambia según quién vivirá ahí." },
      { title: "Entender el inmueble", body: "Superficies según su fuente, situación documental disponible y condiciones de ocupación o entrega." },
      { title: "Poder pagarla", body: "Precio, gastos de cierre y, si hay crédito, mensualidad estimada y condiciones de financiamiento por confirmar con la institución." },
    ],
    decision: "Antes de una oferta, compara el costo total y pide claridad sobre los datos que sigan pendientes.",
  },
  comercial: {
    intro: "En un local u oficina, la ubicación solo sirve si el espacio permite la actividad y los números de ocupación tienen sentido.",
    checks: [
      { title: "Actividad prevista", body: "Uso permitido por verificar, visibilidad, acceso de clientes y posibilidades de adaptación del espacio." },
      { title: "Costo de ocupar", body: "Precio o renta, mantenimiento, adecuaciones, depósitos y otros conceptos que se conozcan antes de comprometerse." },
      { title: "Contrato y entrega", body: "Plazo, condiciones de uso, estado de entrega y responsabilidades por adecuaciones o servicios." },
    ],
    decision: "Si falta confirmar un permiso o condición de uso, la decisión debe esperar esa verificación con la autoridad o especialista competente.",
  },
  industrial: {
    intro: "Una nave o terreno industrial se evalúa desde la operación concreta que deberá recibir, no solo por metros cuadrados.",
    checks: [
      { title: "Acceso y logística", body: "Entradas, maniobras, carga y conexiones relevantes para el proceso previsto." },
      { title: "Capacidad técnica", body: "Instalaciones, energía y servicios según datos disponibles. Las capacidades críticas requieren soporte técnico y confirmación externa." },
      { title: "Uso y puesta en marcha", body: "Compatibilidad del uso previsto, adecuaciones necesarias, calendario y condiciones contractuales de entrega." },
    ],
    decision: "Una visita permite detectar preguntas; la factibilidad técnica y normativa se confirma con documentos y especialistas antes de contratar.",
  },
};

export function SegmentDetail({ segment }: { segment: Segment }) {
  const detail = details[segment];
  return (
    <section className="border-t border-border bg-secondary/40 py-20 md:py-28">
      <Container>
        <BlurFade className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <h2 className="display-title max-w-[15ch] text-4xl text-foreground md:text-5xl">Lo que conviene mirar.</h2>
          <p className="max-w-[56ch] self-end text-lg leading-relaxed text-foreground/85">{detail.intro}</p>
        </BlurFade>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {detail.checks.map((check, index) => (
            <BlurFade key={check.title} delay={index * 0.08} className="border-t border-border pt-5">
              <span className="font-mono text-xs text-primary">0{index + 1}</span>
              <h3 className="display-soft mt-4 text-2xl text-foreground">{check.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{check.body}</p>
            </BlurFade>
          ))}
        </div>
        <BlurFade className="mt-14 grid gap-4 border-t border-border pt-8 md:grid-cols-[0.8fr_1.2fr]">
          <h3 className="display-soft text-xl text-foreground">Antes de decidir</h3>
          <div>
            <p className="max-w-[65ch] text-base leading-relaxed text-muted-foreground">{detail.decision}</p>
            <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
              <Link href="/inventario" className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4">Ver propiedades</Link>
              <Link href="/contacto" className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4">Consultar un caso</Link>
            </div>
          </div>
        </BlurFade>
      </Container>
    </section>
  );
}
