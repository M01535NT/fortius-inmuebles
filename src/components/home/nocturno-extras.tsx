import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calculator, Landmark, Scale, Search } from "lucide-react";

import { TIPO_LABELS, type Property } from "@/data/propiedades";
import type { Testimonio } from "@/lib/domain/records";

type Perfil = { id: string; nombre: string; cargo: string; iniciales: string; foto?: string; descripcion?: string };

const PASOS_COMPRA = [
  "Nos dices qué buscas y con qué presupuesto.",
  "Revisamos documentos y gastos antes de ofertar.",
  "Te acompañamos hasta la firma.",
];

const PRESUPUESTOS = [
  { value: "", label: "Cualquiera" },
  { value: "3000000", label: "Hasta $3,000,000 MXN" },
  { value: "8000000", label: "Hasta $8,000,000 MXN" },
  { value: "15000000", label: "Hasta $15,000,000 MXN" },
];

/* Buscador sin script: manda al inventario con los filtros en la URL. También lo usa la guía para comprar. */
export function BuscadorPropiedades({ properties, className = "nx-search" }: { properties: Property[]; className?: string }) {
  const zonas = Array.from(new Set(properties.map((property) => property.zona))).sort();
  const tipos = Array.from(new Set(properties.map((property) => property.tipo)));
  return (
    <form action="/inventario" method="get" role="search" aria-label="Buscar propiedad" className={className}>
      <h3>Buscar propiedad</h3>
      <div className="nx-search-fields">
        <label><span>Operación</span><select name="op" defaultValue=""><option value="">Comprar o rentar</option><option value="venta">Comprar</option><option value="renta">Rentar</option></select></label>
        <label><span>Tipo</span><select name="tipo" defaultValue=""><option value="">Todos los tipos</option>{tipos.map((tipo) => <option key={tipo} value={tipo}>{TIPO_LABELS[tipo]}</option>)}</select></label>
        <label><span>Zona</span><select name="zona" defaultValue=""><option value="">Todas las zonas</option>{zonas.map((zona) => <option key={zona} value={zona}>{zona}</option>)}</select></label>
        <label><span>Presupuesto</span><select name="max" defaultValue="">{PRESUPUESTOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>
      <button type="submit" className="nx-btn nx-btn-primary"><Search size={18} aria-hidden="true" />Buscar</button>
    </form>
  );
}

/*
  Inicio · «Cómo te ayudamos a comprar»: banda azul con tres pasos y el buscador.
  El formulario manda al inventario con los filtros en la URL; no necesita script.
*/
export function NocturnoComprar({ properties }: { properties: Property[] }) {
  return <section id="comprar" aria-labelledby="comprar-title" className="nx-band-navy">
    <div className="nx-container nx-comprar">
      <div>
        <p className="nx-eyebrow">Cómo te ayudamos a comprar</p>
        <h2 id="comprar-title" className="nx-title">Comprar también empieza por revisar.</h2>
        <ol className="nx-pasos">
          {PASOS_COMPRA.map((paso, index) => <li key={paso}><span aria-hidden="true">0{index + 1}</span>{paso}</li>)}
        </ol>
        <div className="nx-actions">
          <Link href="/inventario" className="nx-btn nx-btn-light">Ver propiedades</Link>
          <Link href="/comprar-propiedad" className="nx-link">Leer la guía para comprar <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </div>
      <BuscadorPropiedades properties={properties} />
    </div>
  </section>;
}

/* Solo se muestran testimonios con autorización escrita; sin ninguno, la sección no existe. */
export function NocturnoTestimonios({ items }: { items: Testimonio[] }) {
  if (!items.length) return null;
  return <section id="testimonios" aria-labelledby="testimonios-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <h2 id="testimonios-title" className="nx-title">Lo que dicen nuestros clientes.</h2>
      </div>
    </div>
    <ul className="nx-quotes">
      {items.slice(0, 6).map((item) => <li key={item.id}>
        <figure className="nx-quote">
          <blockquote><p>{item.texto}</p></blockquote>
          <figcaption><strong>{item.nombre}</strong>{item.detalle && <span>{item.detalle}</span>}</figcaption>
        </figure>
      </li>)}
    </ul>
  </section>;
}

/* Herramientas sin registro: tres tarjetas y el enlace al blog. */
export function NocturnoRecursos() {
  return <section id="recursos" aria-labelledby="recursos-title" className="nx-band-cream">
    <div className="nx-container">
      <div className="nx-head">
        <div>
          <p className="nx-eyebrow">Herramientas sin registro</p>
          <h2 id="recursos-title" className="nx-title">Haz números antes de decidir.</h2>
        </div>
        <Link href="/blog" className="nx-link">Ir al blog <ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
      <ul className="nx-tools">
        {[
          { href: "/herramientas/hipoteca", Icon: Landmark, title: "Calculadora de hipoteca", detail: "Tu pago mensual estimado." },
          { href: "/herramientas/gastos-de-cierre", Icon: Calculator, title: "Gastos de cierre", detail: "Cuánto pagas o cuánto recibes." },
          { href: "/opinion-de-valor", Icon: Scale, title: "Opinión de valor", detail: "Cómo fijamos el precio." },
        ].map(({ href, Icon, title, detail }) => <li key={href}><Link href={href} className="nx-tool">
          <span className="nx-tool-icon"><Icon size={20} strokeWidth={1.6} aria-hidden="true" /></span>
          <span><strong>{title}</strong><span>{detail}</span></span>
          <ArrowUpRight size={20} strokeWidth={1.6} aria-hidden="true" className="nx-tool-go" />
        </Link></li>)}
      </ul>
    </div>
  </section>;
}

const CIUDADES = [
  { name: "Tijuana", detail: "Playas, Zona Río, Otay y Chapultepec", src: "/hero/ciudad-tijuana.webp", alt: "Zona Río de Tijuana con el Centro Cultural y los cerros al fondo" },
  { name: "Rosarito", detail: "Costa y zona residencial", src: "/hero/ciudad-rosarito.webp", alt: "Muelle de madera sobre la playa de Rosarito al atardecer" },
  { name: "Tecate", detail: "Residencial e industrial", src: "/hero/ciudad-tecate.webp", alt: "Kiosco del parque de Tecate con las montañas al fondo" },
  { name: "Ensenada", detail: "Residencial", src: "/hero/ciudad-ensenada.webp", alt: "Costa rocosa de Ensenada con el oleaje" },
];

/* Quién te atiende: perfiles publicados desde el panel (sin ninguno, el perfil ilustrativo) y las cuatro ciudades. */
export function NocturnoEquipo({ team, ilustrativo = false }: { team: Perfil[]; ilustrativo?: boolean }) {
  return <section id="equipo" aria-labelledby="equipo-title" className="nx-section nx-container">
    <div className="nx-equipo">
    <div>
    <div className="nx-head">
      <div>
        <p className="nx-eyebrow">Quién te atiende</p>
        <h2 id="equipo-title" className="nx-title">Una persona lleva tu caso.</h2>
        <p className="nx-lead">De la revisión a la firma.</p>
      </div>
      <Link href="/nosotros#agentes" className="nx-link">Conocer al equipo <ArrowRight size={18} aria-hidden="true" /></Link>
    </div>
    <ul className="nx-team">
      {team.slice(0, 6).map((person) => <li key={person.id}>
        <Link href="/nosotros#agentes" className="nx-person">
          <span className={"nx-person-photo" + (ilustrativo ? " is-mark" : "")}>{ilustrativo
            ? <Image src="/brand/fortius-symbol-inverse.svg" alt="" width={74} height={94} />
            : person.foto
              ? <Image unoptimized src={person.foto} alt={`Foto de ${person.nombre}`} fill sizes="(max-width: 767px) 50vw, 300px" />
              : <span aria-hidden="true">{person.iniciales}</span>}</span>
          <strong>{person.nombre}</strong>
          <span className="nx-person-role">{person.cargo}</span>
          {person.descripcion && <span className="nx-person-bio">{person.descripcion}</span>}
        </Link>
      </li>)}
    </ul>
    </div>
    <div>
      <p className="nx-eyebrow">Dónde trabajamos</p>
      <h3 className="nx-title nx-title-sm">De Tijuana a Ensenada.</h3>
      <ul className="nx-ciudades">
        {CIUDADES.map((ciudad) => <li key={ciudad.name}>
          <figure className="nx-ciudad">
            <span className="nx-ciudad-photo"><Image src={ciudad.src} alt={ciudad.alt} fill sizes="(max-width: 1023px) 50vw, 300px" /></span>
            <figcaption><strong>{ciudad.name}</strong><span>{ciudad.detail}</span></figcaption>
          </figure>
        </li>)}
      </ul>
    </div>
    </div>
  </section>;
}
