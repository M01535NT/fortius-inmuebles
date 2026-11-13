"use client";
/* eslint-disable @next/next/no-img-element -- La vista previa es un blob: generado en el navegador. */
import * as React from "react";
import { createPortal } from "react-dom";
import { Pencil } from "@/components/admin/icons";
import { Button, Sheet } from "@/components/admin/kit";
import { selectClass } from "@/components/admin/ui";
import { errorMessage, uploadFile } from "@/lib/admin/store";
import { renderPhoto, type PhotoAdjust } from "@/lib/apps/photo";

/*
  «Editar» en cada foto de la galería (revisión del catálogo del 12/11/2026): sustituye la
  herramienta «Fotografías». La foto ajustada se sube como material público y reemplaza a la de la
  galería; la original no se borra y se puede volver a elegir desde la biblioteca.
*/
const SLIDERS = [
  { key: "brightness", label: "Luz", min: 50, max: 150, initial: 100 },
  { key: "contrast", label: "Contraste", min: 50, max: 150, initial: 100 },
  { key: "crop", label: "Recorte por cada borde (%)", min: 0, max: 35, initial: 0 },
] as const;
type Adjust = { brightness: number; contrast: number; crop: number; rotation: number };
const START: Adjust = { brightness: 100, contrast: 100, crop: 0, rotation: 0 };

export function PhotoEditButton({ src, label, inmueble, onSaved }: { src: string; label: string; inmueble?: string; onSaved: (url: string) => void }) {
  const [open, setOpen] = React.useState(false);
  return <>
    <Button iconOnly variant="ghost" aria-label={`Editar ${label.toLowerCase()}`} onClick={() => setOpen(true)}><Pencil size={16} aria-hidden="true" /></Button>
    {open && <PhotoEditSheet src={src} label={label} inmueble={inmueble} onClose={() => setOpen(false)} onSaved={url => { onSaved(url); setOpen(false); }} />}
  </>;
}

function PhotoEditSheet({ src, label, inmueble, onClose, onSaved }: { src: string; label: string; inmueble?: string; onClose: () => void; onSaved: (url: string) => void }) {
  const [source, setSource] = React.useState<Blob | null>(null);
  const [adjust, setAdjust] = React.useState<Adjust>(START);
  const [preview, setPreview] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch(src).then(r => { if (!r.ok) throw new Error("No se pudo abrir la foto."); return r.blob(); })
      .then(blob => { if (active) setSource(blob); })
      .catch(e => { if (active) setError(errorMessage(e)); });
    return () => { active = false; };
  }, [src]);

  React.useEffect(() => {
    if (!source) return;
    let url = "", active = true;
    // La vista previa sale a calidad baja para que responda rápido al mover los controles.
    renderPhoto(source, { ...adjust, quality: 70 } satisfies PhotoAdjust)
      .then(({ blob }) => { if (active) { url = URL.createObjectURL(blob); setPreview(url); } })
      .catch(e => { if (active) setError(errorMessage(e)); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [source, adjust]);

  async function save() {
    if (!source) return;
    setBusy(true); setError("");
    try {
      const { blob } = await renderPhoto(source, { ...adjust, quality: 85 });
      const file = await uploadFile(new File([blob], "fortius-foto-editada.jpg", { type: "image/jpeg" }), "public", { destino: "inmueble", inmueble });
      onSaved(file.url);
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  const changed = JSON.stringify(adjust) !== JSON.stringify(START);
  const root = typeof document === "undefined" ? null : document.querySelector(".admin-root") ?? document.body;
  if (!root) return null;
  return createPortal(<Sheet open onClose={onClose} title={`Editar ${label.toLowerCase()}`} description="La original se conserva en la biblioteca."
    footer={<div className="flex flex-wrap gap-2">
      <Button variant="primary" disabled={!source || !changed || busy} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar en la galería"}</Button>
      <Button variant="ghost" disabled={!changed || busy} onClick={() => setAdjust(START)}>Deshacer ajustes</Button>
    </div>}>
    {preview ? <img src={preview} alt={`Vista previa de ${label.toLowerCase()} con los ajustes`} className="max-h-72 w-full rounded-[12px] border border-border object-contain" />
      : !error && <p role="status" className="text-sm text-muted-foreground">Abriendo la foto…</p>}
    <fieldset disabled={!source || busy} className="flex flex-col gap-4">
      {SLIDERS.map(s => <label key={s.key} className="flex flex-col gap-1.5 text-sm font-semibold">{s.label}: {adjust[s.key]}
        <input type="range" className="min-h-11 accent-[var(--primary)]" min={s.min} max={s.max} value={adjust[s.key]} onChange={e => setAdjust(a => ({ ...a, [s.key]: Number(e.target.value) }))} />
      </label>)}
      <label className="flex flex-col gap-1.5 text-sm font-semibold">Giro
        <select className={selectClass} value={adjust.rotation} onChange={e => setAdjust(a => ({ ...a, rotation: Number(e.target.value) }))}>
          {[0, 90, 180, 270].map(v => <option key={v} value={v}>{v}°</option>)}
        </select>
      </label>
    </fieldset>
    <p className="text-sm text-muted-foreground">La foto editada sale en JPEG, sin los datos de ubicación del archivo original. Recuerda guardar el inmueble después.</p>
    {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
  </Sheet>, root);
}
