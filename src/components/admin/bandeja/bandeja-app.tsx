"use client";
import * as React from "react";
import { ArrowLeft, Building2, FileDown, FileText, Upload, UserRound } from "@/components/admin/icons";
import { Button, Kbd, Notice, Segmented } from "@/components/admin/kit";
import { UndoNotice, useUndo } from "@/components/admin/workspace/undo-notice";
import { useSingleKeyShortcuts } from "@/components/admin/workspace/shortcuts";
import { VistaPdf } from "@/components/admin/vista-pdf";
import { typingTarget } from "@/lib/admin/commands";
import { db, errorMessage, fetchJson, loadAllDossiers, useCollection } from "@/lib/admin/store";
import type { OperationRecord } from "@/lib/admin/operation-view";
import { SIN_DESTINO, sugerirDestinos, type Destino, type Sugerencia } from "@/lib/admin/bandeja-sugerencias";
import { cn } from "@/lib/utils";
import { Desplegable, MenuAcciones, type Opcion } from "./desplegable";
import s from "./bandeja.module.css";

/*
  FLX-01 · Bandeja (RP-101, RP-102) y LV-10d · Bandeja como correo (boceto del 14/11/2026). Lo que
  llega se guarda sin llenar nada: se suelta en cualquier parte de la pantalla o se elige con
  «Agregar». Se recorre como un correo: lista a la izquierda, el documento en grande al centro y
  «¿Dónde se guarda?» a la derecha, con los destinos que coinciden con el nombre del archivo.
  Archivar y mandar a la papelera avisan con «Deshacer», que el servidor revierte de verdad.
  Atajos de una tecla (UX-03): J y K para moverse, E para archivar; se apagan con la preferencia
  de atajos y nunca actúan dentro de un campo, un menú abierto o una ventana.
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
const ZONA = "America/Tijuana";
const hoy = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { timeZone: ZONA }) === new Date().toLocaleDateString("es-MX", { timeZone: ZONA });
/** Como en el correo: la hora si llegó hoy; si no, el día. */
const cuando = (iso: string) => hoy(iso) ? new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: ZONA }) : new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: ZONA });
const fechaHora = (iso: string) => new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: ZONA });
const peso = (bytes: number) => bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const formato = (mime: string) => mime === "application/pdf" ? "PDF" : mime === "image/png" ? "PNG" : mime === "image/webp" ? "WEBP" : "JPG";
const visto = (d: Documento) => ({ titulo: d.titulo, eliminado: Boolean(d.deleted_at), archivado: Boolean(d.archivado_el) });
const archivoUrl = (d: Documento) => `/api/admin/bandeja/${d.id}/descargar`;
const JSON_HEADERS = { "Content-Type": "application/json" };
const porFecha = (a: Documento, b: Documento) => b.created_at.localeCompare(a.created_at);

async function subir(file: File): Promise<Documento> {
  const prepared = await fetchJson<{ signedUrl: string; ticket: string }>("/api/admin/bandeja", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
  const sent = await fetch(prepared.signedUrl, { method: "PUT", credentials: "omit", headers: { "Content-Type": file.type }, body: file });
  if (!sent.ok) throw new Error("No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.");
  return (await fetchJson<{ documento: Documento }>("/api/admin/bandeja/completar", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ ticket: prepared.ticket }) })).documento;
}
const enviar = async (doc: Documento, body: Record<string, unknown>) =>
  (await fetchJson<{ documento: Documento }>(`/api/admin/bandeja/${doc.id}`, { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ ...body, esperado: visto(doc) }) })).documento;

/** Un atajo de una tecla no actúa sobre un campo, ni detrás de una ventana, un menú o una lista abierta. */
const atajoBloqueado = (event: KeyboardEvent) => event.ctrlKey || event.metaKey || event.altKey || typingTarget(event.target)
  || !!document.querySelector("dialog[open], [role=dialog][data-state=open], [role=alertdialog], [role=menu], [role=listbox]");

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
  const undo = useUndo();
  const { value: atajos } = useSingleKeyShortcuts();
  const input = React.useRef<HTMLInputElement>(null);
  const archivarConTeclaRef = React.useRef<(() => void) | null>(null);

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

  /** Acomoda las listas según cómo quedó el documento en el servidor. */
  const colocar = React.useCallback((documento: Documento) => {
    const sinEl = (list: Documento[]) => list.filter(d => d.id !== documento.id);
    setDocs(list => documento.deleted_at || documento.archivado_el ? sinEl(list) : [documento, ...sinEl(list)].sort(porFecha));
    setPapelera(list => documento.deleted_at ? [documento, ...sinEl(list)] : sinEl(list));
  }, []);

  /** Como en el correo: al quitar un documento de la lista queda elegido el siguiente (o el anterior). */
  function seguir(doc: Documento) {
    const i = lista.findIndex(d => d.id === doc.id);
    const next = lista[i + 1] ?? lista[i - 1];
    setSelected(next?.id ?? null);
    if (!next) setShowDetail(false);
  }

  async function cambiar(doc: Documento, body: Record<string, unknown>, hecho: string | null) {
    setError(null); setAviso(null);
    try { const documento = await enviar(doc, body); colocar(documento); if (hecho) setAviso(hecho); return documento; }
    catch (e) { setError(errorMessage(e)); cargar(); return null; }
  }

  /** Archivar y mandar a la papelera se deshacen en el servidor; el aviso sale solo si el cambio se guardó. */
  async function quitar(doc: Documento, body: Record<string, unknown>, texto: string, revertir: Record<string, unknown>) {
    const documento = await cambiar(doc, body, null);
    if (!documento) return;
    seguir(doc);
    undo.offer({ text: texto, undo: async () => { const vuelto = await enviar(documento, revertir); colocar(vuelto); setVista(vuelto.deleted_at ? "papelera" : "pendientes"); setSelected(vuelto.id); } });
  }
  const archivar = (doc: Documento, destino: Destino, texto: string) => quitar(doc, { destino }, texto, { destino: SIN_DESTINO });
  const aPapelera = (doc: Documento) => quitar(doc, { papelera: true }, "Se mandó a la papelera.", { papelera: false });

  function mover(paso: 1 | -1) {
    if (!lista.length) return;
    const i = lista.findIndex(d => d.id === current?.id);
    const next = lista[Math.min(lista.length - 1, Math.max(0, i < 0 ? 0 : i + paso))];
    setSelected(next.id); setError(null); setAviso(null);
    const fila = document.getElementById(`bandeja-fila-${next.id}`);
    fila?.scrollIntoView({ block: "nearest" });
    if (fila && document.activeElement?.closest(`.${s.rows}`)) fila.focus({ preventScroll: true });
  }
  const moverConTecla = React.useRef(mover);
  React.useEffect(() => { moverConTecla.current = mover; });
  React.useEffect(() => {
    if (!atajos) return;
    const onKey = (event: KeyboardEvent) => {
      if (atajoBloqueado(event)) return;
      const k = event.key.toLowerCase();
      if (k === "j" || k === "k") { event.preventDefault(); moverConTecla.current(k === "j" ? 1 : -1); }
      else if (k === "e" && !event.repeat && archivarConTeclaRef.current) { event.preventDefault(); archivarConTeclaRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [atajos]);

  return <div className={cn(s.app, s.mail)} data-detail={showDetail} data-drag={arrastre}
    onDragOver={event => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); setArrastre(true); } }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setArrastre(false); }}
    onDrop={event => { event.preventDefault(); setArrastre(false); void recibir([...event.dataTransfer.files]); }}>
    <aside className={s.list} aria-label="Bandeja">
      <div className={s.listHead}>
        <div className={s.listHeadRow}><h1>Bandeja</h1>
          <Button onClick={() => input.current?.click()} disabled={subiendo > 0}><Upload size={16} aria-hidden />{subiendo > 0 ? "Guardando…" : "Agregar"}</Button>
          <input ref={input} type="file" multiple hidden accept={ACEPTA.join(",")} aria-label="Agregar archivos a la Bandeja" onChange={event => { void recibir([...(event.target.files ?? [])]); event.target.value = ""; }} />
        </div>
        <Segmented label="Mostrar" value={vista} onChange={v => { setVista(v); setSelected(null); setShowDetail(false); }} options={[{ id: "pendientes", label: `Por archivar${docs.length ? ` · ${docs.length}` : ""}` }, { id: "papelera", label: "Papelera" }]} />
      </div>
      <div className={s.rows}>
        {estado === "cargando" ? <p className={s.empty}>Cargando la Bandeja…</p>
          : estado === "error" && !lista.length ? <p className={s.empty}>No se pudo cargar la Bandeja. <button type="button" className="underline" onClick={() => { setEstado("cargando"); setError(null); cargar(); }}>Reintentar</button></p>
          : !lista.length ? <p className={s.empty}>{vista === "pendientes" ? "No hay nada por archivar. Suelta aquí un PDF o una foto, o usa «Agregar»; desde el celular puedes tomar la foto en ese momento." : "La papelera está vacía."}</p>
          : lista.map(d => <button key={d.id} id={`bandeja-fila-${d.id}`} type="button" className={s.mrow} aria-current={d.id === current?.id} onClick={() => abrir(d.id)}>
            <span className={s.ftype} aria-hidden="true"><FileText size={18} /><span>{formato(d.mime)}</span></span>
            <span className={s.rowText}><b>{d.titulo}</b><small>{TIPOS.find(t => t.value === d.tipo_documento)?.label ?? "Sin tipo"} · {peso(d.byte_length)}</small></span>
            <span className={s.rowWhen}>{cuando(d.created_at)}</span>
          </button>)}
      </div>
      <p className={s.foot}>{atajos && vista === "pendientes" && lista.length > 0
        ? <><span><Kbd>J</Kbd> <Kbd>K</Kbd> moverse</span><span><Kbd>E</Kbd> archivar</span></>
        : "Suelta archivos en cualquier parte de la pantalla. Se guardan sin llenar nada."}</p>
    </aside>
    <main className={s.detail}>
      {current
        ? <Detalle key={current.id} doc={current} enPapelera={vista === "papelera"} error={error} aviso={aviso} atajos={atajos} archivarConTeclaRef={archivarConTeclaRef}
            onBack={() => setShowDetail(false)} cambiar={cambiar} archivar={archivar} aPapelera={aPapelera} despues={() => { if (showDetail && window.matchMedia("(max-width: 900px)").matches) setShowDetail(false); else mover(1); }}
            propiedades={propiedades} clientes={clientes} operaciones={operaciones} />
        : <div className={s.view}>
            {error && <Notice tone="warn">{error}</Notice>}
            {aviso && <p className={s.hint} role="status">{aviso}</p>}
            <div className={s.stepView}><div><h3>{lista.length ? "Elige un archivo de la lista" : vista === "pendientes" ? "La Bandeja está vacía" : "Nada en la papelera"}</h3><p>{vista === "pendientes" ? "Lo que llegue aparecerá aquí hasta que lo archives." : "Lo que mandes a la papelera se puede restaurar desde aquí."}</p></div></div>
          </div>}
    </main>
    <UndoNotice current={undo.current} clear={undo.clear} ms={undo.ms} onError={setError} className={s.undo} />
  </div>;
}

type Registro = { slug: string; titulo: string; codigo?: string | null };
function Detalle({ doc, enPapelera, error, aviso, atajos, archivarConTeclaRef, onBack, cambiar, archivar, aPapelera, despues, propiedades, clientes, operaciones }: {
  doc: Documento; enPapelera: boolean; error: string | null; aviso: string | null; atajos: boolean; archivarConTeclaRef: React.RefObject<(() => void) | null>;
  onBack: () => void; despues: () => void;
  cambiar: (doc: Documento, body: Record<string, unknown>, hecho: string | null) => Promise<Documento | null>;
  archivar: (doc: Documento, destino: Destino, texto: string) => Promise<void>; aPapelera: (doc: Documento) => Promise<void>;
  propiedades: Registro[]; clientes: Array<{ id: string; nombre: string }>; operaciones: OperationRecord[];
}) {
  const sugerencias = React.useMemo(() => sugerirDestinos(doc, propiedades, operaciones, clientes), [doc, propiedades, operaciones, clientes]);
  const [elegida, setElegida] = React.useState<string | null>(sugerencias[0]?.id ?? null);
  const [otro, setOtro] = React.useState(false);
  const [inmueble, setInmueble] = React.useState(NINGUNO), [operacion, setOperacion] = React.useState(NINGUNO), [persona, setPersona] = React.useState(NINGUNO);
  const [renombrando, setRenombrando] = React.useState(false);
  const [titulo, setTitulo] = React.useState(doc.titulo);
  const [busy, setBusy] = React.useState(false);

  const opcionesInmueble = React.useMemo(() => propiedades.map(p => ({ value: p.slug, label: p.titulo, detail: p.codigo ?? undefined })), [propiedades]);
  const opcionesPersona = React.useMemo(() => clientes.map(c => ({ value: c.id, label: c.nombre })), [clientes]);
  const opcionesOperacion = React.useMemo(() => operaciones.map(o => ({ value: o.id, label: o.unidad || o.folio, detail: o.unidad ? o.folio : undefined })), [operaciones]);
  const conNinguno = (label: string, options: Opcion<string>[]) => [{ value: NINGUNO, label }, ...options];
  const elegido = (value: string) => value === NINGUNO ? null : value;
  const manual = otro || !sugerencias.length;
  const sugerencia = manual ? undefined : sugerencias.find(x => x.id === elegida);
  const destino: Destino | null = sugerencia ? sugerencia.destino
    : inmueble !== NINGUNO || operacion !== NINGUNO || persona !== NINGUNO ? { propiedadSlug: elegido(inmueble), expedienteId: elegido(operacion), clienteId: elegido(persona) } : null;
  const destinoTexto = sugerencia ? sugerencia.label
    : [[inmueble, opcionesInmueble], [operacion, opcionesOperacion], [persona, opcionesPersona]].map(([value, options]) => value === NINGUNO ? null : (options as Opcion<string>[]).find(o => o.value === value)?.label).filter(Boolean).join(" · ");
  const run = async (body: Record<string, unknown>, hecho: string) => { setBusy(true); const r = await cambiar(doc, body, hecho); setBusy(false); return r; };
  const archivarAqui = async () => { if (!destino || busy) return; setBusy(true); await archivar(doc, destino, `Archivado en ${destinoTexto}.`); setBusy(false); };

  const ultimo = React.useRef(archivarAqui);
  React.useEffect(() => { ultimo.current = archivarAqui; });
  React.useEffect(() => {
    if (enPapelera) return;
    archivarConTeclaRef.current = () => void ultimo.current();
    return () => { archivarConTeclaRef.current = null; };
  }, [enPapelera, archivarConTeclaRef]);

  return <div className={s.body}>
    <section className={s.view} aria-label="Documento">
      <div className={s.viewbar}>
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
          <Button variant="ghost" iconOnly aria-label="Abrir el archivo en otra pestaña" title="Abrir en otra pestaña" onClick={() => window.open(archivoUrl(doc), "_blank", "noopener")}><FileDown size={18} aria-hidden /></Button>
          {enPapelera
            ? <Button variant="primary" disabled={busy} onClick={() => void run({ papelera: false }, "Restaurado: volvió a la Bandeja.")}>Restaurar</Button>
            : <MenuAcciones label="Más acciones" actions={[
                { label: "Cambiar el nombre", onSelect: () => setRenombrando(true) },
                { label: "Dejar para después", onSelect: despues },
                { label: "Mandar a la papelera", danger: true, separated: true, onSelect: () => void aPapelera(doc) },
              ]} />}
        </div>
      </div>
      {error && <Notice tone="warn">{error}</Notice>}
      {aviso && <p className={s.hint} role="status">{aviso}</p>}
      {doc.mime === "application/pdf"
        ? <VistaPdf url={archivoUrl(doc)} titulo={doc.titulo} soloPrimeraEnCelular />
        : <div className={s.paper} data-kind="image">
            {/* eslint-disable-next-line @next/next/no-img-element -- archivo privado servido por la API con sesión; next/image no lo puede optimizar */}
            <img src={archivoUrl(doc)} alt={doc.titulo} />
          </div>}
    </section>
    <aside className={s.inspector} aria-label="Datos del archivo">
      {enPapelera
        ? <div className={s.stepView}><div><h3>Está en la papelera</h3><p>No se borra. Restáuralo para archivarlo.</p></div></div>
        : <section className={cn(s.step, s.mailStep)} aria-labelledby="bandeja-destino">
            <div><h3 id="bandeja-destino">¿Dónde se guarda?</h3>
              <p>{sugerencias.length && !manual ? "Coinciden con el nombre del archivo. Elige uno u otro destino." : "Elige uno o varios. Un inmueble puede no tener propietario todavía; la persona puede quedar vacía."}</p></div>
            {!manual && <div className={s.picks} role="group" aria-label="Destinos que coinciden">
              {sugerencias.map(x => <Pick key={x.id} sugerencia={x} pressed={x.id === elegida} disabled={busy} onPress={() => setElegida(x.id)} />)}
            </div>}
            {manual && <div className={s.destStack}>
              <Desplegable label="Inmueble" value={inmueble} onChange={setInmueble} options={conNinguno("Ninguno", opcionesInmueble)} disabled={busy} />
              <Desplegable label="Asunto" value={operacion} onChange={setOperacion} options={conNinguno("Ninguno", opcionesOperacion)} disabled={busy} />
              <Desplegable label="Persona" value={persona} onChange={setPersona} options={conNinguno("Sin persona", opcionesPersona)} disabled={busy} />
            </div>}
            {sugerencias.length > 0 && <button type="button" className={s.link} disabled={busy} onClick={() => setOtro(v => !v)}>{manual ? "Ver los que coinciden" : "Otro destino"}</button>}
            <div className={s.stepFoot}>
              <button type="button" className={s.onDark} disabled={busy || !destino} aria-keyshortcuts={atajos ? "E" : undefined} onClick={() => void archivarAqui()}>
                Archivar aquí{atajos && <span className={s.kbdOnDark} aria-hidden="true">E</span>}
              </button>
              <button type="button" className={s.onDark} data-quiet="true" disabled={busy} onClick={despues}>Dejar para después</button>
            </div>
          </section>}
      {!enPapelera && <div className={s.blk}>
        <h3>Tipo de documento</h3>
        <Desplegable hideLabel label="Tipo de documento" placeholder="Sin tipo" value={doc.tipo_documento ?? ""} options={TIPOS} disabled={busy} onChange={tipo => void run({ tipo }, "Tipo guardado.")} />
      </div>}
      <div className={s.blk}>
        <h3>Archivo</h3>
        <div className={s.kv}><span>Llegó</span><span>{fechaHora(doc.created_at)}</span></div>
        <div className={s.kv}><span>Nombre original</span><span>{doc.nombre_original}</span></div>
        <div className={s.kv}><span>Tamaño</span><span>{peso(doc.byte_length)}</span></div>
        <div className={s.kv}><span>Formato</span><span>{formato(doc.mime)}</span></div>
        <div className={s.kv}><span>Huella</span><span title={doc.sha256}>{doc.sha256.slice(0, 12)}…</span></div>
      </div>
    </aside>
  </div>;
}

function Pick({ sugerencia, pressed, disabled, onPress }: { sugerencia: Sugerencia; pressed: boolean; disabled: boolean; onPress: () => void }) {
  const Icono = sugerencia.tipo === "persona" ? UserRound : sugerencia.tipo === "inmueble" ? Building2 : FileText;
  return <button type="button" className={s.pick} aria-pressed={pressed} disabled={disabled} onClick={onPress}>
    <span className={s.pickIcon} aria-hidden="true"><Icono size={18} /></span>
    <span className={s.pickText}><b>{sugerencia.label}</b><small>{sugerencia.detail}</small></span>
  </button>;
}
