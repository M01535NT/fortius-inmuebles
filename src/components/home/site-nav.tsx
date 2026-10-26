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

  /* Inicio: la barra flota transparente sobre la foto de portada y, al
     desplazar, se vuelve vidrio del tema (blanco en claro, noche en oscuro). */
  if (pathname === "/") {
    const pill = scrolled
      ? "border-[#061f3f]/20 bg-[#061f3f]/5 text-[#061f3f] hover:bg-[#061f3f]/10 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
      : "border-white/20 bg-white/10 text-white hover:bg-white/20";
    return (
      <>
      <header className={"fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-700 " +
        (scrolled ? "border-b border-[#061f3f]/10 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#060c14]/75" : "")}>
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-6 px-5 md:px-8">
          <Link href="/" aria-label="Fortius Inmuebles, inicio"><BrandMark inverse={!scrolled} /></Link>
          <nav aria-label="Principal" className={"hidden items-center gap-1 rounded-full border p-1.5 backdrop-blur-xl lg:flex " +
            (scrolled ? "border-[#061f3f]/15 bg-[#061f3f]/5 dark:border-white/15 dark:bg-white/10" : "border-white/15 bg-white/10")}>
            {HOME_LINKS.map(link => <Link key={link.href} href={link.href}
              className={"rounded-full px-4 py-2 text-sm font-medium transition-colors " +
                (scrolled ? "text-[#061f3f]/80 hover:bg-[#061f3f]/10 hover:text-[#061f3f] dark:text-white/85 dark:hover:bg-white/15 dark:hover:text-white" : "text-white/85 hover:bg-white/15 hover:text-white")}>{link.label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
          <ThemeToggle className={"h-12 w-12 rounded-full backdrop-blur-xl " + pill} />
          <button type="button" onClick={openMenu} aria-label="Abrir menú" aria-haspopup="dialog" aria-expanded={menuOpen}
            className={"group inline-flex h-12 items-center gap-3 rounded-full border pl-5 pr-1.5 text-sm font-semibold backdrop-blur-xl transition-colors active:scale-[0.97] " + pill}>
            Menú
            <span aria-hidden="true" className={"flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-full transition-transform duration-500 group-hover:rotate-90 " +
              (scrolled ? "bg-[#061f3f] dark:bg-[#f5f1eb]" : "bg-[#f5f1eb]")}>
              <span className={"h-[1.5px] w-3.5 transition-transform duration-300 group-hover:translate-y-[3.25px] group-hover:rotate-45 " + (scrolled ? "bg-[#f5f1eb] dark:bg-[#061f3f]" : "bg-[#061f3f]")} />
              <span className={"h-[1.5px] w-3.5 transition-transform duration-300 group-hover:-translate-y-[3.25px] group-hover:-rotate-45 " + (scrolled ? "bg-[#f5f1eb] dark:bg-[#061f3f]" : "bg-[#061f3f]")} />
            </span>
          </button>
          </div>
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
      transition={{ duration: reduce ? 0 : 0.8, ease: [0.25, 1, 0.5, 1] }}
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
