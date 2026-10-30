"use client";
import * as React from "react";
import { Camera, FileDown, FileText, Pencil, RotateCcw, Trash2, Upload } from "@/components/admin/icons";
import { Button, Card, EmptyBox, Pill } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import { db, errorMessage, fetchJson as json, useCollection } from "@/lib/admin/store";
import { ExpedienteDatosPanel } from "./expediente-datos-panel";

/*
  Documentos del cliente (titular, 29/10/2026): el repositorio del expediente. Se suben todos los
  documentos que entregue el cliente —escrituras, certificados, avalúos, identificaciones, CURP,
  predial…— sin acomodarlos por tipo. Cada archivo se sube directo a la carga privada con un
  permiso de un solo uso y el servidor lo comprueba antes de guardarlo. Nada se borra de golpe:
  va a la papelera y se puede restaurar.
*/

export type ArchivoCliente = { id: string; titulo: string; nombre_original: string; mime: string; byte_length: number; uploaded_by: string; created_at: string; deleted_at: string | null };
const TIPOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX = 20 * 1024 * 1024;
const tamano = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const fecha = (iso: string) => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

/** Sube un archivo: permiso de un solo uso, carga directa y registro comprobado en el servidor. */
async function subir(operationId: string, file: File): Promise<ArchivoCliente> {
  if (!TIPOS.includes(file.type)) throw new Error(`«${file.name}»: sube un PDF o una imagen JPEG, PNG o WEBP.`);
  if (file.size === 0 || file.size > MAX) throw new Error(`«${file.name}»: el archivo debe pesar hasta 20 MB.`);
  const prepared = await json<{ signedUrl: string; ticket: string }>(`/api/admin/expedientes/${operationId}/archivos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
  const sent = await fetch(prepared.signedUrl, { method: "PUT", credentials: "omit", headers: { "Content-Type": file.type }, body: file });
  if (!sent.ok) throw new Error(`«${file.name}» no se pudo subir. Vuelve a intentarlo.`);
  const r = await json<{ archivo: ArchivoCliente }>(`/api/admin/expedientes/${operationId}/archivos/completar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket: prepared.ticket }) });
  return r.archivo;
}

export function ClientDocumentsTab({ operationId }: { operationId: string }) {
  const advisers = useCollection(db.asesores);
  const [lista, setLista] = React.useState<{ archivos: ArchivoCliente[]; papelera: ArchivoCliente[] } | null | undefined>(undefined);
  const [subiendo, setSubiendo] = React.useState<string[]>([]);
  const [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const [arrastrando, setArrastrando] = React.useState(false);
  const [editando, setEditando] = React.useState<{ id: string; titulo: string } | null>(null);
  const [verPapelera, setVerPapelera] = React.useState(false);
  // Cada lectura de documentos puede proponer datos nuevos: el panel de datos se vuelve a consultar.
  const [lecturas] = React.useState(0);
  const elegir = React.useRef<HTMLInputElement>(null), camara = React.useRef<HTMLInputElement>(null);

  const cargar = React.useCallback(() => json<{ archivos: ArchivoCliente[]; papelera: ArchivoCliente[] }>(`/api/admin/expedientes/${operationId}/archivos`)
    .then(r => setLista({ archivos: r.archivos ?? [], papelera: r.papelera ?? [] }))
    .catch(cause => { setLista(null); setError(errorMessage(cause)); }), [operationId]);
  React.useEffect(() => { void cargar(); }, [cargar]);

  async function agregar(files: FileList | File[] | null) {
    const todos = Array.from(files ?? []);
    if (!todos.length) return;
    setError(""); setNotice("");
    const fallas: string[] = [];
    let listos = 0;
    // Uno por uno: si uno falla, los demás siguen.
    for (const file of todos) {
      setSubiendo(names => [...names, file.name]);
      try {
        const archivo = await subir(operationId, file);
        listos++;
        setLista(old => old ? { ...old, archivos: [archivo, ...old.archivos] } : { archivos: [archivo], papelera: [] });
      } catch (cause) { fallas.push(errorMessage(cause)); }
      finally { setSubiendo(names => names.filter(name => name !== file.name)); }
    }
    if (listos) setNotice(listos === 1 ? "Se guardó 1 documento." : `Se guardaron ${listos} documentos.`);
    if (fallas.length) setError(fallas.join(" "));
  }
  async function cambiar(id: string, body: Record<string, unknown>, mensaje: string) {
    setError(""); setNotice("");
    try {
      const r = await json<{ archivo: ArchivoCliente }>(`/api/admin/archivos-cliente/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setLista(old => {
        if (!old) return old;
        const resto = { archivos: old.archivos.filter(a => a.id !== id), papelera: old.papelera.filter(a => a.id !== id) };
        return r.archivo.deleted_at ? { ...resto, papelera: [r.archivo, ...resto.papelera] } : { ...resto, archivos: [r.archivo, ...resto.archivos].sort((a, b) => b.created_at.localeCompare(a.created_at)) };
      });
      setNotice(mensaje);
      return true;
    } catch (cause) { setError(errorMessage(cause)); return false; }
  }
  const quien = (id: string) => advisers.find(a => a.id === id)?.nombre ?? "Equipo";
  const archivos = lista?.archivos ?? [], papelera = lista?.papelera ?? [];

  return <div className="flex flex-col gap-5">
    <Card className="p-5" aria-labelledby="docs-cliente-titulo">
      <div className="flex flex-col gap-1">
        <h2 id="docs-cliente-titulo" className="m-0 text-lg font-semibold">Documentos del cliente</h2>
        <p className="text-sm text-muted-foreground">Sube aquí todo lo que entregue el cliente: escrituras, certificado de libertad de gravámenes, avalúo, identificaciones, CURP, predial, agua, actas, poderes. No hace falta acomodarlos. PDF o imagen, hasta 20 MB cada uno.</p>
      </div>
      {/* Zona para soltar archivos; también se eligen o se toma la foto desde el celular. */}
      <div role="group" aria-label="Subir documentos" data-active={arrastrando}
        className={`mt-4 flex flex-col items-center gap-3 rounded-[12px] border-2 border-dashed p-6 text-center ${arrastrando ? "border-primary bg-muted" : "border-border"}`}
        onDragOver={event => { event.preventDefault(); setArrastrando(true); }} onDragLeave={() => setArrastrando(false)}
        onDrop={event => { event.preventDefault(); setArrastrando(false); void agregar(event.dataTransfer.files); }}>
        <Upload size={28} aria-hidden="true" />
        <p className="text-sm">Arrastra los archivos aquí o</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="primary" disabled={subiendo.length > 0} onClick={() => elegir.current?.click()}><Upload size={16} aria-hidden="true" />Elegir archivos</Button>
          <Button disabled={subiendo.length > 0} onClick={() => camara.current?.click()}><Camera size={16} aria-hidden="true" />Tomar foto</Button>
        </div>
        <input ref={elegir} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" aria-label="Elegir archivos" tabIndex={-1} onChange={event => { void agregar(event.target.files); event.target.value = ""; }} />
        <input ref={camara} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Tomar foto con la cámara" tabIndex={-1} onChange={event => { void agregar(event.target.files); event.target.value = ""; }} />
      </div>
      {subiendo.length > 0 && <p role="status" className="mt-3 text-sm text-muted-foreground">Subiendo {subiendo.join(", ")}…</p>}
      {notice && !subiendo.length && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </Card>

    {lista === undefined ? <p role="status" className="text-sm text-muted-foreground">Consultando los documentos…</p>
      : lista === null ? <div className="flex items-center gap-3"><p className="text-sm">No se pudieron cargar los documentos.</p><Button onClick={() => void cargar()}>Reintentar</Button></div>
      : !archivos.length ? <EmptyBox icon={<FileText size={28} aria-hidden="true" />} title="Todavía no hay documentos">Cuando subas los documentos del cliente aparecerán aquí.</EmptyBox>
      : <Card className="p-2" aria-label="Documentos guardados">
        <ul className="flex flex-col divide-y divide-border">{archivos.map(archivo => <li key={archivo.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
          <FileText size={20} aria-hidden="true" className="shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-1 flex-col">
            {editando?.id === archivo.id
              ? <form className="flex flex-wrap gap-2" onSubmit={async event => { event.preventDefault(); if (await cambiar(archivo.id, { titulo: editando.titulo }, "Nombre actualizado.")) setEditando(null); }}>
                <label className="sr-only" htmlFor={`titulo-${archivo.id}`}>Nombre del documento</label>
                <input id={`titulo-${archivo.id}`} className={`${inputClass} min-w-0 flex-1`} maxLength={240} value={editando.titulo} autoFocus onChange={event => setEditando({ id: archivo.id, titulo: event.target.value })} onKeyDown={event => { if (event.key === "Escape") setEditando(null); }} />
                <Button type="submit" variant="primary" disabled={!editando.titulo.trim()}>Guardar</Button>
                <Button onClick={() => setEditando(null)}>Cancelar</Button>
              </form>
              : <span className="font-semibold [overflow-wrap:anywhere]">{archivo.titulo}</span>}
            <span className="text-xs text-muted-foreground">{archivo.mime === "application/pdf" ? "PDF" : "Imagen"} · {tamano(archivo.byte_length)} · {fecha(archivo.created_at)} · {quien(archivo.uploaded_by)}</span>
          </div>
          {editando?.id !== archivo.id && <span className="flex gap-1">
            <a className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium hover:bg-muted" href={`/api/admin/archivos-cliente/${archivo.id}/descargar`} target="_blank" rel="noopener"><FileDown size={16} aria-hidden="true" />Abrir</a>
            <Button variant="ghost" iconOnly aria-label={`Cambiar el nombre de ${archivo.titulo}`} onClick={() => setEditando({ id: archivo.id, titulo: archivo.titulo })}><Pencil size={16} aria-hidden="true" /></Button>
            <Button variant="ghost" iconOnly aria-label={`Mandar ${archivo.titulo} a la papelera`} onClick={() => void cambiar(archivo.id, { papelera: true }, "Se movió a la papelera; puedes restaurarlo.")}><Trash2 size={16} aria-hidden="true" /></Button>
          </span>}
        </li>)}</ul>
      </Card>}

    <ExpedienteDatosPanel operationId={operationId} refresh={lecturas} />

    {papelera.length > 0 && <Card className="p-4" aria-label="Papelera de documentos">
      <button type="button" className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-semibold" aria-expanded={verPapelera} onClick={() => setVerPapelera(open => !open)}>
        Papelera <Pill size="sm" tone="muted">{papelera.length}</Pill>
      </button>
      {verPapelera && <ul className="mt-2 flex flex-col divide-y divide-border">{papelera.map(archivo => <li key={archivo.id} className="flex flex-wrap items-center gap-3 py-2">
        <span className="min-w-0 flex-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">{archivo.titulo}</span>
        <Button onClick={() => void cambiar(archivo.id, { papelera: false }, "Documento restaurado.")}><RotateCcw size={16} aria-hidden="true" />Restaurar</Button>
      </li>)}</ul>}
    </Card>}
  </div>;
}
