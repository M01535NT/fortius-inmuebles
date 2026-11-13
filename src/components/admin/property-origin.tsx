"use client";
import * as React from "react";
import { Field, inputClass, selectClass } from "@/components/admin/ui";
import { uploadFile } from "@/lib/admin/store";
import type { PropertyAlly } from "@/lib/propiedad-seguimiento";

const PRIVATE_BUCKET = "fortius-inmuebles-private";
export const privateFileUrl = (path: string) => `/api/admin/files?bucket=${PRIVATE_BUCKET}&path=${encodeURIComponent(path)}`;

/**
 * PUB-02 (RP-95, DEC-40): de dónde viene el inmueble. Un compartido lleva la inmobiliaria que lo
 * comparte y su autorización escrita (carta, correo o mensaje guardado como archivo privado).
 * Los campos van por nombre en el formulario; el inmueble los lee al guardar.
 */
export function PropertyOrigin({ origen: initialOrigin, aliado, allies, onChange }: { origen: "propio" | "compartido"; aliado?: PropertyAlly; allies: PropertyAlly[]; onChange: () => void }) {
  const [origen, setOrigen] = React.useState(initialOrigin);
  const [authorization, setAuthorization] = React.useState({ path: aliado?.autorizacion?.path ?? "", nombre: aliado?.autorizacion?.nombre ?? "" });
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState("");
  const contacto = React.useRef<HTMLInputElement>(null), porcentaje = React.useRef<HTMLInputElement>(null);
  const id = React.useId();
  // Una inmobiliaria ya registrada trae su contacto y porcentaje; se pueden cambiar.
  function prefill(name: string) {
    const known = allies.find((ally) => ally.inmobiliaria.toLocaleLowerCase("es-MX") === name.trim().toLocaleLowerCase("es-MX"));
    if (!known) return;
    if (contacto.current && !contacto.current.value && known.contacto) contacto.current.value = known.contacto;
    if (porcentaje.current && !porcentaje.current.value && known.porcentaje != null) porcentaje.current.value = String(known.porcentaje);
  }
  async function upload(file: File | undefined, input: HTMLInputElement) {
    if (!file) return;
    setError(""); setUploading(true);
    try {
      const saved = await uploadFile(file, "private");
      setAuthorization({ path: saved.path, nombre: file.name.slice(0, 160) });
      onChange();
      input.value = "";
    } catch { setError("No se pudo subir la autorización. Intenta de nuevo."); }
    finally { setUploading(false); }
  }
  return <div className="mt-4 grid gap-4 sm:grid-cols-2">
    <Field label="¿De quién es el inmueble?" htmlFor={`${id}-origen`} className="sm:col-span-2">
      <select id={`${id}-origen`} name="origen" value={origen} onChange={(event) => setOrigen(event.target.value as typeof origen)} className={selectClass}>
        <option value="propio">Lo captó Fortius</option>
        <option value="compartido">Lo comparte otra inmobiliaria</option>
      </select>
    </Field>
    {origen === "compartido" && <>
      <p className="m-0 text-sm text-muted-foreground sm:col-span-2">No lleva captación. Se publica con la autorización escrita de la inmobiliaria y lo publica el director. En el sitio dice «Inmueble en colaboración», sin el nombre de la inmobiliaria; su nombre, contacto, porcentaje y autorización no salen del panel.</p>
      <Field label="Inmobiliaria que lo comparte" htmlFor={`${id}-inmobiliaria`}>
        <input id={`${id}-inmobiliaria`} name="aliadoInmobiliaria" list={`${id}-aliados`} required minLength={2} maxLength={120} defaultValue={aliado?.inmobiliaria ?? ""} onChange={(event) => prefill(event.target.value)} className={inputClass} />
        <datalist id={`${id}-aliados`}>{allies.map((ally) => <option key={ally.inmobiliaria} value={ally.inmobiliaria} />)}</datalist>
      </Field>
      <Field label="Contacto en la inmobiliaria" htmlFor={`${id}-contacto`} hint="Nombre y teléfono o correo. Solo lo ve el equipo.">
        <input ref={contacto} id={`${id}-contacto`} name="aliadoContacto" maxLength={200} defaultValue={aliado?.contacto ?? ""} className={inputClass} />
      </Field>
      <Field label="Comisión para Fortius (% del precio)" htmlFor={`${id}-porcentaje`} hint="Lo acordado con la inmobiliaria; en Reportes sale como estimación.">
        <input ref={porcentaje} id={`${id}-porcentaje`} name="aliadoPorcentaje" type="number" inputMode="decimal" min={0} max={100} step="0.01" defaultValue={aliado?.porcentaje ?? ""} className={inputClass} />
      </Field>
      <fieldset className="m-0 grid gap-3 rounded-md border border-border p-3 sm:col-span-2 sm:grid-cols-2">
        <legend className="px-1 text-sm font-medium text-foreground">Autorización escrita para publicarlo</legend>
        <input type="hidden" name="aliadoAutorizacionPath" value={authorization.path} />
        <input type="hidden" name="aliadoAutorizacionNombre" value={authorization.nombre} />
        <Field label={authorization.path ? "Cambiar el archivo" : "Archivo de la autorización"} htmlFor={`${id}-archivo`} hint="Carta, correo o captura del mensaje. Se guarda privado." className="sm:col-span-2">
          <input id={`${id}-archivo`} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => upload(event.currentTarget.files?.[0], event.currentTarget)} className={inputClass + " h-auto min-h-11 py-2"} />
        </Field>
        {uploading && <p role="status" className="m-0 text-sm sm:col-span-2">Subiendo…</p>}
        {error && <p role="alert" className="m-0 text-sm text-destructive sm:col-span-2">{error}</p>}
        {authorization.path && !uploading && <p className="m-0 text-sm sm:col-span-2">Adjunta: <a href={privateFileUrl(authorization.path)} target="_blank" rel="noreferrer" className="text-primary-ink underline underline-offset-4">{authorization.nombre || "ver autorización"}</a></p>}
        <Field label="Fecha de la autorización" htmlFor={`${id}-fecha`}>
          <input id={`${id}-fecha`} name="aliadoAutorizacionFecha" type="date" defaultValue={aliado?.autorizacion?.fecha ?? ""} className={inputClass} />
        </Field>
        <Field label="Quién la firmó o envió" htmlFor={`${id}-firmante`}>
          <input id={`${id}-firmante`} name="aliadoAutorizacionFirmante" maxLength={160} defaultValue={aliado?.autorizacion?.firmante ?? ""} className={inputClass} />
        </Field>
      </fieldset>
    </>}
  </div>;
}
