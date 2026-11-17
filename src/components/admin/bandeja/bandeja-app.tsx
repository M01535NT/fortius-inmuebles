"use client";
import * as React from "react";
import { ArrowLeft, Clock, FileDown, FileText, Folder, Pencil, Search, Trash2, Upload, ZoomIn } from "@/components/admin/icons";
import { ActionsMenu, Avatar, Button, Kbd, Notice, Segmented, Swap, Thumb } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import { UndoNotice, useUndo } from "@/components/admin/workspace/undo-notice";
import { useSingleKeyShortcuts } from "@/components/admin/workspace/shortcuts";
import { VistaPdf } from "@/components/admin/vista-pdf";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Label, RadioGroup, RadioGroupItem } from "@/components/ui/controls";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { typingTarget } from "@/lib/admin/commands";
import { db, errorMessage, fetchJson, loadAllDossiers, useCollection } from "@/lib/admin/store";
import type { OperationRecord } from "@/lib/admin/operation-view";
import { SIN_DESTINO, sugerirDestinos, type Destino, type Sugerencia } from "@/lib/admin/bandeja-sugerencias";
import { cn } from "@/lib/utils";
import { useAviso } from "./aviso";
import s from "./bandeja.module.css";

/*
  FLX-01 · Bandeja (RP-101, RP-102) y LV-10d · Bandeja como correo (boceto del 14/11/2026). Lo que
  llega se guarda sin llenar nada: se suelta en cualquier parte de la pantalla o se elige con
  «Agregar». Se recorre como un correo: lista a la izquierda, el documento en grande al centro y
  «¿Dónde se guarda?» a la derecha, con los destinos que coinciden con el nombre del archivo (cada
  uno con la foto del inmueble o la cara de la persona). Archivar y mandar a la papelera avisan con
  «Deshacer», que el servidor revierte de verdad. Atajos de una tecla (UX-03): J y K para moverse,
  E para archivar y # para la papelera; se apagan con la preferencia de atajos y nunca actúan dentro
  de un campo, un menú abierto o una ventana. Piezas de DEC-52: selector con buscador para el
  destino, «Select» para el tipo, menú del kit, ventana para la vista grande y avisos de Sonner.
*/

type Documento = {
  id: string; titulo: string; nombre_original: string; mime: string; byte_length: number; sha256: string; tipo_documento: string | null;
  asesor_id: string | null; cliente_id: string | null; propiedad_slug: string | null; expediente_id: string | null;
  archivado_el: string | null; created_at: string; deleted_at: string | null;
};
type Vista = "pendientes" | "papelera";
const TIPOS = [
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
const archivoUrl = (d: Documento) => `/api/admin/bandeja-vieja/${d.id}/descargar`;
const JSON_HEADERS = { "Content-Type": "application/json" };
const porFecha = (a: Documento, b: Documento) => b.created_at.localeCompare(a.created_at);

async function subir(file: File): Promise<Documento> {
  const prepared = await fetchJson<{ signedUrl: string; ticket: string }>("/api/admin/bandeja-vieja", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
  const sent = await fetch(prepared.signedUrl, { method: "PUT", credentials: "omit", headers: { "Content-Type": file.type }, body: file });
  if (!sent.ok) throw new Error("No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.");
  return (await fetchJson<{ documento: Documento }>("/api/admin/bandeja-vieja/completar", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ ticket: prepared.ticket }) })).documento;
}
const enviar = async (doc: Documento, body: Record<string, unknown>) =>
  (await fetchJson<{ documento: Documento }>(`/api/admin/bandeja-vieja/${doc.id}`, { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ ...body, esperado: visto(doc) }) })).documento;

/** Un atajo de una tecla no actúa sobre un campo, ni detrás de una ventana, un menú o una lista abierta. */
const atajoBloqueado = (event: KeyboardEvent) => event.ctrlKey || event.metaKey || event.altKey || typingTarget(event.target)
  || !!document.querySelector("dialog[open], [role=dialog][data-state=open], [role=alertdialog], [role=menu], [role=listbox]");

type Teclas = { archivar: () => void; papelera: () => void };

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
  const aviso = useAviso();
  const undo = useUndo();
  const { value: atajos } = useSingleKeyShortcuts();
  const input = React.useRef<HTMLInputElement>(null);
  const teclasRef = React.useRef<Teclas | null>(null);

  const [vuelta, setVuelta] = React.useState(0);
  const cargar = React.useCallback(() => setVuelta(n => n + 1), []);
  React.useEffect(() => {
    let alive = true;
    fetchJson<{ documentos: Documento[]; papelera: Documento[] }>("/api/admin/bandeja-vieja")
      .then(data => { if (alive) { setDocs(data.documentos); setPapelera(data.papelera); setEstado("listo"); } })
      .catch(e => { if (alive) { setError(errorMessage(e)); setEstado("error"); } });
    return () => { alive = false; };
  }, [vuelta]);
  React.useEffect(() => { let alive = true; loadAllDossiers<OperationRecord>().then(all => { if (alive) setOperaciones(all.filter(o => !o.deleted_at)); }).catch(() => undefined); return () => { alive = false; }; }, []);

  const limpiar = () => { setError(null); aviso.limpiar(); };

  async function recibir(files: File[]) {
    limpiar();
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
    if (ultimo) { setVista("pendientes"); setSelected(ultimo.id); aviso.avisar(guardados === 1 ? "Guardado en la Bandeja. No hizo falta llenar nada." : `${guardados} archivos guardados en la Bandeja.`); }
  }

  const lista = vista === "pendientes" ? docs : papelera;
  const current = lista.find(d => d.id === selected) ?? (showDetail ? undefined : lista[0]);
  const abrir = (id: string) => { setSelected(id); setShowDetail(true); limpiar(); };

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
    limpiar();
    try { const documento = await enviar(doc, body); colocar(documento); if (hecho) aviso.avisar(hecho); return documento; }
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
    setSelected(next.id); limpiar();
    const fila = document.getElementById(`bandeja-fila-${next.id}`);
    fila?.scrollIntoView?.({ block: "nearest" });
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
      else if (k === "e" && !event.repeat && teclasRef.current) { event.preventDefault(); teclasRef.current.archivar(); }
      else if (k === "#" && !event.repeat && teclasRef.current) { event.preventDefault(); teclasRef.current.papelera(); }
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
          : estado === "error" && !lista.length ? <div className={s.empty}><p>No se pudo cargar la Bandeja.</p><Button onClick={() => { setEstado("cargando"); setError(null); cargar(); }}>Reintentar</Button></div>
          : !lista.length ? <p className={s.empty}>{vista === "pendientes" ? "No hay nada por archivar. Suelta aquí un PDF o una foto, o usa «Agregar»; desde el celular puedes tomar la foto en ese momento." : "La papelera está vacía."}</p>
          : lista.map(d => <button key={d.id} id={`bandeja-fila-${d.id}`} type="button" className={s.mrow} aria-current={d.id === current?.id} onClick={() => abrir(d.id)}>
            <span className={s.ftype} aria-hidden="true">
              {d.mime.startsWith("image/")
                // eslint-disable-next-line @next/next/no-img-element -- archivo privado servido por la API con sesión; next/image no lo puede optimizar
                ? <img src={archivoUrl(d)} alt="" loading="lazy" />
                : <><FileText size={18} /><span>{formato(d.mime)}</span></>}
            </span>
            <span className={s.rowText}><b>{d.titulo}</b><small>{TIPOS.find(t => t.value === d.tipo_documento)?.label ?? "Sin tipo"} · {peso(d.byte_length)}</small></span>
            <span className={s.rowWhen}>{cuando(d.created_at)}</span>
          </button>)}
      </div>
      <p className={s.foot}>{atajos && vista === "pendientes" && lista.length > 0
        ? <><span><Kbd>J</Kbd> <Kbd>K</Kbd> moverse</span><span><Kbd>E</Kbd> archivar</span><span><Kbd>#</Kbd> papelera</span></>
        : "Suelta archivos en cualquier parte de la pantalla. Se guardan sin llenar nada."}</p>
    </aside>
    <main className={s.detail}>
      {current
        ? <Detalle key={current.id} doc={current} enPapelera={vista === "papelera"} error={error} aviso={aviso.texto} atajos={atajos} teclasRef={teclasRef}
            onBack={() => setShowDetail(false)} cambiar={cambiar} archivar={archivar} aPapelera={aPapelera} despues={() => { if (showDetail && window.matchMedia("(max-width: 900px)").matches) setShowDetail(false); else mover(1); }}
            propiedades={propiedades} clientes={clientes} operaciones={operaciones} />
        : <div className={s.view}>
            {error && <Notice tone="warn">{error}</Notice>}
            {aviso.texto && <p className={s.hint} role="status">{aviso.texto}</p>}
            <div className={s.stepView}><div><h3>{lista.length ? "Elige un archivo de la lista" : vista === "pendientes" ? "La Bandeja está vacía" : "Nada en la papelera"}</h3><p>{vista === "pendientes" ? "Lo que llegue aparecerá aquí hasta que lo archives." : "Lo que mandes a la papelera se puede restaurar desde aquí."}</p></div></div>
          </div>}
    </main>
    <UndoNotice current={undo.current} clear={undo.clear} ms={undo.ms} onError={setError} className={s.undo} />
  </div>;
}

type Registro = { slug: string; titulo: string; codigo?: string | null; galeria?: Array<{ src?: string | null }> };
type Persona = { id: string; nombre: string };

/** Foto antes que ícono (RP-104): el inmueble con su foto; la persona con su cara; el asunto con la foto de su inmueble o la cara de su persona. */
function Cara({ tipo, destino, label, size, inmuebles, personas }: { tipo: Sugerencia["tipo"]; destino: Destino; label: string; size: number; inmuebles: Map<string, Registro>; personas: Map<string, Persona> }) {
  const casa = destino.propiedadSlug ? inmuebles.get(destino.propiedadSlug) : undefined;
  const persona = destino.clienteId ? personas.get(destino.clienteId) : undefined;
  if (tipo === "persona" || (tipo === "operacion" && !casa?.galeria?.[0]?.src && persona)) return <Avatar name={persona?.nombre ?? label} size={size} />;
  return <Thumb src={casa?.galeria?.[0]?.src} size={size} icon={tipo === "operacion" ? <FileText size={Math.round(size * 0.45)} aria-hidden="true" /> : undefined} />;
}

function Detalle({ doc, enPapelera, error, aviso, atajos, teclasRef, onBack, cambiar, archivar, aPapelera, despues, propiedades, clientes, operaciones }: {
  doc: Documento; enPapelera: boolean; error: string | null; aviso: string | null; atajos: boolean; teclasRef: React.RefObject<Teclas | null>;
  onBack: () => void; despues: () => void;
  cambiar: (doc: Documento, body: Record<string, unknown>, hecho: string | null) => Promise<Documento | null>;
  archivar: (doc: Documento, destino: Destino, texto: string) => Promise<void>; aPapelera: (doc: Documento) => Promise<void>;
  propiedades: Registro[]; clientes: Persona[]; operaciones: OperationRecord[];
}) {
  const sugerencias = React.useMemo(() => sugerirDestinos(doc, propiedades, operaciones, clientes), [doc, propiedades, operaciones, clientes]);
  const inmuebles = React.useMemo(() => new Map(propiedades.map(p => [p.slug, p])), [propiedades]);
  const personas = React.useMemo(() => new Map(clientes.map(c => [c.id, c])), [clientes]);
  const [elegida, setElegida] = React.useState<string>(sugerencias[0]?.id ?? "");
  const [otro, setOtro] = React.useState(false);
  const [inmueble, setInmueble] = React.useState(NINGUNO), [operacion, setOperacion] = React.useState(NINGUNO), [persona, setPersona] = React.useState(NINGUNO);
  const [renombrando, setRenombrando] = React.useState(false);
  const [grande, setGrande] = React.useState(false);
  const [titulo, setTitulo] = React.useState(doc.titulo);
  const [busy, setBusy] = React.useState(false);
  const id = React.useId();

  const cara = (tipo: Sugerencia["tipo"], destino: Destino, label: string) => <Cara tipo={tipo} destino={destino} label={label} size={28} inmuebles={inmuebles} personas={personas} />;
  const opcionesInmueble = React.useMemo<ComboboxOption[]>(() => propiedades.map(p => ({ value: p.slug, label: p.titulo, detail: p.codigo ?? undefined, media: <Thumb src={p.galeria?.[0]?.src} size={28} /> })), [propiedades]);
  const opcionesPersona = React.useMemo<ComboboxOption[]>(() => clientes.map(c => ({ value: c.id, label: c.nombre, media: <Avatar name={c.nombre} size={28} /> })), [clientes]);
  const opcionesOperacion = React.useMemo<ComboboxOption[]>(() => operaciones.map(o => ({
    value: o.id, label: o.unidad || o.folio, detail: o.unidad ? o.folio : undefined,
    keywords: [o.folio, (o.cliente_id && personas.get(o.cliente_id)?.nombre) || ""],
    media: <Cara tipo="operacion" destino={{ expedienteId: o.id, propiedadSlug: o.propiedad_slug ?? null, clienteId: o.cliente_id ?? null }} label={o.folio} size={28} inmuebles={inmuebles} personas={personas} />,
  })), [operaciones, inmuebles, personas]);
  const conNinguno = (label: string, options: ComboboxOption[]): ComboboxOption[] => [{ value: NINGUNO, label }, ...options];
  const elegido = (value: string) => value === NINGUNO ? null : value;
  const manual = otro || !sugerencias.length;
  const sugerencia = manual ? undefined : sugerencias.find(x => x.id === elegida);
  const destino: Destino | null = sugerencia ? sugerencia.destino
    : inmueble !== NINGUNO || operacion !== NINGUNO || persona !== NINGUNO ? { propiedadSlug: elegido(inmueble), expedienteId: elegido(operacion), clienteId: elegido(persona) } : null;
  const destinoTexto = sugerencia ? sugerencia.label
    : ([[inmueble, opcionesInmueble], [operacion, opcionesOperacion], [persona, opcionesPersona]] as const).map(([value, options]) => value === NINGUNO ? null : options.find(o => o.value === value)?.label).filter(Boolean).join(" · ");
  const run = async (body: Record<string, unknown>, hecho: string) => { setBusy(true); const r = await cambiar(doc, body, hecho); setBusy(false); return r; };
  const archivarAqui = async () => { if (!destino || busy) return; setBusy(true); await archivar(doc, destino, `Archivado en ${destinoTexto}.`); setBusy(false); };

  const ultimo = React.useRef<Teclas>({ archivar: () => undefined, papelera: () => undefined });
  React.useEffect(() => { ultimo.current = { archivar: () => void archivarAqui(), papelera: () => { if (!busy) void aPapelera(doc); } }; });
  React.useEffect(() => {
    if (enPapelera) return;
    teclasRef.current = { archivar: () => ultimo.current.archivar(), papelera: () => ultimo.current.papelera() };
    return () => { teclasRef.current = null; };
  }, [enPapelera, teclasRef]);

  const vistaDocumento = (completa: boolean) => doc.mime === "application/pdf"
    ? <VistaPdf url={archivoUrl(doc)} titulo={doc.titulo} maxPaginas={completa ? 20 : 6} soloPrimeraEnCelular={!completa} />
    : <div className={s.paper} data-kind="image" data-full={completa || undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- archivo privado servido por la API con sesión; next/image no lo puede optimizar */}
        <img src={archivoUrl(doc)} alt={doc.titulo} />
      </div>;

  return <div className={s.body}>
    <section className={s.view} aria-label="Documento">
      <div className={s.viewbar}>
        <Button variant="ghost" iconOnly className={s.back} aria-label="Volver a la lista" onClick={onBack}><ArrowLeft size={18} aria-hidden /></Button>
        <div className={s.title}>
          {renombrando
            ? <form onSubmit={async event => { event.preventDefault(); const limpio = titulo.trim(); if (!limpio || limpio === doc.titulo) { setRenombrando(false); return; } if (await run({ titulo: limpio }, "Nombre cambiado.")) setRenombrando(false); }}>
                <label className={s.sr} htmlFor={`${id}-titulo`}>Nombre del documento</label>
                <input id={`${id}-titulo`} className={inputClass} value={titulo} maxLength={240} autoFocus onChange={event => setTitulo(event.target.value)} onBlur={() => { setTitulo(doc.titulo); setRenombrando(false); }} onKeyDown={event => { if (event.key === "Escape") { setTitulo(doc.titulo); setRenombrando(false); } }} />
              </form>
            : <h2>{doc.titulo}</h2>}
          <span>{enPapelera ? "En la papelera" : `Llegó el ${fechaHora(doc.created_at)} · sin archivar`}</span>
        </div>
        <div className={s.actions}>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" iconOnly aria-label="Ver en grande" onClick={() => setGrande(true)}><ZoomIn size={18} aria-hidden /></Button>
          </TooltipTrigger><TooltipContent>Ver en grande</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" iconOnly aria-label="Abrir el archivo en otra pestaña" onClick={() => window.open(archivoUrl(doc), "_blank", "noopener")}><FileDown size={18} aria-hidden /></Button>
          </TooltipTrigger><TooltipContent>Abrir en otra pestaña</TooltipContent></Tooltip>
          {enPapelera
            ? <Button variant="primary" disabled={busy} onClick={() => void run({ papelera: false }, "Restaurado: volvió a la Bandeja.")}>Restaurar</Button>
            : <ActionsMenu label="Más acciones" disabled={busy} actions={[
                { label: "Cambiar el nombre", icon: <Pencil size={16} aria-hidden="true" />, onSelect: () => setRenombrando(true) },
                { label: "Dejar para después", icon: <Clock size={16} aria-hidden="true" />, onSelect: despues },
                { label: "Mandar a la papelera", icon: <Trash2 size={16} aria-hidden="true" />, danger: true, separated: true, onSelect: () => void aPapelera(doc) },
              ]} />}
        </div>
      </div>
      {error && <Notice tone="warn">{error}</Notice>}
      {aviso && <p className={s.hint} role="status">{aviso}</p>}
      {vistaDocumento(false)}
    </section>
    <Dialog open={grande} onOpenChange={setGrande}>
      <DialogContent className={s.grande} closeLabel="Cerrar la vista grande">
        <div className={s.grandeHead}><DialogTitle>{doc.titulo}</DialogTitle><DialogDescription>{formato(doc.mime)} · {peso(doc.byte_length)}</DialogDescription></div>
        {grande && vistaDocumento(true)}
      </DialogContent>
    </Dialog>
    <aside className={s.inspector} aria-label="Datos del archivo">
      {enPapelera
        ? <div className={s.stepView}><div><h3>Está en la papelera</h3><p>No se borra. Restáuralo para archivarlo.</p></div></div>
        : <section className={s.donde} aria-labelledby={`${id}-donde`}>
            <div><h3 id={`${id}-donde`}>¿Dónde se guarda?</h3>
              <p>{sugerencias.length && !manual ? "Coinciden con el nombre del archivo. Elige uno u otro destino." : "Elige uno o varios. Un inmueble puede no tener propietario todavía; la persona puede quedar vacía."}</p></div>
            <Swap id={manual ? "manual" : "sugeridos"} className={s.destStack}>
              {manual
                ? <>
                    <Destinatario id={`${id}-inmueble`} label="Inmueble" value={inmueble} onChange={setInmueble} options={conNinguno("Ninguno", opcionesInmueble)} disabled={busy} buscar="Buscar por nombre o código…" />
                    <Destinatario id={`${id}-asunto`} label="Asunto" value={operacion} onChange={setOperacion} options={conNinguno("Ninguno", opcionesOperacion)} disabled={busy} buscar="Buscar por folio o persona…" />
                    <Destinatario id={`${id}-persona`} label="Persona" value={persona} onChange={setPersona} options={conNinguno("Sin persona", opcionesPersona)} disabled={busy} buscar="Buscar por nombre…" />
                  </>
                : <RadioGroup value={elegida} onValueChange={setElegida} disabled={busy} aria-label="Destinos que coinciden" className={s.picks}>
                    {sugerencias.map(x => <label key={x.id} className={s.pick}>
                      {cara(x.tipo, x.destino, x.label)}
                      <span className={s.pickText}><b>{x.label}</b><small>{x.detail}</small></span>
                      <RadioGroupItem value={x.id} className={s.pickRadio} />
                    </label>)}
                  </RadioGroup>}
            </Swap>
            {sugerencias.length > 0 && <Button variant="ghost" className={s.otro} disabled={busy} onClick={() => setOtro(v => !v)}><Search size={16} aria-hidden />{manual ? "Ver los que coinciden" : "Otro destino"}</Button>}
            <div className={s.stepFoot}>
              <Button variant="primary" disabled={busy || !destino} aria-keyshortcuts={atajos ? "E" : undefined} onClick={() => void archivarAqui()}>
                <Folder size={16} aria-hidden />Archivar aquí{atajos && <span className={s.kbdOn} aria-hidden="true">E</span>}
              </Button>
              <Button variant="ghost" disabled={busy} onClick={despues}>Dejar para después</Button>
            </div>
          </section>}
      {!enPapelera && <div className={s.blk}>
        <h3 id={`${id}-tipo`}>Tipo de documento</h3>
        <Select value={doc.tipo_documento ?? ""} disabled={busy} onValueChange={tipo => { if (tipo !== doc.tipo_documento) void run({ tipo }, "Tipo guardado."); }}>
          <SelectTrigger aria-labelledby={`${id}-tipo`}><SelectValue placeholder="Sin tipo" /></SelectTrigger>
          <SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>}
      <div className={s.blk}>
        <h3>Archivo</h3>
        <div className={s.kv}><span>Llegó</span><span>{fechaHora(doc.created_at)}</span></div>
        <div className={s.kv}><span>Nombre original</span><span>{doc.nombre_original}</span></div>
        <div className={s.kv}><span>Tamaño</span><span>{peso(doc.byte_length)}</span></div>
        <div className={s.kv}><span>Formato</span><span>{formato(doc.mime)}</span></div>
      </div>
    </aside>
  </div>;
}

/** Un destino a mano: selector con buscador (shadcn/ui «Combobox») con su etiqueta visible. */
function Destinatario({ id, label, value, onChange, options, disabled, buscar }: { id: string; label: string; value: string; onChange: (v: string) => void; options: ComboboxOption[]; disabled: boolean; buscar: string }) {
  return <div className={s.field}>
    <Label htmlFor={id} className={s.fieldLabel}>{label}</Label>
    <Combobox id={id} value={value} onChange={onChange} options={options} disabled={disabled} searchPlaceholder={buscar} empty="No hay coincidencias" />
  </div>;
}
