"use client";
import * as React from "react";
import { Button } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import { errorMessage, fetchJson as json } from "@/lib/admin/store";
import { type Colonia } from "@/lib/formatos/deducir";

/*
  Código postal → colonia y municipio (CSR-03). Un campo de cinco dígitos; al buscar, las
  colonias del catálogo de Baja California aparecen como botones y la elegida se entrega al
  domicilio. Sin catálogo instalado, lo dice y la captura sigue a mano.
*/
export function CpHelper({ onPick, className }: { onPick: (colonia: Colonia) => void; className?: string }) {
  const [cp, setCp] = React.useState("");
  const [colonias, setColonias] = React.useState<Colonia[] | null>(null);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  const id = React.useId();
  async function buscar() {
    if (!/^\d{5}$/.test(cp)) { setError("Escribe los cinco dígitos del código postal."); return; }
    setBusy(true); setError(""); setColonias(null);
    try {
      const r = await json<{ catalogo: boolean; colonias: Colonia[] }>(`/api/admin/codigos-postales?cp=${cp}`);
      if (!r.catalogo) setError("El catálogo de códigos postales no está instalado en este servidor.");
      else if (!r.colonias.length) setError("Ese código postal no está en el catálogo de Baja California.");
      else setColonias(r.colonias);
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  return <div className={className}>
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-sm font-semibold" htmlFor={id}>Código postal
        <input id={id} className={`${inputClass} w-32`} inputMode="numeric" maxLength={5} value={cp} onChange={event => { setCp(event.target.value.replace(/\D/g, "")); setColonias(null); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void buscar(); } }} />
      </label>
      <Button disabled={busy} onClick={() => void buscar()}>{busy ? "Buscando…" : "Buscar colonia"}</Button>
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    {colonias && <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Colonias del código postal ${cp}`}>{colonias.map(colonia => <li key={colonia.colonia}><Button variant="secondary" onClick={() => onPick(colonia)}>{colonia.colonia} <span className="text-muted-foreground">· {colonia.municipio}</span></Button></li>)}</ul>}
  </div>;
}
