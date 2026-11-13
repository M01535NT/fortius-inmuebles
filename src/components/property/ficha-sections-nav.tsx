"use client";

import * as React from "react";

/*
  Índice de secciones de la ficha (12/11/2026, auditoría I8): se oculta al bajar y vuelve al
  subir, para que en el teléfono no tape el contenido. El foco con teclado lo muestra siempre.
  Solo se oculta cuando ya va pegado arriba (position: sticky): mientras sigue en su lugar,
  debajo de las cifras, ocultarlo dejaba un hueco en blanco en fichas con galería alta (13/11/2026).
*/
export function shouldHideSections({ y, last, navTop, stickyTop }: { y: number; last: number; navTop: number; stickyTop: number }) {
  const pinned = navTop <= stickyTop + 2;
  return pinned && y > last && y > 400;
}

export function FichaSectionsNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [hidden, setHidden] = React.useState(false);
  const nav = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - last) < 8) return;
        const element = nav.current;
        if (element) {
          // El top pegado sale del CSS (72 px hoy); oculto, el desplazamiento solo lo sube más.
          const stickyTop = Number.parseFloat(getComputedStyle(element).top) || 0;
          setHidden(shouldHideSections({ y, last, navTop: element.getBoundingClientRect().top, stickyTop }));
        }
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, []);

  return (
    <nav ref={nav} className="fe-sections" data-hidden={hidden || undefined} aria-label="Secciones del inmueble" onFocus={() => setHidden(false)}>
      {sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
    </nav>
  );
}
