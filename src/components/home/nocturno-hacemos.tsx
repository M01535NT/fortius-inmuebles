import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* Inicio · «Qué hacemos»: tres caminos con foto, una frase cada uno; sin numeración, no son una secuencia (12/11/2026). */
const CAMINOS = [
  { n: "01", title: "Vender tu propiedad", text: "Revisamos papeles y precio antes de anunciar.", href: "/vender-propiedad", label: "Cómo vendemos", src: "/hero/que-hacemos-vender.webp", alt: "Casa de dos niveles con jardín al atardecer" },
  { n: "02", title: "Comprar una propiedad", text: "Buscamos dentro de tu presupuesto y revisamos papeles antes de ofertar.", href: "/comprar-propiedad", label: "Cómo te ayudamos a comprar", src: "/hero/que-hacemos-comprar.webp", alt: "Sala luminosa de un departamento con vista a la ciudad" },
  { n: "03", title: "Rentar", text: "Publicamos tu inmueble o te buscamos uno, con contrato revisado.", href: "/inventario?op=renta", label: "Ver rentas", src: "/hero/que-hacemos-rentar.webp", alt: "Planta baja de un edificio de oficinas con fachada de vidrio" },
];

export function NocturnoHacemos() {
  return <section id="que-hacemos" aria-labelledby="hacemos-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <h2 id="hacemos-title" className="nx-title">Vende, compra o renta con nosotros.</h2>
      </div>
      <p className="nx-lead nx-head-lead">Casas, departamentos, locales, oficinas, naves y terrenos en Baja California.</p>
    </div>
    <ul className="nx-caminos">
      {CAMINOS.map((camino) => <li key={camino.n}>
        <Link href={camino.href} className="nx-camino">
          <span className="nx-camino-photo"><Image src={camino.src} alt={camino.alt} fill sizes="(max-width: 1023px) 100vw, 400px" /></span>
          <span className="nx-camino-body">
            <span className="nx-camino-title">{camino.title}</span>
            <span className="nx-camino-text">{camino.text}</span>
            <span className="nx-camino-link">{camino.label} <ArrowRight size={18} aria-hidden="true" /></span>
          </span>
        </Link>
      </li>)}
    </ul>
  </section>;
}
