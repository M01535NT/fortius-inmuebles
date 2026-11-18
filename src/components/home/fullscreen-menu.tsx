"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Dialog } from "radix-ui";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { SitioLogo } from "@/components/sitio/logo";
import { Cruz } from "@/components/sitio/iconos";
import { InterruptorTema } from "@/components/sitio/interruptor-tema";
import { usePublicFeatures } from "@/components/providers/public-features-provider";
import { publicContact } from "@/lib/public-contact";
import styles from "./fullscreen-menu.module.css";

/* Columnas del menú (Fortius II, 17/11/2026): mismos destinos que antes; cambia solo el aspecto. */
const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  { title: "Vender", links: [
    { href: "/vender-propiedad", label: "Vender mi propiedad" },
    { href: "/opinion-de-valor", label: "Opinión de valor" },
    { href: "/herramientas/gastos-de-cierre", label: "Gastos de cierre" },
    { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  ] },
  { title: "Comprar", links: [
    { href: "/comprar-propiedad", label: "Guía para comprar" },
    { href: "/inventario?op=venta", label: "Propiedades en venta" },
    { href: "/inventario?op=renta", label: "Propiedades en renta" },
    { href: "/herramientas/hipoteca", label: "Calculadora de hipoteca" },
    { href: "/herramientas", label: "Todas las herramientas" },
  ] },
  { title: "Propiedades", links: [
    { href: "/inventario", label: "Ver todas" },
    { href: "/inventario?segmento=residencial", label: "Residencial" },
    { href: "/inventario?segmento=comercial", label: "Comercial" },
    { href: "/inventario?segmento=industrial", label: "Industrial" },
  ] },
  { title: "Fortius", links: [
    { href: "/", label: "Inicio" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/nosotros#agentes", label: "Asesores" },
    { href: "/blog", label: "Blog" },
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

/*
  La ventana es el diálogo de Radix (17/11/2026): mantiene el foco adentro, cierra con Escape,
  oculta la página de atrás al lector de pantalla, bloquea el desplazamiento del fondo (también
  en el iPhone) y devuelve el foco al botón «Menú». Sigue montada mientras corre la animación de
  cierre («presente») y se desmonta al terminar.
*/
// Keep the existing export so all public navigation entry points share this menu.
export function FullscreenMenu({ open, onClose }: Props) {
  const pathname = usePathname() ?? "/";
  // El portal de Radix pinta la ventana un render después: la animación espera a tener el nodo.
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const scrimRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const originRef = React.useRef("94% 4%");
  const timelineRef = React.useRef<gsap.core.Timeline | null>(null);
  const pendingAnchorRef = React.useRef<string | null>(null);
  const [present, setPresent] = React.useState(open);
  // Al abrir se monta en el mismo render; al cerrar espera a que termine la animación.
  if (open && !present) setPresent(true);
  const { settings } = usePublicFeatures();
  const contact = publicContact(settings, "Hola, quiero conversar sobre una propiedad con Fortius.");
  const directHref = contact.whatsapp || contact.messenger || contact.emailHref || "/contacto";
  const isCurrent = (href: string) => href === pathname || (href !== "/" && !href.includes("#") && !href.includes("?") && pathname.startsWith(`${href}/`));

  /* Anchors on the current page: the scroll lock is still active when the
     router tries to scroll, so close first and jump once the window is gone.
     A smooth scroll would be cut short by ScrollTrigger refreshes while
     images below load, so the jump is instant. */
  const followAnchor = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const [path, id] = href.split("#");
    if (!id || (path || "/") !== pathname) { onClose(); return; }
    event.preventDefault();
    window.history.pushState(null, "", `#${id}`);
    pendingAnchorRef.current = id;
    onClose();
  };

  React.useEffect(() => {
    if (present || !pendingAnchorRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      const id = pendingAnchorRef.current;
      pendingAnchorRef.current = null;
      if (id) document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [present]);

  // El círculo nace del botón que abrió el menú: se mide antes de que Radix mueva el foco.
  React.useLayoutEffect(() => {
    if (open) originRef.current = originFrom(document.activeElement);
  }, [open]);

  /* Opening: the panel grows as a circle from the trigger and the columns rise
     one by one. Closing reverses the circle. Reduced motion shows it at once. */
  useGSAP(() => {
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    if (!present || !root || !panel || !scrim) return;
    const items = root.querySelectorAll("[data-menu-item]");
    const reduce = prefersReducedMotion();
    timelineRef.current?.kill();
    const timeline = gsap.timeline();
    timelineRef.current = timeline;
    if (open) {
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
    } else if (getComputedStyle(root).visibility === "hidden" || reduce) {
      setPresent(false);
    } else {
      const closed = `circle(0% at ${originRef.current})`;
      timeline.fromTo(panel, { clipPath: `circle(150% at ${originRef.current})` }, { clipPath: closed, duration: 0.8, ease: "power3.inOut" })
        .to(scrim, { opacity: 0, duration: 0.4, ease: "power2.in" }, 0.35)
        .set(root, { visibility: "hidden" })
        .call(() => setPresent(false));
    }
    return () => { timeline.kill(); };
  }, { dependencies: [open, present, root] });

  return (
    <Dialog.Root open={present} onOpenChange={(abierto) => { if (!abierto) onClose(); }}>
      <Dialog.Portal>
        <div ref={setRoot} className={styles.overlay}>
          <Dialog.Overlay ref={scrimRef} className={styles.scrim} />
          {/* Mientras se cierra, Escape ya no hace nada: el cierre está en curso. */}
          <Dialog.Content ref={panelRef} className={styles.panel} aria-describedby={undefined}
            onOpenAutoFocus={(event) => { event.preventDefault(); closeRef.current?.focus({ preventScroll: true }); }}
            onEscapeKeyDown={(event) => { if (!open) event.preventDefault(); }}>
            <Dialog.Title className="sr-only">Menú</Dialog.Title>
            <header className={styles.header}>
              <SitioLogo className={styles.brand} />
              <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar menú" className={styles.close}>
                Cerrar <Cruz />
              </button>
            </header>
            <div className={styles.body}>
              {/* «Hablemos» va primero: en celular queda arriba, sin bajar dos pantallas (12/11/2026). */}
              <section className={styles.aside} data-menu-item aria-label="Contacto con Fortius">
                <h2 className={styles.title}>Hablemos</h2>
                {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" onClick={onClose} className={styles.channel}>WhatsApp {contact.whatsappLabel}</a>}
                {contact.emailHref && <a href={contact.emailHref} onClick={onClose} className={styles.channel}>{contact.email}</a>}
                {contact.messenger && <a href={contact.messenger} target="_blank" rel="noopener noreferrer" onClick={onClose} className={styles.channel}>Messenger</a>}
                {contact.phoneHref && <a href={contact.phoneHref} onClick={onClose} className={styles.channel}>Teléfono {contact.phone}</a>}
                {settings?.horario?.trim() && <p className={styles.hours}>{settings.horario}</p>}
                <Link href="/vender-propiedad" prefetch={open ? null : false} onClick={onClose} className={styles.primary}>Quiero vender</Link>
                <Link href={directHref} prefetch={false} onClick={onClose} className={styles.direct}>Contacto directo <ArrowRight size={16} aria-hidden="true" /></Link>
                <InterruptorTema className={styles.theme} />
              </section>
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
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
