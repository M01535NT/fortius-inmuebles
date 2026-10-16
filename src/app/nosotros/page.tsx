import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { InstitutionalVideo } from "@/components/sections/institutional-video";
import { BlurFade } from "@/components/magicui/blur-fade";
import { getPublishedTeam } from "@/lib/backend/public-team";
import { getPublicSettings } from "@/lib/backend/public";
import { publicContact } from "@/lib/public-contact";
import { SITE_TERMS } from "@/data/site-terms";

export const metadata: Metadata = {
  alternates: { canonical: "/nosotros" }, title: "Nosotros · Equipo y valores",
  description: "Conoce al equipo de Fortius Inmuebles, sus datos de contacto y los principios con los que acompañamos tu operación.",
};
const values = [
  ["Claridad", "Explicamos el precio, los honorarios y las condiciones antes de que tomes una decisión. Si falta información, lo decimos."],
  ["Responsabilidad", "Cada operación tiene un asesor a cargo, acuerdos por escrito y seguimiento de los pendientes."],
  ["Discreción", "Coordinamos el acceso al inmueble y compartimos documentos únicamente con quienes intervienen en la operación y necesitan consultarlos."],
  ["Criterio", "Revisamos documentos y datos de mercado. Distinguimos lo comprobado de lo que aún necesita verificarse."],
  ["Respeto a tu decisión", "Presentamos opciones y explicamos sus implicaciones. Tú decides el precio y las condiciones que aceptas."],
];
export default async function NosotrosPage() {
  const [team, settings] = await Promise.all([getPublishedTeam(), getPublicSettings()]);
  const contact = publicContact(settings);
  const profiles = team.length ? team : [{
    id: "moises", nombre: SITE_TERMS.responsible, cargo: "Asesor inmobiliario · Fortius", iniciales: "MN",
    descripcion: "Soy tu contacto para revisar lo que buscas o la propiedad que quieres vender. Coordino las visitas y reviso las propuestas contigo; tú decides qué condiciones aceptar.",
    foto: "/images/team/advisor-example.webp", telefono: settings?.telefono, whatsapp: settings?.whatsapp,
    email: contact.email || SITE_TERMS.email, instagram: undefined, facebook: undefined, linkedin: undefined,
  }];
  return <main className="about-page">
    <section className="editorial-container about-intro">
      <BlurFade><p className="about-eyebrow">Nosotros</p><h1>Personas detrás<br /><em>de cada operación.</em></h1>
        <p className="about-lead">Somos Fortius Inmuebles. Acompañamos a propietarios y compradores con un asesor que coordina la información, las visitas y la negociación, desde la primera conversación hasta la entrega.</p>
        <nav className="about-index" aria-label="En esta página"><Link href="#agentes">Agentes <ArrowUpRight size={16} /></Link><Link href="#identidad">Misión y visión <ArrowUpRight size={16} /></Link><Link href="#valores">Nuestros valores <ArrowUpRight size={16} /></Link></nav>
      </BlurFade>
    </section>
    <section id="agentes" className="editorial-container about-section" aria-labelledby="team-heading">
      <div className="about-section-heading"><h2 id="team-heading">Conoce a tu asesor.</h2><p>Un contacto directo para tu operación.</p></div>
      <div className="about-team">{profiles.map(profile => {
        const channels = publicContact({ telefono: profile.telefono || "", whatsapp: profile.whatsapp || "", email: profile.email || "", facebook: "" } as Parameters<typeof publicContact>[0]);
        const illustrative = profile.id === "moises" && !team.length;
        return <BlurFade key={profile.id}><article className="about-agent">
          <figure>{profile.foto ? <Image unoptimized src={profile.foto} alt={illustrative ? "Retrato ilustrativo; no representa a Moisés Núñez Tonalá" : profile.nombre} width={800} height={1000} sizes="(max-width: 767px) 90vw, 360px" /> : <div className="about-agent-initials" aria-label={`Iniciales de ${profile.nombre}`}>{profile.iniciales}</div>}{illustrative && <figcaption>Retrato ilustrativo provisional</figcaption>}</figure>
          <div className="about-agent-body"><p className="about-eyebrow">{profile.cargo}</p><h3>{profile.nombre}</h3>{profile.descripcion && <p className="about-agent-description">{profile.descripcion}</p>}
            <div className="about-agent-contact">
              {channels.whatsapp && <a href={channels.whatsapp}>WhatsApp <ArrowUpRight size={16} /></a>}
              {channels.phoneHref && <a href={channels.phoneHref}>{channels.phone} <ArrowUpRight size={16} /></a>}
              {channels.emailHref && <a href={channels.emailHref}>{profile.email} <ArrowUpRight size={16} /></a>}
              {!channels.whatsapp && !channels.phoneHref && !channels.emailHref && <Link href="/contacto">Contactar con Fortius <ArrowUpRight size={16} /></Link>}
            </div>
            <nav className="about-agent-social" aria-label={`Redes de ${profile.nombre}`}>{([['Instagram', profile.instagram], ['Facebook', profile.facebook], ['LinkedIn', profile.linkedin]] as const).filter(([,url])=>url).map(([label,url])=><a key={label} href={url} target="_blank" rel="noopener noreferrer">{label} <ArrowUpRight size={14} /></a>)}</nav>
          </div>
        </article></BlurFade>;
      })}</div>
    </section>
    <section id="identidad" className="about-identity"><div className="editorial-container">
      <div className="about-purpose"><BlurFade id="mision"><p className="about-eyebrow">Misión</p><h2>Decidir con información.<br />Avanzar con respaldo.</h2><p>Acompañar la venta y compra de inmuebles con información comprobable, coordinación documental y representación cercana, para que cada cliente entienda sus opciones y decida con claridad.</p></BlurFade>
      <BlurFade id="vision"><p className="about-eyebrow">Visión</p><h2>Crecer por la confianza<br />que construimos.</h2><p>Ser una inmobiliaria de referencia en Baja California por la calidad de su asesoría, el orden de sus operaciones y relaciones que continúen después de la firma.</p></BlurFade></div>
      <div id="valores" className="about-values"><h2>Lo que guía nuestro trabajo.</h2><div>{values.map(([title, text])=><BlurFade key={title}><article><h3>{title}</h3><p>{text}</p></article></BlurFade>)}</div></div>
    </div></section>
    <InstitutionalVideo />
  </main>;
}
