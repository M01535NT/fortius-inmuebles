"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, MessageCircle } from "lucide-react";
import { DocumentLink } from "@/components/navigation/document-link";
import { Boton } from "@/components/sitio/boton";
import { InterruptorTema } from "@/components/sitio/interruptor-tema";
import { SitioLogo } from "@/components/sitio/logo";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import type { SiteSettings } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";
import styles from "./site-footer.module.css";

const sections = [
  { title: "Vender", links: [
    { href: "/vender-propiedad", label: "Vender mi propiedad" },
    { href: "/opinion-de-valor", label: "Opinión de valor" },
    { href: "/herramientas/gastos-de-cierre", label: "Gastos de cierre" },
    { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  ] },
  { title: "Comprar", links: [
    { href: "/inventario", label: "Ver propiedades" },
    { href: "/inventario?segmento=residencial", label: "Residencial" },
    { href: "/inventario?segmento=comercial", label: "Comercial" },
    { href: "/inventario?segmento=industrial", label: "Industrial" },
    { href: "/comprar-propiedad", label: "Guía para comprar" },
    { href: "/herramientas/hipoteca", label: "Calculadora de hipoteca" },
  ] },
  { title: "Fortius", links: [
    { href: "/nosotros", label: "Nosotros" },
    { href: "/nosotros#agentes", label: "Asesores" },
    { href: "/blog", label: "Blog" },
    { href: "/avisos", label: "Avisos y documentos" },
    { href: "/contacto", label: "Contacto" },
  ] },
];

function Facebook({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 22v-9h3l.5-4H14V7c0-1.15.32-2 2-2h2V1.4A24 24 0 0 0 15 1c-3 0-5 1.82-5 5v3H7v4h3v9z" /></svg>;
}
function Instagram({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
}
function WhatsApp({ size }: { size: number }) {
  return <MessageCircle size={size} strokeWidth={1.7} aria-hidden="true" />;
}

function socialProfile(value: string | undefined, domain: string) {
  try {
    const url = new URL(value?.trim() ?? "");
    if (url.protocol !== "https:" || url.username || url.password || url.port) return "";
    if (url.hostname !== domain && !url.hostname.endsWith(`.${domain}`)) return "";
    return url.pathname !== "/" ? url.href : "";
  } catch { return ""; }
}

/*
  Pie, Fortius II (17/11/2026). Fuera del inicio y de Contacto abre con una banda oscura de invitación.
  Debajo, sobre el fondo del tema: logo y contacto, tres columnas con líneas finas y una franja final
  con los avisos, «Acceso al panel», el interruptor de tema y «Volver arriba».
  Solo se muestran las redes que existen.
*/
export function SiteFooter({ settings }: { settings?: SiteSettings | null }) {
  const pathname = usePathname();
  const reduce = useReducedMotionSafe();
  const contact = publicContact(settings, "Hola, quiero conversar sobre una propiedad con Fortius.");
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ? contact.email : "";
  const socialLinks = [
    { name: "Instagram", href: socialProfile(settings?.instagram, "instagram.com"), Icon: Instagram },
    { name: "Facebook", href: socialProfile(settings?.facebook, "facebook.com"), Icon: Facebook },
    { name: "WhatsApp", href: contact.whatsapp, Icon: WhatsApp },
  ].filter((item) => item.href);
  if (pathname.startsWith("/admin")) return null;
  /* El inicio cierra con su propia invitación y Contacto ya es la invitación (12/11/2026). */
  const showInvitation = pathname !== "/" && pathname !== "/contacto";

  return (
    <footer className={styles.footer}>
      {showInvitation && <div className={`s-banda ${styles.cta}`}>
        <div className={`s-contenedor ${styles.ctaInner}`}>
          <div className={styles.ctaCopy}>
            <h2 className={styles.ctaTitle}>¿Vendes o compras? Hablemos.</h2>
            {settings?.horario?.trim() && <p className={styles.hours}>{settings.horario}</p>}
          </div>
          <div className={styles.ctaActions}>
            <Boton href="/vender-propiedad" tamano="grande" flecha>Quiero vender</Boton>
            {contact.whatsapp
              ? <Boton href={contact.whatsapp} variante="contorno" tamano="grande" target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</Boton>
              : <Boton href="/contacto" variante="contorno" tamano="grande">Contactar a Fortius</Boton>}
          </div>
        </div>
      </div>}
      <div className={`s-contenedor ${styles.main}`}>
        <div className={styles.brandBlock}>
          <Link href="/" aria-label="Fortius, inicio" className={styles.brand}><SitioLogo /></Link>
          <p className={styles.pitch}>Compraventa y renta de inmuebles en Tijuana, Rosarito, Tecate y Ensenada.</p>
          <dl className={styles.contact}>
            {contact.whatsapp && <div><dt>WhatsApp</dt><dd><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.link}>{contact.whatsappLabel}</a></dd></div>}
            {contact.phoneHref && <div><dt>Teléfono</dt><dd><a href={contact.phoneHref} className={styles.link}>{contact.phone}</a></dd></div>}
            {email && <div><dt>Correo</dt><dd><a href={`mailto:${email}`} className={styles.link}>{email}</a></dd></div>}
          </dl>
          {socialLinks.length > 0 && <nav className={styles.socials} aria-label="Redes sociales de Fortius">
            {socialLinks.map(({ name, href, Icon }) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} de Fortius (abre en otra pestaña)`} title={name}>
              <Icon size={18} />
            </a>)}
          </nav>}
        </div>
        {sections.map((section) => (
          <nav key={section.title} aria-label={section.title} className={styles.column}>
            <h3 className={styles.columnTitle}>{section.title}</h3>
            <ul>{section.links.map((link) => <li key={link.href}>
              <Link href={link.href} className={styles.link}>{link.label}</Link>
            </li>)}</ul>
          </nav>
        ))}
      </div>
      <div className={`s-contenedor ${styles.bottom}`}>
        <p className={styles.copy}>© {new Date().getFullYear()} Fortius Inmuebles</p>
        <nav aria-label="Información legal y administración" className={styles.legal}>
          <Link href="/privacidad" className={styles.link}>Aviso de privacidad</Link>
          <Link href="/terminos" className={styles.link}>Términos y condiciones</Link>
          <Link href="/avisos" className={styles.link}>Avisos y documentos</Link>
          <DocumentLink href="/admin" className={styles.link}>Acceso al panel</DocumentLink>
        </nav>
        <div className={styles.tools}>
          <InterruptorTema />
          <button type="button" className={styles.top} onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" })}>
            Volver arriba <ArrowUp size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
