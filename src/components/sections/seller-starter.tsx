"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { SELLER_START_KEY } from "@/components/sections/contact-form";

const TIPOS = [
  { label: "Casa", group: "Residencial" },
  { label: "Departamento", group: "Residencial" },
  { label: "Local u oficina", group: "Comercial" },
  { label: "Nave o terreno", group: "Industrial" },
];

/* Boceto Vender: arranque en dos preguntas; «Continuar» lleva al formulario de
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
      <div className="ss-meta"><span>Paso 1 de 2</span><span>Toma 2 minutos</span></div>
      <div className="ss-progress" aria-hidden="true"><span /></div>
      <h2 className="ss-title">¿Qué tipo de propiedad quieres vender?</h2>
      <div role="radiogroup" aria-label="Tipo de propiedad" className="ss-types">
        {TIPOS.map(option => (
          <button key={option.label} type="button" role="radio" aria-checked={tipo === option.label} onClick={() => setTipo(option.label)}>
            <span>{option.label}</span><span>{option.group}</span>
          </button>
        ))}
      </div>
      <div className="pg-field">
        <label htmlFor="ss-zona">Zona o colonia</label>
        <input id="ss-zona" value={zona} onChange={event => setZona(event.target.value)} placeholder="Ej. Playas de Tijuana" autoComplete="off" />
      </div>
      <div className="ss-foot">
        <span>Sin compromiso. No compartimos tus datos.</span>
        <button type="submit" className="pg-btn">Continuar <ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    </form>
  );
}
