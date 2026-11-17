"use client";
import { useId, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo, formatoMonto, montoANumero } from "@/components/panel/kit/campo";
import { Switch } from "@/components/panel/ui/switch";
import type { Property } from "@/data/propiedades";
import { diferencia, montoDe } from "@/lib/panel/datos/inmueble-extras";
import { precioCorto } from "@/lib/panel/datos/inmuebles-ficha";

/**
 * «Cambiar precio» del menú ⋯ (boceto, función 12): el nuevo precio, lo que había, la diferencia en porcentaje y,
 * si hay interesados, avisarles del cambio (se copia el texto para enviarlo y queda anotado a quién).
 */
export function CambiarPrecio({ inmueble, interesados, ocupado, alGuardar, alCancelar }: {
  inmueble: Property; interesados: number; ocupado: boolean;
  alGuardar: (monto: number, avisar: boolean) => void; alCancelar: () => void;
}) {
  const antes = montoDe(inmueble);
  const [texto, setTexto] = useState(antes ? formatoMonto(String(antes)) : "");
  const [avisar, setAvisar] = useState(true);
  const id = useId();
  const nuevo = montoANumero(texto);
  const dif = diferencia(antes, nuevo);
  return (
    <form style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); if (nuevo > 0) alGuardar(nuevo, avisar && interesados > 0); }}>
      <Campo etiqueta={inmueble.operacion === "renta" ? "Nueva renta mensual en pesos" : "Nuevo precio en pesos"} dinero inputMode="numeric" autoComplete="off" maxLength={20}
        placeholder="3,100,000" value={texto} onChange={(e) => setTexto(formatoMonto(e.target.value))} autoFocus />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14 }}>
        <span style={{ color: "var(--ink-muted)" }}>{antes ? `Antes: ${precioCorto(inmueble)}` : "Todavía no tiene precio"}</span>
        {dif ? <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: dif < 0 ? "var(--accent)" : "var(--ink)" }}>{dif > 0 ? "+" : ""}{dif} %</span> : null}
      </div>
      {interesados > 0 ? (
        <div className="fx-tarjeta">
          <div className="fx-swrow">
            <label htmlFor={id} className="fx-swrow-txt" style={{ cursor: "pointer" }}>
              <b>Avisar a {interesados === 1 ? "1 interesado" : `${interesados} interesados`} del cambio</b>
              <span>Se copia el mensaje para que lo envíes por WhatsApp</span>
            </label>
            <Switch id={id} checked={avisar} onCheckedChange={setAvisar} />
          </div>
        </div>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <Boton variante="secundario" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit" deshabilitado={ocupado || nuevo <= 0}>Guardar</Boton>
      </div>
    </form>
  );
}
