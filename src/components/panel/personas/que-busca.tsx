"use client";
import { useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo, formatoMonto, montoANumero } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { TIPO_LABELS } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { queBuscaDe, type DatosQueBusca } from "@/lib/panel/datos/personas-ficha";

const BUSCA: { valor: Exclude<DatosQueBusca["operacion"], "">; etiqueta: string }[] = [
  { valor: "comprar", etiqueta: "Comprar" },
  { valor: "rentar", etiqueta: "Rentar" },
  { valor: "invertir", etiqueta: "Invertir" },
];
const OFRECE: { valor: Exclude<DatosQueBusca["operacion"], "">; etiqueta: string }[] = [
  { valor: "vender", etiqueta: "Vender" },
  { valor: "arrendar", etiqueta: "Poner en renta" },
];
const PAGO: { valor: Exclude<DatosQueBusca["formaPago"], "">; etiqueta: string }[] = [
  { valor: "contado", etiqueta: "Contado" },
  { valor: "credito", etiqueta: "Crédito" },
  { valor: "mixto", etiqueta: "Mixto" },
];
const TIPOS = Object.entries(TIPO_LABELS).map(([valor, etiqueta]) => ({ valor, etiqueta }));

/** «Anotar qué busca» / «Editar» del boceto: lo que busca (o lo que ofrece un propietario). Nada es obligatorio. */
export function HojaQueBusca({ abierta, persona, ocupado, alGuardar, alCerrar }: {
  abierta: boolean; persona: Cliente; ocupado: boolean; alGuardar: (d: DatosQueBusca) => void; alCerrar: () => void;
}) {
  const ofrece = persona.tipo === "propietario" || persona.tipo === "arrendador";
  return (
    <HojaAdaptable abierta={abierta} titulo={ofrece ? "Qué ofrece" : "Qué busca"} descripcion="Con esto se buscan coincidencias en el inventario." alCerrar={alCerrar}>
      {abierta ? <Formulario key={persona.id} persona={persona} ofrece={ofrece} ocupado={ocupado} alGuardar={alGuardar} alCerrar={alCerrar} /> : null}
    </HojaAdaptable>
  );
}

function Formulario({ persona, ofrece, ocupado, alGuardar, alCerrar }: {
  persona: Cliente; ofrece: boolean; ocupado: boolean; alGuardar: (d: DatosQueBusca) => void; alCerrar: () => void;
}) {
  const inicial = queBuscaDe(persona);
  const [d, setD] = useState<DatosQueBusca>(inicial);
  const [monto, setMonto] = useState(inicial.presupuesto !== null ? formatoMonto(String(inicial.presupuesto)) : "");
  const [recamaras, setRecamaras] = useState(inicial.recamaras !== null ? String(inicial.recamaras) : "");
  return (
    <form style={{ display: "grid", gap: 12, marginTop: 8 }} onSubmit={(e) => {
      e.preventDefault();
      const n = monto.trim() ? montoANumero(monto) : null;
      const r = recamaras.trim() ? Number.parseInt(recamaras, 10) : null;
      alGuardar({ ...d, presupuesto: n !== null && Number.isFinite(n) ? n : null, recamaras: r !== null && Number.isFinite(r) && r >= 0 ? r : null });
    }}>
      <Desplegable etiqueta={ofrece ? "Quiere" : "Busca"} valor={d.operacion} opciones={ofrece ? OFRECE : BUSCA} vacio="Sin indicar"
        alElegir={(operacion) => setD({ ...d, operacion })} />
      <Desplegable etiqueta="Tipo de inmueble" valor={d.tipoPropiedad} opciones={TIPOS} vacio="Cualquiera" alElegir={(tipoPropiedad) => setD({ ...d, tipoPropiedad })} />
      <Campo etiqueta={ofrece ? "Zona" : "Zonas"} placeholder={ofrece ? "Ej. Playas de Tijuana" : "Ej. Otay, Santa Fe"} autoComplete="off" maxLength={160}
        value={d.zona} onChange={(e) => setD({ ...d, zona: e.target.value })} />
      <Campo etiqueta={ofrece ? "Precio que espera (MXN)" : "Presupuesto hasta (MXN)"} dinero inputMode="decimal" autoComplete="off"
        value={monto} onChange={(e) => setMonto(formatoMonto(e.target.value))} />
      <Campo etiqueta={ofrece ? "Recámaras" : "Recámaras (mínimo)"} inputMode="numeric" autoComplete="off" maxLength={3}
        value={recamaras} onChange={(e) => setRecamaras(e.target.value.replace(/\D/g, ""))} />
      {ofrece ? null : <Desplegable etiqueta="Forma de pago" valor={d.formaPago} opciones={PAGO} vacio="Sin indicar" alElegir={(formaPago) => setD({ ...d, formaPago })} />}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)", gap: 8 }}>
        <Boton variante="secundario" onClick={alCerrar}>Cancelar</Boton>
        <Boton type="submit" deshabilitado={ocupado}>Guardar</Boton>
      </div>
    </form>
  );
}
