"use client";
import * as React from "react";
import type { FormatoDefinition } from "@/lib/formatos/catalog";
import { mostrarCampoAviso, validarAviso } from "@/lib/formatos/aviso";
import { inputClass, selectClass } from "./ui";

type Props = { definition: FormatoDefinition; values: Record<string, unknown>; onChange: (key: string, value: unknown) => void };
const responsableKeys = ["responsable", "domicilioResponsable", "contactoPrivacidad", "correoPrivacidad"];

export function AvisoEditor({ definition, values, onChange }: Props) {
  const businessComplete = responsableKeys.every(key => String(values[key] ?? "").trim()) && validarAviso(Object.fromEntries(responsableKeys.map(key => [key, values[key]]))).length === 0;
  const [businessOpen, setBusinessOpen] = React.useState(!businessComplete);
  function fields(keys: string[]) {
    return keys.filter(key => mostrarCampoAviso(key, values)).map(key => {
      const field = definition.fields.find(item => item.key === key)!;
      const id = `formato-${key}`;
      const help = key === "responsable" ? "Nombre de la persona o razón social que trata los datos." : key === "domicilioResponsable" ? "Calle, número, colonia, ciudad, estado y código postal." : "";
      return <div key={key} className={`text-sm ${key === "domicilioResponsable" ? "md:col-span-2" : ""}`}>
        <label htmlFor={id} className="mb-1.5 block font-medium">{field.label}</label>
        {field.type === "choice" ? <select id={id} value={String(values[key] ?? "")} onChange={event => onChange(key, event.target.value)} className={selectClass}>
          <option value="">Selecciona</option>{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : <input id={id} aria-describedby={help ? `${id}-help` : undefined} type={field.type === "date" ? "date" : key === "correoPrivacidad" ? "email" : "text"} value={String(values[key] ?? "")} onChange={event => onChange(key, event.target.value)} className={inputClass} />}
        {help && <p id={`${id}-help`} className="mt-1 text-xs text-muted-foreground">{help}</p>}
      </div>;
    });
  }
  const grid = "grid gap-4 md:grid-cols-2";
  return <div className="space-y-6">
    <section aria-labelledby="aviso-titular">
      <h3 id="aviso-titular" className="mb-3 text-lg font-semibold">Persona que recibe el aviso</h3>
      <div className={grid}>{fields(["titular", "tipoTitular", "operacion", "fechaEmision"])}</div>
      <details open={values.tipoTitular === "representante" || Boolean(String(values.representante ?? "").trim())} className="mt-4">
        <summary className="cursor-pointer py-2 text-sm font-medium">Representante, si aplica</summary>
        <div className={`mt-3 ${grid}`}>{fields(["representante", "documentoRepresentante"])}</div>
      </details>
    </section>
    <section aria-labelledby="aviso-decisiones" className="border-t border-border pt-5">
      <h3 id="aviso-decisiones" className="text-lg font-semibold">Decisiones de privacidad</h3>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">Registra la decisión del titular. Puedes descargar el aviso con decisiones pendientes para recabar su firma.</p>
      <div className={grid}>{fields(["consentimientoPatrimonial", "consentimientoPublicidad"])}</div>
      {values.consentimientoPublicidad === "si" && <div className={`mt-4 ${grid}`}>{fields(["publicidadCorreo", "publicidadTelefono", "publicidadMensajeria"])}</div>}
      <details open={["transferenciaAsesor", "transferenciaFinanciera", "transferenciaOperacion"].some(key => values[key] === "si")} className="mt-4">
        <summary className="cursor-pointer py-2 text-sm font-medium">Compartir datos con terceros</summary>
        <p className="my-2 text-xs text-muted-foreground">Una decisión pendiente no autoriza compartir datos.</p>
        <div className={grid}>{fields(["transferenciaAsesor", "asesorDestinatario", "asesorPais", "transferenciaFinanciera", "financieroDestinatario", "financieroPais", "transferenciaOperacion", "operacionDestinatario", "operacionPais"])}</div>
      </details>
      <details open={values.acuseEstado === "firmado_fuera"} className="mt-2">
        <summary className="cursor-pointer py-2 text-sm font-medium">Firma del aviso</summary>
        <p className="my-2 text-xs text-muted-foreground">El PDF incluye espacio para firmar. Generarlo no registra una firma.</p>
        <div className={grid}>{fields(["acuseEstado", "fechaAcuse", "referenciaAcuse"])}</div>
      </details>
    </section>
    <details open={businessOpen} onToggle={event => setBusinessOpen(event.currentTarget.open)} className="border-t border-border pt-4">
      <summary className="cursor-pointer py-2 text-sm font-semibold">Datos de Fortius</summary>
      {businessComplete && <p className="my-2 text-sm text-muted-foreground">{String(values.responsable)} · {String(values.correoPrivacidad)}</p>}
      <div className={`mt-3 ${grid}`}>{fields(responsableKeys)}</div>
    </details>
    <p className="text-xs text-muted-foreground">Expediente: {String(values.folio ?? "")}. Se incluirá en el PDF.</p>
  </div>;
}
