"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, X } from "lucide-react";

import { EASE_OUT, gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { BrandMark } from "@/components/brand/brand-mark";

/*
  Menú a pantalla completa. Se revela con un clip-path circular que nace
  en la esquina superior derecha (donde vive el botón de menú) y se
  expande hasta cubrir el viewport. Enlaces display grandes a la
  izquierda; panel de imagen a la derecha que cambia con el hover.
*/
const PRIMARY = [
  { href: "/", label: "Inicio", image: "/hero/casa-playa.webp" },
  { href: "/inventario", label: "Propiedades", image: "/hero/edificio-ciudad.webp" },
  { href: "/#metodo", label: "Método", image: "/hero/interior-depa.webp" },
  { href: "/herramientas", label: "Herramientas", image: "/hero/plaza.webp" },
  { href: "/blog", label: "Mercado inmobiliario", image: "/hero/interior-plaza.webp" },
  { href: "/contacto", label: "Contacto", image: "/hero/nave-tijuana.webp" },
];

/* El círculo nace donde está el botón de menú (esquina superior derecha). */
const CLIP_CLOSED = "circle(0px at calc(100% - 52px) 32px)";
const CLIP_OPEN = "circle(150% at calc(100% - 52px) 32px)";

type Props = { open: boolean; onClose: () => void };

export function FullscreenMenu({ open, onClose }: Props) {
  const pathname = usePathname() ?? "/";
  const ref = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const [active, setActive] = React.useState(0);
  const isCurrent = (href: string) => href === pathname || (href !== "/" && !href.includes("#") && pathname.startsWith(`${href}/`));

  /* Bloqueo de scroll + Escape mientras el menú está abierto. */
  React.useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        ref.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    // The reveal hook removes `visibility:hidden` during the same commit.
    // Defer focus one frame so real browsers can focus the now-visible control.
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [open, onClose]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const reduce = prefersReducedMotion();
      gsap.killTweensOf([el, ...el.querySelectorAll("[data-menu-item], [data-menu-panel]")]);

      if (open) {
        const tl = gsap.timeline();
        tl.set(el, { visibility: "visible" });
        if (reduce) {
          tl.set(el, { clipPath: CLIP_OPEN });
          tl.set("[data-menu-item], [data-menu-panel]", { clearProps: "all" });
          return;
        }
        tl.to(el, { clipPath: CLIP_OPEN, duration: 0.75, ease: "power3.inOut" })
          .fromTo(
            "[data-menu-item]",
            { y: 70, rotation: 3, opacity: 0 },
            {
              y: 0,
              rotation: 0,
              opacity: 1,
              duration: 0.7,
              ease: EASE_OUT,
              stagger: 0.055,
              transformOrigin: "0% 100%",
            },
            "-=0.3",
          )
          .fromTo(
            "[data-menu-panel]",
            { scale: 1.06, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.8, ease: EASE_OUT },
            "<0.1",
          );
      } else {
        gsap
          .timeline()
          .to(el, {
            clipPath: CLIP_CLOSED,
            duration: reduce ? 0 : 0.55,
            ease: "power3.inOut",
          })
          .set(el, { visibility: "hidden" });
      }
    },
    { scope: ref, dependencies: [open] },
  );

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Menú"
      style={{ clipPath: CLIP_CLOSED }}
      className="invisible fixed inset-0 z-50 overflow-y-auto scroll-pt-20 bg-background"
    >
      {/* Cabecera del overlay: marca + cerrar en el mismo punto del botón. */}
      <div className="sticky top-0 z-10 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-8">
          <BrandMark />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.97]"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="mx-auto grid min-h-[calc(100dvh-64px)] max-w-[1280px] items-center px-5 py-8 md:px-8 md:py-12">
        <div className="grid min-h-0 items-center gap-10 lg:grid-cols-12">
          {/* Enlaces principales */}
          <nav aria-label="Menú principal" className="lg:col-span-7">
            <ol>
              {PRIMARY.map((item, i) => (
                <li key={item.href} data-menu-item onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>
                  <Link
                    href={item.href}
                    prefetch={open ? null : false}
                    onClick={onClose}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    className="group flex items-baseline gap-4 border-b border-border py-2.5 md:py-3.5 aria-[current=page]:border-primary"
                  >
                    <span className="font-mono text-xs text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="display-title text-[clamp(1.875rem,6.5vw,3.5rem)] text-foreground/85 transition-colors duration-300 group-hover:text-foreground">
                      {item.label}
                    </span>
                    <ArrowUpRight
                      className="ml-auto size-5 self-center text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                      strokeWidth={1.5}
                    />
                  </Link>
                </li>
              ))}
            </ol>

          </nav>

          {/* Panel de imagen: cambia con el hover de los enlaces. */}
          <div
            data-menu-panel
            className="relative hidden h-[min(52dvh,520px)] overflow-hidden rounded-lg border border-border lg:col-span-5 lg:block"
            aria-hidden="true"
          >
            {PRIMARY.map((item, i) => (
              <Image
                key={item.image}
                src={item.image}
                alt=""
                fill
                sizes="(max-width: 1024px) 0px, 40vw"
                className={
                  "object-cover transition-opacity duration-500" +
                  (i === active ? " opacity-100" : " opacity-0")
                }
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
