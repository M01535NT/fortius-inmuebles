"use client";
import * as React from "react";
import { ArrowLeft, FileDown, Upload } from "@/components/admin/icons";
import { Button, Notice, Segmented } from "@/components/admin/kit";
import { db, errorMessage, fetchJson, loadAllDossiers, useCollection } from "@/lib/admin/store";
import type { OperationRecord } from "@/lib/admin/operation-view";
import { Desplegable, MenuAcciones, type Opcion } from "./desplegable";
import s from "./bandeja.module.css";

/*
  FLX-01 · Bandeja (RP-101, RP-102; boceto aprobado el 14/11/2026). Lo que llega se guarda sin
  llenar nada: se suelta en cualquier parte de la pantalla o se elige con «Agregar». Después se
  archiva en un inmueble (aunque no tenga propietario), una operación o una persona, o se deja
  para después. El servidor comprueba cada destino; aquí solo se elige.
*/

type Documento = {
  id: string; titulo: string; nombre_original: string; mime: string; byte_length: number; sha256: string; tipo_documento: string | null;
  asesor_id: string | null; cliente_id: string | null; propiedad_slug: string | null; expediente_id: string | null;
  archivado_el: string | null; created_at: string; deleted_at: string | null;
};
type Vista = "pendientes" | "papelera";
const TIPOS: Opcion<string>[] = [
  { value: "levantamiento", label: "Levantamiento" }, { value: "avaluo", label: "Avalúo" }, { value: "escritura", label: "Escritura" },
  { value: "identificacion", label: "Identificación" }, { value: "predial", label: "Predial" }, { value: "libertad_gravamen", label: "Libertad de gravamen" },
  { value: "contrato", label: "Contrato" }, { value: "foto", label: "Foto" }, { value: "otro", label: "Otro" },
];
const NINGUNO = "__ninguno__";
const ACEPTA = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "America/Tijuana" });
const fechaHora = (iso: string) => new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Tijuana" });
const peso = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const visto = (d: Documento) => ({ titulo: d.titulo, eliminado: Boolean(d.deleted_at), archivado: Boolean(d.archivado_el) });
const JSON_HEADERS = { "Content-Type": "application/json" };

async function subir(file: File): Promise<Documento> {
  const prepared = await fetchJson<{ signedUrl: string; ticket: string }>("/api/admin/bandeja", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
  const sent = await fetch(prepared.signedUrl, { method: "PUT", credentials: "omit", headers: { "Content-Type": file.type }, body: file });
  if (!sent.ok) throw new Error("No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.");
  return (await fetchJson<{ documento: Documento }>("/api/admin/bandeja/completar", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ ticket: prepared.ticket }) })).documento;
}

export function BandejaApp() {
  const propiedades = useCollection(db.propiedades), clientes = useCollection(db.clientes);
  const [operaciones, setOperaciones] = React.useState<OperationRecord[]>([]);
  const [docs, setDocs] = React.useState<Documento[]>([]);
  const [papelera, setPapelera] = React.useState<Documento[]>([]);
  const [estado, setEstado] = React.useState<"cargando" | "listo" | "error">("cargando");
  const [vista, setVista] = React.useState<Vista>("pendientes");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);
  const [subiendo, setSubiendo] = React.useState(0);
  const [arrastre, setArrastre] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const input = React.useRef<HTMLInputElement>(null);

  const [vuelta, setVuelta] = React.useState(0);
  const cargar = React.useCallback(() => setVuelta(n => n + 1), []);
  React.useEffect(() => {
    let alive = true;
    fetchJson<{ documentos: Documento[]; papelera: Documento[] }>("/api/admin/bandeja")
      .then(data => { if (alive) { setDocs(data.documentos); setPapelera(data.papelera); setEstado("listo"); } })
      .catch(e => { if (alive) { setError(errorMessage(e)); setEstado("error"); } });
    return () => { alive = false; };
  }, [vuelta]);
  React.useEffect(() => { let alive = true; loadAllDossiers<OperationRecord>().then(all => { if (alive) setOperaciones(all.filter(o => !o.deleted_at)); }).catch(() => undefined); return () => { alive = false; }; }, []);

  async function recibir(files: File[]) {
    setError(null); setAviso(null);
    const validos = files.filter(file => ACEPTA.includes(file.type));
    if (validos.length < files.length) setError("Solo se guardan PDF e imágenes JPEG, PNG o WEBP.");
    if (!validos.length) return;
    setSubiendo(validos.length);
    let ultimo: Documento | null = null, guardados = 0;
    for (const file of validos) {
      try { const documento = await subir(file); ultimo = documento; guardados += 1; setDocs(list => [documento, ...list.filter(d => d.id !== documento.id)]); }
      catch (e) { setError(errorMessage(e)); }
      setSubiendo(n => n - 1);
    }
    if (ultimo) { setVista("pendientes"); setSelected(ultimo.id); setAviso(guardados === 1 ? "Guardado en la Bandeja. No hizo falta llenar nada." : `${guardados} archivos guardados en la Bandeja.`); }
  }

  const lista = vista === "pendientes" ? docs : papelera;
  const current = lista.find(d => d.id === selected) ?? (showDetail ? undefined : lista[0]);
  const abrir = (id: string) => { setSelected(id); setShowDetail(true); setError(null); setAviso(null); };

  /** Aplica un cambio en el servidor y acomoda las listas según cómo quedó el documento. */
  async function cambiar(doc: Documento, body: Record<string, unknown>, hecho: string) {
    setError(null); setAviso(null);
    try {
      const { documento } = await fetchJson<{ documento: Documento }>(`/api/admin/bandeja/${doc.id}`, { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ ...body, esperado: visto(doc) }) });
      const sinEl = (list: Documento[]) => list.filter(d => d.id !== documento.id);
      setDocs(list => documento.deleted_at || documento.archivado_el ? sinEl(list) : [documento, ...sinEl(list)].sort((a, b) => b.created_at.localeCompare(a.created_at)));
      setPapelera(list => documento.deleted_at ? [documento, ...sinEl(list)] : sinEl(list));
      if (documento.deleted_at || documento.archivado_el) { setSelected(null); setShowDetail(false); }
      setAviso(hecho);
      return documento;
    } catch (e) { setError(errorMessage(e)); cargar(); return null; }
  }

  return <div className={s.app} data-detail={showDetail} data-drag={arrastre}
    onDragOver={event => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); setArrastre(true); } }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setArrastre(false); }}
    onDrop={event => { event.preventDefault(); setArrastre(false); void recibir([...event.dataTransfer.files]); }}>
    <aside className={s.list} aria-label="Bandeja">
      <div className={s.listHead}>
        <div className={s.listHeadRow}><h1>Bandeja</h1>
          <Button onClick={() => input.current?.click()} disabled={subiendo > 0}><Upload size={16} aria-hidden />{subiendo > 0 ? "Guardando…" : "Agregar"}</Button>
          <input ref={input} type="file" multiple hidden accept={ACEPTA.join(",")} aria-label="Agregar archivos a la Bandeja" onChange={event => { void recibir([...(event.target.files ?? [])]); event.target.value = ""; }} />
        </div>
        <p className={s.hint}>Suelta archivos en cualquier parte de la pantalla. Se guardan sin llenar nada.</p>
        <Segmented label="Mostrar" value={vista} onChange={v => { setVista(v); setSelected(null); setShowDetail(false); }} options={[{ id: "pendientes", label: `Por archivar${docs.length ? ` · ${docs.length}` : ""}` }, { id: "papelera", label: "Papelera" }]} />
      </div>
      <div className={s.rows}>
        {estado === "cargando" ? <p className={s.empty}>Cargando la Bandeja…</p>
          : estado === "error" && !lista.length ? <p className={s.empty}>No se pudo cargar la Bandeja. <button type="button" className="underline" onClick={() => { setEstado("cargando"); setError(null); cargar(); }}>Reintentar</button></p>
          : !lista.length ? <p className={s.empty}>{vista === "pendientes" ? "No hay nada por archivar. Suelta aquí un PDF o una foto, o usa «Agregar»; desde el celular puedes tomar la foto en ese momento." : "La papelera está vacía."}</p>
          : lista.map(d => <button key={d.id} type="button" className={s.row} aria-current={d.id === current?.id} onClick={() => abrir(d.id)}>
            <span className={s.rowA}><b>{d.titulo}</b><span>{fecha(d.created_at)}</span></span>
            <span className={s.rowB}>{TIPOS.find(t => t.value === d.tipo_documento)?.label ?? "Sin tipo"} · {peso(d.byte_length)}</span>
          </button>)}
      </div>
    </aside>
    <main className={s.detail}>
      {current
        ? <Detalle key={current.id} doc={current} enPapelera={vista === "papelera"} error={error} aviso={aviso} onBack={() => setShowDetail(false)} cambiar={cambiar}
            propiedades={propiedades.map(p => ({ value: p.slug, label: p.titulo, detail: p.codigo }))}
            clientes={clientes.map(c => ({ value: c.id, label: c.nombre }))}
            operaciones={operaciones.map(o => ({ value: o.id, label: o.unidad || o.folio, detail: o.unidad ? o.folio : undefined }))} />
        : <div className={s.center}>
            {error && <Notice tone="warn">{error}</Notice>}
            {aviso && <p className={s.hint} role="status">{aviso}</p>}
            <div className={s.stepView}><div><h3>{lista.length ? "Elige un archivo de la lista" : vista === "pendientes" ? "La Bandeja está vacía" : "Nada en la papelera"}</h3><p>{vista === "pendientes" ? "Lo que llegue aparecerá aquí hasta que lo archives." : "Lo que mandes a la papelera se puede restaurar desde aquí."}</p></div></div>
          </div>}
    </main>
  </div>;
}

function Detalle({ doc, enPapelera, error, aviso, onBack, cambiar, propiedades, clientes, operaciones }: {
  doc: Documento; enPapelera: boolean; error: string | null; aviso: string | null; onBack: () => void;
  cambiar: (doc: Documento, body: Record<string, unknown>, hecho: string) => Promise<Documento | null>;
  propiedades: Opcion<string>[]; clientes: Opcion<string>[]; operaciones: Opcion<string>[];
}) {
  const [inmueble, setInmueble] = React.useState(NINGUNO), [operacion, setOperacion] = React.useState(NINGUNO), [persona, setPersona] = React.useState(NINGUNO);
  const [renombrando, setRenombrando] = React.useState(false);
  const [titulo, setTitulo] = React.useState(doc.titulo);
  const [busy, setBusy] = React.useState(false);
  const conNinguno = (label: string, options: Opcion<string>[]) => [{ value: NINGUNO, label }, ...options];
  const elegido = (value: string) => value === NINGUNO ? null : value;
  const hayDestino = inmueble !== NINGUNO || operacion !== NINGUNO || persona !== NINGUNO;
  const run = async (body: Record<string, unknown>, hecho: string) => { setBusy(true); const r = await cambiar(doc, body, hecho); setBusy(false); return r; };
  const destinoTexto = [inmueble, operacion, persona].map((value, i) => value === NINGUNO ? null : [propiedades, operaciones, clientes][i].find(o => o.value === value)?.label).filter(Boolean).join(" · ");

  return <>
    <div className={s.head}>
      <Button variant="ghost" iconOnly className={s.back} aria-label="Volver a la lista" onClick={onBack}><ArrowLeft size={18} aria-hidden /></Button>
      <div className={s.title}>
        {renombrando
          ? <form onSubmit={async event => { event.preventDefault(); const limpio = titulo.trim(); if (!limpio || limpio === doc.titulo) { setRenombrando(false); return; } if (await run({ titulo: limpio }, "Nombre cambiado.")) setRenombrando(false); }}>
              <label className={s.sr} htmlFor="bandeja-titulo">Nombre del documento</label>
              <input id="bandeja-titulo" className={s.titleInput} value={titulo} maxLength={240} autoFocus onChange={event => setTitulo(event.target.value)} onBlur={() => { setTitulo(doc.titulo); setRenombrando(false); }} onKeyDown={event => { if (event.key === "Escape") { setTitulo(doc.titulo); setRenombrando(false); } }} />
            </form>
          : <h2>{doc.titulo}</h2>}
        <span>{enPapelera ? "En la papelera" : `Llegó el ${fechaHora(doc.created_at)} · sin archivar`}</span>
      </div>
      <div className={s.actions}>
        <a className="sr-only" href={`/api/admin/bandeja/${doc.id}/descargar`} target="_blank" rel="noreferrer" id={`ver-${doc.id}`}>Abrir el archivo</a>
        <Button onClick={() => window.open(`/api/admin/bandeja/${doc.id}/descargar`, "_blank", "noopener")}><FileDown size={16} aria-hidden />Ver</Button>
        {enPapelera
          ? <Button variant="primary" disabled={busy} onClick={() => void run({ papelera: false }, "Restaurado: volvió a la Bandeja.")}>Restaurar</Button>
          : <MenuAcciones label="Más acciones" actions={[
              { label: "Cambiar el nombre", onSelect: () => setRenombrando(true) },
              { label: "Mandar a la papelera", danger: true, separated: true, onSelect: () => void run({ papelera: true }, "Se mandó a la papelera. Se puede restaurar.") },
            ]} />}
      </div>
    </div>
    <div className={s.body}>
      <div className={s.center}>
        {error && <Notice tone="warn">{error}</Notice>}
        {aviso && <p className={s.hint} role="status">{aviso}</p>}
        {enPapelera
          ? <div className={s.stepView}><div><h3>Está en la papelera</h3><p>No se borra. Restáuralo para archivarlo.</p></div></div>
          : <section className={s.step} aria-labelledby="bandeja-destino">
              <div><h3 id="bandeja-destino">¿Dónde se guarda?</h3><p>Elige uno o varios. Un inmueble puede no tener propietario todavía; la persona puede quedar vacía.</p></div>
              <div className={s.dest}>
                <Desplegable label="Inmueble" value={inmueble} onChange={setInmueble} options={conNinguno("Ninguno", propiedades)} disabled={busy} />
                <Desplegable label="Operación" value={operacion} onChange={setOperacion} options={conNinguno("Ninguna", operaciones)} disabled={busy} />
                <Desplegable label="Persona" value={persona} onChange={setPersona} options={conNinguno("Sin persona", clientes)} disabled={busy} />
              </div>
              <div className={s.stepFoot}>
                <button type="button" className={s.onDark} disabled={busy || !hayDestino} onClick={() => void run({ destino: { propiedadSlug: elegido(inmueble), expedienteId: elegido(operacion), clienteId: elegido(persona) } }, `Archivado en ${destinoTexto}.`)}>Archivar</button>
                <button type="button" className={s.onDark} data-quiet="true" disabled={busy} onClick={onBack}>Dejar para después</button>
              </div>
            </section>}
      </div>
      <aside className={s.inspector} aria-label="Datos del archivo">
        {!enPapelera && <div className={s.blk}>
          <h3>Tipo de documento</h3>
          <Desplegable hideLabel label="Tipo de documento" placeholder="Sin tipo" value={doc.tipo_documento ?? ""} options={TIPOS} disabled={busy} onChange={tipo => void run({ tipo }, "Tipo guardado.")} />
        </div>}
        <div className={s.blk}>
          <h3>Archivo</h3>
          <div className={s.kv}><span>Nombre original</span><span>{doc.nombre_original}</span></div>
          <div className={s.kv}><span>Tamaño</span><span>{peso(doc.byte_length)}</span></div>
          <div className={s.kv}><span>Formato</span><span>{doc.mime === "application/pdf" ? "PDF" : "Imagen"}</span></div>
          <div className={s.kv}><span>Huella</span><span title={doc.sha256}>{doc.sha256.slice(0, 12)}…</span></div>
        </div>
      </aside>
    </div>
  </>;
}
