"use client";

import * as React from "react";
import Image from "next/image";

const ZONAS = [
  { nombre: "Tijuana", texto: "Playas, Zona Río, Otay y Chapultepec", foto: "/hero/ciudad-tijuana.webp" },
  { nombre: "Rosarito", texto: "Costa y zona residencial", foto: "/hero/ciudad-rosarito.webp" },
  { nombre: "Tecate", texto: "Residencial e industrial", foto: "/hero/ciudad-tecate.webp" },
  { nombre: "Ensenada", texto: "Residencial", foto: "/hero/ciudad-ensenada.webp" },
];

/* Zonas (17/11/2026): cada ciudad se abre al pasar el cursor, enfocarla o tocarla. */
export function Zonas() {
  const [abierta, setAbierta] = React.useState(0);
  return (
    <section className="s-contenedor zo" aria-labelledby="zo-titulo">
      <h2 id="zo-titulo" className="s-h2 zo-titulo">De Tijuana a Ensenada</h2>
      <div className="zo-fila" role="group" aria-labelledby="zo-titulo">
        {ZONAS.map((z, i) => (
          <button key={z.nombre} type="button" className="zo-ciudad" aria-pressed={i === abierta}
            onMouseEnter={() => setAbierta(i)} onFocus={() => setAbierta(i)} onClick={() => setAbierta(i)}>
            <Image src={z.foto} alt="" fill sizes="(max-width: 767px) 100vw, 60vw" />
            <span className="zo-velo" aria-hidden="true" />
            <span className="zo-texto">
              <span className="zo-nombre">{z.nombre}</span>
              <span className="zo-detalle">{z.texto}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
