"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { usePublicFeatures } from "@/components/providers/public-features-provider";
import { publicContact } from "@/lib/public-contact";
import styles from "./fullscreen-menu.module.css";

/* Columnas del menú desplegable (boceto 2). */
const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  { title: "Propiedades", links: [
    { href: "/inventario", label: "Propiedades" },
    { href: "/comprar-propiedad", label: "Comprar una propiedad" },
    { href: "/inventario?segmento=residencial", label: "Residencial" },
    { href: "/inventario?segmento=comercial", label: "Comercial" },
    { href: "/inventario?segmento=industrial", label: "Industrial" },
  ] },
  { title: "Vender con Fortius", links: [
    { href: "/vender-propiedad", label: "Vender mi propiedad" },
    { href: "/#metodo", label: "Método" },
    { href: "/#revision", label: "Revisión documental" },
    { href: "/opinion-de-valor", label: "Opinión de valor" },
    { href: "/#promocion", label: "Promoción" },
  ] },
  { title: "Guías y herramientas", links: [
    { href: "/herramientas", label: "Herramientas" },
    { href: "/herramientas/hipoteca", label: "Calculadora de hipoteca" },
    { href: "/herramientas/gastos-de-cierre", label: "Gastos de cierre" },
    { href: "/blog", label: "Blog" },
    { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  ] },
  { title: "Fortius", links: [
    { href: "/", label: "Inicio" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/nosotros#agentes", label: "Agentes" },
    { href: "/avisos", label: "Avisos y documentos" },
    { href: "/contacto", label: "Contacto" },
  ] },
];

type Props = { open: boolean; onClose: () => void };

/** Center of the element that opened the menu, as a clip-path origin. */
function originFrom(element: Element | null) {
  if (!(element instanceof HTMLElement) || typeof window === "undefined") return "94% 4%";
  const rect = element.getBoundingClientRect();
  if (!rect.width) return "94% 4%";
  const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
  const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
  return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
}

// Keep the existing export so all public navigation entry points share this menu.
export function FullscreenMenu({ open, onClose }: Props) {
  const pathname = usePathname() ?? "/";
  const ref = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const scrimRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const originRef = React.useRef("94% 4%");
  const timelineRef = React.useRef<gsap.core.Timeline | null>(null);
  const { settings } = usePublicFeatures();
  const contact = publicContact(settings, "Hola, quiero conversar sobre una propiedad con Fortius.");
  const directHref = contact.whatsapp || contact.messenger || contact.emailHref || "/contacto";
  const isCurrent = (href: string) => href === pathname || (href !== "/" && !href.includes("#") && !href.includes("?") && pathname.startsWith(`${href}/`));

  /* Anchors on the current page: the scroll lock is still active when the
     router tries to scroll, so close first and jump once it is released.
     A smooth scroll would be cut short by ScrollTrigger refreshes while
     images below load, so the jump is instant. */
  const followAnchor = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const [path, id] = href.split("#");
    if (!id || (path || "/") !== pathname) { onClose(); return; }
    event.preventDefault();
    onClose();
    window.history.pushState(null, "", `#${id}`);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
    }));
  };

  React.useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter(element => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    return () => {
      window.cancelAnimationFrame(frame);
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      previousFocusRef.current?.focus({ preventScroll: true });
      previousFocusRef.current = null;
    };
  }, [open, onClose]);

  /* Opening: the panel grows as a circle from the trigger and the columns rise
     one by one. Closing reverses the circle. Reduced motion shows it at once. */
  useGSAP(() => {
    const root = ref.current;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!root || !panel || !scrim) return;
    const items = root.querySelectorAll("[data-menu-item]");
    const reduce = prefersReducedMotion();
    timelineRef.current?.kill();
    const timeline = gsap.timeline();
    timelineRef.current = timeline;
    if (open) {
      originRef.current = originFrom(document.activeElement);
      const closed = `circle(0% at ${originRef.current})`;
      const full = `circle(150% at ${originRef.current})`;
      timeline.set(root, { visibility: "visible" });
      if (reduce) {
        timeline.set(panel, { clipPath: "none" }).set(scrim, { opacity: 1 }).set(items, { yPercent: 0, opacity: 1 });
      } else {
        timeline.set(items, { yPercent: 30, opacity: 0 })
          .fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0)
          .fromTo(panel, { clipPath: closed }, { clipPath: full, duration: 1.1, ease: "power3.inOut" }, 0)
          .to(items, { yPercent: 0, opacity: 1, duration: 1, stagger: 0.06, ease: "power3.out" }, 0.4)
          .set(panel, { clipPath: "none" });
      }
    } else if (getComputedStyle(root).visibility !== "hidden") {
      const closed = `circle(0% at ${originRef.current})`;
      if (reduce) {
        timeline.set(root, { visibility: "hidden" });
      } else {
        timeline.fromTo(panel, { clipPath: `circle(150% at ${originRef.current})` }, { clipPath: closed, duration: 0.8, ease: "power3.inOut" })
          .to(scrim, { opacity: 0, duration: 0.4, ease: "power2.in" }, 0.35)
          .set(root, { visibility: "hidden" });
      }
    }
    return () => { timeline.kill(); };
  }, { scope: ref, dependencies: [open] });

  return (
    <div ref={ref} className={styles.overlay} inert={!open} aria-hidden={!open}>
      <div ref={scrimRef} className={styles.scrim} aria-hidden="true" onClick={onClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Menú" className={styles.panel}>
        <header className={styles.header}>
          <BrandMark className={styles.brand} />
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar menú" className={styles.close}>
            Cerrar <X size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>
          <nav aria-label="Menú principal" className={styles.columns}>
            {COLUMNS.map((column) => (
              <section key={column.title} data-menu-item aria-label={column.title}>
                <h2 className={styles.title}>{column.title}</h2>
                <ul className={styles.list}>
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} prefetch={open ? null : false} onClick={(event) => followAnchor(event, link.href)}
                        aria-current={isCurrent(link.href) ? "page" : undefined} className={styles.link}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
          <section className={styles.aside} data-menu-item aria-label="Contacto con Fortius">
            <h2 className={styles.title}>Hablemos</h2>
            {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" onClick={onClose} className={styles.channel}>WhatsApp {contact.whatsappLabel}</a>}
            {contact.emailHref && <a href={contact.emailHref} onClick={onClose} className={styles.channel}>{contact.email}</a>}
            {contact.messenger && <a href={contact.messenger} target="_blank" rel="noopener noreferrer" onClick={onClose} className={styles.channel}>Messenger</a>}
            {contact.phoneHref && <a href={contact.phoneHref} onClick={onClose} className={styles.channel}>Teléfono {contact.phone}</a>}
            {settings?.horario?.trim() && <p className={styles.hours}>{settings.horario}</p>}
            <Link href="/opinion-de-valor" prefetch={open ? null : false} onClick={onClose} className={styles.primary}>Pide tu opinión de valor</Link>
            <Link href={directHref} prefetch={false} onClick={onClose} className={styles.direct}>Contacto directo <ArrowRight size={16} aria-hidden="true" /></Link>
            <ThemeToggle className={styles.square} />
          </section>
        </div>
      </div>
    </div>
  );
}
