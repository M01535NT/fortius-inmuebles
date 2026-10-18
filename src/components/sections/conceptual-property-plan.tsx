"use client";

import * as React from "react";
import * as motion from "motion/react-m";

type Segment = "residencial" | "comercial" | "industrial";

const drawings = {
  residencial: {
    label: "Esquema de vivienda",
    paths: ["M18 92V35L80 12l62 23v57Z", "M18 58h124", "M76 35v57", "M102 58v34"],
    zones: [
      { title: "Área social", text: "Luz, ventilación y relación con exteriores." },
      { title: "Descanso", text: "Recámaras, privacidad y ruido." },
      { title: "Servicios", text: "Cocina, lavado, instalaciones y mantenimiento." },
    ],
  },
  comercial: {
    label: "Esquema de espacio comercial",
    paths: ["M16 90V24h128v66Z", "M16 48h128", "M56 48v42", "M112 48v42", "M28 24v24m24-24v24m24-24v24m24-24v24m24-24v24"],
    zones: [
      { title: "Acceso y exhibición", text: "Frente, visibilidad y entrada de clientes." },
      { title: "Operación", text: "Área de trabajo, bodega y circulaciones." },
      { title: "Servicios", text: "Sanitarios, instalaciones y adecuaciones." },
    ],
  },
  industrial: {
    label: "Esquema de operación industrial",
    paths: ["M14 91V30h132v61Z", "M14 62h132", "M48 30v61", "M116 30v61", "M22 22h94l30 8", "M56 75h52"],
    zones: [
      { title: "Acceso y maniobra", text: "Entradas, patio y radios de giro." },
      { title: "Producción", text: "Altura, claros y piso según el proceso." },
      { title: "Carga y servicios", text: "Andenes, energía y conexiones." },
    ],
  },
} as const;

/* Lectura del espacio (boceto Segmento): plano esquemático en tarjeta oscura
   y zonas seleccionables; la zona activa se resalta en rosa. */
export function ConceptualPropertyPlan({ segment }: { segment: Segment }) {
  const [active, setActive] = React.useState(0);
  const drawing = drawings[segment];

  return (
    <div className="seg-plan">
      <div className="seg-plan-canvas">
        <svg viewBox="0 0 160 110" role="img" aria-label={`${drawing.label}: ${drawing.zones[active].title}`}>
          {drawing.paths.map((path, index) => (
            <motion.path key={path} d={path} fill="none" stroke={index === active + 1 ? "#e5829b" : "rgba(245,241,235,0.45)"} strokeWidth={index === active + 1 ? 2.8 : 1.4} vectorEffect="non-scaling-stroke" initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.8, delay: index * 0.08 }} />
          ))}
          <motion.circle cx={[42, 82, 124][active]} cy={[70, 43, 76][active]} r="4" fill="#e5829b" initial={{ scale: 0 }} animate={{ scale: 1 }} />
        </svg>
        <p className="seg-plan-note">Esquema conceptual para ordenar preguntas. No representa el plano ni las medidas de un inmueble real.</p>
      </div>
      <div className="seg-plan-zones" role="group" aria-label="Zonas del esquema">
        <p className="pg-eyebrow pg-eyebrow-ink">Lectura del espacio</p>
        {drawing.zones.map((zone, index) => (
          <button key={zone.title} type="button" aria-pressed={active === index} onClick={() => setActive(index)}>
            <span>{zone.title}</span><span>{zone.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
