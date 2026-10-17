"use client";
import * as React from "react";
import { Button } from "@/components/admin/kit";
import { inputClass, selectClass } from "@/components/admin/ui";
import { errorMessage, fetchJson as json } from "@/lib/admin/store";

/*
  Fotografías y croquis privados de un borrador (levantamientos 04 y opinión 07):
  subir con su fuente y fecha, y elegir la fotografía principal y el croquis del PDF.
  Misma API que la pestaña Documentos.
*/

export type Adjunto = { id: string; kind: "foto" | "croquis" | "soporte"; caption: string; source: string; observed_on: string | null };
export const WITH_IMAGES = ["04A", "04B", "04C", "04D", "04E", "04F", "04G", "07"];

export function FormatoImages({ documentId, values, onChange, disabled }: { documentId: string; values: Record<string, unknown>; onChange: (key: string, value: string) => void; disabled: boolean }) {
  const [adjuntos, setAdjuntos] = React.useState<Adjunto[] | null>(null);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  React.useEffect(() => {
    let alive = true;
    json<{ adjuntos: Adjunto[] }>(`/api/admin/formatos/${documentId}/adjuntos`).then(r => { if (alive) setAdjuntos(r.adjuntos); }).catch(cause => { if (alive) { setAdjuntos([]); setError(errorMessage(cause)); } });
    return () => { alive = false; };
  }, [documentId]);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget; event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await json<{ adjunto: Adjunto }>(`/api/admin/formatos/${documentId}/adjuntos`, { method: "POST", body: new FormData(form) });
      setAdjuntos(items => [...(items ?? []), result.adjunto]); form.reset();
      // La primera imagen de cada tipo queda elegida para el PDF; se puede cambiar abajo.
      const slot = result.adjunto.kind === "foto" ? "fotoPrincipalId" : result.adjunto.kind === "croquis" ? "croquisId" : null;
      if (slot && !values[slot]) onChange(slot, result.adjunto.id);
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  return <div className="flex flex-col gap-5">
    <p className="text-sm text-muted-foreground">Sube la fotografía principal y el croquis de ubicación y acceso. Anota de dónde viene cada imagen y cuándo se tomó. Solo se usan con autorización del propietario.</p>
    <form onSubmit={upload} className="grid gap-3 rounded-[12px] border border-border p-4 md:grid-cols-2">
      <fieldset disabled={disabled || busy} className="contents">
        <label className="text-sm">Tipo<select name="tipo" required className={selectClass}><option value="foto">Fotografía</option><option value="croquis">Croquis o plano</option><option value="soporte">Soporte gráfico</option></select></label>
        <label className="text-sm">Fecha en que se tomó<input name="fechaObservacion" type="date" className={inputClass} /></label>
        <label className="text-sm">Descripción<input name="descripcion" required maxLength={240} className={inputClass} placeholder="Fachada principal" /></label>
        <label className="text-sm">Fuente o autor<input name="fuente" required maxLength={240} className={inputClass} placeholder="Tomada por el asesor en la visita" /></label>
        <label className="text-sm md:col-span-2">Imagen JPEG o PNG, máximo 10 MB<input name="archivo" type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" required className={inputClass} /></label>
        <Button type="submit" className="self-start">{busy ? "Subiendo…" : "Subir imagen"}</Button>
      </fieldset>
    </form>
    {adjuntos === null ? <p role="status" className="text-sm text-muted-foreground">Consultando imágenes…</p>
      : adjuntos.length > 0 && <ul className="flex flex-col gap-1 text-sm">{adjuntos.map(item => <li key={item.id}><a className="underline" href={`/api/admin/adjuntos/${item.id}/descargar`} target="_blank" rel="noreferrer">{item.caption}</a> · {item.kind === "foto" ? "Fotografía" : item.kind === "croquis" ? "Croquis" : "Soporte"} · {item.source}{item.observed_on ? ` · ${item.observed_on}` : ""}</li>)}</ul>}
    <div className="grid gap-3 md:grid-cols-2">{[{ key: "fotoPrincipalId", kind: "foto", label: "Fotografía principal del PDF" }, { key: "croquisId", kind: "croquis", label: "Croquis del PDF" }].map(slot => <label key={slot.key} className="text-sm">{slot.label}
      <select value={String(values[slot.key] ?? "")} disabled={disabled} onChange={event => onChange(slot.key, event.target.value)} className={selectClass}><option value="">Elige una imagen</option>{(adjuntos ?? []).filter(item => item.kind === slot.kind).map(item => <option key={item.id} value={item.id}>{item.caption}</option>)}</select>
    </label>)}</div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
