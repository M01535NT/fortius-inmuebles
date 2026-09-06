import { BlurFade } from "@/components/magicui/blur-fade";
import { Container } from "@/components/layout/container";
import { ContactForm } from "@/components/sections/contact-form";

export function DiagnosticCTA({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  return (
    <section id="diagnostico" className="scroll-mt-20 bg-secondary/60 py-20 md:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <BlurFade className="lg:col-span-5">
            <Heading className="display-title text-4xl text-foreground sm:text-5xl">
              Empieza con
              <br />
              una evaluación.
            </Heading>
            <p className="mt-6 max-w-[46ch] text-[15.5px] leading-relaxed text-muted-foreground">
              Cuéntanos qué quieres resolver. La primera conversación aclara
              precio, tiempos, condición del inmueble y el siguiente paso.
            </p>
          </BlurFade>

          <BlurFade delay={0.1} className="lg:col-span-6 lg:col-start-7">
            <ContactForm />
          </BlurFade>
        </div>
      </Container>
    </section>
  );
}
