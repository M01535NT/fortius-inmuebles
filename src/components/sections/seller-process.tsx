import Link from "next/link";

import { Container } from "@/components/layout/container";
import { BlurFade } from "@/components/magicui/blur-fade";

const reviews = [
  {
    title: "Quién puede vender",
    text: "Confirmamos quién es el propietario o representante y qué documentos respaldan el encargo. Si falta algo, lo señalamos antes de anunciar.",
  },
  {
    title: "Qué se está ofreciendo",
    text: "Contrastamos superficies, estado observable y características con la fuente disponible. La ficha distingue los datos confirmados de los pendientes.",
  },
  {
    title: "Precio y condiciones",
    text: "Preparamos una opinión de precio con la evidencia que exista y acordamos publicación, visitas y condiciones de entrega contigo.",
  },
];

export function SellerProcess() {
  return (
    <section className="border-t border-border bg-secondary/40 py-20 md:py-28">
      <Container>
        <BlurFade>
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <div>
              <h2 className="display-title max-w-[15ch] text-4xl text-foreground md:text-5xl">Antes de publicar.</h2>
              <p className="mt-5 max-w-[45ch] text-base leading-relaxed text-muted-foreground">
                La primera conversación sirve para ubicar los pendientes. La publicación se prepara cuando el inmueble, el encargo y la información que podemos mostrar están claros.
              </p>
            </div>
            <ol className="border-t border-border">
              {reviews.map((item, index) => (
                <li key={item.title} className="grid gap-3 border-b border-border py-6 sm:grid-cols-[3rem_1fr]">
                  <span className="font-mono text-sm text-primary">0{index + 1}</span>
                  <div>
                    <h3 className="display-soft text-xl text-foreground">{item.title}</h3>
                    <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </BlurFade>
        <BlurFade className="mt-14 grid gap-8 border-t border-border pt-10 md:grid-cols-2">
          <div>
            <h3 className="display-soft text-2xl text-foreground">Lo que recibes</h3>
            <p className="mt-3 max-w-[55ch] text-base leading-relaxed text-muted-foreground">
              Una respuesta sobre lo que ya puede avanzar, los pendientes que requieren atención y una propuesta de siguientes pasos. Durante la venta, acordamos cómo darte seguimiento a visitas y ofertas.
            </p>
            <Link href="/#entregables" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4">Ver entregables del método</Link>
          </div>
          <div>
            <h3 className="display-soft text-2xl text-foreground">Si hay pendientes</h3>
            <p className="mt-3 max-w-[55ch] text-base leading-relaxed text-muted-foreground">
              Te decimos cuáles afectan el precio, la promoción o el cierre y qué información se necesita para resolverlos. No tienes que adivinar si conviene anunciar de inmediato.
            </p>
            <Link href="/herramientas/gastos-de-cierre" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4">Estimar gastos y neto de venta</Link>
          </div>
        </BlurFade>
      </Container>
    </section>
  );
}
