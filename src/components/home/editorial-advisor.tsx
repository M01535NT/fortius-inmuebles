import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SITE_TERMS } from "@/data/site-terms";

export function EditorialAdvisor() {
  return <section id="asesor" className="editorial-advisor editorial-container" aria-labelledby="advisor-title">
    <figure data-editorial-reveal>
      <Image src="/images/team/advisor-example.png" alt="Retrato ilustrativo de ejemplo; no representa a Moisés Núñez Tonalá" width={800} height={1000} sizes="(max-width: 767px) 80vw, 320px" />
      <figcaption>Retrato ilustrativo provisional</figcaption>
    </figure>
    <div data-editorial-reveal>
      <h2 id="advisor-title" className="editorial-section-title">Hablemos de<br />lo que necesitas.</h2>
      <p className="editorial-advisor-name">{SITE_TERMS.responsible}</p>
      <p className="editorial-advisor-role">Asesor inmobiliario · Fortius</p>
      <p className="editorial-advisor-copy">Soy tu contacto para revisar lo que buscas o la propiedad que quieres vender. Coordinamos las visitas y revisamos las propuestas contigo; tú decides qué condiciones aceptar.</p>
      <Link href="/contacto" className="editorial-text-link">Hablar con Moisés <ArrowUpRight size={18} aria-hidden="true" /></Link>
    </div>
  </section>;
}
