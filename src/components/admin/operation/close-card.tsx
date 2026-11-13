"use client";
import * as React from "react";
import { Button, Card, Pill } from "@/components/admin/kit";
import { selectClass } from "@/components/admin/ui";
import { db, upsertPropiedad, useCollection } from "@/lib/admin/store";
import { commissionSplit, type OperationClose, type OperationWorkflow } from "@/lib/formatos/operation-workflow";
import { calcularIntermediacion } from "@/lib/formatos/intermediacion";
import { flowOf, type OperationRecord } from "@/lib/admin/operation-view";
import { saveError } from "./use-operation";

/*
  Cierre de la operación (COR-22, RP-99). Registra quién captó y quién vendió (cualquier asesor del
  equipo puede vender) y estima el reparto: 25 % y 25 %, o 50 % si es el mismo asesor, sobre la
  comisión del contrato de intermediación. Es una estimación hasta que se cobre. Propone marcar el
  inmueble como vendido o rentado, y dejarlo en el sitio como vendido o retirarlo.
*/

type Save = (changes: { flujo?: OperationWorkflow }) => Promise<unknown>;
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const ROLE = { capto: "captó", vendio: "vendió", ambos: "captó y vendió" } as const;

export function CloseCard({ op, intermediacion, disabled, onSave, className }: {
  op: OperationRecord; intermediacion?: { data: Record<string, unknown>; version: number }; disabled: boolean; onSave: Save; className?: string;
}) {
  const advisers = useCollection(db.asesores), properties = useCollection(db.propiedades);
  const flow = flowOf(op), cierre = flow.cierre;
  const property = properties.find(p => p.slug === op.propiedad_slug);
  const rent = op.operacion === "renta" || flow.ruta === "arrendador";
  const [capto, setCapto] = React.useState(cierre?.capto ?? op.asesor_id);
  const [vendio, setVendio] = React.useState(cierre?.vendio ?? op.asesor_id);
  const [keep, setKeep] = React.useState(true);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const lock = disabled || busy;

  // La comisión estimada sale del contrato de intermediación (09): porcentaje sobre el precio sin IVA.
  const calc = intermediacion ? calcularIntermediacion(intermediacion.data) : null;
  const comision = calc && calc.comision !== null ? calc.comision : undefined;
  const draft: OperationClose = { capto, vendio, ...(comision !== undefined ? { comisionEstimada: comision, fuente: `Contrato de intermediación · versión ${intermediacion!.version}` } : {}) };
  const shown = cierre ?? draft;
  const changed = !cierre || cierre.capto !== capto || cierre.vendio !== vendio || cierre.comisionEstimada !== draft.comisionEstimada;
  const name = (id: string) => advisers.find(a => a.id === id)?.nombre ?? "Asesor sin nombre";
  const team = advisers.filter(a => a.activo !== false || a.id === capto || a.id === vendio);

  async function run(task: () => Promise<unknown>, done: string) {
    setBusy(true); setError(""); setNotice("");
    try { await task(); setNotice(done); } catch (cause) { setError(saveError(cause)); } finally { setBusy(false); }
  }
  const sold = rent ? "rentada" : "vendida", soldText = rent ? "rentado" : "vendido";
  const marked = property?.estado === "vendida" || property?.estado === "rentada";

  return <Card id="cierre-operacion" className={`flex flex-col gap-4 p-5 ${className ?? ""}`} aria-labelledby="cierre-titulo">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="cierre-titulo" className="m-0 text-base">Cierre de la operación</h2>
      <Pill tone={cierre ? "success" : "warn"}>{cierre ? "Registrado" : "Falta registrar"}</Pill>
    </div>

    <form className="grid gap-3 sm:grid-cols-2" aria-label="Quién captó y quién vendió" onSubmit={e => { e.preventDefault(); if (!lock && changed) void run(() => onSave({ flujo: { ...flow, cierre: draft } }), "Listo: quedó registrado quién captó y quién vendió."); }}>
      <label className="text-sm">Asesor que captó<select className={selectClass} value={capto} disabled={lock} onChange={e => setCapto(e.target.value)}>
        {team.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
      </select></label>
      <label className="text-sm">Asesor que {rent ? "rentó" : "vendió"}<select className={selectClass} value={vendio} disabled={lock} onChange={e => setVendio(e.target.value)}>
        {team.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
      </select></label>
      <div className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-semibold">Reparto estimado de la comisión</span>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {commissionSplit(changed ? draft : shown).map(part => <li key={part.asesorId} className="flex flex-wrap justify-between gap-2">
            <span>{name(part.asesorId)} · {part.papel === "ambos" ? ROLE.ambos : part.papel === "capto" ? ROLE.capto : rent ? "rentó" : ROLE.vendio}</span>
            <span className="tabular-nums">{part.porcentaje} %{part.monto !== undefined ? ` · ${money.format(part.monto)}` : ""}</span>
          </li>)}
        </ul>
        <span className="text-muted-foreground">{(changed ? draft : shown).comisionEstimada !== undefined
          ? `Estimado sobre la comisión de ${money.format((changed ? draft : shown).comisionEstimada!)} del contrato de intermediación. Cambia si se cobra otra cantidad.`
          : "Sin monto: el contrato de intermediación todavía no tiene precio y comisión completos."}</span>
      </div>
      <span className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" disabled={lock || !changed}>{cierre ? "Guardar cambios" : "Registrar quién captó y quién vendió"}</Button></span>
    </form>

    {property && <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
      <h3 className="m-0 text-sm font-semibold">El inmueble</h3>
      {marked
        ? <>
          <p className="m-0 text-sm">Está marcado como «{property.estado === "rentada" ? "Rentada" : "Vendida"}» y {property.publicada ? "se ve en el sitio como tal." : "no está en el sitio."}</p>
          {property.publicada && <span><Button disabled={lock} onClick={() => void run(() => upsertPropiedad({ ...property, publicada: false }, db.propiedades.version(property)), "El inmueble salió del sitio.")}>Retirarlo del sitio</Button></span>}
        </>
        : <>
          <p className="m-0 text-sm text-muted-foreground">Al cerrar, márcalo como {soldText}. Así sale de las búsquedas de disponibles.</p>
          {property.publicada && <fieldset className="flex flex-col gap-2" disabled={lock}>
            <legend className="sr-only">¿Qué pasa con el anuncio?</legend>
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" className="size-5" name="anuncio" checked={keep} onChange={() => setKeep(true)} />Dejarlo en el sitio como {soldText}</label>
            <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" className="size-5" name="anuncio" checked={!keep} onChange={() => setKeep(false)} />Retirarlo del sitio</label>
          </fieldset>}
          <span><Button disabled={lock} onClick={() => void run(() => upsertPropiedad({ ...property, estado: sold, publicada: property.publicada && keep }, db.propiedades.version(property)), `Listo: el inmueble quedó como «${rent ? "Rentada" : "Vendida"}».`)}>Marcar el inmueble como {soldText}</Button></span>
        </>}
    </div>}

    {notice && <p role="status" className="m-0 text-sm text-muted-foreground">{notice}</p>}
    {error && <p role="alert" className="m-0 text-sm text-destructive">{error}</p>}
  </Card>;
}
