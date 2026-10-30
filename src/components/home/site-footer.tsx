"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as motion from "motion/react-m";
import { ArrowUp, MessageCircle } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { DocumentLink } from "@/components/navigation/document-link";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import type { SiteSettings } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";

const sections = [
  { title: "Propiedades", links: [
    { href: "/comprar-propiedad", label: "Comprar una propiedad" },
    { href: "/inventario?segmento=residencial", label: "Residencial" },
    { href: "/inventario?segmento=comercial", label: "Comercial" },
    { href: "/inventario?segmento=industrial", label: "Industrial" },
  ] },
  { title: "Trabajar con Fortius", links: [
    { href: "/#metodo", label: "Método" },
    { href: "/opinion-de-valor", label: "Opinión de valor" },
    { href: "/#revision", label: "Revisión documental" },
    { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/nosotros#agentes", label: "Agentes" },
    { href: "/nosotros#identidad", label: "Misión, visión y valores" },
  ] },
  { title: "Guías y herramientas", links: [
    { href: "/blog", label: "Blog" },
    { href: "/herramientas/hipoteca", label: "Calculadora de hipoteca" },
    { href: "/herramientas/gastos-de-cierre", label: "Calculadora de gastos de cierre" },
  ] },
];

function Facebook({ size }: { size: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 22v-9h3l.5-4H14V7c0-1.15.32-2 2-2h2V1.4A24 24 0 0 0 15 1c-3 0-5 1.82-5 5v3H7v4h3v9z" /></svg>;
}
function Instagram({ size, strokeWidth = 1.7 }: { size: number; strokeWidth?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
}

function socialProfile(value: string | undefined, domain: string) {
  try {
    const url = new URL(value?.trim() ?? "");
    if (url.protocol !== "https:" || url.username || url.password || url.port) return "";
    if (url.hostname !== domain && !url.hostname.endsWith(`.${domain}`)) return "";
    return url.pathname !== "/" ? url.href : "";
  } catch { return ""; }
}

/* Pie (boceto 2): invitación de contacto sobre el fondo de la página y, debajo,
   la franja azul noche con la marca, las columnas y los avisos legales. */
export function SiteFooter({ settings }: { settings?: SiteSettings | null }) {
  const pathname = usePathname();
  const reduce = useReducedMotionSafe();
  const contact = publicContact(settings);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ? contact.email : "";
  const socialLinks = [
    { name: "Instagram", href: socialProfile(settings?.instagram, "instagram.com"), Icon: Instagram },
    { name: "Facebook", href: socialProfile(settings?.facebook, "facebook.com"), Icon: Facebook },
    { name: "WhatsApp", href: contact.whatsapp, Icon: MessageCircle },
  ];
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="nx-footer">
      <div className="nx-footer-cta">
        <motion.div className="nx-container nx-footer-intro" initial={false}
          whileInView={reduce ? undefined : { y: [16, 0] }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}>
          <div className="nx-footer-invitation">
            <p className="nx-footer-eyebrow">Tu próxima propiedad empieza con una conversación</p>
            <h2>{pathname === "/" ? "Hablemos de tu próxima operación." : "Hablemos de lo que sigue."}</h2>
            <div className="nx-footer-actions">
              <Link href="/vender-propiedad" className="nx-footer-pill nx-footer-pill-primary">Quiero vender</Link>
              <Link href="/inventario" className="nx-footer-pill">{pathname === "/" ? "Explorar inmuebles" : "Buscar propiedad"}</Link>
              <Link href="/contacto" className="nx-footer-pill">Contactar a Fortius</Link>
            </div>
          </div>
          <div className="nx-footer-contact">
            <p className="nx-footer-eyebrow">Contacto</p>
            <dl>
              {contact.whatsapp && <div><dt>WhatsApp</dt><dd><a href={contact.whatsapp} className="nx-footer-link">{contact.whatsappLabel}</a></dd></div>}
              {contact.phoneHref && <div><dt>Teléfono</dt><dd><a href={contact.phoneHref} className="nx-footer-link">{contact.phone}</a></dd></div>}
              {contact.messenger && <div><dt>Messenger</dt><dd><a href={contact.messenger} className="nx-footer-link">Escribir por Messenger</a></dd></div>}
              {email && <div><dt>Correo</dt><dd><a href={`mailto:${email}`} className="nx-footer-link">{email}</a></dd></div>}
              {settings?.horario?.trim() && <div><dt>Horario</dt><dd className="nx-footer-hours">{settings.horario}</dd></div>}
            </dl>
            <Link href="/contacto" className="nx-footer-link">Opciones de contacto</Link>
            <nav className="nx-footer-socials" aria-label="Redes sociales de Fortius">
              {socialLinks.map(({ name, href, Icon }) => href ? <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} de Fortius (abre en otra pestaña)`} title={name}>
                <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              </a> : <span key={name} className="nx-footer-social-pending" role="img" aria-label={`${name} de Fortius: enlace pendiente`} title={`${name}: próximamente`}>
                <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              </span>)}
            </nav>
          </div>
        </motion.div>
      </div>
      <div className="nx-footer-band">
        <div className="nx-container">
          <div className="nx-footer-columns">
            <div className="nx-footer-brand-block">
              <Link href="/" aria-label="Inicio de Fortius Inmuebles" className="nx-footer-brand"><BrandMark inverse /></Link>
              <p>Compraventa y renta de inmuebles en Tijuana, Rosarito, Tecate y Ensenada.</p>
            </div>
            {sections.map((section) => (
              <nav key={section.title} aria-label={section.title}>
                <h3>{section.title}</h3>
                <ul>{section.links.map((link) => <li key={link.href}>
                  <Link href={link.href} className="nx-footer-link">{link.label}</Link>
                </li>)}</ul>
              </nav>
            ))}
            <nav aria-label="Síguenos">
              <h3>Síguenos</h3>
              <ul>{socialLinks.map(({ name, href, Icon }) => <li key={name}>
                {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="nx-footer-link nx-footer-follow">
                  <Icon size={18} strokeWidth={1.7} aria-hidden="true" />{name}<span className="sr-only"> (abre en otra pestaña)</span>
                </a> : <span className="nx-footer-link nx-footer-follow nx-footer-follow-pending" title={`${name}: próximamente`}>
                  <Icon size={18} strokeWidth={1.7} aria-hidden="true" />{name}<span className="sr-only">: enlace pendiente</span>
                </span>}
              </li>)}</ul>
            </nav>
          </div>
          <div className="nx-footer-bottom">
            <p>© {new Date().getFullYear()} Fortius Inmuebles</p>
            <nav aria-label="Información legal y administración">
              <Link href="/avisos" className="nx-footer-link">Avisos y documentos</Link>
              <Link href="/privacidad" className="nx-footer-link">Aviso de privacidad</Link>
              <Link href="/terminos" className="nx-footer-link">Términos y condiciones</Link>
              <DocumentLink href="/admin" className="nx-footer-link">Acceso al panel</DocumentLink>
            </nav>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" })}>
              Volver arriba <ArrowUp size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
