"use client";

import * as React from "react";
import { ArrowRight, Building2, Home, Store, Warehouse, type LucideIcon } from "lucide-react";
import { SELLER_START_KEY } from "@/components/sections/contact-form";

const TIPOS: { label: string; Icon: LucideIcon }[] = [
  { label: "Casa", Icon: Home },
  { label: "Departamento", Icon: Building2 },
  { label: "Local u oficina", Icon: Store },
  { label: "Nave o terreno", Icon: Warehouse },
];

/* Vender (30/10/2026): arranque en dos preguntas; «Continuar» lleva al formulario de
   evaluación con el tipo y la zona ya anotados. Nada se envía desde aquí. */
export function SellerStarter() {
  const [tipo, setTipo] = React.useState(TIPOS[0].label);
  const [zona, setZona] = React.useState("");

  function continuar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { window.sessionStorage.setItem(SELLER_START_KEY, JSON.stringify({ tipo, zona: zona.trim() })); } catch { /* sin prellenado */ }
    // El formulario ya montado adopta la selección y la página baja a él.
    window.dispatchEvent(new Event(SELLER_START_KEY));
    document.getElementById("diagnostico")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <form className="ss-card" aria-label="Cuéntanos de tu propiedad" onSubmit={continuar}>
      <p className="ss-meta"><span>Paso 1 de 2</span><span>2 minutos</span></p>
      <h2 className="ss-title">¿Qué quieres vender?</h2>
      <div role="radiogroup" aria-label="Tipo de propiedad" className="ss-types">
        {TIPOS.map(({ label, Icon }) => (
          <button key={label} type="button" role="radio" aria-checked={tipo === label} onClick={() => setTipo(label)}>
            <Icon size={24} strokeWidth={1.6} aria-hidden="true" /><span>{label}</span>
          </button>
        ))}
      </div>
      <div className="pg-field">
        <label htmlFor="ss-zona">Zona o colonia</label>
        <input id="ss-zona" value={zona} onChange={event => setZona(event.target.value)} placeholder="Ej. Playas de Tijuana" autoComplete="off" />
      </div>
      <button type="submit" className="ss-submit">Continuar <ArrowRight size={18} aria-hidden="true" /></button>
    </form>
  );
}
