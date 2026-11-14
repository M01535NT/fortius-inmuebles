"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, FileText, MessageCircle, Phone, Plus, Star, Trash2, Upload, X, ZoomIn, ZoomOut } from "@/components/admin/icons";
import { Button, Kbd, Notice, Pill, Segmented, Sheet } from "@/components/admin/kit";
import { UndoNotice, useUndo } from "@/components/admin/workspace/undo-notice";
import { apiRequest, archivoFromUpload, db, errorMessage, resolveFileUrl, uid, upsert, uploadFile, useCollection, useLoadState, useSession } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import type { Archivo, Evento } from "@/lib/domain/records";
import type { Task } from "@/lib/tasks";
import { ACREEDORES, PASO_CLAVES, TOTAL_PASOS, documentoDelPaso, faltanParaCerrar, nuevoTramite, pasosDe, textoDelAvance, type Acreedor, type Tramite, type TramiteNota } from "@/lib/tramites";
import { cn } from "@/lib/utils";
import s from "./tramites.module.css";

/*
  TRA-01 · Trámites (boceto aprobado el 13/11/2026: «como app, no como página»). Lista a la izquierda
  y el trámite a la derecha: ruta de 8 pasos que se puede pulsar, pendientes del paso, cerrar con
  Deshacer, espera con cuenta regresiva, documentos privados con visor, notas tipo chat, tareas y
  citas, y el avance para el propietario. La base revisa cada regla (20261114211000); aquí solo se
  muestra lo que falta y se guarda con la versión del registro (409 si alguien más cambió algo).
  Atajos: T tarea, N nota, R avance.
*/

type Filtro = "curso" | "espera" | "terminados";
const DAY = 86400000;
const plusDays = (iso: string, n: number) => new Date(Date.parse(iso + "T12:00:00Z") + n * DAY).toISOString().slice(0, 10);
const shortDate = (iso?: string) => iso ? new Date(iso.length === 10 ? iso + "T12:00:00Z" : iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", timeZone: "America/Tijuana" }) : "";
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / DAY);
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "·";
const phoneDigits = (p?: string) => (p ?? "").replace(/\D/g, "");

export function TramitesApp({ initialId = null }: { initialId?: string | null }) {
  const tramites = useCollection(db.tramites);
  const load = useLoadState(db.tramites);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const archivos = useCollection(db.archivos);
  const tareas = useCollection(db.tareas);
  const eventos = useCollection(db.eventos);
  const session = useSession();
  const [me, setMe] = React.useState<string | null>(null);
  const [filtro, setFiltro] = React.useState<Filtro>("curso");
  const [selected, setSelected] = React.useState<string | null>(initialId);
  const [showDetail, setShowDetail] = React.useState(!!initialId);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const undo = useUndo();
  const today = operationalDate();

  React.useEffect(() => {
    let alive = true;
    apiRequest<{ asesorId?: string | null }>("/api/admin/mi-asesor").then(r => { if (alive) setMe(r.asesorId ?? null); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  const visibles = tramites.filter(t => filtro === "terminados" ? t.estado !== "en_curso" : t.estado === "en_curso" && (filtro === "curso" || !!t.espera))
    .sort((a, b) => (b.actualizadoEl ?? "").localeCompare(a.actualizadoEl ?? ""));
  const current = tramites.find(t => t.id === selected) ?? (showDetail ? undefined : visibles[0]);

  function open(id: string) {
    setSelected(id); setShowDetail(true); setError(null);
    const url = new URL(window.location.href); url.searchParams.set("id", id); window.history.replaceState(null, "", url);
  }

  return <div className={s.app} data-detail={showDetail}>
    <aside className={s.list} aria-label="Trámites">
      <div className={s.listHead}>
        <div className={s.listHeadRow}><h1>Trámites</h1><Button onClick={() => setCreating(true)}><Plus size={16} aria-hidden />Nuevo</Button></div>
        <Segmented label="Mostrar" value={filtro} onChange={setFiltro} options={[{ id: "curso", label: "En curso" }, { id: "espera", label: "En espera" }, { id: "terminados", label: "Terminados" }]} />
      </div>
      <div className={s.rows}>
        {load.status === "loading" && !tramites.length ? <p className={s.empty}>Cargando trámites…</p>
          : load.status === "error" ? <p className={s.empty}>No se pudieron cargar los trámites. {load.error}</p>
          : !visibles.length ? <p className={s.empty}>{filtro === "curso" ? "Sin trámites en curso. Abre uno con «Nuevo» cuando un propietario necesite cancelar su hipoteca." : "Nada por aquí."}</p>
          : visibles.map(t => <button key={t.id} type="button" className={s.row} aria-current={t.id === current?.id} onClick={() => open(t.id)}>
            <span className={s.rowA}><b>{t.titulo}</b><span>{t.creadoEl ? `${Math.max(0, daysBetween(t.creadoEl.slice(0, 10), today))} d` : ""}</span></span>
            <span className={s.mbar} aria-hidden>{PASO_CLAVES.map((_, i) => <i key={i} data-s={i < t.pasoActual ? "d" : i === t.pasoActual ? "n" : ""} />)}</span>
            <span className={s.rowB}><span>{ACREEDORES[t.acreedor]} · {t.pasoActual >= TOTAL_PASOS ? "Terminado" : pasosDe(t.acreedor)[t.pasoActual].nombre}</span>{t.espera && <Pill tone="warn" size="sm">En espera</Pill>}{t.estado === "cancelado" && <Pill tone="muted" size="sm">Cancelado</Pill>}</span>
          </button>)}
      </div>
    </aside>
    <main className={s.detail}>
      {current
        ? <Detalle key={current.id} t={current} me={me} sessionId={session?.id ?? ""} sessionName={session?.name || session?.email || "Fortius"} today={today}
            cliente={clientes.find(c => c.id === current.clienteId)} propiedad={propiedades.find(p => p.slug === current.propiedadSlug)?.titulo}
            documentos={archivos.filter(a => a.tramiteId === current.id)} tareas={tareas.filter(x => x.tramiteId === current.id)} citas={eventos.filter(e => e.tramiteId === current.id)}
            onBack={() => setShowDetail(false)} offer={undo.offer} onError={setError} error={error} />
        : <div className={s.center}><p className={s.empty}>{selected ? "Este trámite no existe o no tienes acceso." : "Elige un trámite de la lista."}</p></div>}
    </main>
    <NuevoTramite open={creating} onClose={() => setCreating(false)} me={me} clientes={clientes} propiedades={propiedades.map(p => ({ slug: p.slug, titulo: p.titulo, asesorId: p.asesorId }))} onCreated={id => { setCreating(false); setFiltro("curso"); open(id); }} />
    {undo.current && <div className={s.toast}><UndoNotice current={undo.current} clear={undo.clear} ms={undo.ms} onError={setError} /></div>}
  </div>;
}

type DetalleProps = {
  t: Tramite; me: string | null; sessionId: string; sessionName: string; today: string;
  cliente?: { id: string; nombre: string; telefono?: string; email?: string }; propiedad?: string;
  documentos: Archivo[]; tareas: Task[]; citas: Evento[];
  onBack: () => void; offer: ReturnType<typeof useUndo>["offer"]; onError: (e: string | null) => void; error: string | null;
};

function Detalle({ t, me, sessionId, sessionName, today, cliente, propiedad, documentos, tareas, citas, onBack, offer, onError, error }: DetalleProps) {
  const pasos = pasosDe(t.acreedor);
  const [ver, setVer] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [taskAt, setTaskAt] = React.useState<{ x: number; y: number; agenda: boolean } | null>(null);
  const [waitAt, setWaitAt] = React.useState<{ x: number; y: number } | null>(null);
  const [report, setReport] = React.useState(false);
  const [viewer, setViewer] = React.useState<number | null>(null);
  const noteRef = React.useRef<HTMLTextAreaElement>(null);

  // Guarda con la versión vigente; la base revisa y devuelve el trámite sellado.
  const save = React.useCallback(async (next: Tramite) => {
    setBusy(true); onError(null);
    try { return await upsert(db.tramites, next, db.tramites.version(t)); }
    catch (e) { onError(errorMessage(e)); return null; }
    finally { setBusy(false); }
  }, [t, onError]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (e.ctrlKey || e.metaKey || e.altKey || tag === "input" || tag === "textarea" || tag === "select" || document.querySelector("[role=dialog]")) return;
      const k = e.key.toLowerCase();
      if (k === "t") { e.preventDefault(); setTaskAt({ x: window.innerWidth / 2 - 200, y: 120, agenda: false }); }
      else if (k === "n") { e.preventDefault(); noteRef.current?.focus(); }
      else if (k === "r") { e.preventDefault(); setReport(true); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const actual = Math.min(t.pasoActual, TOTAL_PASOS - 1);
  const shown = ver ?? actual;
  const terminado = t.pasoActual >= TOTAL_PASOS;
  const faltan = terminado ? [] : faltanParaCerrar(t, documentos);
  const anchor = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return { x: Math.max(16, Math.min(r.right - 400, window.innerWidth - 416)), y: r.bottom + 8 }; };

  async function toggle(i: number) {
    const next: Tramite = { ...t, pasos: t.pasos.map((p, k) => k !== actual ? p : { ...p, pendientes: p.pendientes.map((x, j) => j === i ? { ...x, hecho: !x.hecho } : x) }) };
    await save(next);
  }
  async function cerrar() {
    const nombre = pasos[actual].nombre;
    const saved = await save({ ...t, pasoActual: t.pasoActual + 1, espera: null, estado: t.pasoActual + 1 >= TOTAL_PASOS ? "terminado" : "en_curso" });
    if (saved) { setVer(null); offer({ text: `Paso «${nombre}» cerrado`, undo: async () => { const latest = db.tramites.list().find(r => r.id === t.id) ?? saved; await upsert(db.tramites, { ...latest, pasoActual: latest.pasoActual - 1, estado: "en_curso" }, db.tramites.version(latest)); } }); }
  }
  async function addNote(texto: string) {
    const clean = texto.trim(); if (!clean) return false;
    const nota: TramiteNota = { id: `n-${uid().slice(0, 12)}`, tipo: "nota", texto: clean };
    return !!(await save({ ...t, notas: [...t.notas, nota] }));
  }

  async function upload(files: FileList | File[]) {
    const list = Array.from(files); if (!list.length) return;
    const paso = t.pasos[actual]; const pasoClave = documentoDelPaso(t.acreedor, paso.clave) && !documentos.some(d => d.pasoClave === paso.clave) ? paso.clave : "";
    onError(null); setBusy(true);
    try {
      for (const [i, file] of list.entries()) {
        const up = await uploadFile(file, "private");
        await upsert(db.archivos, { ...archivoFromUpload(uid(), up), clienteId: t.clienteId, tramiteId: t.id, pasoClave: i === 0 ? pasoClave : "" }, null);
      }
    } catch (e) { onError(errorMessage(e)); }
    finally { setBusy(false); }
  }

  return <>
    <div className={s.head}>
      <Button variant="ghost" iconOnly className={s.back} onClick={onBack} aria-label="Ver la lista de trámites"><ArrowLeft size={18} aria-hidden /></Button>
      <div className={s.title}>
        <h2>{t.titulo}</h2>
        <span>Cancelación de hipoteca · {ACREEDORES[t.acreedor]}{cliente ? ` · ${cliente.nombre}` : ""}{propiedad ? ` · ${propiedad}` : ""}{t.creadoEl ? ` · lleva ${Math.max(0, daysBetween(t.creadoEl.slice(0, 10), today))} días` : ""}</span>
      </div>
      <div className={s.actions}>
        <Button onClick={e => setTaskAt({ ...anchor(e.currentTarget), agenda: false })}><Plus size={16} aria-hidden />Tarea <Kbd>T</Kbd></Button>
        <Button variant="primary" onClick={() => setReport(true)}><MessageCircle size={16} aria-hidden />Enviar avance</Button>
      </div>
    </div>
    <div className={s.route} role="tablist" aria-label="Pasos del trámite">
      {pasos.map((p, i) => <button key={p.clave} type="button" role="tab" className={s.rstep} aria-selected={shown === i && !terminado}
        data-s={i < t.pasoActual ? "d" : i === t.pasoActual ? "n" : ""} onClick={() => setVer(i === actual ? null : i)}>
        <span className={s.rnum}>{i + 1}</span><span className={s.rbar} /><span className={s.rlab}>{p.nombre}</span>
      </button>)}
    </div>
    <div className={s.body}>
      <div className={s.center} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void upload(e.dataTransfer.files); }}>
        {error && <Notice title="No se guardó">{error}</Notice>}
        {terminado ? <div className={s.stepView}><div className={s.stepMain}><h3>Trámite terminado</h3><p>La hipoteca quedó cancelada. Entrega al propietario la escritura y el certificado si aún no los tiene.</p></div></div>
          : t.estado === "cancelado" ? <div className={s.stepView}><div className={s.stepMain}><h3>Trámite cancelado</h3><p>Se conserva con sus notas y documentos.</p></div><div className={s.stepFoot}><Button disabled={busy} onClick={() => void save({ ...t, estado: "en_curso" })}>Reanudar</Button></div></div>
          : shown !== actual ? <div className={s.stepView}>
              <div className={s.stepTop}><div className={s.stepMain}><span className={s.big}>{String(shown + 1).padStart(2, "0")}</span><h3>{pasos[shown].nombre}</h3><p>{pasos[shown].ayuda}</p></div>
                <Pill tone={shown < t.pasoActual ? "success" : "info"}>{shown < t.pasoActual ? `Listo${t.pasos[shown].cerradoEl ? ` · ${shortDate(t.pasos[shown].cerradoEl)}` : ""}` : "Más adelante"}</Pill></div>
              <div className={s.stepFoot}><Button onClick={() => setVer(null)}>Volver al paso actual</Button></div>
            </div>
          : <section className={s.step} aria-labelledby="paso-actual">
              <div className={s.stepTop}>
                <div className={s.stepMain}><span className={s.big}>{String(actual + 1).padStart(2, "0")}</span><h3 id="paso-actual">{pasos[actual].nombre}</h3><p>{pasos[actual].ayuda}</p></div>
                {t.espera && <WaitRing desde={t.espera.desde} volver={t.espera.volver} today={today} />}
              </div>
              {t.espera && <div className={s.wait}><b>En espera de {t.espera.quien}</b><span>desde el {shortDate(t.espera.desde)} · volver a preguntar el {shortDate(t.espera.volver)}</span></div>}
              <div className={s.checks} role="group" aria-label="Pendientes del paso">
                {t.pasos[actual].pendientes.map((x, i) => <button key={x.id} type="button" role="checkbox" aria-checked={x.hecho} className={s.ck} disabled={busy} onClick={() => void toggle(i)}>
                  <span className={s.bx}>{x.hecho && <Check size={14} aria-hidden />}</span><span className={s.ckText}>{x.texto}</span>
                </button>)}
                {documentoDelPaso(t.acreedor, t.pasos[actual].clave) && <div className={s.ck} aria-live="polite">
                  <span className={s.bx}>{documentos.some(d => d.pasoClave === t.pasos[actual].clave) && <Check size={14} aria-hidden />}</span>
                  <span className={s.ckText}>Documento: {documentoDelPaso(t.acreedor, t.pasos[actual].clave)}</span>
                  {!documentos.some(d => d.pasoClave === t.pasos[actual].clave) && <span className={s.ckMissing}>falta</span>}
                </div>}
              </div>
              <div className={s.stepFoot}>
                <Button variant="primary" disabled={busy || faltan.length > 0} onClick={() => void cerrar()}><Check size={16} aria-hidden />{actual === TOTAL_PASOS - 1 ? "Terminar el trámite" : "Cerrar el paso"}</Button>
                {documentoDelPaso(t.acreedor, t.pasos[actual].clave) && !documentos.some(d => d.pasoClave === t.pasos[actual].clave) && <label className={cn("inline-flex", s.onNavy)} style={{ borderRadius: "var(--radius-control)" }}>
                  <FileButton label="Subir documento" onFiles={upload} navy />
                </label>}
                {t.espera
                  ? <Button className={s.onNavy} disabled={busy} onClick={() => void save({ ...t, espera: null })}>Ya respondieron</Button>
                  : <Button className={s.onNavy} disabled={busy} onClick={e => setWaitAt(anchor(e.currentTarget))}>Marcar en espera</Button>}
                <span className={s.hint}>{faltan.length ? `Falta: ${faltan.join(" · ")}` : "Todo listo"}</span>
              </div>
            </section>}

        <section className={s.sec} aria-labelledby="docs-h">
          <div className={s.secHead}><h4 id="docs-h">Documentos</h4><span>Privados del trámite · arrastra archivos aquí</span></div>
          <div className={s.docs}>
            {documentos.map((d, i) => <button key={d.id} type="button" className={s.doc} onClick={() => setViewer(i)}>
              <span className={s.page}><FileText size={28} aria-hidden /></span>
              <span><b>{d.nombre}</b><small>{d.pasoClave ? pasos[PASO_CLAVES.indexOf(d.pasoClave as (typeof PASO_CLAVES)[number])]?.nombre : "Otro"}</small></span>
            </button>)}
            {pasos.filter((p, i) => documentoDelPaso(t.acreedor, p.clave) && i <= t.pasoActual + 1 && !documentos.some(d => d.pasoClave === p.clave)).map(p =>
              <div key={p.clave} className={cn(s.doc, s.docMissing)}><span className={s.page}><FileText size={24} aria-hidden /></span><span><b>{documentoDelPaso(t.acreedor, p.clave)}</b><small>Falta · paso {PASO_CLAVES.indexOf(p.clave) + 1}</small></span></div>)}
            <FileButton label={busy ? "Subiendo…" : "Suelta o elige un archivo"} onFiles={upload} drop />
          </div>
        </section>

        <section className={s.sec} aria-labelledby="act-h">
          <div className={s.secHead}><h4 id="act-h">Actividad y notas</h4><span>Las notas no van al propietario</span></div>
          <div className={s.feed}>
            {[...t.notas].sort((a, b) => Number(!!b.fijada) - Number(!!a.fijada) || (b.fecha ?? "").localeCompare(a.fecha ?? "")).map(n =>
              <div key={n.id} className={s.ev} data-sys={n.tipo === "evento"} data-pin={!!n.fijada}>
                <span className={s.av} aria-hidden>{n.tipo === "evento" ? "·" : n.autor === sessionId ? initials(sessionName) : "✎"}</span>
                <div>{n.tipo === "evento"
                  ? <p>{n.texto} <span className={s.meta}>{shortDate(n.fecha)}</span></p>
                  : <><span className={s.meta}><b>{n.autor === sessionId ? "Tú" : "Equipo"}</b> · {shortDate(n.fecha)}{n.fijada ? " · fijada" : ""}</span><p>{n.texto}</p></>}</div>
                {n.tipo === "nota" && <span className={s.evActs}>
                  <Button variant="ghost" iconOnly aria-label={n.fijada ? "Quitar de arriba" : "Fijar arriba"} disabled={busy} onClick={() => void save({ ...t, notas: t.notas.map(x => x.id === n.id ? { ...x, fijada: !x.fijada } : x) })}><Star size={16} aria-hidden /></Button>
                  {n.autor === sessionId && <Button variant="ghost" iconOnly aria-label="Quitar la nota" disabled={busy} onClick={async () => {
                    const saved = await save({ ...t, notas: t.notas.filter(x => x.id !== n.id) });
                    if (saved) offer({ text: "Nota quitada", undo: async () => { const latest = db.tramites.list().find(r => r.id === t.id) ?? saved; await upsert(db.tramites, { ...latest, notas: [...latest.notas, { id: `n-${uid().slice(0, 12)}`, tipo: "nota", texto: n.texto, fijada: n.fijada }] }, db.tramites.version(latest)); } });
                  }}><Trash2 size={16} aria-hidden /></Button>}
                </span>}
              </div>)}
          </div>
          <Composer inputRef={noteRef} busy={busy} onSave={addNote} />
        </section>
      </div>

      <aside className={s.inspector} aria-label="Detalles del trámite">
        <div className={s.blk}>
          <div className={s.blkHead}><h5>Tareas y citas</h5><Button variant="ghost" onClick={e => setTaskAt({ ...anchor(e.currentTarget), agenda: false })}><Plus size={14} aria-hidden />Agregar</Button></div>
          {!tareas.length && !citas.length && <p className={s.meta}>Sin tareas. Pulsa T para crear una.</p>}
          {[...tareas].sort((a, b) => (a.vence ?? "").localeCompare(b.vence ?? "")).map(x => <button key={x.id} type="button" role="checkbox" aria-checked={x.estado === "completada"} className={s.todo}
            onClick={async () => { try { const v = db.tareas.version(x); const was = x.estado; await upsert(db.tareas, { ...x, estado: was === "completada" ? "pendiente" : "completada" }, v); if (was !== "completada") offer({ text: "Tarea hecha", undo: async () => { const l = db.tareas.list().find(r => r.id === x.id); if (l) await upsert(db.tareas, { ...l, estado: "pendiente" }, db.tareas.version(l)); } }); } catch (e) { onError(errorMessage(e)); } }}>
            <span className={s.tbx}>{x.estado === "completada" && <Check size={11} aria-hidden />}</span>
            <span><span className={s.tt}>{x.titulo}</span><span className={s.ts}>{x.vence ? shortDate(x.vence) : "Sin fecha"} · en Hoy</span></span>
          </button>)}
          {[...citas].sort((a, b) => (a.fecha + (a.hora ?? "")).localeCompare(b.fecha + (b.hora ?? ""))).map(c => <Link key={c.id} href={`/admin/agenda?fecha=${c.fecha}`} className={s.todo}>
            <span className={s.tbx} style={{ borderRadius: 6 }}><CalendarDays size={11} aria-hidden /></span>
            <span><span className={s.tt}>{c.titulo}</span><span className={s.ts}>{shortDate(c.fecha)}{c.hora ? ` · ${c.hora}` : ""} · en la agenda</span></span>
          </Link>)}
        </div>
        <div className={s.blk}>
          <div className={s.blkHead}><h5>Con quién se trata</h5></div>
          {cliente && <div className={s.person}><span className={s.pa}>{initials(cliente.nombre)}</span><div><b>{cliente.nombre}</b><span>Propietario</span></div>
            {cliente.telefono && <a className="inline-grid size-10 place-items-center rounded-lg" href={`tel:${phoneDigits(cliente.telefono)}`} aria-label={`Llamar a ${cliente.nombre}`}><Phone size={16} aria-hidden /></a>}
            {cliente.telefono && <a className="inline-grid size-10 place-items-center rounded-lg" href={`https://wa.me/${waNumber(cliente.telefono)}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp a ${cliente.nombre}`}><MessageCircle size={16} aria-hidden /></a>}
          </div>}
          <div className={s.person}><span className={s.pa}>{initials(ACREEDORES[t.acreedor])}</span><div><b>{ACREEDORES[t.acreedor]}</b><span>Acreedor</span></div></div>
          <div className={s.person}><span className={s.pa}>NT</span><div><b>Notaría</b><span>{t.credito?.notaria || "Por elegir"}</span></div></div>
          <div className={s.person}><span className={s.pa}>RP</span><div><b>Registro Público</b><span>Oficina Tijuana</span></div></div>
        </div>
        <div className={s.blk}>
          <div className={s.blkHead}><h5>Lo que paga el propietario</h5></div>
          {t.pagos.map(p => <div key={p.id} className={s.pay}><span>{p.concepto}</span>
            <button type="button" className={s.payBtn} disabled={busy} aria-pressed={p.estado === "pagado"} aria-label={`${p.concepto}: ${p.estado === "pagado" ? "pagado" : "pendiente"}. Cambiar`} onClick={() => void save({ ...t, pagos: t.pagos.map(x => x.id === p.id ? { ...x, estado: x.estado === "pagado" ? "pendiente" : "pagado" } : x) })}>
              {p.estado === "pagado" ? <Pill tone="success" size="sm">Pagado</Pill> : <Pill tone="muted" size="sm">Pendiente</Pill>}
            </button></div>)}
        </div>
        <div className={s.blk}>
          <div className={s.blkHead}><h5>Datos del crédito</h5></div>
          <div className={s.kv}>
            <CreditoField label="Número de crédito" value={t.credito?.numero} onSave={v => save({ ...t, credito: { ...t.credito, numero: v } })} />
            <CreditoField label="Folio real" value={t.credito?.folioReal} onSave={v => save({ ...t, credito: { ...t.credito, folioReal: v } })} />
            <CreditoField label="Notaría" value={t.credito?.notaria} onSave={v => save({ ...t, credito: { ...t.credito, notaria: v } })} />
            <div className={s.kvRow}><span>Último avance</span><span>{t.ultimoAvance?.fecha ? shortDate(t.ultimoAvance.fecha) : "Sin enviar"}</span></div>
          </div>
        </div>
        {t.estado === "en_curso" && <Button variant="ghost" disabled={busy} onClick={async () => { const saved = await save({ ...t, estado: "cancelado" }); if (saved) offer({ text: "Trámite cancelado", undo: async () => { const l = db.tramites.list().find(r => r.id === t.id) ?? saved; await upsert(db.tramites, { ...l, estado: "en_curso" }, db.tramites.version(l)); } }); }}>Cancelar el trámite</Button>}
        {me === null && <p className={s.meta}>Como director ves todos los trámites del equipo.</p>}
      </aside>
    </div>

    {taskAt && <QuickTask at={taskAt} today={today} onClose={() => setTaskAt(null)} onSave={async (titulo, vence, hora) => {
      try {
        if (hora) await upsert(db.eventos, { id: `ev-${uid()}`, titulo, fecha: vence, hora, tipo: "llamada", clienteId: t.clienteId, propiedadSlug: t.propiedadSlug || undefined, asesorId: t.asesorId, tramiteId: t.id }, null);
        else await upsert(db.tareas, { id: `ta-${uid()}`, titulo, descripcion: `Trámite: ${t.titulo}`, categoria: "documentacion", estado: "pendiente", prioridad: "normal", vence, pasos: [], clienteId: t.clienteId, asesorId: t.asesorId, propiedadSlug: t.propiedadSlug || undefined, tramiteId: t.id }, null);
        setTaskAt(null);
      } catch (e) { onError(errorMessage(e)); }
    }} />}
    {waitAt && <QuickWait at={waitAt} today={today} acreedor={t.acreedor} paso={pasos[actual].clave} onClose={() => setWaitAt(null)} onSave={async (quien, volver) => { const saved = await save({ ...t, espera: { quien, desde: today, volver } }); if (saved) setWaitAt(null); }} />}
    <Avance open={report} onClose={() => setReport(false)} t={t} propietario={cliente?.nombre.split(" ")[0] ?? ""} firma={`${sessionName} · Fortius Inmuebles`} telefono={cliente?.telefono} email={cliente?.email}
      onSent={async medio => { await save({ ...t, ultimoAvance: { medio } }); }} />
    {viewer !== null && documentos[viewer] && <Visor docs={documentos} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} />}
  </>;
}

function waNumber(phone: string) { const d = phoneDigits(phone); return d.length === 10 ? `52${d}` : d; }

function WaitRing({ desde, volver, today }: { desde: string; volver: string; today: string }) {
  const total = Math.max(1, daysBetween(desde, volver)), left = Math.max(0, daysBetween(today, volver));
  const r = 32, c = 2 * Math.PI * r, p = Math.min(1, (total - left) / total);
  return <div className={s.ring} role="img" aria-label={left ? `Faltan ${left} días para volver a preguntar` : "Hoy toca volver a preguntar"}>
    <svg viewBox="0 0 76 76" aria-hidden><circle className={s.ringBg} cx="38" cy="38" r={r} /><circle className={s.ringFg} cx="38" cy="38" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - p)} /></svg>
    <span className={s.ringTxt}><span><b>{left}</b>{left === 1 ? "día" : "días"}</span></span>
  </div>;
}

function FileButton({ label, onFiles, drop, navy }: { label: string; onFiles: (f: FileList) => void; drop?: boolean; navy?: boolean }) {
  const input = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  return <>
    <input ref={input} type="file" hidden multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => { if (e.target.files) onFiles(e.target.files); e.target.value = ""; }} />
    {drop
      ? <button type="button" className={s.drop} data-over={over} onClick={() => input.current?.click()} onDragEnter={() => setOver(true)} onDragLeave={() => setOver(false)} onDrop={() => setOver(false)}><Upload size={18} aria-hidden />{label}</button>
      : <Button className={navy ? s.onNavy : undefined} onClick={() => input.current?.click()}><Upload size={16} aria-hidden />{label}</Button>}
  </>;
}

function Composer({ inputRef, busy, onSave }: { inputRef: React.RefObject<HTMLTextAreaElement | null>; busy: boolean; onSave: (t: string) => Promise<boolean> }) {
  const [text, setText] = React.useState("");
  async function send() { if (await onSave(text)) setText(""); }
  return <div className={s.composer}>
    <div className={s.cbox}>
      <textarea ref={inputRef} rows={1} value={text} aria-label="Escribe una nota" placeholder="Escribe una nota… (Enter guarda, Mayús+Enter salta de línea)"
        onChange={e => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(140, e.target.scrollHeight) + "px"; }}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
      <Button variant="primary" disabled={busy || !text.trim()} onClick={() => void send()}>Guardar</Button>
    </div>
    <div className={s.quick}>{["Llamé y no contestaron", "Me dijeron que ", "Quedó en mandarlo"].map(q => <button key={q} type="button" onClick={() => { setText(q); inputRef.current?.focus(); }}>{q.trim()}</button>)}</div>
  </div>;
}

function CreditoField({ label, value, onSave }: { label: string; value?: string; onSave: (v: string) => Promise<unknown> }) {
  const [draft, setDraft] = React.useState(value ?? "");
  const [seen, setSeen] = React.useState(value);
  if (seen !== value) { setSeen(value); setDraft(value ?? ""); }
  return <label className={s.kvRow}><span>{label}</span>
    <input className={s.kvInput} value={draft} maxLength={label === "Notaría" ? 160 : 60} placeholder="Agregar" onChange={e => setDraft(e.target.value)}
      onBlur={() => { if (draft.trim() !== (value ?? "")) void onSave(draft.trim()); }} onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
  </label>;
}

function Popover({ at, onClose, label, children }: { at: { x: number; y: number }; onClose: () => void; label: string; children: React.ReactNode }) {
  React.useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [onClose]);
  return <>
    <button type="button" className={s.scrim} aria-label="Cerrar" tabIndex={-1} onClick={onClose} />
    <div className={s.pop} role="dialog" aria-label={label} style={{ left: at.x, top: Math.min(at.y, window.innerHeight - 280) }}>{children}</div>
  </>;
}

function QuickTask({ at, today, onClose, onSave }: { at: { x: number; y: number; agenda: boolean }; today: string; onClose: () => void; onSave: (titulo: string, vence: string, hora?: string) => Promise<void> }) {
  const [titulo, setTitulo] = React.useState("");
  const [dias, setDias] = React.useState(1);
  const [agenda, setAgenda] = React.useState(at.agenda);
  const [hora, setHora] = React.useState("10:00");
  const [busy, setBusy] = React.useState(false);
  async function go() { if (!titulo.trim()) return; setBusy(true); await onSave(titulo.trim(), plusDays(today, dias), agenda ? hora : undefined); setBusy(false); }
  return <Popover at={at} onClose={onClose} label="Nueva tarea">
    <input autoFocus className={s.popInput} value={titulo} maxLength={160} placeholder={agenda ? "¿Con quién y para qué?" : "¿Qué hay que hacer?"} onChange={e => setTitulo(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void go(); } }} />
    <div className={s.chips} role="group" aria-label="Para cuándo">{[[0, "Hoy"], [1, "Mañana"], [3, "En 3 días"], [7, "En una semana"]].map(([n, l]) => <button key={n} type="button" className={s.chip} aria-pressed={dias === n} onClick={() => setDias(n as number)}>{l}</button>)}</div>
    <div className={s.chips}>
      <button type="button" className={s.chip} aria-pressed={agenda} onClick={() => setAgenda(!agenda)}><CalendarDays size={14} aria-hidden />Cita en la agenda</button>
      {agenda && ["09:00", "10:00", "12:00", "17:00"].map(h => <button key={h} type="button" className={s.chip} aria-pressed={hora === h} onClick={() => setHora(h)}>{h}</button>)}
    </div>
    <div className={s.popFoot}><span>{agenda ? "Va a la agenda con hora" : "Aparece en «Hoy» el día que toca"}</span><Button variant="primary" disabled={busy || !titulo.trim()} onClick={() => void go()}>Guardar</Button></div>
  </Popover>;
}

function QuickWait({ at, today, acreedor, paso, onClose, onSave }: { at: { x: number; y: number }; today: string; acreedor: Acreedor; paso: string; onClose: () => void; onSave: (quien: string, volver: string) => Promise<void> }) {
  const sugerido = paso === "registro" || paso === "certificado" ? "Registro Público" : paso === "notario" || paso === "firma" ? "la notaría" : ACREEDORES[acreedor];
  const [quien, setQuien] = React.useState(sugerido);
  const [dias, setDias] = React.useState(paso === "registro" ? 14 : 7);
  const [busy, setBusy] = React.useState(false);
  return <Popover at={at} onClose={onClose} label="Marcar en espera">
    <input autoFocus className={s.popInput} value={quien} maxLength={120} aria-label="¿De quién esperas respuesta?" onChange={e => setQuien(e.target.value)} />
    <div className={s.chips} role="group" aria-label="Volver a preguntar en">{[3, 7, 14, 30].map(n => <button key={n} type="button" className={s.chip} aria-pressed={dias === n} onClick={() => setDias(n)}>En {n} días</button>)}</div>
    <div className={s.popFoot}><span>Se crea la tarea para el {shortDate(plusDays(today, dias))}</span><Button variant="primary" disabled={busy || !quien.trim()} onClick={async () => { setBusy(true); await onSave(quien.trim(), plusDays(today, dias)); setBusy(false); }}>Guardar</Button></div>
  </Popover>;
}

function Avance({ open, onClose, t, propietario, firma, telefono, email, onSent }: { open: boolean; onClose: () => void; t: Tramite; propietario: string; firma: string; telefono?: string; email?: string; onSent: (m: "whatsapp" | "correo" | "pdf") => Promise<void> }) {
  const [partes, setPartes] = React.useState({ listo: true, sigue: true, necesita: true, pagos: false });
  const [medio, setMedio] = React.useState<"whatsapp" | "correo" | "pdf">(telefono ? "whatsapp" : email ? "correo" : "pdf");
  const [copied, setCopied] = React.useState(false);
  const texto = textoDelAvance(t, partes, propietario, firma);
  function enviar() {
    if (medio === "whatsapp" && telefono) window.open(`https://wa.me/${waNumber(telefono)}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    else if (medio === "correo" && email) window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Avance de la cancelación de hipoteca · ${t.titulo}`)}&body=${encodeURIComponent(texto)}`;
    else { const w = window.open("", "_blank"); if (w) { w.document.title = `Avance · ${t.titulo}`; const pre = w.document.createElement("pre"); pre.style.cssText = "font:15px/1.6 system-ui;white-space:pre-wrap;padding:32px"; pre.textContent = texto; w.document.body.appendChild(pre); w.print(); } }
    void onSent(medio); onClose();
  }
  const labels = { listo: "Lo que ya está listo", sigue: "Lo que sigue", necesita: "Lo que necesitamos de usted", pagos: "Pagos" } as const;
  return <Sheet open={open} onClose={onClose} title="Avance para el propietario" description={`Se arma solo con los pasos y pagos. Revísalo antes de mandarlo. Último envío: ${t.ultimoAvance?.fecha ? shortDate(t.ultimoAvance.fecha) : "ninguno"}.`}
    footer={<div className="flex flex-wrap justify-between gap-2">
      <Button onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* el portapapeles puede estar bloqueado */ } }}>{copied ? "Copiado" : "Copiar texto"}</Button>
      <Button variant="primary" disabled={(medio === "whatsapp" && !telefono) || (medio === "correo" && !email)} onClick={enviar}>{medio === "whatsapp" ? "Abrir WhatsApp" : medio === "correo" ? "Abrir correo" : "Imprimir o guardar PDF"}</Button>
    </div>}>
    <div className="grid gap-4">
      <Segmented label="Cómo lo mandas" value={medio} onChange={setMedio} options={[{ id: "whatsapp", label: "WhatsApp", disabled: !telefono }, { id: "correo", label: "Correo", disabled: !email }, { id: "pdf", label: "PDF" }]} />
      <div className={s.bubble}>{texto}</div>
      <div>{(Object.keys(labels) as Array<keyof typeof labels>).map(k => <label key={k} className={s.sw}>{labels[k]}<input type="checkbox" checked={partes[k]} onChange={e => setPartes({ ...partes, [k]: e.target.checked })} /></label>)}</div>
      <p className={s.meta}>Las notas internas nunca se incluyen. El mensaje lo mandas tú desde tu WhatsApp o tu correo; aquí queda registrado que se envió.</p>
    </div>
  </Sheet>;
}

function Visor({ docs, index, onIndex, onClose }: { docs: Archivo[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const d = docs[index];
  // El estado se guarda junto con el documento al que pertenece: al cambiar de documento se reinicia solo.
  const [file, setFile] = React.useState<{ src: string; url?: string; err?: string }>({ src: "" });
  const [zoomOf, setZoomOf] = React.useState<{ src: string; z: number }>({ src: "", z: 1 });
  const url = file.src === d.url ? file.url ?? null : null, err = file.src === d.url ? file.err ?? null : null;
  const zoom = zoomOf.src === d.url ? zoomOf.z : 1;
  const setZoom = (f: (z: number) => number) => setZoomOf({ src: d.url, z: f(zoom) });
  React.useEffect(() => {
    let alive = true;
    resolveFileUrl(d.url).then(u => { if (alive) setFile({ src: d.url, url: u }); }).catch(e => { if (alive) setFile({ src: d.url, err: errorMessage(e) }); });
    return () => { alive = false; };
  }, [d.url]);
  React.useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") onIndex((index + 1) % docs.length); if (e.key === "ArrowLeft") onIndex((index - 1 + docs.length) % docs.length); };
    document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k);
  }, [index, docs.length, onClose, onIndex]);
  return <div className={s.viewer} role="dialog" aria-modal="true" aria-label={`Documento: ${d.nombre}`}>
    <div className={s.vHead}>
      <div><b>{d.nombre}</b><span>{index + 1} de {docs.length} · ← → para cambiar · Esc para cerrar</span></div>
      {d.tipo === "imagen" && <><button type="button" className={s.vBtn} aria-label="Alejar" onClick={() => setZoom(z => Math.max(.5, z - .25))}><ZoomOut size={18} aria-hidden /></button>
        <button type="button" className={s.vBtn} aria-label="Acercar" onClick={() => setZoom(z => Math.min(3, z + .25))}><ZoomIn size={18} aria-hidden /></button></>}
      {url && <a className={s.vBtn} href={url} target="_blank" rel="noreferrer" aria-label="Abrir en otra pestaña"><FileText size={18} aria-hidden /></a>}
      <button type="button" className={s.vBtn} aria-label="Cerrar" autoFocus onClick={onClose}><X size={18} aria-hidden /></button>
    </div>
    <div className={s.vBody}>
      {docs.length > 1 && <span className={s.vNav} data-side="l"><button type="button" className={s.vBtn} aria-label="Anterior" onClick={() => onIndex((index - 1 + docs.length) % docs.length)}><ChevronLeft size={18} aria-hidden /></button></span>}
      {err ? <p>{err}</p> : !url ? <p>Abriendo…</p> : d.tipo === "imagen" ? /* eslint-disable-next-line @next/next/no-img-element -- URL firmada y privada de 60 s; no pasa por el optimizador */
        <img src={url} alt={d.nombre} style={{ transform: `scale(${zoom})` }} /> : <iframe src={url} title={d.nombre} />}
      {docs.length > 1 && <span className={s.vNav} data-side="r"><button type="button" className={s.vBtn} aria-label="Siguiente" onClick={() => onIndex((index + 1) % docs.length)}><ChevronRight size={18} aria-hidden /></button></span>}
    </div>
  </div>;
}

function NuevoTramite({ open, onClose, me, clientes, propiedades, onCreated }: { open: boolean; onClose: () => void; me: string | null; clientes: Array<{ id: string; nombre: string; asesorId?: string; tipo: string }>; propiedades: Array<{ slug: string; titulo: string; asesorId: string }>; onCreated: (id: string) => void }) {
  const [acreedor, setAcreedor] = React.useState<Acreedor>("infonavit");
  const [clienteId, setClienteId] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [titulo, setTitulo] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const cliente = clientes.find(c => c.id === clienteId);
  const opciones = clientes.filter(c => !me || c.asesorId === me).sort((a, b) => Number(b.tipo === "propietario") - Number(a.tipo === "propietario") || a.nombre.localeCompare(b.nombre));
  async function crear() {
    if (!cliente) { setErr("Elige al propietario."); return; }
    const asesorId = me ?? cliente.asesorId;
    if (!asesorId) { setErr("El propietario no tiene asesor asignado; asígnalo antes de abrir el trámite."); return; }
    setBusy(true); setErr(null);
    try {
      const id = `tr-${uid().slice(0, 18)}`;
      const nombre = titulo.trim() || propiedades.find(p => p.slug === slug)?.titulo || `Hipoteca de ${cliente.nombre}`;
      await upsert(db.tramites, nuevoTramite({ id, acreedor, titulo: nombre, clienteId: cliente.id, asesorId, propiedadSlug: slug }), null);
      setClienteId(""); setSlug(""); setTitulo(""); onCreated(id);
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  }
  const field = "min-h-11 w-full rounded-[var(--field-radius)] border border-[var(--control-edge)] bg-[var(--field-surface)] px-3";
  return <Sheet open={open} onClose={onClose} title="Nueva cancelación de hipoteca" description="Fortius lleva el trámite; el propietario paga notario y Registro. Los pasos se ajustan al acreedor."
    footer={<div className="flex justify-end gap-2"><Button onClick={onClose}>Cancelar</Button><Button variant="primary" disabled={busy || !clienteId} onClick={() => void crear()}>{busy ? "Abriendo…" : "Abrir trámite"}</Button></div>}>
    <div className="grid gap-4">
      <Segmented label="Acreedor" value={acreedor} onChange={setAcreedor} options={(Object.keys(ACREEDORES) as Acreedor[]).map(id => ({ id, label: ACREEDORES[id] }))} />
      <label className="grid gap-1.5 text-sm font-semibold">Propietario
        <select className={field} value={clienteId} onChange={e => setClienteId(e.target.value)}><option value="">Elige un contacto</option>{opciones.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.tipo !== "propietario" ? ` (${c.tipo})` : ""}</option>)}</select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">Inmueble (opcional)
        <select className={field} value={slug} onChange={e => setSlug(e.target.value)}><option value="">Sin inmueble en cartera</option>{propiedades.filter(p => !me || p.asesorId === me).map(p => <option key={p.slug} value={p.slug}>{p.titulo}</option>)}</select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">Nombre corto (opcional)
        <input className={field} value={titulo} maxLength={160} placeholder="Ej.: Casa en Otay" onChange={e => setTitulo(e.target.value)} />
      </label>
      {err && <p className={s.err} role="alert">{err}</p>}
    </div>
  </Sheet>;
}
