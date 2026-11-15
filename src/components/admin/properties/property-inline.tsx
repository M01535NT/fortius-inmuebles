"use client";
import * as React from "react";
import { Pencil, Star } from "@/components/admin/icons";
import { Button } from "@/components/admin/kit";
import { AsyncButton, AsyncSelect } from "@/components/admin/ui";
import type { Undoable } from "@/components/admin/workspace/undo-notice";
import { ESTADO_LABELS, ESTADOS_POR_OPERACION, estadoValido, formatPrecio, type Property } from "@/data/propiedades";
import { montoDe } from "@/lib/admin/inmuebles-vitrina";
import { db, errorMessage, upsertPropiedad, type AdminProperty } from "@/lib/admin/store";
import s from "./properties.module.css";

/* Cambios en su lugar de un inmueble: precio, estado y destacada, cada uno con la versión del registro. */

export function PropertyStatus({ property, className }: { property: Property; className?: string }) {
  return <AsyncSelect aria-label={`Estado de ${property.titulo}`} value={property.estado}
    onChange={async value => await upsertPropiedad({ ...property, estado: value as Property["estado"] }, db.propiedades.version(property))}
    className={className ?? "min-h-11 w-full min-w-0 rounded-[10px] border border-input bg-background px-2 text-base text-foreground"}>
    {!estadoValido(property.operacion, property.estado) && <option value={property.estado} disabled>{ESTADO_LABELS[property.estado]} (no corresponde a la operación; corrígelo)</option>}
    {ESTADOS_POR_OPERACION[property.operacion].map(value => <option key={value} value={value}>{ESTADO_LABELS[value]}</option>)}
  </AsyncSelect>;
}

export function FeaturedButton({ property, className }: { property: Property; className: string }) {
  return <AsyncButton type="button" className={className} aria-pressed={property.destacada}
    aria-label={`${property.destacada ? "Quitar de destacadas" : "Marcar destacada"}: ${property.titulo}`}
    onClick={async () => await upsertPropiedad({ ...property, destacada: !property.destacada }, db.propiedades.version(property))}>
    <Star size={15} aria-hidden="true" fill={property.destacada ? "currentColor" : "none"} />{property.destacada ? "Destacada" : "Marcar destacada"}
  </AsyncButton>;
}

/*
  LV-10f · Precio en su lugar: se pulsa, se escribe y se guarda con la versión del inmueble (un 409
  abre la ventana de conflicto). «Deshacer» vuelve a guardar el precio de antes. «Valor a consulta»
  y los inmuebles de otro asesor no se cambian aquí.
*/
export function PrecioEnFila({ property: p, editable, offer, big }: { property: AdminProperty; editable: boolean; offer: (u: Undoable) => void; big?: boolean }) {
  const [texto, setTexto] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const boton = React.useRef<HTMLButtonElement>(null);
  const id = React.useId();
  const antes = p.precio;
  const cerrar = () => { setTexto(null); setError(""); requestAnimationFrame(() => boton.current?.focus()); };
  if (texto === null || antes.modalidad !== "publico") {
    const amount = <span className={s.amount} data-big={big || undefined} data-pending={antes.modalidad === "consulta" || undefined}>{formatPrecio(antes)}</span>;
    return editable && antes.modalidad === "publico"
      ? <button ref={boton} type="button" className={s.priceEdit} aria-label={`Cambiar el precio de ${p.titulo}: ${formatPrecio(antes)}`} onClick={() => setTexto(String(antes.monto))}>{amount}<Pencil size={14} aria-hidden="true" /></button>
      : amount;
  }
  const publico = antes;
  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    const monto = montoDe(texto ?? "");
    if (!monto) { setError("Escribe el precio en números, sin centavos."); return; }
    if (monto === publico.monto) { cerrar(); return; }
    setBusy(true); setError("");
    try {
      await upsertPropiedad({ ...p, precio: { ...publico, monto } }, db.propiedades.version(p));
      cerrar();
      offer({ text: `Nuevo precio de «${p.titulo}»: ${formatPrecio({ ...publico, monto })}.`, undo: async () => {
        const ahora = db.propiedades.list().find(x => x.slug === p.slug) ?? p;
        await upsertPropiedad({ ...ahora, precio: publico }, db.propiedades.version(ahora));
      } });
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }
  return <form className={s.priceForm} onSubmit={guardar} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); cerrar(); } }}>
    <label htmlFor={id} className="sr-only">Precio de {p.titulo} en {publico.moneda}</label>
    <span className={s.priceInput}><span aria-hidden="true">$</span><input id={id} inputMode="numeric" autoComplete="off" autoFocus value={texto} onChange={event => setTexto(event.target.value)} /><span aria-hidden="true">{publico.moneda}{publico.periodo === "mensual" ? " /mes" : ""}</span></span>
    <span className={s.priceActs}><Button type="submit" variant="primary" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button><Button variant="ghost" onClick={cerrar}>Cancelar</Button></span>
    {error && <p role="alert" className={s.priceError}>{error}</p>}
  </form>;
}
