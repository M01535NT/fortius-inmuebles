"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "motion/react";

import { FullscreenMenu } from "@/components/home/fullscreen-menu";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/home/theme-toggle";

/* Una sola barra para todo el sitio: la píldora de Inicio. En la portada flota
   transparente sobre la foto; en las demás páginas, y al desplazar, toma el
   vidrio del tema (blanco en claro, noche en oscuro). El menú a pantalla
   completa conserva el resto de las rutas. */
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

  /* El panel /admin trae su propio shell: sin nav público. */
  if (pathname.startsWith("/admin")) return null;

  const solid = pathname !== "/" || scrolled;
  const openMenu = () => { setMenuReady(true); setMenuOpen(true); };
  const menu = menuReady ? <FullscreenMenu open={menuOpen} onClose={closeMenu} /> : null;
  const pill = solid
    ? "border-[#061f3f]/20 bg-[#061f3f]/5 text-[#061f3f] hover:bg-[#061f3f]/10 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
    : "border-white/20 bg-white/10 text-white hover:bg-white/20";

  return (
    <>
    <header className={"fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-700 " +
      (solid ? "border-b border-[#061f3f]/10 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#060c14]/80" : "")}>
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-6 px-5 md:px-8">
        <Link href="/" aria-label="Fortius Inmuebles, inicio"><BrandMark inverse={!solid} /></Link>
        <nav aria-label="Principal" className={"hidden items-center gap-1 rounded-full border p-1.5 backdrop-blur-xl lg:flex " +
          (solid ? "border-[#061f3f]/15 bg-[#061f3f]/5 dark:border-white/15 dark:bg-white/10" : "border-white/15 bg-white/10")}>
          {LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            return <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}
              className={"rounded-full px-4 py-2 text-sm font-medium transition-colors " + (current
                ? "bg-[#061f3f] text-[#f5f1eb] dark:bg-[#f5f1eb] dark:text-[#061f3f]"
                : solid
                  ? "text-[#061f3f]/80 hover:bg-[#061f3f]/10 hover:text-[#061f3f] dark:text-white/85 dark:hover:bg-white/15 dark:hover:text-white"
                  : "text-white/85 hover:bg-white/15 hover:text-white")}>{link.label}</Link>;
          })}
        </nav>
        <div className="flex items-center gap-2">
        <ThemeToggle className={"h-12 w-12 rounded-full backdrop-blur-xl " + pill} />
        <button type="button" onClick={openMenu} aria-label="Abrir menú" aria-haspopup="dialog" aria-expanded={menuOpen}
          className={"group inline-flex h-12 items-center gap-3 rounded-full border pl-5 pr-1.5 text-sm font-semibold backdrop-blur-xl transition-colors active:scale-[0.97] " + pill}>
          Menú
          <span aria-hidden="true" className={"flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-full transition-transform duration-500 group-hover:rotate-90 " +
            (solid ? "bg-[#061f3f] dark:bg-[#f5f1eb]" : "bg-[#f5f1eb]")}>
            <span className={"h-[1.5px] w-3.5 transition-transform duration-300 group-hover:translate-y-[3.25px] group-hover:rotate-45 " + (solid ? "bg-[#f5f1eb] dark:bg-[#061f3f]" : "bg-[#061f3f]")} />
            <span className={"h-[1.5px] w-3.5 transition-transform duration-300 group-hover:-translate-y-[3.25px] group-hover:-rotate-45 " + (solid ? "bg-[#f5f1eb] dark:bg-[#061f3f]" : "bg-[#061f3f]")} />
          </span>
        </button>
        </div>
      </div>
    </header>
    {/* Fuera del header: un transform crearía un containing block y rompería el position:fixed del overlay. */}
    {menu}
    </>
  );
}
