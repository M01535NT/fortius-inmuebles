import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calculator, Landmark } from "lucide-react";

import type { Property } from "@/data/propiedades";
import type { Post, Testimonio } from "@/lib/domain/records";
import { formatBlogDate, postDate } from "@/lib/blog-editorial";
import { SEGMENTOS_INMUEBLE, inventarioDeSegmento } from "@/lib/inmueble-segmentos";

type Perfil = { id: string; nombre: string; cargo: string; iniciales: string; foto?: string };

/* Atajos por tipo: cada tarjeta abre el inventario con el filtro aplicado. */
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
          <Link href={inventarioDeSegmento(segmento.key)} className="nx-segment">
            <span className="nx-segment-name">{segmento.label}</span>
            <span className="nx-segment-detail">{segmento.detalle}</span>
            <span className="nx-segment-foot">
              <span>{total === 0 ? "Sin propiedades por ahora" : `${total} ${total === 1 ? "propiedad" : "propiedades"}`}</span>
              <ArrowUpRight size={20} aria-hidden="true" />
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

/* Herramientas y blog: dos calculadoras y las últimas lecturas. */
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
          <li><Link href="/herramientas/hipoteca" className="nx-tool">
            <Landmark size={22} aria-hidden="true" />
            <span><strong>Calculadora de hipoteca</strong><span>Compara escenarios y descarga la amortización.</span></span>
          </Link></li>
          <li><Link href="/herramientas/gastos-de-cierre" className="nx-tool">
            <Calculator size={22} aria-hidden="true" />
            <span><strong>Gastos de cierre</strong><span>Efectivo de compra o neto de venta.</span></span>
          </Link></li>
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

/* Equipo: solo perfiles publicados desde el panel; sin ninguno, invita a conocer al asesor. */
export function NocturnoEquipo({ team }: { team: Perfil[] }) {
  return <section id="equipo" aria-labelledby="equipo-title" className="nx-section nx-container">
    <div className="nx-head">
      <div>
        <h2 id="equipo-title" className="nx-title">Un asesor a cargo de cada operación.</h2>
      </div>
      <Link href="/nosotros#agentes" className="nx-link">Conocer al equipo</Link>
    </div>
    {team.length
      ? <ul className="nx-team">
          {team.slice(0, 4).map((person) => <li key={person.id}>
            <Link href="/nosotros#agentes" className="nx-person">
              <span className="nx-person-photo">{person.foto
                ? <Image unoptimized src={person.foto} alt="" fill sizes="(max-width: 767px) 50vw, 240px" />
                : <span aria-hidden="true">{person.iniciales}</span>}</span>
              <strong>{person.nombre}</strong>
              <span>{person.cargo}</span>
            </Link>
          </li>)}
        </ul>
      : <p className="nx-lead nx-team-note">Tu asesor coordina la información, las visitas y la negociación, desde la primera conversación hasta la entrega.</p>}
  </section>;
}
