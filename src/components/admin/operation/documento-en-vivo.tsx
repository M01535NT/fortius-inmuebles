"use client";
import * as React from "react";
import { Check, Files, ListChecks, Mic, X, ZoomIn, ZoomOut } from "@/components/admin/icons";
import { Button, Pill } from "@/components/admin/kit";
import { FormatoEditor } from "@/components/admin/formato-editor";
import { errorMessage, fetchJson as json } from "@/lib/admin/store";
import { fetchLetterhead } from "@/lib/letterhead";
import { avisoIncompleto, emiteIncompleto, type FormatoDefinition, type FormatoField } from "@/lib/formatos/catalog";
import { datoParaCelda, llenarDesdeDatos, type DatosGuardados } from "@/lib/formatos/datos-expediente";
import { ExpedienteDatosPanel } from "./expediente-datos-panel";
import type { ArchivoCliente } from "./client-documents-tab";
import { DOCUMENTOS } from "@/lib/formatos/documento";
import type { Documento } from "@/lib/formatos/documento/modelo";
import { imageInfo, type ImagenDocumento } from "@/lib/formatos/documento/imagen";
import type { Maqueta, Trazo, Zona } from "@/lib/formatos/documento/pdf";
import { FormatoImages, type Adjunto } from "./formato-images";
import s from "./documento-en-vivo.module.css";

/*
  Captura sobre el documento (EXT-12, prueba con el 04B). Se ve la plantilla tal como sale en
  PDF —se dibuja con el mismo escritor, así coinciden cortes de línea y de página— y cada parte
  que se llena es pulsable: abre su campo a un lado (abajo en celular); al aceptar, el dato
  entra al documento y se guarda con la versión del borrador. Lo que falta queda marcado.

  Captura sin repetir (CSR, 31/10/2026): al abrir, los datos confirmados del expediente llenan
  solos las celdas vacías y se avisa cuántas; lo que falta se separa entre lo propio del formato y
  lo que se resuelve una vez en el expediente (se completa aquí mismo); los documentos del cliente
  se pueden ver al lado; y los campos de texto se pueden dictar donde el navegador lo permite.
*/

/** Reconocimiento de voz del navegador (Chrome, Edge, Safari); donde no existe, el botón no aparece. */
type Reconocedor = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
function crearReconocedor(): Reconocedor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Reconocedor; webkitSpeechRecognition?: new () => Reconocedor };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}
const dictadoDisponible = () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
/** Escribe en un campo controlado por React como si el usuario lo hubiera teclado. */
function escribirEn(campo: HTMLInputElement | HTMLTextAreaElement, texto: string) {
  const proto = campo instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  const actual = campo.value;
  const siguiente = actual && !/\s$/.test(actual) ? `${actual} ${texto}` : `${actual}${texto}`;
  if (setter) setter.call(campo, siguiente); else campo.value = siguiente;
  campo.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Formatos que se capturan sobre el documento en vivo. */
export const EN_VIVO = new Set(["01", "02", "04A", "04B", "04C", "04D", "04E", "04F", "04G", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]);
const IMAGE_KEYS = ["fotoPrincipalId", "croquisId"];
const IMAGE_ERRORS: Record<string, string> = { "Selecciona la fotografía principal adjunta": "fotoPrincipalId", "Selecciona el croquis adjunto": "croquisId" };
type Render = (doc: Documento) => Promise<Maqueta>;
/** Pantalla de celular o tableta vertical (donde el panel de captura sube desde abajo). */
const narrowScreen = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 1023px)").matches;
const empty = (value: unknown) => value === undefined || value === null || String(value).trim() === "";

async function bytesOf(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo cargar la vista del documento. Recarga la página.");
  return new Uint8Array(await response.arrayBuffer());
}
/** Imagen del documento con medidas ya orientadas (como la normaliza el servidor) y su dirección local. */
async function imagenDe(adjunto: Adjunto): Promise<ImagenDocumento | undefined> {
  const response = await fetch(`/api/admin/adjuntos/${adjunto.id}/descargar`);
  if (!response.ok) return undefined;
  const blob = await response.blob(), bytes = new Uint8Array(await blob.arrayBuffer()), info = imageInfo(bytes);
  if (!info) return undefined;
  const bitmap = await createImageBitmap(blob).catch(() => null);
  const size = bitmap ? { width: bitmap.width, height: bitmap.height } : info;
  bitmap?.close();
  return { bytes, tipo: info.tipo, ...size, caption: adjunto.caption, source: adjunto.source, date: adjunto.observed_on, href: URL.createObjectURL(blob) };
}

export function DocumentoEnVivo({ definition, documentId, expedienteId, values, missing, disabled, onAccept, onDraft, onExpedienteSaved }: {
  definition: FormatoDefinition; documentId: string; values: Record<string, unknown>; missing: string[]; disabled: boolean;
  /** Expediente del formato: sus datos confirmados se ofrecen para llenar lo vacío y avisan si algo es distinto. */
  expedienteId?: string;
  /** Integra lo capturado y lo guarda; si falla, la captura sigue abierta con el error. */
  onAccept: (patch: Record<string, unknown>) => Promise<void>;
  /** Avisa si hay una captura abierta con cambios, para no perderla al cerrar la ventana. */
  onDraft: (dirty: boolean) => void;
  /** Se confirmaron datos del expediente desde aquí: el servidor ya llenó este formato, hay que volver a leerlo antes de seguir. */
  onExpedienteSaved?: () => Promise<void> | void;
}) {
  const [render, setRender] = React.useState<Render | null>(null);
  const [maqueta, setMaqueta] = React.useState<Maqueta | null>(null);
  const [failure, setFailure] = React.useState("");
  const [adjuntos, setAdjuntos] = React.useState<Adjunto[]>([]);
  const [imagenes, setImagenes] = React.useState<Record<string, ImagenDocumento>>({});
  const [editing, setEditing] = React.useState<{ zona: Zona; draft: Record<string, unknown> } | null>(null);
  const [saving, setSaving] = React.useState(false), [error, setError] = React.useState("");
  const [listOpen, setListOpen] = React.useState(false);
  // En celular abre grande (tamaño carta, se recorre de lado): ajustada al ancho la hoja se lee y se toca con dificultad.
  // «Ajustar al ancho» la vuelve a encoger.
  const [large, setLarge] = React.useState(() => narrowScreen());
  const [refresh, setRefresh] = React.useState(0);
  const [datosExp, setDatosExp] = React.useState<DatosGuardados | null>(null);
  const [datosRefresh, setDatosRefresh] = React.useState(0);
  const [autoNotice, setAutoNotice] = React.useState("");
  const [completando, setCompletando] = React.useState(false);
  const [verDocs, setVerDocs] = React.useState(false);
  const [archivos, setArchivos] = React.useState<ArchivoCliente[] | null>(null);
  const [archivoAbierto, setArchivoAbierto] = React.useState<ArchivoCliente | null>(null);
  const [dictando, setDictando] = React.useState(false);
  const reconocedor = React.useRef<Reconocedor | null>(null);
  const ultimoCampo = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    if (!expedienteId) return;
    let alive = true;
    json<{ datos: DatosGuardados }>(`/api/admin/expedientes/${expedienteId}/datos`).then(r => { if (alive) setDatosExp(r.datos ?? {}); }).catch(() => { /* sin datos del expediente, el formato se llena a mano */ });
    return () => { alive = false; };
  }, [expedienteId, datosRefresh]);
  // Documentos del cliente, solo cuando se piden.
  React.useEffect(() => {
    if (!verDocs || !expedienteId || archivos) return;
    let alive = true;
    json<{ archivos: ArchivoCliente[] }>(`/api/admin/expedientes/${expedienteId}/archivos`).then(r => { if (alive) setArchivos(r.archivos ?? []); }).catch(() => { if (alive) setArchivos([]); });
    return () => { alive = false; };
  }, [verDocs, expedienteId, archivos]);
  React.useEffect(() => () => reconocedor.current?.stop(), []);
  const zoneRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const panelRef = React.useRef<HTMLDivElement>(null);
  const formId = React.useId();
  const fields = React.useMemo(() => new Map(definition.fields.map(field => [field.key, field])), [definition]);
  const byLabel = React.useMemo(() => new Map(definition.fields.map(field => [field.label, field.key])), [definition]);
  const missingKeys = React.useMemo(() => new Set(missing.map(label => byLabel.get(label) ?? IMAGE_ERRORS[label]).filter((key): key is string => !!key)), [missing, byLabel]);

  // Fuentes y membrete una sola vez; el escritor del PDF se carga aparte para no pesar en el panel.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const [{ crearMaquetador }, regular, bold, letterhead] = await Promise.all([import("@/lib/formatos/documento/pdf"), bytesOf("/fonts/Archivo-Regular.ttf"), bytesOf("/fonts/Archivo-SemiBold.ttf"), fetchLetterhead()]);
      const maquetar = await crearMaquetador({ regular, bold, ...letterhead });
      if (alive) setRender(() => maquetar);
    })().catch(cause => { if (alive) setFailure(errorMessage(cause)); });
    return () => { alive = false; };
  }, []);
  React.useEffect(() => {
    let alive = true;
    json<{ adjuntos: Adjunto[] }>(`/api/admin/formatos/${documentId}/adjuntos`).then(r => { if (alive) setAdjuntos(r.adjuntos ?? []); }).catch(() => undefined);
    return () => { alive = false; };
  }, [documentId, refresh]);
  // Solo se descargan las imágenes elegidas para el documento.
  // También las del reporte fotográfico del 07, una por renglón.
  const fotos = Array.isArray(values.fotografias) ? (values.fotografias as Array<Record<string, unknown>>).map(row => row?.assetId) : [];
  const chosen = [...IMAGE_KEYS.map(key => values[key]), ...fotos].filter((id): id is string => typeof id === "string" && !!id);
  const chosenKey = chosen.join(",");
  React.useEffect(() => {
    let alive = true;
    const wanted = adjuntos.filter(item => chosenKey.split(",").includes(item.id) && !imagenes[item.id]);
    if (!wanted.length) return;
    Promise.all(wanted.map(async item => [item.id, await imagenDe(item)] as const)).then(list => {
      if (alive) setImagenes(old => ({ ...old, ...Object.fromEntries(list.filter((entry): entry is readonly [string, ImagenDocumento] => !!entry[1])) }));
    });
    return () => { alive = false; };
  }, [adjuntos, chosenKey, imagenes]);
  // Las direcciones locales de las imágenes se liberan al cerrar la ventana.
  const imagenesRef = React.useRef(imagenes);
  React.useEffect(() => { imagenesRef.current = imagenes; }, [imagenes]);
  React.useEffect(() => () => { for (const image of Object.values(imagenesRef.current)) if (image.href) URL.revokeObjectURL(image.href); }, []);

  // El documento se vuelve a dibujar con cada tecla de la captura abierta: así se ve en vivo.
  const draft = editing?.draft;
  const shown = React.useMemo(() => draft ? { ...values, ...draft } : values, [values, draft]);
  // La hoja lleva la misma leyenda de «Documento incompleto» que tendría el PDF descargado ahora.
  const aviso = emiteIncompleto(definition.id) ? avisoIncompleto(missing) : undefined;
  React.useEffect(() => {
    const build = DOCUMENTOS[definition.id];
    if (!render || !build) return;
    let alive = true;
    render({ ...build(shown, { imagenes }), aviso }).then(next => { if (alive) setMaqueta(next); }).catch(cause => { if (alive) setFailure(errorMessage(cause)); });
    return () => { alive = false; };
  }, [render, definition.id, shown, imagenes, aviso]);

  const draftDirty = !!editing && Object.entries(editing.draft).some(([key, value]) => JSON.stringify(value ?? "") !== JSON.stringify(values[key] ?? ""));
  React.useEffect(() => { onDraft(draftDirty); }, [draftDirty, onDraft]);

  // Dos celdas pueden abrir los mismos campos (la foto y su ID): la posición las distingue.
  const zoneId = (zona: Zona) => `${zona.page}:${zona.keys.join(",")}:${Math.round(zona.x)}:${Math.round(zona.y)}`;
  function open(zona: Zona) {
    setError(""); setListOpen(false);
    setEditing({ zona, draft: Object.fromEntries(zona.keys.map(key => [key, values[key]])) });
    // En celular el panel sube desde abajo: la celda queda arriba, a la vista mientras se escribe.
    const narrow = narrowScreen();
    requestAnimationFrame(() => zoneRefs.current.get(zoneId(zona))?.scrollIntoView({ block: narrow ? "start" : "nearest", inline: "nearest" }));
  }
  function closePanel() {
    const target = editing && zoneRefs.current.get(zoneId(editing.zona));
    setEditing(null); setError("");
    if (editing?.zona.keys.some(key => IMAGE_KEYS.includes(key))) setRefresh(n => n + 1);
    requestAnimationFrame(() => target?.focus());
  }
  async function accept(event?: React.FormEvent) {
    event?.preventDefault();
    if (!editing || saving) return;
    setSaving(true); setError("");
    try { await onAccept(editing.draft); closePanel(); }
    catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  }
  function openKey(key: string) {
    const zona = maqueta?.zonas.find(item => item.keys.includes(key));
    if (!zona) return;
    open(zona);
  }
  const editingZone = editing?.zona;
  React.useEffect(() => {
    if (!editingZone) return;
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("input:not([readonly]), select, textarea")?.focus());
  }, [editingZone]);

  const label = (key: string) => fields.get(key)?.label ?? key;
  const zoneName = (zona: Zona) => zona.keys.length === 1 ? label(zona.keys[0]) : zona.label;
  const pending = [...missingKeys];
  // Reglas que no son un solo campo (p. ej. «Al menos un canal autorizado para publicidad» del aviso) también cuentan.
  const sueltos = missing.filter(label => !byLabel.has(label) && !IMAGE_ERRORS[label]);
  const faltan = pending.length + sueltos.length;
  // Datos del expediente: lo que puede llenar celdas vacías y lo que ya está escrito distinto (nunca se cambia solo).
  const desdeExpediente = React.useMemo(() => datosExp ? llenarDesdeDatos(definition.id, values, datosExp) : { patch: {}, conflictos: [] }, [datosExp, definition.id, values]);
  const porLlenar = Object.keys(desdeExpediente.patch).length;
  async function usarExpediente(patch: Record<string, unknown>) {
    if (saving || disabled) return;
    setSaving(true); setError("");
    try { await onAccept(patch); } catch (cause) { setError(errorMessage(cause)); } finally { setSaving(false); }
  }
  // CSR-01: lo confirmado en el expediente entra solo en las celdas vacías, al abrir y cada vez que el expediente cambia desde aquí.
  const onAcceptRef = React.useRef(onAccept);
  React.useEffect(() => { onAcceptRef.current = onAccept; }, [onAccept]);
  const patchAuto = desdeExpediente.patch, patchAutoKey = JSON.stringify(patchAuto);
  React.useEffect(() => {
    if (!datosExp || disabled || !Object.keys(patchAuto).length) return;
    let alive = true;
    onAcceptRef.current(patchAuto)
      .then(() => { if (alive) setAutoNotice(`Se llenaron ${Object.keys(patchAuto).length === 1 ? "1 dato" : `${Object.keys(patchAuto).length} datos`} con el expediente.`); })
      .catch(cause => { if (alive) setError(errorMessage(cause)); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- el parche se compara por contenido
  }, [datosExp, disabled, patchAutoKey]);
  // CSR-05: lo que falta se separa entre lo propio del formato y lo que se resuelve una vez en el expediente.
  const pendingExp = pending.filter(key => datoParaCelda(definition.id, key));
  const pendingPropio = pending.filter(key => !datoParaCelda(definition.id, key));
  const clavesExp = [...new Set(pendingExp.map(key => datoParaCelda(definition.id, key)!.clave))];
  // CSR-08: dictar en el último campo de texto que tuvo el foco.
  function dictar() {
    if (dictando) { reconocedor.current?.stop(); return; }
    const campo = ultimoCampo.current ?? panelRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>("textarea, input[type=text]");
    if (!campo) { setError("Pulsa primero el campo donde quieres dictar."); return; }
    const rec = crearReconocedor();
    if (!rec) return;
    rec.lang = "es-MX"; rec.interimResults = false; rec.continuous = false;
    rec.onresult = event => { const texto = Array.from(event.results, r => r[0]?.transcript ?? "").join(" ").trim(); if (texto) escribirEn(campo, texto); };
    rec.onend = () => { setDictando(false); reconocedor.current = null; };
    rec.onerror = () => { setDictando(false); setError("No se pudo escuchar; revisa el permiso del micrófono."); };
    reconocedor.current = rec;
    setError(""); setDictando(true);
    try { rec.start(); } catch { setDictando(false); }
  }
  const panelOpen = !!editing || listOpen;
  const editFields: FormatoField[] = editing ? editing.zona.keys.filter(key => !IMAGE_KEYS.includes(key)).map(key => fields.get(key)).filter((field): field is FormatoField => !!field) : [];
  const imageKey = editing?.zona.keys.find(key => IMAGE_KEYS.includes(key));

  return <div className="relative flex min-h-0 flex-1">
    <div className={`${s.desk} min-w-0 flex-1 overflow-auto`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 sm:px-6">
        {error && !editing ? <p role="alert" className="text-sm text-destructive">{error}</p>
          : <p className="text-sm text-muted-foreground">{autoNotice || "Pulsa una parte del documento para llenarla. Lo que se ve es lo que sale en el PDF."}</p>}
        <span className="flex flex-wrap gap-1">
          {expedienteId && <Button variant="ghost" aria-expanded={verDocs} onClick={() => setVerDocs(open => !open)}><Files size={16} aria-hidden="true" />Documentos del cliente</Button>}
          <span className="flex gap-1 lg:hidden"><Button variant="ghost" aria-pressed={large} onClick={() => setLarge(value => !value)}>{large ? <ZoomOut size={16} aria-hidden="true" /> : <ZoomIn size={16} aria-hidden="true" />}{large ? "Ajustar al ancho" : "Ver más grande"}</Button><Button variant="ghost" aria-expanded={listOpen} onClick={() => { setEditing(null); setListOpen(open => !open); }}><ListChecks size={16} aria-hidden="true" />Qué falta{faltan ? ` (${faltan})` : ""}</Button></span>
        </span>
      </div>
      {failure ? <p role="alert" className="p-6 text-sm text-destructive">{failure}</p>
        : !maqueta ? <p role="status" className="p-6 text-sm text-muted-foreground">Preparando el documento…</p>
        : <div className={s.sheets} data-large={large}>{maqueta.pages.map((trazos, page) => <div key={page} className={s.sheet}>
          <svg viewBox={`0 0 ${maqueta.width} ${maqueta.height}`} role="img" aria-label={`Hoja ${page + 1} de ${maqueta.pages.length}`}>
            {trazos.map((trazo, index) => <Dibujo key={index} trazo={trazo} height={maqueta.height} />)}
          </svg>
          {maqueta.zonas.filter(zona => zona.page === page).map(zona => {
            const id = zoneId(zona), filled = zona.keys.some(key => !empty(values[key]));
            return <button key={id} type="button" ref={node => { if (node) zoneRefs.current.set(id, node); else zoneRefs.current.delete(id); }}
              className={s.zone} disabled={disabled || saving}
              data-missing={zona.keys.some(key => missingKeys.has(key))} data-active={editing ? zoneId(editing.zona) === id : false}
              aria-label={`${zoneName(zona)}${filled ? "" : ", sin llenar"}`}
              style={{ left: `${zona.x / maqueta.width * 100}%`, top: `${(maqueta.height - zona.y - zona.h) / maqueta.height * 100}%`, width: `${zona.w / maqueta.width * 100}%`, height: `${zona.h / maqueta.height * 100}%` }}
              onClick={() => open(zona)} />;
          })}
        </div>)}</div>}
    </div>

    {/* CSR-05: los documentos que entregó el cliente, a la vista mientras se captura. */}
    {verDocs && <section aria-label="Documentos del cliente" className={s.viewer}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="m-0 flex-1 text-base font-semibold">{archivoAbierto ? archivoAbierto.titulo : "Documentos del cliente"}</h3>
        {archivoAbierto && <Button variant="ghost" onClick={() => setArchivoAbierto(null)}>Todos</Button>}
        <Button variant="ghost" iconOnly aria-label="Cerrar los documentos" onClick={() => { setVerDocs(false); setArchivoAbierto(null); }}><X size={18} aria-hidden="true" /></Button>
      </div>
      {archivoAbierto ? archivoAbierto.mime === "application/pdf"
        ? <iframe title={archivoAbierto.titulo} src={`/api/admin/archivos-cliente/${archivoAbierto.id}/descargar`} className="min-h-0 flex-1 border-0 bg-white" />
        : <div className="min-h-0 flex-1 overflow-auto bg-[color:var(--muted)] p-2"><img src={`/api/admin/archivos-cliente/${archivoAbierto.id}/descargar`} alt={archivoAbierto.titulo} className="mx-auto h-auto max-w-full" /></div>
        : <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
          {!archivos ? <p role="status" className="px-2 text-sm text-muted-foreground">Consultando…</p>
            : !archivos.length ? <p className="px-2 text-sm text-muted-foreground">Este expediente todavía no tiene documentos del cliente. Se suben en la operación, en «Documentos del cliente».</p>
            : <ul className="flex flex-col gap-0.5">{archivos.map(archivo => <li key={archivo.id}><button type="button" className={s.missingItem} onClick={() => setArchivoAbierto(archivo)}><span className="flex-1 [overflow-wrap:anywhere]">{archivo.titulo}</span><span className="text-xs text-muted-foreground">{archivo.mime === "application/pdf" ? "PDF" : "Imagen"}</span></button></li>)}</ul>}
        </div>}
    </section>}

    <aside aria-label={editing ? "Captura" : completando ? "Completar en el expediente" : "Qué falta"} className={s.aside} data-open={panelOpen || completando}>
      {/* Las imágenes traen su propio formulario de carga: el panel no es un <form> y «Aceptar» apunta al de los campos. */}
      {editing ? <div ref={panelRef} onFocusCapture={event => { const t = event.target; if (t instanceof HTMLTextAreaElement || (t instanceof HTMLInputElement && (t.type === "text" || t.type === "search"))) ultimoCampo.current = t; }} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); closePanel(); } }} className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-xs font-semibold text-muted-foreground">Hoja {editing.zona.page + 1}</p>
            <h3 className="m-0 text-lg font-semibold leading-tight [overflow-wrap:anywhere]">{zoneName(editing.zona)}</h3>
          </div>
          <Button variant="ghost" iconOnly aria-label="Cancelar la captura" onClick={closePanel}><X size={18} aria-hidden="true" /></Button>
        </div>
        {/* El desplazamiento va en un div: un fieldset no se encoge dentro del panel y sus campos se salían por debajo. */}
        <div className="min-h-0 flex-1 overflow-auto">
          <fieldset disabled={saving || disabled} className="flex min-w-0 flex-col gap-4 px-5 py-5">
            {imageKey ? <FormatoImages documentId={documentId} values={{ ...values, ...editing.draft }} disabled={saving || disabled}
              onChange={(key, value) => setEditing(old => old && { ...old, draft: IMAGE_KEYS.includes(key) ? { ...old.draft, [key]: value } : old.draft })}
              // La fecha de toma sale de la imagen elegida si todavía no se anotó (solo si el formato la imprime).
              onChosen={(key, adjunto) => {
                const fechaKey = key === "fotoPrincipalId" ? "fotoFecha" : "croquisFecha";
                if (!adjunto.observed_on || !fields.has(fechaKey)) return;
                setEditing(old => old && (old.draft[fechaKey] ?? values[fechaKey]) ? old : old && { ...old, draft: { ...old.draft, [fechaKey]: adjunto.observed_on } });
              }} />
              : <>
                {/* El reporte fotográfico: primero se suben las imágenes, luego se eligen y se les pone pie. */}
                {editing.zona.keys.includes("fotografias") && <FormatoImages documentId={documentId} values={{ ...values, ...editing.draft }} disabled={saving || disabled}
                  onChange={(key, value) => setEditing(old => old && IMAGE_KEYS.includes(key) ? { ...old, draft: { ...old.draft, [key]: value } } : old)}
                  onUploaded={adjunto => setAdjuntos(list => list.some(item => item.id === adjunto.id) ? list : [...list, adjunto])} />}
                {/* Sin validación del navegador: un dato faltante no impide guardar lo capturado (RP-82); lo que falta queda marcado. */}
                <form id={formId} noValidate onSubmit={accept}><FormatoEditor narrow definition={{ ...definition, fields: editFields }} images={adjuntos} values={{ ...values, ...editing.draft }} onChange={(key, value) => setEditing(old => old && { ...old, draft: { ...old.draft, [key]: value } })} /></form>
              </>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </fieldset>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">
          {!imageKey && dictadoDisponible() && <Button variant="ghost" aria-pressed={dictando} disabled={saving || disabled} onClick={dictar}><Mic size={16} aria-hidden="true" />{dictando ? "Escuchando… pulsa para parar" : "Dictar"}</Button>}
          <span className="flex-1" />
          <Button variant="ghost" onClick={closePanel}>Cancelar</Button>
          {imageKey ? <Button variant="primary" disabled={saving || disabled} onClick={() => void accept()}><Check size={16} aria-hidden="true" />{saving ? "Guardando…" : "Aceptar"}</Button>
            : <Button type="submit" form={formId} variant="primary" disabled={saving || disabled}><Check size={16} aria-hidden="true" />{saving ? "Guardando…" : "Aceptar"}</Button>}
        </div>
      </div>
        : completando && expedienteId ? <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h3 className="m-0 flex-1 text-lg font-semibold">Completar en el expediente</h3>
            <Button variant="ghost" iconOnly aria-label="Volver a qué falta" onClick={() => setCompletando(false)}><X size={18} aria-hidden="true" /></Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <p className="mb-3 px-2 text-sm text-muted-foreground">Lo que confirmes aquí llena este formato y los demás del expediente.</p>
            <ExpedienteDatosPanel operationId={expedienteId} solo={clavesExp.length ? clavesExp : undefined} titulo="Datos que faltan" onSaved={() => { void Promise.resolve(onExpedienteSaved?.()).catch(cause => setError(errorMessage(cause))).finally(() => setDatosRefresh(n => n + 1)); }} />
          </div>
        </div>
        : <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <h3 className="m-0 flex-1 text-lg font-semibold">Qué falta para el PDF</h3>
            {faltan ? <Pill size="sm" tone="warn">{faltan}</Pill> : <Pill size="sm" tone="success">Completo</Pill>}
            <span className="lg:hidden"><Button variant="ghost" iconOnly aria-label="Cerrar la lista" onClick={() => setListOpen(false)}><X size={18} aria-hidden="true" /></Button></span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-3 py-4">
            {(porLlenar > 0 || desdeExpediente.conflictos.length > 0) && <section aria-label="Datos del expediente" className="flex flex-col gap-2 rounded-[12px] border border-border p-3">
              <p className="text-sm font-semibold">Datos del expediente</p>
              {porLlenar > 0 && <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">{porLlenar === 1 ? "Hay 1 dato confirmado" : `Hay ${porLlenar} datos confirmados`} que puede llenar celdas vacías de este formato.</p>
                <Button variant="primary" disabled={disabled || saving} onClick={() => void usarExpediente(desdeExpediente.patch)}><Check size={16} aria-hidden="true" />Llenar con los datos del expediente</Button>
              </div>}
              {desdeExpediente.conflictos.length > 0 && <ul className="flex flex-col gap-2">{desdeExpediente.conflictos.map(conflicto => <li key={conflicto.key} className="flex flex-col gap-1 text-sm">
                <span><strong>{label(conflicto.key)}</strong>: aquí dice «{String(conflicto.actual)}»; el expediente tiene «{String(conflicto.propuesto)}».</span>
                <span><Button disabled={disabled || saving} onClick={() => void usarExpediente({ [conflicto.key]: conflicto.propuesto })}>Usar el del expediente</Button></span>
              </li>)}</ul>}
              {error && !editing && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </section>}
            {pendingExp.length > 0 && expedienteId && <section aria-label="Se completan en el expediente" className="flex flex-col gap-2 rounded-[12px] border border-border p-3">
              <p className="text-sm font-semibold">Se completan una vez en el expediente</p>
              <ul className="flex flex-col gap-0.5">{pendingExp.map(key => <li key={key}><button type="button" className={s.missingItem} disabled={disabled || !maqueta} onClick={() => openKey(key)}><span className="flex-1">{label(key)}</span></button></li>)}</ul>
              <Button variant="primary" disabled={disabled || saving} onClick={() => { setListOpen(false); setCompletando(true); }}>Completar en el expediente</Button>
            </section>}
            {faltan ? <ul className="flex flex-col gap-0.5">{pendingPropio.map(key => <li key={key}><button type="button" className={s.missingItem} disabled={disabled || !maqueta} onClick={() => openKey(key)}><span className="flex-1">{label(key)}</span></button></li>)}
              {sueltos.map(text => <li key={text} className="px-3 py-2 text-sm">{text}</li>)}</ul>
              : <p className="px-2 text-sm text-muted-foreground">Ya tiene lo indispensable para generar el PDF. Puedes seguir llenando lo demás.</p>}
            <p className="mt-auto px-2 text-xs text-muted-foreground">Lo de borde vino falta. Cada dato se guarda al aceptar.</p>
          </div>
        </div>}
    </aside>
  </div>;
}

/** Un trazo del PDF en la hoja de la pantalla (el eje vertical se invierte). */
function Dibujo({ trazo, height }: { trazo: Trazo; height: number }) {
  switch (trazo.kind) {
    // El ancho medido por el PDF manda: así cada renglón calza igual aunque la letra de pantalla difiera un poco.
    case "text": return <text className={trazo.serif ? s.serif : s.text} x={trazo.x} y={height - trazo.y} fontSize={trazo.size} fontWeight={trazo.bold ? (trazo.serif ? 700 : 600) : 400} fill={`#${trazo.color}`} {...(trazo.w > 0 && trazo.text.trim() ? { textLength: trazo.w, lengthAdjust: "spacingAndGlyphs" as const } : {})}>{trazo.text}</text>;
    case "rect": return <rect x={trazo.x} y={height - trazo.y - trazo.h} width={trazo.w} height={trazo.h} fill={trazo.fill ? `#${trazo.fill}` : "none"} stroke={trazo.stroke ? `#${trazo.stroke}` : undefined} strokeWidth={trazo.stroke ? trazo.strokeWidth ?? 1 : undefined} />;
    case "line": return <line x1={trazo.x1} y1={height - trazo.y1} x2={trazo.x2} y2={height - trazo.y2} stroke={`#${trazo.color}`} strokeWidth={trazo.width} />;
    case "image": return <image href={trazo.href} x={trazo.x} y={height - trazo.y - trazo.h} width={trazo.w} height={trazo.h} preserveAspectRatio="xMidYMid meet" />;
  }
}
