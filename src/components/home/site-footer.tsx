"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as motion from "motion/react-m";
import { ArrowUp, MessageCircle } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { DocumentLink } from "@/components/navigation/document-link";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import type { SiteSettings } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";

const sections = [
  { title: "Vender", links: [
    { href: "/vender-propiedad", label: "Vender mi propiedad" },
    { href: "/opinion-de-valor", label: "Opinión de valor" },
    { href: "/herramientas/gastos-de-cierre", label: "Gastos y neto de venta" },
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
    { href: "/nosotros#agentes", label: "Agentes" },
    { href: "/blog", label: "Blog" },
    { href: "/avisos", label: "Avisos y documentos" },
    { href: "/contacto", label: "Contacto" },
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

/*
  Pie (30/10/2026): una sola invitación sobre crema con dos acciones y, debajo, la
  franja azul noche con la marca, el contacto, tres columnas, los avisos legales y el
  cambio de tema. Solo se muestran las redes que existen.
*/
export function SiteFooter({ settings }: { settings?: SiteSettings | null }) {
  const pathname = usePathname();
  const reduce = useReducedMotionSafe();
  const contact = publicContact(settings, "Hola, quiero conversar sobre una propiedad con Fortius.");
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ? contact.email : "";
  const socialLinks = [
    { name: "Instagram", href: socialProfile(settings?.instagram, "instagram.com"), Icon: Instagram },
    { name: "Facebook", href: socialProfile(settings?.facebook, "facebook.com"), Icon: Facebook },
    { name: "WhatsApp", href: contact.whatsapp, Icon: MessageCircle },
  ].filter((item) => item.href);
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="nx-footer">
      <div className="nx-footer-cta">
        <motion.div className="nx-container nx-footer-intro" initial={false}
          whileInView={reduce ? undefined : { y: [16, 0] }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}>
          <div>
            <h2>¿Vendes o compras? Hablemos.</h2>
            {settings?.horario?.trim() && <p className="nx-footer-hours">{settings.horario}</p>}
          </div>
          <div className="nx-footer-actions">
            <Link href="/vender-propiedad" className="nx-btn nx-btn-primary">Quiero vender</Link>
            {contact.whatsapp
              ? <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className="nx-btn">Escribir por WhatsApp</a>
              : <Link href="/contacto" className="nx-btn">Contactar a Fortius</Link>}
          </div>
        </motion.div>
      </div>
      <div className="nx-footer-band">
        <div className="nx-container">
          <div className="nx-footer-columns">
            <div className="nx-footer-brand-block">
              <Link href="/" aria-label="Fortius Inmuebles" className="nx-footer-brand"><BrandMark inverse /></Link>
              <p>Compraventa y renta de inmuebles en Tijuana, Rosarito, Tecate y Ensenada.</p>
              <dl className="nx-footer-contact">
                {contact.whatsapp && <div><dt>WhatsApp</dt><dd><a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className="nx-footer-link">{contact.whatsappLabel}</a></dd></div>}
                {contact.phoneHref && <div><dt>Teléfono</dt><dd><a href={contact.phoneHref} className="nx-footer-link">{contact.phone}</a></dd></div>}
                {email && <div><dt>Correo</dt><dd><a href={`mailto:${email}`} className="nx-footer-link">{email}</a></dd></div>}
              </dl>
              {socialLinks.length > 0 && <nav className="nx-footer-socials" aria-label="Redes sociales de Fortius">
                {socialLinks.map(({ name, href, Icon }) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} de Fortius (abre en otra pestaña)`} title={name}>
                  <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                </a>)}
              </nav>}
            </div>
            {sections.map((section) => (
              <nav key={section.title} aria-label={section.title}>
                <h3>{section.title}</h3>
                <ul>{section.links.map((link) => <li key={link.href}>
                  <Link href={link.href} className="nx-footer-link">{link.label}</Link>
                </li>)}</ul>
              </nav>
            ))}
          </div>
          <div className="nx-footer-bottom">
            <p>© {new Date().getFullYear()} Fortius Inmuebles</p>
            <nav aria-label="Información legal y administración">
              <Link href="/privacidad" className="nx-footer-link">Aviso de privacidad</Link>
              <Link href="/terminos" className="nx-footer-link">Términos y condiciones</Link>
              <Link href="/avisos" className="nx-footer-link">Avisos y documentos</Link>
              <DocumentLink href="/admin" className="nx-footer-link nx-footer-admin">Acceso al panel</DocumentLink>
            </nav>
            <div className="nx-footer-tools">
              <ThemeToggle className="nx-footer-theme" />
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" })}>
                Volver arriba <ArrowUp size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
