"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationGroups } from "@/data/navigation";
import { ArrowRight, ArrowUpRight, ChevronDown, X } from "lucide-react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { usePublicFeatures } from "@/components/providers/public-features-provider";
import { publicContact } from "@/lib/public-contact";
import styles from "./fullscreen-menu.module.css";

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
  const [expandedGroup, setExpandedGroup] = React.useState<string | null>("Propiedades");
  const ref = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const originRef = React.useRef("94% 4%");
  const timelineRef = React.useRef<gsap.core.Timeline | null>(null);
  const { settings } = usePublicFeatures();
  const contact = publicContact(settings, "Hola, quiero conversar sobre una propiedad con Fortius.");
  const directHref = contact.whatsapp || contact.messenger || contact.emailHref || "/contacto";
  const isCurrent = (href: string) => href === pathname || (href !== "/" && !href.includes("#") && pathname.startsWith(`${href}/`));

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

  /* Opening: the panel grows as a circle from the trigger and the links rise
     one by one. Closing reverses the circle. Reduced motion shows it at once. */
  useGSAP(() => {
    const root = ref.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
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
        timeline.set(panel, { clipPath: "none" }).set(items, { yPercent: 0, opacity: 1 });
      } else {
        timeline.set(items, { yPercent: 60, opacity: 0 })
          .fromTo(panel, { clipPath: closed }, { clipPath: full, duration: 0.85, ease: "power4.inOut" }, 0)
          .to(items, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.045, ease: "expo.out" }, 0.32)
          .set(panel, { clipPath: "none" });
      }
    } else if (getComputedStyle(root).visibility !== "hidden") {
      const closed = `circle(0% at ${originRef.current})`;
      if (reduce) {
        timeline.set(root, { visibility: "hidden" });
      } else {
        timeline.fromTo(panel, { clipPath: `circle(150% at ${originRef.current})` }, { clipPath: closed, duration: 0.6, ease: "power3.inOut" })
          .set(root, { visibility: "hidden" });
      }
    }
    return () => { timeline.kill(); };
  }, { scope: ref, dependencies: [open] });

  return (
    <div ref={ref} className={styles.overlay} inert={!open} aria-hidden={!open}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Menú" className={styles.panel}>
        <div className={styles.glowFrame} aria-hidden="true"><div className={styles.glow} /></div>
        <header className={styles.header}>
          <BrandMark inverse className={styles.brand} />
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar menú" className={styles.close}>
            Cerrar <span className={styles.closeIcon} aria-hidden="true"><X size={16} strokeWidth={2} /></span>
          </button>
        </header>
        <div className={styles.body}>
          <nav aria-label="Menú principal">
            <ol className={styles.list}>
              {PRIMARY.map((item, i) => {
                const group = navigationGroups.find(group => group.href === item.href || (group.label === "Servicios" && item.href === "/#metodo"));
                const expanded = expandedGroup === group?.label;
                return <li key={item.href} data-menu-item className={styles.item}>
                  <div className={styles.row}>
                    <Link href={item.href} prefetch={open ? null : false} onClick={(event) => followAnchor(event, item.href)}
                      aria-current={isCurrent(item.href) ? "page" : undefined} className={styles.link}>
                      <span className={styles.number} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                      <span className={styles.label}>{item.label}</span>
                      <ArrowUpRight size={32} strokeWidth={1.5} aria-hidden="true" className={styles.arrow} />
                    </Link>
                    {group && <button type="button" aria-label={`Desplegar ${group.label}`} aria-expanded={expanded}
                      aria-controls={`menu-group-${i}`} onClick={() => setExpandedGroup(expanded ? null : group.label)} className={styles.toggle}>
                      <ChevronDown size={18} aria-hidden="true" />
                    </button>}
                  </div>
                  {group && <ul id={`menu-group-${i}`} hidden={!expanded} className={styles.sublinks}>
                    {group.links.map(link => <li key={link.href}><Link href={link.href} prefetch={open ? null : false} onClick={(event) => followAnchor(event, link.href)}>{link.label}</Link></li>)}
                  </ul>}
                </li>;
              })}
            </ol>
          </nav>
          <div className={styles.aside}>
            <section data-menu-item aria-label="Servicios para propietarios">
              <Link href="/vender-propiedad" prefetch={open ? null : false} onClick={onClose} className={styles.sell}>
                <Image src="/hero/interior-depa.webp" alt="" fill sizes="(max-width: 899px) 100vw, 480px" />
                <span className={styles.sellScrim} aria-hidden="true" />
                <span className={styles.sellCopy}>
                  <span className={styles.sellEyebrow}>PARA PROPIETARIOS</span>
                  <span className={styles.sellTitle}>Vender mi propiedad</span>
                </span>
              </Link>
              <Link href="/vender-propiedad#precio-y-condiciones" prefetch={open ? null : false} onClick={onClose} className={styles.value}>Opinión de valor <ArrowRight size={15} aria-hidden="true" /></Link>
            </section>
            <section className={styles.contact} data-menu-item aria-label="Contacto con Fortius">
              <h2>Hablemos de tu próxima operación.</h2>
              <div className={styles.channels}>
                {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" onClick={onClose} className={styles.channel}>WhatsApp <ArrowUpRight size={16} aria-hidden="true" /></a>}
                {contact.messenger && <a href={contact.messenger} target="_blank" rel="noopener noreferrer" onClick={onClose} className={styles.channel}>Messenger <ArrowUpRight size={16} aria-hidden="true" /></a>}
                {contact.emailHref && <a href={contact.emailHref} onClick={onClose} className={styles.channel}>Correo <ArrowUpRight size={16} aria-hidden="true" /></a>}
              </div>
              <div className={styles.meta}>
                {contact.phoneHref ? <a href={contact.phoneHref} onClick={onClose}>{contact.phone}</a> : <span>Antes de prometer, revisamos.</span>}
                <ThemeToggle className="border-white/20 text-[#f5f1eb] hover:bg-white/10 hover:text-white" />
              </div>
              <Link href={directHref} prefetch={false} onClick={onClose} className={styles.direct}>Contacto directo <ArrowRight size={14} aria-hidden="true" /></Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
