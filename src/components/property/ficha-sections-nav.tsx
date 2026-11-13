"use client";

import * as React from "react";

/*
  Índice de secciones de la ficha (12/11/2026, auditoría I8): se oculta al bajar y vuelve al
  subir, para que en el teléfono no tape el contenido. El foco con teclado lo muestra siempre.
*/
export function FichaSectionsNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [hidden, setHidden] = React.useState(false);

  React.useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - last) < 8) return;
        setHidden(y > last && y > 400);
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, []);

  return (
    <nav className="fe-sections" data-hidden={hidden || undefined} aria-label="Secciones del inmueble" onFocus={() => setHidden(false)}>
      {sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
    </nav>
  );
}
