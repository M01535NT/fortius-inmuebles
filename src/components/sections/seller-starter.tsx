"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Building2, Home, Store, Warehouse, type LucideIcon } from "lucide-react";
import { ContactForm, SELLER_START_KEY } from "@/components/sections/contact-form";
import { MessagingContact } from "@/components/contact/messaging-actions";
import { usePublicFeatures } from "@/components/providers/public-features-provider";

const TIPOS: { label: string; Icon: LucideIcon }[] = [
  { label: "Casa", Icon: Home },
  { label: "Departamento", Icon: Building2 },
  { label: "Local u oficina", Icon: Store },
  { label: "Nave o terreno", Icon: Warehouse },
];

/*
  Vender (12/11/2026, decisión del titular): el asistente es el único formulario de la página.
  Paso 1: tipo y zona. Paso 2: nombre y teléfono, con lo anterior ya anotado, y termina en
  «Agendar entrevista». Sin captación pública activa, el paso 2 ofrece WhatsApp y teléfono.
*/
export function SellerStarter() {
  const { publicLeadsEnabled } = usePublicFeatures();
  const [paso, setPaso] = React.useState<1 | 2>(1);
  const [tipo, setTipo] = React.useState(TIPOS[0].label);
  const [zona, setZona] = React.useState("");
  const pasoDos = React.useRef<HTMLHeadingElement>(null);
  const pasoUno = React.useRef<HTMLHeadingElement>(null);
  const movido = React.useRef(false);

  React.useEffect(() => {
    if (!movido.current) return;
    (paso === 2 ? pasoDos : pasoUno).current?.focus();
  }, [paso]);

  function continuar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // El formulario del paso 2 lee la selección al montarse.
    try { window.sessionStorage.setItem(SELLER_START_KEY, JSON.stringify({ tipo, zona: zona.trim() })); } catch { /* sin prellenado */ }
    movido.current = true;
    setPaso(2);
  }

  return (
    <div id="entrevista" className="ss-card">
      {paso === 1 ? (
        <form className="ss-step" aria-label="Cuéntanos de tu propiedad" onSubmit={continuar}>
          <p className="ss-meta"><span>Paso 1 de 2</span><span>2 minutos</span></p>
          <h2 ref={pasoUno} tabIndex={-1} className="ss-title">¿Qué quieres vender?</h2>
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
      ) : (
        <div className="ss-step">
          <p className="ss-meta">
            <span>Paso 2 de 2</span>
            <button type="button" className="ss-back" onClick={() => setPaso(1)}><ArrowLeft size={16} aria-hidden="true" />Volver</button>
          </p>
          <h2 ref={pasoDos} tabIndex={-1} className="ss-title">¿Cómo te contactamos?</h2>
          {publicLeadsEnabled
            ? <ContactForm submitLabel="Agendar entrevista" />
            : <MessagingContact title="Agenda por WhatsApp o teléfono." />}
        </div>
      )}
    </div>
  );
}
