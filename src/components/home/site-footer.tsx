"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as motion from "motion/react-m";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { DocumentLink } from "@/components/navigation/document-link";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import type { SiteSettings } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";

const sections = [
  { title: "Propiedades", links: [
    { href: "/comprar-propiedad", label: "Comprar una propiedad" },
    { href: "/residencial", label: "Residencial" },
    { href: "/comercial", label: "Comercial" },
    { href: "/industrial", label: "Industrial" },
  ] },
  { title: "Trabajar con Fortius", links: [
    { href: "/#metodo", label: "Método" },
    { href: "/due-diligence-inmobiliaria", label: "Revisión documental" },
    { href: "/#respuestas", label: "Preguntas frecuentes" },
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

export function SiteFooter({ settings }: { settings?: SiteSettings | null }) {
  const pathname = usePathname();
  const reduce = useReducedMotionSafe();
  const contact = publicContact(settings);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) ? contact.email : "";
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="editorial-footer">
      <div className="editorial-container">
        <motion.div className="editorial-footer-intro" initial={false}
          whileInView={reduce ? undefined : { y: [16, 0] }} viewport={{ once: true }} transition={{ duration: 0.65 }}>
          <div className="editorial-footer-invitation">
            <p className="editorial-footer-eyebrow">Tu próxima propiedad empieza con una conversación.</p>
            <h2>Hablemos de<br /><em>lo que sigue.</em></h2>
            <Link href="/contacto" className="editorial-footer-cta">Contactar a Fortius <ArrowUpRight size={22} aria-hidden="true" /></Link>
          </div>
          <nav className="editorial-footer-directions" aria-label="Comprar o vender">
            <Link href="/vender-propiedad"><span><small>Para propietarios</small>Quiero vender</span><ArrowUpRight aria-hidden="true" /></Link>
            <Link href="/inventario"><span><small>Para compradores</small>Buscar propiedad</span><ArrowUpRight aria-hidden="true" /></Link>
          </nav>
        </motion.div>
        <div className="editorial-footer-columns">
          {sections.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h3>{section.title}</h3>
              <ul>{section.links.map((link) => <li key={link.href}>
                <Link href={link.href} className="editorial-footer-link">{link.label}</Link>
              </li>)}</ul>
            </nav>
          ))}
          <div className="editorial-footer-contact">
            <h3>Contacto</h3>
            <ul>
              {contact.whatsapp && <li><a href={contact.whatsapp} className="editorial-footer-link">WhatsApp: {contact.whatsappLabel}</a></li>}
              {contact.phoneHref && <li><a href={contact.phoneHref} className="editorial-footer-link">Teléfono: {contact.phone}</a></li>}
              {contact.messenger && <li><a href={contact.messenger} className="editorial-footer-link">Messenger</a></li>}
              {email && <li><a href={`mailto:${email}`} className="editorial-footer-link">{email}</a></li>}
              {settings?.horario?.trim() && <li className="editorial-footer-hours">{settings.horario}</li>}
              <li><Link href="/contacto" className="editorial-footer-link">Opciones de contacto</Link></li>
            </ul>
          </div>
        </div>
        <div className="editorial-footer-masthead">
          <Link href="/" aria-label="Inicio de Fortius Inmuebles" className="editorial-footer-brand"><BrandMark /></Link>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" })}>
            Volver arriba <ArrowUp size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="editorial-footer-bottom">
          <p>© {new Date().getFullYear()} Fortius Inmuebles.</p>
          <nav aria-label="Información legal y administración">
            <Link href="/privacidad" className="editorial-footer-link">Aviso de privacidad</Link>
            <Link href="/terminos" className="editorial-footer-link">Términos y condiciones</Link>
            <DocumentLink href="/admin" className="editorial-footer-link">Acceso al panel</DocumentLink>
          </nav>
        </div>
      </div>
    </footer>
  );
}
