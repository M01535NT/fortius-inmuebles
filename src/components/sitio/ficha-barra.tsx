"use client";

import * as React from "react";

type Props = {
  asesor?: { nombre: string; iniciales: string };
  precio: string;
  whatsapp?: string;
  /** Vendida o rentada: en lugar de visita, lleva a opciones parecidas. */
  alternativa?: { texto: string; href: string };
};

/*
  Barra flotante de la ficha: aparece al pasar el marco de fotos y se esconde
  al llegar al asesor o al pie, para no tapar el mismo botón dos veces.
*/
export function FichaBarra({ asesor, precio, whatsapp, alternativa }: Props) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const destinos = [document.getElementById("interes"), document.querySelector("footer")].filter((e): e is HTMLElement => e !== null);
    const tapados = new Set<Element>();
    let pasado = false;
    const actualizar = () => setVisible(pasado && tapados.size === 0);
    const alDesplazar = () => { pasado = window.scrollY > window.innerHeight * 0.9; actualizar(); };
    const observador = new IntersectionObserver((entradas) => {
      for (const e of entradas) { if (e.isIntersecting) tapados.add(e.target); else tapados.delete(e.target); }
      actualizar();
    });
    destinos.forEach((d) => observador.observe(d));
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => { window.removeEventListener("scroll", alDesplazar); observador.disconnect(); };
  }, []);

  function solicitar() {
    window.dispatchEvent(new Event("fortius:solicitar-visita"));
    const destino = document.getElementById("interes");
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    destino?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "center" });
  }

  return (
    <div className="fb" data-visible={visible} aria-label="Contacto del inmueble" role="region" inert={!visible}>
      {asesor && <span className="fb-avatar" aria-hidden="true">{asesor.iniciales}</span>}
      <span className="fb-texto">
        {asesor && <span className="fb-nombre">{asesor.nombre}</span>}
        <span className="fb-precio">{precio}</span>
      </span>
      {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="s-btn s-btn-contorno s-btn-chico fb-whatsapp">WhatsApp</a>}
      {alternativa
        ? <a href={alternativa.href} className="s-btn s-btn-relleno s-btn-chico">{alternativa.texto}</a>
        : <button type="button" className="s-btn s-btn-rojo s-btn-chico" onClick={solicitar}>Solicitar visita</button>}
    </div>
  );
}
