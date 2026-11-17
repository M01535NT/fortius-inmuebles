"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "motion/react";

import { FullscreenMenu } from "@/components/home/fullscreen-menu";
import { SiteSearch } from "@/components/home/site-search";
import { SitioLogo } from "@/components/sitio/logo";
import { Hamburguesa, Lupa } from "@/components/sitio/iconos";
import styles from "./site-nav.module.css";

/*
  Cabecera del sitio, Fortius II (17/11/2026): logo a la izquierda y, arriba a la derecha, la lupa
  del buscador y el botón «Menú» de hamburguesa, en todos los tamaños. Sin enlaces sueltos.
  En el inicio y en Vender flota clara sobre el video; al bajar, o en cualquier otra página, toma
  el fondo del tema con una línea fina abajo.
*/
const PORTADAS_OSCURAS = new Set(["/", "/vender-propiedad"]);

export function SiteNav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuReady, setMenuReady] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);
  const closeSearch = React.useCallback(() => setSearchOpen(false), []);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24);
  });

  /* El panel /admin trae su propio shell: sin cabecera pública. */
  if (pathname.startsWith("/admin")) return null;

  const solid = !PORTADAS_OSCURAS.has(pathname) || scrolled;
  const openMenu = () => { setMenuReady(true); setMenuOpen(true); };
  const menu = menuReady ? <FullscreenMenu open={menuOpen} onClose={closeMenu} /> : null;

  return (
    <>
      <header className={`${styles.header} ${solid ? styles.solid : styles.onImage}`}>
        <div className={styles.inner}>
          <Link href="/" aria-label="Fortius Inmuebles, inicio" className={styles.logo}>
            <SitioLogo tono={solid ? "auto" : "oscuro"} />
          </Link>
          <div className={styles.end}>
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Buscar en el sitio" aria-haspopup="dialog" aria-expanded={searchOpen}
              className={styles.icon}>
              <Lupa />
            </button>
            <button type="button" onClick={openMenu} aria-label="Abrir menú" aria-haspopup="dialog" aria-expanded={menuOpen} className={styles.menu}>
              Menú <Hamburguesa />
            </button>
          </div>
        </div>
      </header>
      {/* Fuera del header: un transform crearía un containing block y rompería el position:fixed de los overlays. */}
      {menu}
      {searchOpen ? <SiteSearch onClose={closeSearch} /> : null}
    </>
  );
}
