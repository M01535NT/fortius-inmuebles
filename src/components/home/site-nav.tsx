"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "motion/react";

import { FullscreenMenu } from "@/components/home/fullscreen-menu";
import { SiteSearch } from "@/components/home/site-search";
import { BrandMark } from "@/components/brand/brand-mark";
import styles from "./site-nav.module.css";

/*
  Barra pública (31/10/2026): «Buscar» a la izquierda, el logo al centro y «Menú» a la derecha,
  solo palabras en la tipografía del sitio; sin enlaces sueltos por decisión del titular.
  Blanca con línea inferior; en la portada flota sobre el video hasta que se desplaza la página.
  El buscador sugiere destinos del sitio y el menú desplegable guarda las rutas y el tema.
*/
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

  /* El panel /admin trae su propio shell: sin nav público. */
  if (pathname.startsWith("/admin")) return null;

  const solid = pathname !== "/" || scrolled;
  const openMenu = () => { setMenuReady(true); setMenuOpen(true); };
  const menu = menuReady ? <FullscreenMenu open={menuOpen} onClose={closeMenu} /> : null;

  return (
    <>
    <header className={`${styles.header} ${solid ? styles.solid : styles.onImage}`}>
      <div className={styles.inner}>
        <div className={styles.start}>
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="Abrir buscador" aria-haspopup="dialog" aria-expanded={searchOpen}
            className={styles.word}>
            Buscar
          </button>
        </div>
        <Link href="/" aria-label="Fortius Inmuebles, inicio" className={styles.logo}><BrandMark inverse={!solid} /></Link>
        <div className={styles.end}>
          <button type="button" onClick={openMenu} aria-label="Abrir menú" aria-haspopup="dialog" aria-expanded={menuOpen}
            className={styles.word}>
            Menú
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
