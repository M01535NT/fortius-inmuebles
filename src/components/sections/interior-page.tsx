import Link from "next/link";

import { BlurFade } from "@/components/magicui/blur-fade";
import { Container } from "@/components/layout/container";

type InteriorPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
};

/*
  Shared hero for interior routes. Same design system as the home
  (display type, tokens, hairline lists), calmer vibe: no photo, the
  typography carries the page.
*/
export function InteriorPage({ title, description, bullets, primary = { href: "/#evaluar", label: "Evaluar mi propiedad" }, secondary = { href: "/#metodo", label: "Conocer el método" } }: InteriorPageProps) {
  return (
    <section className="interior-page bg-background pt-28 md:pt-32">
      <Container className="grid gap-12 pb-16 md:gap-14 md:pb-24 lg:grid-cols-12">
        <BlurFade inView={false} className="lg:col-span-7">
          <h1 className="display-title max-w-[14ch] text-5xl text-foreground md:text-6xl lg:text-[4.35rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={primary.href}
              className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
            >
              {primary.label}
            </Link>
            <Link
              href={secondary.href}
              className="inline-flex h-12 items-center rounded-md border border-border px-6 text-base font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
            >
              {secondary.label}
            </Link>
          </div>
        </BlurFade>

        <BlurFade delay={0.1} className="self-end lg:col-span-4 lg:col-start-9">
          <p className="display-soft text-xl text-foreground">Criterios de trabajo</p>
          <ul className="mt-5 space-y-2.5">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-base text-foreground/85">
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
