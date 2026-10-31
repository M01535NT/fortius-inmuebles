import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AboutReveal } from "@/components/about/about-reveal";
import { getPublishedTeam } from "@/lib/backend/public-team";
import { getPublicSettings } from "@/lib/backend/public";
import { publicContact } from "@/lib/public-contact";
import { SITE_TERMS } from "@/data/site-terms";
import { PERFIL_ILUSTRATIVO } from "@/data/perfil-ilustrativo";
import "./nosotros.css";

export const metadata: Metadata = {
  alternates: { canonical: "/nosotros" }, title: "Nosotros · Equipo y valores",
  description: "Conoce al equipo de Fortius Inmuebles, sus datos de contacto y los principios con los que acompañamos tu operación.",
};

/* Dirección «Nocturno» (lienzo, artboard Nosotros): portada oscura con el
   asesor, misión y visión como dos tarjetas, valores numerados y video. */
const values: { title: string; text: string; wide?: boolean }[] = [
  { title: "Claridad", text: "Precio, honorarios y condiciones, antes de decidir." },
  { title: "Responsabilidad", text: "Acuerdos por escrito." },
  { title: "Discreción", text: "Tus documentos, solo con quien participa." },
  { title: "Criterio", text: "Lo comprobado, separado de lo pendiente.", wide: true },
  { title: "Respeto a tu decisión", text: "Tú decides precio y condiciones.", wide: true },
];

export default async function NosotrosPage() {
  const [team, settings] = await Promise.all([getPublishedTeam(), getPublicSettings()]);
  const contact = publicContact(settings);
  const videoUrl = settings?.videoInstitucionalUrl;
  const profiles = team.length ? team : [{
    ...PERFIL_ILUSTRATIVO, telefono: settings?.telefono, whatsapp: settings?.whatsapp,
    email: contact.email || SITE_TERMS.email, instagram: undefined, facebook: undefined, linkedin: undefined,
  }];
  const [lead, ...rest] = profiles;
  const channelsOf = (profile: typeof lead) => publicContact({ telefono: profile.telefono || "", whatsapp: profile.whatsapp || "", email: profile.email || "", facebook: "" } as Parameters<typeof publicContact>[0]);
  const isIllustrative = (profile: typeof lead) => profile.id === "moises" && !team.length;

  const portrait = (profile: typeof lead, priority = false) => profile.foto
    ? <Image unoptimized priority={priority} src={profile.foto} alt={isIllustrative(profile) ? `Retrato ilustrativo; no representa a ${profile.nombre}` : profile.nombre} fill sizes="(max-width: 899px) 100vw, 480px" />
    : <span className="ab-initials" aria-label={`Iniciales de ${profile.nombre}`}>{profile.iniciales}</span>;

  const channelLinks = (profile: typeof lead) => {
    const channels = channelsOf(profile);
    return <>
      {channels.whatsapp && <a href={channels.whatsapp} className="ab-chip ab-chip-primary">WhatsApp</a>}
      {channels.phoneHref && <a href={channels.phoneHref} className="ab-chip">Llamar</a>}
      {channels.emailHref && <a href={channels.emailHref} className="ab-chip">Correo</a>}
      {!channels.whatsapp && !channels.phoneHref && !channels.emailHref && <Link href="/contacto" className="ab-chip">Contactar con Fortius</Link>}
    </>;
  };
  const socialLinks = (profile: typeof lead) => ([["Instagram", profile.instagram], ["Facebook", profile.facebook], ["LinkedIn", profile.linkedin]] as const)
    .filter(([, url]) => url).map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer">{label} <ArrowUpRight size={14} aria-hidden="true" /></a>);

  return <main className="about-page">
    <AboutReveal>
    <section className="ab-hero" aria-labelledby="about-title">
      <div className="nx-container ab-hero-grid">
        <div className="ab-hero-copy" data-reveal>
          <h1 id="about-title" className="ab-hero-title" data-reveal-item>Personas detrás de cada operación.</h1>
          <p className="ab-hero-lead" data-reveal-item>De la primera llamada a la entrega.</p>
          <nav className="ab-index" aria-label="En esta página" data-reveal-item>
            <a href="#agentes">Agentes</a><a href="#identidad">Misión y visión</a><a href="#valores">Valores</a>{videoUrl && <a href="#video">Video</a>}
          </nav>
        </div>
        <figure id="agentes" className="ab-portrait" data-reveal>
          <div className="ab-portrait-media">{isIllustrative(lead)
            ? <span className="ab-mark"><Image src="/brand/fortius-symbol-inverse.svg" alt="" width={148} height={188} /></span>
            : portrait(lead, true)}</div>
          <figcaption className="ab-portrait-card">
            <span className="ab-portrait-role">{lead.cargo}</span>
            <span className="ab-portrait-name">{lead.nombre}</span>
            <span className="ab-portrait-actions">{channelLinks(lead)}</span>
            {socialLinks(lead).length > 0 && <nav className="ab-social" aria-label={`Redes de ${lead.nombre}`}>{socialLinks(lead)}</nav>}
            {isIllustrative(lead) && <span className="ab-portrait-note">La foto del equipo se publica cuando el perfil está en el panel.</span>}
          </figcaption>
        </figure>
      </div>
    </section>

    <section className="ab-band" aria-labelledby="agent-heading">
      <div className="nx-container">
        <div className="ab-agent-intro" data-reveal>
          <div data-reveal-item>
            <h2 id="agent-heading" className="ab-title">Un contacto directo para tu operación.</h2>
          </div>
          {lead.descripcion && <p className="ab-agent-text" data-reveal-item>{lead.descripcion}</p>}
        </div>
        {rest.length > 0 && <ul className="ab-team" data-reveal>
          {rest.map(profile => <li key={profile.id} className="ab-member" data-reveal-item>
            <div className="ab-member-media">{portrait(profile)}</div>
            <div className="ab-member-body">
              <p className="ab-eyebrow">{profile.cargo}</p>
              <h3>{profile.nombre}</h3>
              {profile.descripcion && <p className="ab-member-text">{profile.descripcion}</p>}
              <div className="ab-portrait-actions">{channelLinks(profile)}</div>
              {socialLinks(profile).length > 0 && <nav className="ab-social" aria-label={`Redes de ${profile.nombre}`}>{socialLinks(profile)}</nav>}
            </div>
          </li>)}
        </ul>}
      </div>
    </section>

    <section id="identidad" className="ab-band" aria-label="Misión y visión">
      <div className="nx-container ab-purpose" data-reveal>
        <article id="mision" className="ab-purpose-card" data-reveal-item>
          <span className="ab-purpose-photo"><Image src="/hero/etapa-01-revisamos.webp" alt="Escritura y pluma sobre un escritorio" fill sizes="(max-width: 899px) 100vw, 50vw" /></span>
          <p className="ab-eyebrow">Misión</p>
          <h2>Decidir con información. Avanzar con respaldo.</h2>
          <p>Información comprobable para decidir con claridad.</p>
        </article>
        <article id="vision" className="ab-purpose-card ab-purpose-card-accent" data-reveal-item>
          <span className="ab-purpose-photo"><Image src="/hero/ciudad-tijuana.webp" alt="Zona Río de Tijuana con el Centro Cultural y los cerros al fondo" fill sizes="(max-width: 899px) 100vw, 50vw" /></span>
          <p className="ab-eyebrow">Visión</p>
          <h2>Crecer por la confianza que construimos.</h2>
          <p>Referencia en Baja California, también después de la firma.</p>
        </article>
      </div>
    </section>

    <section id="valores" className="ab-band" aria-labelledby="values-heading">
      <div className="nx-container">
        <h2 id="values-heading" className="ab-title ab-values-title" data-reveal>Lo que guía nuestro trabajo.</h2>
        <ol className="ab-values" data-reveal>
          {values.map((value, index) => <li key={value.title} className={"ab-value" + (value.wide ? " ab-value-wide" : "")} data-reveal-item>
            <span className="ab-value-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{value.title}</h3><p>{value.text}</p></div>
          </li>)}
        </ol>
      </div>
    </section>

    {/* El video solo aparece cuando el panel tiene un video institucional real. */}
    {videoUrl && <section id="video" className="ab-band ab-band-last" aria-labelledby="video-heading">
      <div className="nx-container">
        <div className="ab-video dark" data-reveal>
          <div className="ab-video-head">
            <h2 id="video-heading">Cómo trabajamos, en video.</h2>
          </div>
          <video src={videoUrl} controls preload="metadata" className="ab-video-player">Tu navegador no puede reproducir este video.</video>
        </div>
      </div>
    </section>}
    </AboutReveal>
  </main>;
}
