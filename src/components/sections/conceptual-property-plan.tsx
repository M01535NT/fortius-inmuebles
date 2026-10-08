"use client";

import * as React from "react";
import * as motion from "motion/react-m";

type Segment = "residencial" | "comercial" | "industrial";

const drawings = {
  residencial: {
    label: "Esquema de vivienda",
    paths: ["M18 92V35L80 12l62 23v57Z", "M18 58h124", "M76 35v57", "M102 58v34"],
    zones: ["Área social", "Descanso", "Servicios"],
  },
  comercial: {
    label: "Esquema de espacio comercial",
    paths: ["M16 90V24h128v66Z", "M16 48h128", "M56 48v42", "M112 48v42", "M28 24v24m24-24v24m24-24v24m24-24v24m24-24v24"],
    zones: ["Acceso y exhibición", "Operación", "Servicios"],
  },
  industrial: {
    label: "Esquema de operación industrial",
    paths: ["M14 91V30h132v61Z", "M14 62h132", "M48 30v61", "M116 30v61", "M22 22h94l30 8", "M56 75h52"],
    zones: ["Acceso y maniobra", "Producción", "Carga y servicios"],
  },
} as const;

export function ConceptualPropertyPlan({ segment }: { segment: Segment }) {
  const [active, setActive] = React.useState(0);
  const drawing = drawings[segment];

  return (
    <div className="grid gap-8 border-y border-border py-8 md:grid-cols-[1.15fr_0.85fr] md:items-center">
      <div className="relative min-h-64 overflow-hidden rounded-md bg-background p-6">
        <svg viewBox="0 0 160 110" role="img" aria-label={`${drawing.label}: ${drawing.zones[active]}`} className="h-full min-h-52 w-full text-foreground">
          {drawing.paths.map((path, index) => (
            <motion.path key={path} d={path} fill="none" stroke={index === active + 1 ? "var(--primary)" : "currentColor"} strokeWidth={index === active + 1 ? 2.8 : 1.4} vectorEffect="non-scaling-stroke" initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.8, delay: index * 0.08 }} />
          ))}
          <motion.circle cx={[42, 82, 124][active]} cy={[70, 43, 76][active]} r="4" fill="var(--primary)" initial={{ scale: 0 }} animate={{ scale: 1 }} />
        </svg>
      </div>
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">Lectura del espacio</p>
        <h3 className="display-soft mt-3 text-2xl text-foreground">{drawing.zones[active]}</h3>
        <div className="mt-5 flex flex-col gap-2" role="group" aria-label="Zonas del esquema">
          {drawing.zones.map((zone, index) => <button key={zone} type="button" aria-pressed={active === index} onClick={() => setActive(index)} className={`min-h-11 border-l-2 px-4 text-left text-sm transition-colors ${active === index ? "border-primary text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{zone}</button>)}
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Esquema conceptual para ordenar preguntas. No representa el plano ni las medidas de un inmueble real.</p>
      </div>
    </div>
  );
}
