"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "motion/react";

import { FullscreenMenu } from "@/components/home/fullscreen-menu";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/home/theme-toggle";

/* Una sola barra para todo el sitio: la píldora de Inicio. En la portada
   flota sobre la foto; en las demás páginas queda sólida para leerse sobre
   el contenido claro. El menú a pantalla completa conserva el resto de rutas. */
const LINKS = [
  { href: "/inventario", label: "Propiedades" },
  { href: "/vender-propiedad", label: "Vender" },
  { href: "/#metodo", label: "Método" },
  { href: "/herramientas", label: "Herramientas" },
  { href: "/blog", label: "Blog" },
  { href: "/nosotros", label: "Nosotros" },
];

function isCurrent(pathname: string, href: string) {
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuReady, setMenuReady] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24);
  });

  if (pathname.startsWith("/admin")) return null;

  const onHome = pathname === "/";
  const solid = !onHome || scrolled;
  const openMenu = () => { setMenuReady(true); setMenuOpen(true); };
  const menu = menuReady ? <FullscreenMenu open={menuOpen} onClose={closeMenu} /> : null;

  return (
    <>
      <header className={"fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 " +
        (solid ? "border-b border-white/10 bg-[#060c14]/88 backdrop-blur-xl" : "border-b border-transparent")}>
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-6 px-5 md:px-8">
          <Link href="/" aria-label="Fortius Inmuebles, inicio"><BrandMark inverse /></Link>
          <nav aria-label="Principal" className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1.5 backdrop-blur-xl lg:flex">
            {LINKS.map((link) => {
              const current = isCurrent(pathname, link.href);
              return <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}
                className={"rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                  (current ? "bg-[#f5f1eb] text-[#061f3f]" : "text-white/85 hover:bg-white/15 hover:text-white")}>{link.label}</Link>;
            })}
          </nav>
          <div className="flex items-center gap-2">
            {!onHome && <ThemeToggle className="rounded-full border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white" />}
            <button type="button" onClick={openMenu} aria-label="Abrir menú" aria-haspopup="dialog" aria-expanded={menuOpen}
              className="group inline-flex h-12 items-center gap-3 rounded-full border border-white/20 bg-white/10 pl-5 pr-1.5 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/20 active:scale-[0.97]">
              Menú
              <span aria-hidden="true" className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-full bg-[#f5f1eb] transition-transform duration-500 group-hover:rotate-90">
                <span className="h-[1.5px] w-3.5 bg-[#061f3f] transition-transform duration-300 group-hover:translate-y-[3.25px] group-hover:rotate-45" />
                <span className="h-[1.5px] w-3.5 bg-[#061f3f] transition-transform duration-300 group-hover:-translate-y-[3.25px] group-hover:-rotate-45" />
              </span>
            </button>
          </div>
        </div>
      </header>
      {menu}
    </>
  );
}
