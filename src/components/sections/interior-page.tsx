import Link from "next/link";

import { BlurFade } from "@/components/magicui/blur-fade";
import { Container } from "@/components/layout/container";

type InteriorPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
};

/*
  Shared hero for interior routes. Same design system as the home
  (display type, tokens, hairline lists), calmer vibe: no photo, the
  typography carries the page.
*/
export function InteriorPage({ title, description, bullets }: InteriorPageProps) {
  return (
    <section className="bg-background pt-28 md:pt-32">
      <Container className="grid gap-14 pb-20 md:pb-28 lg:grid-cols-12">
        <BlurFade inView={false} className="lg:col-span-7">
          <h1 className="display-title max-w-[14ch] text-5xl text-foreground md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-[52ch] text-[15.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/#evaluar"
              className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
            >
              Evaluar mi propiedad
            </Link>
            <Link
              href="/#metodo"
              className="inline-flex h-12 items-center rounded-md border border-border px-6 text-[15px] font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
            >
              Conocer el método
            </Link>
          </div>
        </BlurFade>

        <BlurFade delay={0.1} className="self-end lg:col-span-4 lg:col-start-9">
          <p className="display-soft text-[19px] text-foreground">Criterios de trabajo</p>
          <ul className="mt-5 space-y-2.5">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-[14.5px] text-foreground/85">
                <span aria-hidden="true" className="mt-[9px] h-px w-4 shrink-0 bg-primary" />
                {bullet}
              </li>
            ))}
          </ul>
        </BlurFade>
      </Container>
    </section>
  );
}
