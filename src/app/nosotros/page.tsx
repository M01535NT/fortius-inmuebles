import type { Metadata } from "next";
import Image from "next/image";

import { Boton } from "@/components/sitio/boton";
import { FlechaDiagonal } from "@/components/sitio/iconos";
import { Bloque, CabezaPagina, Filas } from "@/components/sitio/pagina";
import { PERFIL_ILUSTRATIVO } from "@/data/perfil-ilustrativo";
import { SITE_TERMS } from "@/data/site-terms";
import { getPublicSettings } from "@/lib/backend/public";
import { getPublishedTeam } from "@/lib/backend/public-team";
import { publicContact } from "@/lib/public-contact";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "./nosotros-sitio.css";

export const metadata: Metadata = pageMetadata({
  path: "/nosotros",
  title: "Quiénes somos: inmobiliaria en Tijuana",
  description:
    "Conoce a Fortius Inmuebles en Tijuana: cómo trabajamos y los principios con que acompañamos tu compra o venta, con cada acuerdo por escrito.",
});

const VALORES = [
  { titulo: "Claridad", texto: "Precio, honorarios y condiciones, antes de decidir." },
  { titulo: "Responsabilidad", texto: "Acuerdos por escrito." },
  { titulo: "Discreción", texto: "Tus documentos, solo con quien participa." },
  { titulo: "Criterio", texto: "Lo comprobado, separado de lo pendiente." },
  { titulo: "Respeto a tu decisión", texto: "Tú decides precio y condiciones." },
];

/*
  Nosotros, Fortius II (etapa 5, 17/11/2026): quién te atiende (los perfiles publicados en el
  panel; mientras no haya, el perfil ilustrativo con sus iniciales), misión y visión con foto,
  valores en filas y el video institucional solo si el panel tiene uno.
*/
export default async function NosotrosPage() {
  const [team, settings] = await Promise.all([getPublishedTeam(), getPublicSettings().catch(() => null)]);
  const contact = publicContact(settings);
  const videoUrl = settings?.videoInstitucionalUrl;
  const perfiles = team.length ? team : [{
    ...PERFIL_ILUSTRATIVO, telefono: settings?.telefono, whatsapp: settings?.whatsapp,
    email: contact.email || SITE_TERMS.email, instagram: undefined, facebook: undefined, linkedin: undefined,
  }];
  type Perfil = (typeof perfiles)[number];
  const ilustrativo = !team.length;

  const canales = (p: Perfil) => {
    const c = publicContact({ telefono: p.telefono || "", whatsapp: p.whatsapp || "", email: p.email || "", facebook: "" } as Parameters<typeof publicContact>[0]);
    const hay = c.whatsapp || c.phoneHref || c.emailHref;
    return (
      <div className="s-acciones">
        {c.whatsapp && <Boton href={c.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</Boton>}
        {c.phoneHref && <Boton href={c.phoneHref} variante="contorno">Llamar</Boton>}
        {c.emailHref && <Boton href={c.emailHref} variante="contorno">Correo</Boton>}
        {!hay && <Boton href="/contacto" variante="contorno">Contactar a Fortius</Boton>}
      </div>
    );
  };
  const redes = (p: Perfil) => {
    const lista = ([["Instagram", p.instagram], ["Facebook", p.facebook], ["LinkedIn", p.linkedin]] as const).filter(([, url]) => url);
    if (!lista.length) return null;
    return (
      <nav className="no-redes" aria-label={`Redes de ${p.nombre}`}>
        {lista.map(([nombre, url]) => <a key={nombre} href={url} target="_blank" rel="noopener noreferrer">{nombre}<FlechaDiagonal size={16} /></a>)}
      </nav>
    );
  };
  const retrato = (p: Perfil, prioridad = false) => p.foto && !ilustrativo
    ? <Image unoptimized preload={prioridad} src={p.foto} alt={p.nombre} fill sizes="(max-width: 899px) 100vw, 480px" />
    : <span className="no-iniciales" aria-label={`Iniciales de ${p.nombre}`}>{p.iniciales}</span>;

  return (
    <main className="s-pagina no">
      <CabezaPagina titulo="Personas detrás de cada operación." entrada="De la primera llamada a la entrega." />

      <section id="agentes" className="s-contenedor no-equipo" aria-labelledby="no-equipo">
        <h2 id="no-equipo" className="s-h2">Quién te atiende en Fortius.</h2>
        <ul className="no-perfiles">
          {perfiles.map((p, i) => (
            <li key={p.id} className={i === 0 ? "no-perfil no-perfil-principal" : "no-perfil"}>
              <span className="no-retrato">{retrato(p, i === 0)}</span>
              <div className="no-perfil-texto">
                <h3 className="no-nombre">{p.nombre}</h3>
                <p className="no-cargo">{p.cargo}</p>
                {p.descripcion && <p className="no-descripcion">{p.descripcion}</p>}
                {canales(p)}
                {redes(p)}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="identidad" className="s-contenedor no-proposito" aria-label="Misión y visión">
        <article id="mision" aria-label="Misión" className="no-tarjeta s-banda">
          <Image src="/hero/etapa-01-revisamos.webp" alt="" fill sizes="(max-width: 899px) 100vw, 50vw" />
          <span className="no-velo" aria-hidden="true" />
          <div className="no-tarjeta-texto">
            <h2>Que decidas con información comprobable.</h2>
            <p>Revisamos documentos y precio antes de que firmes.</p>
          </div>
        </article>
        <article id="vision" aria-label="Visión" className="no-tarjeta s-banda">
          <Image src="/hero/ciudad-tijuana.webp" alt="" fill sizes="(max-width: 899px) 100vw, 50vw" />
          <span className="no-velo" aria-hidden="true" />
          <div className="no-tarjeta-texto">
            <h2>Ser la referencia en Baja California, también después de la firma.</h2>
          </div>
        </article>
      </section>

      <Bloque id="valores" titulo="Lo que guía nuestro trabajo.">
        <Filas filas={VALORES} />
      </Bloque>

      {/* El video solo aparece cuando el panel tiene un video institucional real. */}
      {videoUrl && (
        <section id="video" className="s-contenedor no-video" aria-labelledby="no-video">
          <h2 id="no-video" className="s-h2">Cómo trabajamos, en video.</h2>
          <video src={videoUrl} controls preload="metadata" className="no-video-reproductor">Tu navegador no puede reproducir este video.</video>
        </section>
      )}
    </main>
  );
}
