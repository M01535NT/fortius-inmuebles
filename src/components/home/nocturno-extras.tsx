import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calculator, Landmark, Scale } from "lucide-react";

import type { Property } from "@/data/propiedades";
import type { Post, Testimonio } from "@/lib/domain/records";
import { formatBlogDate, postDate } from "@/lib/blog-editorial";
import { SEGMENTOS_INMUEBLE, inventarioDeSegmento } from "@/lib/inmueble-segmentos";

type Perfil = { id: string; nombre: string; cargo: string; iniciales: string; foto?: string; descripcion?: string };

const FOTO_SEGMENTO: Record<string, string> = {
  residencial: "/hero/interior-depa.webp",
  comercial: "/hero/edificio-ciudad.webp",
  industrial: "/hero/nave-tijuana.webp",
};

/* Atajos por tipo (boceto 2): tarjeta con foto que abre el inventario filtrado; sin propiedades
   del tipo, invita a pedir aviso por contacto. */
export function NocturnoSegmentos({ properties }: { properties: Property[] }) {
  return <section id="segmentos" aria-labelledby="segmentos-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <h2 id="segmentos-title" className="nx-title">Explora por tipo.</h2>
      </div>
    </div>
    <ul className="nx-segments">
      {SEGMENTOS_INMUEBLE.map((segmento) => {
        const total = properties.filter((property) => (segmento.tipos as readonly string[]).includes(property.tipo)).length;
        return <li key={segmento.key}>
          <Link href={total === 0 ? "/contacto" : inventarioDeSegmento(segmento.key)} className="nx-segment">
            <Image src={FOTO_SEGMENTO[segmento.key]} alt="" fill sizes="(max-width: 1023px) 100vw, 400px" className="nx-segment-img" />
            <span className="nx-segment-body">
              <span className="nx-segment-name">{segmento.label}</span>
              <span className="nx-segment-detail">{segmento.detalle}</span>
              <span className="nx-segment-foot">
                {total === 0
                  ? <>Avísame cuando haya disponibles <ArrowRight size={16} aria-hidden="true" /></>
                  : <>Ver {segmento.label.toLowerCase()} ({total}) <ArrowUpRight size={16} aria-hidden="true" /></>}
              </span>
            </span>
          </Link>
        </li>;
      })}
    </ul>
  </section>;
}

/* Franja para quien viene a comprar: lleva a la guía y al inventario. */
export function NocturnoComprar() {
  return <section id="comprar" aria-labelledby="comprar-title" className="nx-section nx-container">
    <div className="nx-band">
      <div>
        <h2 id="comprar-title" className="nx-band-title">Antes de comprar, conoce lo que se suma al precio.</h2>
        <p className="nx-lead">Los documentos que se revisan, los gastos de la operación y los pasos hasta la firma, explicados sin tecnicismos.</p>
      </div>
      <div className="nx-band-actions">
        <Link href="/comprar-propiedad" className="nx-btn nx-btn-primary">Leer la guía para comprar <ArrowRight size={18} aria-hidden="true" /></Link>
        <Link href="/inventario" className="nx-btn">Explorar inventario</Link>
      </div>
    </div>
  </section>;
}

/* Solo se muestran testimonios con autorización escrita; sin ninguno, la sección no existe. */
export function NocturnoTestimonios({ items }: { items: Testimonio[] }) {
  if (!items.length) return null;
  return <section id="testimonios" aria-labelledby="testimonios-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <h2 id="testimonios-title" className="nx-title">Lo que dicen quienes ya trabajaron con nosotros.</h2>
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

/* Herramientas y blog: calculadoras, opinión de valor y las últimas lecturas. */
export function NocturnoRecursos({ posts }: { posts: Post[] }) {
  const latest = posts.slice(0, 3);
  return <section id="recursos" aria-labelledby="recursos-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <h2 id="recursos-title" className="nx-title">Herramientas y guías.</h2>
      </div>
    </div>
    <div className="nx-resources">
      <div>
        <h3 className="nx-sub">Calculadoras</h3>
        <ul className="nx-tools">
          {[
            { href: "/herramientas/hipoteca", Icon: Landmark, title: "Calculadora de hipoteca", detail: "Compara escenarios y descarga la tabla de amortización." },
            { href: "/herramientas/gastos-de-cierre", Icon: Calculator, title: "Gastos de cierre", detail: "Cuánto necesitas para comprar o cuánto recibes al vender." },
            { href: "/opinion-de-valor", Icon: Scale, title: "Opinión de valor", detail: "Un precio de salida con comparables, fuentes y límites." },
          ].map(({ href, Icon, title, detail }) => <li key={href}><Link href={href} className="nx-tool">
            <span className="nx-tool-icon"><Icon size={20} strokeWidth={1.6} aria-hidden="true" /></span>
            <span><strong>{title}</strong><span>{detail}</span></span>
            <ArrowUpRight size={20} strokeWidth={1.6} aria-hidden="true" className="nx-tool-go" />
          </Link></li>)}
        </ul>
        <Link href="/herramientas" className="nx-link">Ver todas las herramientas</Link>
      </div>
      <div>
        <h3 className="nx-sub">Del blog</h3>
        {latest.length
          ? <ul className="nx-posts">
              {latest.map((post) => <li key={post.slug}><Link href={`/blog/${post.slug}`} className="nx-post">
                <strong>{post.titulo}</strong>
                <span>{post.resumen}</span>
                <time dateTime={postDate(post)}>{formatBlogDate(postDate(post))}</time>
              </Link></li>)}
            </ul>
          : <p className="nx-empty">Por ahora no hay artículos publicados.</p>}
        <Link href="/blog" className="nx-link">Ir al blog</Link>
      </div>
    </div>
  </section>;
}

/* Equipo: perfiles publicados desde el panel, con foto y una descripción breve. Sin ninguno,
   se muestra el perfil ilustrativo (con el símbolo de la marca en lugar de foto). */
export function NocturnoEquipo({ team, ilustrativo = false }: { team: Perfil[]; ilustrativo?: boolean }) {
  return <section id="equipo" aria-labelledby="equipo-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <h2 id="equipo-title" className="nx-title">El equipo que acompaña tu operación.</h2>
        <p className="nx-lead">Captar una propiedad y venderla son dos etapas, y pueden atenderlas personas distintas. Conoce a quienes forman el equipo.</p>
      </div>
      <Link href="/nosotros#agentes" className="nx-link">Conocer al equipo</Link>
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
  </section>;
}
