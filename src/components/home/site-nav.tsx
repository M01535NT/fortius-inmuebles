"use client";

import * as React from "react";
import Link from "next/link";
import * as motion from "motion/react-m";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "motion/react";

import { NavDropdown } from "@/components/navigation/nav-dropdown";
import { navigationGroups } from "@/data/navigation";
import { FullscreenMenu } from "@/components/home/fullscreen-menu";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";

/* Inicio (dirección Nocturno): enlaces directos en una píldora de vidrio. */
const HOME_LINKS = [
  { href: "/inventario", label: "Propiedades" },
  { href: "/vender-propiedad", label: "Vender" },
  { href: "/#metodo", label: "Método" },
  { href: "/herramientas", label: "Herramientas" },
  { href: "/blog", label: "Blog" },
  { href: "/nosotros", label: "Nosotros" },
];

export function SiteNav() {
  const reduce = useReducedMotionSafe();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuReady, setMenuReady] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24);
  });

  /* El panel /admin trae su propio shell: sin nav público. */
  if (pathname.startsWith("/admin")) return null;

  const openMenu = () => { setOpenGroup(null); setMenuReady(true); setMenuOpen(true); };
  const menu = menuReady ? <FullscreenMenu open={menuOpen} onClose={closeMenu} /> : null;

  /* Inicio es nocturno en ambos temas: la barra flota transparente sobre la
     foto y, al desplazar, se vuelve vidrio oscuro. */
  if (pathname === "/") {
    return (
      <>
      <header className={"fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 " +
        (scrolled ? "border-b border-white/10 bg-[#060c14]/75 backdrop-blur-xl" : "border-b border-transparent")}>
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-6 px-5 md:px-8">
          <Link href="/" aria-label="Fortius Inmuebles, inicio"><BrandMark inverse /></Link>
          <nav aria-label="Principal" className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1.5 backdrop-blur-xl lg:flex">
            {HOME_LINKS.map(link => <Link key={link.href} href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/15 hover:text-white">{link.label}</Link>)}
          </nav>
          <button type="button" onClick={openMenu} aria-label="Abrir menú" aria-haspopup="dialog" aria-expanded={menuOpen}
            className="group inline-flex h-12 items-center gap-3 rounded-full border border-white/20 bg-white/10 pl-5 pr-1.5 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/20 active:scale-[0.97]">
            Menú
            <span aria-hidden="true" className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-full bg-[#f5f1eb] transition-transform duration-500 group-hover:rotate-90">
              <span className="h-[1.5px] w-3.5 bg-[#061f3f] transition-transform duration-300 group-hover:translate-y-[3.25px] group-hover:rotate-45" />
              <span className="h-[1.5px] w-3.5 bg-[#061f3f] transition-transform duration-300 group-hover:-translate-y-[3.25px] group-hover:-rotate-45" />
            </span>
          </button>
        </div>
      </header>
      {menu}
      </>
    );
  }

  const linkClass = "text-foreground/75 hover:text-foreground";

  return (
    <>
    <motion.header
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md transition-colors duration-300"
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 md:px-8">
        <Link href="/" aria-label="Fortius Inmuebles, inicio"><BrandMark /></Link>

        <nav className="hidden items-center gap-3 lg:flex xl:gap-6" aria-label="Principal">
          {navigationGroups.map(group => <NavDropdown key={group.label} group={group} current={pathname === group.href || (group.label === "Recursos" && pathname.startsWith("/blog"))} open={openGroup === group.label} onOpen={() => setOpenGroup(group.label)} onClose={() => setOpenGroup(null)} className={"text-sm font-medium transition-colors " + linkClass} />)}
          <Link href="/contacto" className={"nav-contact-link text-sm font-medium " + linkClass}>Contacto</Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <button
            type="button"
            onClick={openMenu}
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className="group inline-flex h-11 items-center gap-2.5 rounded-md border border-border px-3.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground active:scale-[0.97]"
          >
            Menú
            {/* Indicador de menú. */}
            <span aria-hidden="true" className="flex flex-col gap-[5px]">
              <span className="h-px w-5 bg-current transition-transform duration-300 group-hover:scale-x-75" />
              <span className="h-px w-5 bg-current transition-transform duration-300 group-hover:scale-x-125" />
            </span>
          </button>
        </div>
      </div>
    </motion.header>

    {/* Fuera del header: su transform crearía un containing block y
        rompería el position:fixed del overlay. */}
    {menu}
    </>
  );
}
