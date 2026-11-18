"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { FlechaDerecha } from "@/components/sitio/iconos";
import { VideoFondo } from "@/components/sitio/video-fondo";

type Asunto = {
  id: string;
  palabra: string;
  texto: string;
  cta: string;
  href: string;
  /** Lo que se escribe en «¿Qué necesitas?» cuando el botón lleva al cierre. */
  frase?: string;
  fondo: { webm?: string; mp4: string; poster: string } | { foto: string };
};

const ASUNTOS: Asunto[] = [
  { id: "vender", palabra: "Vender", texto: "Revisamos papeles y precio antes de anunciar.", cta: "Quiero vender", href: "/vender-propiedad",
    fondo: { webm: "/hero/asunto-casa.webm", mp4: "/hero/asunto-casa.mp4", poster: "/hero/asunto-casa-poster.webp" } },
  { id: "comprar", palabra: "Comprar", texto: "Buscamos dentro de tu presupuesto y revisamos papeles antes de ofertar.", cta: "Ver propiedades", href: "/inventario?op=venta",
    fondo: { mp4: "/hero/comprar.mp4", poster: "/hero/comprar-poster.webp" } },
  { id: "rentar", palabra: "Rentar", texto: "Publicamos tu inmueble o te buscamos uno, con contrato revisado.", cta: "Ver rentas", href: "/inventario?op=renta",
    fondo: { webm: "/hero/asunto-plaza.webm", mp4: "/hero/asunto-plaza.mp4", poster: "/hero/asunto-plaza-poster.webp" } },
  { id: "valor", palabra: "Saber cuánto vale", texto: "Una opinión de valor por escrito, con las propiedades con que se comparó.", cta: "Pedir opinión de valor", href: "/opinion-de-valor",
    fondo: { foto: "/hero/etapa-02-precio.webp" } },
  { id: "papeles", palabra: "Poner papeles en orden", texto: "Escritura, adeudos o una hipoteca por cancelar: te decimos qué falta y qué sigue.", cta: "Revisar mis papeles", href: "#cuentanos",
    frase: "Quiero poner en orden los papeles de mi propiedad", fondo: { foto: "/hero/etapa-01-revisamos.webp" } },
  { id: "otro", palabra: "Otro asunto", texto: "Cuéntanos qué necesitas y te decimos cómo podemos ayudarte.", cta: "Contar mi asunto", href: "#cuentanos",
    fondo: { foto: "/hero/ciudad-tijuana.webp" } },
];

/*
  Portada por asuntos (17/11/2026): «¿Qué te trae por aquí?» y los asuntos en letra grande.
  Al pasar el cursor, enfocar o tocar uno cambian el fondo, el texto y el botón. Los asuntos
  que no llevan a otra página bajan al cierre «Cuéntanos tu asunto» con la frase ya escrita.
*/
export function PortadaAsuntos({ whatsapp }: { whatsapp?: string }) {
  const [elegido, setElegido] = React.useState("vender");
  const activo = ASUNTOS.find((a) => a.id === elegido) ?? ASUNTOS[0];

  function alPulsarCta() {
    if (!activo.href.startsWith("#")) return;
    window.dispatchEvent(new CustomEvent("fortius:asunto", { detail: activo.frase ?? "" }));
  }

  return (
    <section className="s-banda-media pa" aria-labelledby="pa-pregunta">
      <div className="pa-fondos" aria-hidden="true">
        {ASUNTOS.map((a) => (
          <span key={a.id} className="pa-fondo" data-activo={a.id === elegido}>
            {"foto" in a.fondo
              ? <Image src={a.fondo.foto} alt="" fill sizes="100vw" />
              : <VideoFondo webm={a.fondo.webm} mp4={a.fondo.mp4} poster={a.fondo.poster} activo={a.id === elegido} />}
          </span>
        ))}
        <span className="pa-velo" />
      </div>

      <div className="s-contenedor pa-cuerpo">
        <div className="pa-asuntos">
          <h1 id="pa-pregunta" className="pa-pregunta">¿Qué te trae por aquí?</h1>
          <div className="pa-lista" role="group" aria-labelledby="pa-pregunta">
            {ASUNTOS.map((a) => (
              <button key={a.id} type="button" className="pa-asunto" aria-pressed={a.id === elegido}
                onMouseEnter={() => setElegido(a.id)} onFocus={() => setElegido(a.id)} onClick={() => setElegido(a.id)}>
                <span className="pa-raya" aria-hidden="true" />
                <span>{a.palabra}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pa-lado">
          <p className="pa-texto" aria-live="polite">{activo.texto}</p>
          <div className="pa-acciones">
            <Link href={activo.href} onClick={alPulsarCta} className="s-btn s-btn-relleno s-btn-grande">{activo.cta}<FlechaDerecha /></Link>
            {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="pa-whatsapp">o escribe por WhatsApp</a>}
          </div>
          <p className="pa-ciudades">Tijuana · Rosarito · Tecate · Ensenada</p>
        </div>
      </div>
    </section>
  );
}
