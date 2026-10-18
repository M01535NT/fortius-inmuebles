"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationGroups } from "@/data/navigation";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { BrandMark } from "@/components/brand/brand-mark";
import { usePublicFeatures } from "@/components/providers/public-features-provider";
import { publicContact } from "@/lib/public-contact";
import styles from "./side-menu.module.css";

const PRIMARY = [
  { href: "/", label: "Inicio" },
  { href: "/inventario", label: "Propiedades" },
  { href: "/#metodo", label: "Método" },
  { href: "/herramientas", label: "Herramientas" },
  { href: "/blog", label: "Blog" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/avisos", label: "Avisos" },
  { href: "/contacto", label: "Contacto" },
];

type Props = { open: boolean; onClose: () => void };

// Keep the existing export so all public navigation entry points share this drawer.
export function FullscreenMenu({ open, onClose }: Props) {
  const pathname = usePathname() ?? "/";
  const [expandedGroup, setExpandedGroup] = React.useState<string | null>("Propiedades");
  const ref = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const timelineRef = React.useRef<gsap.core.Timeline | null>(null);
  const initializedRef = React.useRef(false);
  const { settings } = usePublicFeatures();
  const contact = publicContact(settings, "Hola, quiero conversar sobre una propiedad con Fortius.");
  const directHref = contact.whatsapp || contact.messenger || contact.emailHref || "/contacto";
  const isCurrent = (href: string) => href === pathname || (href !== "/" && !href.includes("#") && pathname.startsWith(`${href}/`));

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

  useGSAP(() => {
    const root = ref.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    const veil = root.querySelector("[data-menu-veil]");
    const items = root.querySelectorAll("[data-menu-item]");
    timelineRef.current?.kill();
    if (!initializedRef.current) {
      gsap.set(panel, { xPercent: 100, x: 0 });
      gsap.set(veil, { opacity: 0 });
      initializedRef.current = true;
    }
    const reduce = prefersReducedMotion();
    const timeline = gsap.timeline();
    timelineRef.current = timeline;
    if (open) {
      const fullyClosed = getComputedStyle(root).visibility === "hidden";
      gsap.set(root, { visibility: "visible" });
      timeline.to(veil, { opacity: 1, duration: reduce ? 0 : 0.3 }, 0)
        .to(panel, { xPercent: 0, duration: reduce ? 0 : 0.62, ease: "power4.out" }, 0);
      if (reduce) {
        gsap.set(items, { x: 0, opacity: 1 });
      } else {
        if (fullyClosed) gsap.set(items, { x: 18, opacity: 0 });
        timeline.to(items, {
          x: 0, opacity: 1, duration: 0.35, stagger: 0.025, ease: "power2.out",
        }, 0.16);
      }
    } else {
      timeline.to(panel, { xPercent: 100, duration: reduce ? 0 : 0.32, ease: "power3.inOut" }, 0)
        .to(veil, { opacity: 0, duration: reduce ? 0 : 0.28 }, 0)
        .set(root, { visibility: "hidden" });
    }
    return () => {
      timeline.kill();
      initializedRef.current = false;
    };
  }, { scope: ref, dependencies: [open] });

  return (
    <div ref={ref} className={styles.overlay} inert={!open} aria-hidden={!open}>
      <div className={styles.veil} data-menu-veil onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Menú" className={styles.panel}>
        <header className={styles.header}>
          <BrandMark className={styles.brand} />
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar menú" className={styles.close}>
            Cerrar <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Explora Fortius</p>
          <nav aria-label="Menú principal">
            <ol className={styles.list}>
              {PRIMARY.map((item, i) => {
                const group = navigationGroups.find(group => group.href === item.href || (group.label === "Servicios" && item.href === "/#metodo"));
                const expanded = expandedGroup === group?.label;
                return <li key={item.href} data-menu-item>
                  <div className={styles.row}>
                    <Link href={item.href} prefetch={open ? null : false} onClick={onClose}
                      aria-current={isCurrent(item.href) ? "page" : undefined} className={styles.link}>
                      {item.label}<ArrowRight size={17} strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                    {group && <button type="button" aria-label={`Desplegar ${group.label}`} aria-expanded={expanded}
                      aria-controls={`menu-group-${i}`} onClick={() => setExpandedGroup(expanded ? null : group.label)} className={styles.toggle}>
                      <ChevronDown size={16} aria-hidden="true" />
                    </button>}
                  </div>
                  {group && <ul id={`menu-group-${i}`} hidden={!expanded} className={styles.sublinks}>
                    {group.links.map(link => <li key={link.href}><Link href={link.href} prefetch={open ? null : false} onClick={onClose}>{link.label}</Link></li>)}
                  </ul>}
                </li>;
              })}
            </ol>
          </nav>
          <section className={styles.sell} data-menu-item aria-label="Servicios para propietarios">
            <h2>¿Tienes una propiedad?</h2>
            <Link href="/vender-propiedad" prefetch={open ? null : false} onClick={onClose} className={styles.cta}>Vender mi propiedad <ArrowRight size={15} aria-hidden="true" /></Link>
            <Link href="/vender-propiedad#precio-y-condiciones" prefetch={open ? null : false} onClick={onClose} className={styles.value}>Opinión de valor <ArrowRight size={14} aria-hidden="true" /></Link>
          </section>
          <section className={styles.contact} data-menu-item aria-label="Contacto con Fortius">
            <h2>Hablemos de tu próxima operación.</h2>
            <div className={styles.channels}>
              {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" onClick={onClose}>WhatsApp <ArrowRight size={14} aria-hidden="true" /></a>}
              {contact.messenger && <a href={contact.messenger} target="_blank" rel="noopener noreferrer" onClick={onClose}>Messenger <ArrowRight size={14} aria-hidden="true" /></a>}
              {contact.emailHref && <a href={contact.emailHref} onClick={onClose}>Correo <ArrowRight size={14} aria-hidden="true" /></a>}
            </div>
            {contact.phoneHref && <a href={contact.phoneHref} onClick={onClose}>{contact.phone}</a>}
            <p>Antes de prometer, revisamos.</p>
            <Link href={directHref} prefetch={false} onClick={onClose} className={styles.direct}>Contacto directo <ArrowRight size={14} aria-hidden="true" /></Link>
          </section>
        </div>
      </div>
    </div>
  );
}
