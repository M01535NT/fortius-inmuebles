"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, CalendarPlus, Check, FileText, MessageCircle, Pencil, Phone, Plus, Search, Upload } from "@/components/admin/icons";
import { Avatar, Button, ButtonLink, Notice, Pill, Segmented, StageRail, Thumb } from "@/components/admin/kit";
import { Desplegable, MenuAcciones } from "@/components/admin/bandeja/desplegable";
import { usePersonStatus } from "@/components/admin/workspace/use-person-status";
import { UndoNotice, useUndo } from "@/components/admin/workspace/undo-notice";
import { CLIENTE_TIPO_LABELS } from "@/components/admin/cliente-editor";
import { propertyState } from "@/components/admin/properties/property-list";
import { formatPrecio } from "@/data/propiedades";
import { clientRows, leadRows, matches, type ContactRow } from "@/lib/admin/contacts-view";
import { operationalDate } from "@/lib/admin/operational-date";
import { leadStage, LEAD_STAGE_LABELS } from "@/lib/admin/person-view";
import { PERSON_STATUS_LABEL } from "@/lib/admin/person-status";
import { GRUPOS, grupoDe, sucesos, type Suceso } from "@/lib/admin/personas-vista";
import { db, errorMessage, fetchJson, loadAllDossiers, upsert, useCollection, type AdminProperty, type Cliente, type Evento, type Lead, type Nota } from "@/lib/admin/store";
import { stageTrack, type OperationRecord } from "@/lib/admin/operation-view";
import { formatoById } from "@/lib/formatos/catalog";
import { isOwnerRoute, ownerProcess, processPhase, processStageText } from "@/lib/formatos/operation-workflow";
import type { Task } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import b from "@/components/admin/bandeja/bandeja.module.css";
import s from "./personas.module.css";

/*
  FLX · Personas (boceto aprobado por el titular el 14/11/2026) y LV-10e: la lista se lee como
  agenda con cara (primero a quién le toca hoy) y el perfil junta lo que sigue, sus inmuebles con
  foto, sus operaciones con el riel de etapas, sus documentos y lo que ha pasado. Los datos de
  contacto se cambian en su lugar: se guardan con la versión del registro (un 409 abre la ventana
  de conflicto) y se pueden deshacer, porque el servidor vuelve a guardar los valores de antes.
  La guía se muestra como funciona hoy; ninguna regla cambia aquí.
*/

type Filtro = "todas" | "prospectos" | "clientes";
type Tab = "todos" | "recibidos" | "hechos";
type Fila = { id: string; nombre: string; detalle: string; origen: string; version?: string; fecha: string; clase: "recibido" | "hecho"; href: string };
type Suelto = { id: string; titulo: string; created_at: string; tipo_documento: string | null };
type ArchivoOperacion = { id: string; titulo: string; created_at: string; deleted_at: string | null };
type Borrador = { id: string; formato_id: string; version: number; updated_at: string };
type Persona = Cliente | Lead;
type Coleccion<T extends { id: string }> = Parameters<typeof upsert<T>>[0];
const ACEPTA = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const corta = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "America/Tijuana" });
const mesAno = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { month: "short", year: "numeric", timeZone: "America/Tijuana" });
const JSON_HEADERS = { "Content-Type": "application/json" };
const tituloFormato = (id: string) => { try { return formatoById(id).title; } catch { return "Formato"; } };

export function PersonasApp({ initialId }: { initialId: string | null }) {
  const leads = useCollection(db.leads), clientes = useCollection(db.clientes), tareas = useCollection(db.tareas), eventos = useCollection(db.eventos), propiedades = useCollection(db.propiedades);
  const notas = useCollection(db.notas), asesores = useCollection(db.asesores);
  const today = operationalDate();
  const status = usePersonStatus();
  const [operaciones, setOperaciones] = React.useState<OperationRecord[]>([]);
  const [filtro, setFiltro] = React.useState<Filtro>("todas");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(initialId);
  const [showDetail, setShowDetail] = React.useState(Boolean(initialId));
  React.useEffect(() => { let alive = true; loadAllDossiers<OperationRecord>().then(all => { if (alive) setOperaciones(all.filter(o => !o.deleted_at && o.etapa !== "cerrado" && o.flujo?.estado !== "descartada")); }).catch(() => undefined); return () => { alive = false; }; }, []);

  const abiertos = leads.filter(l => !l.clienteId);
  const etapaDe = (o: OperationRecord) => processStageText(o.etapa, o.flujo, today) || "en curso";
  const personOps = operaciones.map(o => ({ id: o.id, clienteId: o.cliente_id, stage: etapaDe(o) }));
  const esCliente = (row: ContactRow) => { if (row.kind !== "cliente") return false; const st = status.ofClient(row.id); return st === "cliente" || st === "cliente_anterior"; };
  const filas = [
    ...leadRows(abiertos, tareas, eventos, today).filter(r => { const l = abiertos.find(x => x.id === r.id)!; return matches(query, l.nombre, l.telefono, l.email, r.wants); }),
    ...clientRows(clientes, tareas, eventos, today, personOps).filter(r => { const c = clientes.find(x => x.id === r.id)!; return matches(query, c.nombre, c.telefono, c.email, r.wants); }),
  ].filter(r => filtro === "todas" || (filtro === "clientes") === esCliente(r)).sort((x, y) => x.sort.localeCompare(y.sort) || x.name.localeCompare(y.name, "es"));
  const clave = (r: Pick<ContactRow, "kind" | "id">) => `${r.kind}:${r.id}`;
  const current = filas.find(r => clave(r) === selected) ?? (showDetail ? undefined : filas[0]);
  const condicion = (r: ContactRow) => r.kind === "cliente"
    ? `${CLIENTE_TIPO_LABELS[clientes.find(c => c.id === r.id)?.tipo ?? "otro"]} · ${PERSON_STATUS_LABEL[status.ofClient(r.id) ?? "prospecto"]}`
    : `Prospecto · ${LEAD_STAGE_LABELS[leadStage(abiertos.find(l => l.id === r.id)?.estado)]}`;
  function abrir(r: ContactRow) {
    setSelected(clave(r)); setShowDetail(true);
    const url = new URL(window.location.href); url.searchParams.set("id", clave(r)); window.history.replaceState(null, "", url);
  }
  const persona = current ? (current.kind === "cliente" ? clientes.find(c => c.id === current.id) : abiertos.find(l => l.id === current.id)) : undefined;
  const asesor = persona?.asesorId ? asesores.find(a => a.id === persona.asesorId) : undefined;

  return <div className={b.app} data-detail={showDetail}>
    <aside className={b.list} aria-label="Personas">
      <div className={b.listHead}>
        <div className={b.listHeadRow}><h1>Personas</h1><ButtonLink href="/admin/operaciones/nueva"><Plus size={16} aria-hidden />Nuevo</ButtonLink></div>
        <label className={s.search}><Search size={18} aria-hidden /><span className={b.sr}>Buscar por nombre o teléfono</span><input type="search" placeholder="Buscar por nombre o teléfono" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <Segmented label="Mostrar" value={filtro} onChange={setFiltro} options={[{ id: "todas", label: "Todos" }, { id: "prospectos", label: "Prospectos" }, { id: "clientes", label: "Clientes" }]} />
      </div>
      <div className={b.rows}>
        {!filas.length ? <p className={b.empty}>{query.trim() || filtro !== "todas" ? "Nadie coincide. Prueba con otro nombre o cambia el filtro." : "Todavía no hay personas. Registra a quien llamó con «Nuevo»."}</p>
          : GRUPOS.map(grupo => {
            const lista = filas.filter(r => grupoDe(r.sort, today) === grupo.id);
            if (!lista.length) return null;
            return <div key={grupo.id} role="group" aria-labelledby={`personas-${grupo.id}`} className={s.grupo}>
              <h2 id={`personas-${grupo.id}`} className={s.grpt} data-late={grupo.id === "toca" || undefined}>{grupo.titulo}<span>{lista.length}</span></h2>
              {lista.map(r => <button key={clave(r)} type="button" className={cn(b.row, s.prow)} aria-current={clave(r) === (current && clave(current))} onClick={() => abrir(r)}>
                <Avatar name={r.name} size={40} />
                <span className={s.prowText}><b>{r.name}</b><span>{condicion(r)}</span></span>
                {r.when && <span className={s.prowWhen} data-late={r.late || undefined}>{r.when}</span>}
              </button>)}
            </div>;
          })}
      </div>
    </aside>
    <main className={b.detail} style={{ gridTemplateRows: "auto auto minmax(0, 1fr)" }}>
      {current
        ? <Perfil key={clave(current)} row={current} sub={condicion(current)} today={today} onBack={() => setShowDetail(false)} persona={persona}
            asesor={asesor ? { nombre: asesor.nombre, foto: asesor.perfilPublico?.foto } : undefined}
            operaciones={current.kind === "cliente" ? operaciones.filter(o => o.cliente_id === current.id) : []}
            propiedades={propiedades} tareas={tareas} eventos={eventos} notas={notas} etapaDe={etapaDe} />
        : <><span /><span /><div className={b.center}><div className={b.stepView}><div><h3>{selected ? "Esta persona ya no aparece en tus contactos" : "Elige a una persona de la lista"}</h3><p>Aquí verás lo que sigue con ella y sus documentos.</p></div></div></div></>}
    </main>
  </div>;
}

function Perfil({ row, sub, persona, asesor, operaciones, propiedades, tareas, eventos, notas, today, onBack, etapaDe }: {
  row: ContactRow; sub: string; persona?: Persona; asesor?: { nombre: string; foto?: string }; operaciones: OperationRecord[]; propiedades: AdminProperty[];
  tareas: Task[]; eventos: Evento[]; notas: Nota[]; today: string; onBack: () => void; etapaDe: (o: OperationRecord) => string;
}) {
  const router = useRouter();
  const undo = useUndo();
  const [opId, setOpId] = React.useState(operaciones[0]?.id ?? "");
  const op = operaciones.find(o => o.id === opId) ?? operaciones[0];
  const [sueltos, setSueltos] = React.useState<Suelto[]>([]);
  const [archivos, setArchivos] = React.useState<ArchivoOperacion[]>([]);
  const [borradores, setBorradores] = React.useState<Borrador[]>([]);
  const [tab, setTab] = React.useState<Tab>("todos");
  const [vuelta, setVuelta] = React.useState(0);
  const [subiendo, setSubiendo] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [docsError, setDocsError] = React.useState(false);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const input = React.useRef<HTMLInputElement>(null);
  const esCliente = row.kind === "cliente";
  const tituloInmueble = (slug: string) => propiedades.find(p => p.slug === slug)?.titulo;

  React.useEffect(() => {
    if (!esCliente) return;
    let alive = true;
    fetchJson<{ documentos: Suelto[] }>(`/api/admin/bandeja?clienteId=${encodeURIComponent(row.id)}`).then(r => { if (alive) { setSueltos(r.documentos); setDocsError(false); } }).catch(() => { if (alive) setDocsError(true); });
    return () => { alive = false; };
  }, [esCliente, row.id, vuelta]);
  React.useEffect(() => {
    if (!op) return;
    let alive = true;
    fetchJson<{ archivos: ArchivoOperacion[] }>(`/api/admin/expedientes/${op.id}/archivos`).then(r => { if (alive) setArchivos(r.archivos); }).catch(() => undefined);
    fetchJson<{ documentos: Borrador[] }>(`/api/admin/expedientes/${op.id}/formatos`).then(r => { if (alive) setBorradores(r.documentos); }).catch(() => undefined);
    return () => { alive = false; };
  }, [op]);

  async function agregar(files: File[]) {
    setError(null); setAviso(null);
    const validos = files.filter(f => ACEPTA.includes(f.type));
    if (validos.length < files.length) setError("Solo se guardan PDF e imágenes JPEG, PNG o WEBP.");
    if (!validos.length) return;
    setSubiendo(true);
    try {
      for (const file of validos) {
        const prepared = await fetchJson<{ signedUrl: string; ticket: string }>("/api/admin/bandeja", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
        const sent = await fetch(prepared.signedUrl, { method: "PUT", credentials: "omit", headers: { "Content-Type": file.type }, body: file });
        if (!sent.ok) throw new Error("No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.");
        const { documento } = await fetchJson<{ documento: { id: string; titulo: string } }>("/api/admin/bandeja/completar", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ ticket: prepared.ticket }) });
        await fetchJson(`/api/admin/bandeja/${documento.id}`, { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify({ destino: { clienteId: row.id }, esperado: { titulo: documento.titulo, eliminado: false, archivado: false } }) });
      }
      setAviso(validos.length === 1 ? "Archivo guardado en su perfil." : `${validos.length} archivos guardados en su perfil.`);
    } catch (e) { setError(`${errorMessage(e)} Lo que alcanzó a subir quedó en la Bandeja.`); }
    setSubiendo(false); setVuelta(n => n + 1);
  }

  /*
    Cambia campos del registro con su versión. `cambios` se calcula sobre la copia más reciente de la
    colección; «Deshacer» vuelve a guardar los valores de antes sobre la versión que quedó.
  */
  async function guardarEn<T extends { id: string }>(col: Coleccion<T>, base: T, cambios: (actual: T) => Partial<T>, texto: string, sello?: (t: T) => T) {
    const fresco = () => col.list().find(x => x.id === base.id) ?? base;
    const actual = fresco();
    const nuevos = cambios(actual);
    const antes = Object.fromEntries(Object.keys(nuevos).map(k => [k, actual[k as keyof T]])) as Partial<T>;
    const listo = (t: T) => (sello ? sello(t) : t);
    await upsert(col, listo({ ...actual, ...nuevos }), col.version(actual));
    undo.offer({ text: texto, undo: async () => { const ahora = fresco(); await upsert(col, listo({ ...ahora, ...antes }), col.version(ahora)); } });
  }
  const guardar = (cambios: (actual: Persona) => Partial<Persona>, texto: string) => {
    if (!persona) return Promise.resolve();
    if (row.kind === "cliente") return guardarEn(db.clientes, persona as Cliente, c => cambios(c) as Partial<Cliente>, texto, c => ({ ...c, actualizadoEl: new Date().toISOString() }));
    return guardarEn(db.leads, persona as Lead, l => cambios(l) as Partial<Lead>, texto);
  };

  const documentos: Fila[] = [
    ...sueltos.map(d => ({ id: `s${d.id}`, nombre: d.titulo, detalle: "De la persona", origen: "Recibido", fecha: d.created_at, clase: "recibido" as const, href: `/api/admin/bandeja/${d.id}/descargar` })),
    ...(op ? archivos.filter(a => !a.deleted_at).map(a => ({ id: `a${a.id}`, nombre: a.titulo, detalle: "De la operación", origen: "Recibido", fecha: a.created_at, clase: "recibido" as const, href: `/api/admin/archivos-cliente/${a.id}/descargar` })) : []),
    ...(op ? borradores.map(d => ({ id: `f${d.id}`, nombre: tituloFormato(d.formato_id), detalle: "De la operación", origen: "Hecho aquí", version: `Versión ${d.version}`, fecha: d.updated_at, clase: "hecho" as const, href: `/admin/operaciones/${op.id}?documento=${d.id}` })) : []),
  ].sort((x, y) => y.fecha.localeCompare(x.fecha));
  const visibles = documentos.filter(d => tab === "todos" || (tab === "recibidos") === (d.clase === "recibido"));

  const pasos = op && isOwnerRoute(op.flujo?.ruta) ? ownerProcess(op.flujo?.ruta) : null;
  const fase = op && pasos ? processPhase(op.etapa, op.flujo, today) : null;
  const actual = pasos && fase ? pasos.findIndex(p => p.key === fase) : -1;
  const paso = pasos && actual >= 0 ? pasos[actual] : null;
  // Cuando no hay tarea ni cita, el «siguiente paso» de la lista es la etapa de la operación: aquí lo cuenta la guía, no se repite.
  const pendiente = /^Operación en /i.test(row.step) ? "" : row.step;
  const guia = op?.flujo?.ruta === "arrendador" ? "renta" : "venta";
  const digits = (persona?.telefono ?? "").replace(/\D/g, "");
  const wa = digits.length === 10 ? `52${digits}` : digits;
  const opHref = op ? `/admin/operaciones/${op.id}` : "";
  const ref = `${row.kind === "cliente" ? "clienteId" : "leadId"}=${encodeURIComponent(row.id)}`;

  // Sus inmuebles: los de sus operaciones (los suyos o los que busca) y aquel por el que preguntó.
  const papeles = new Map<string, string>();
  if (persona?.propiedadSlug) papeles.set(persona.propiedadSlug, "Preguntó por él");
  for (const o of operaciones) if (o.propiedad_slug) papeles.set(o.propiedad_slug, isOwnerRoute(o.flujo?.ruta) ? (o.operacion === "renta" ? "Lo ofrece en renta" : "Lo vende") : "Le interesa");
  const inmuebles = [...papeles].flatMap(([slug, papel]) => { const p = propiedades.find(x => x.slug === slug); return p ? [{ p, papel }] : []; });
  const notasContacto = row.kind === "lead" ? (persona as Lead | undefined)?.notas ?? [] : (persona as Cliente | undefined)?.leadOriginal?.notas ?? [];
  const historia = sucesos({ kind: row.kind, id: row.id, operaciones: operaciones.map(o => o.id) }, { notas, eventos, tareas, notasContacto }, today);
  const cliente = row.kind === "cliente" ? persona as Cliente | undefined : undefined;

  return <>
    <div className={cn(b.head, s.cover)}>
      <Button variant="ghost" iconOnly className={b.back} aria-label="Volver a la lista" onClick={onBack}><ArrowLeft size={18} aria-hidden /></Button>
      <Avatar name={row.name} size={72} className={s.coverFace} />
      <div className={cn(b.title, s.coverTitle)}>
        <h2>{row.name}</h2>
        <p className={s.coverSub}>
          <span>{sub}</span>
          {persona?.creadoEl && <span>En tus contactos desde {mesAno(persona.creadoEl)}</span>}
          {asesor && <span className={s.atiende}>Atiende <Avatar name={asesor.nombre} src={asesor.foto} size={20} /> {asesor.nombre}</span>}
        </p>
      </div>
      <div className={b.actions}>
        {digits && <ButtonLink href={`tel:${digits}`}><Phone size={16} aria-hidden />Llamar</ButtonLink>}
        {digits && <ButtonLink href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden />WhatsApp</ButtonLink>}
        <ButtonLink variant="primary" href={`/admin/agenda?nueva=1&${ref}`}><CalendarPlus size={16} aria-hidden />Agendar</ButtonLink>
        <MenuAcciones label="Más acciones" actions={[
          ...(op ? [{ label: "Crear un documento", onSelect: () => { router.push(`${opHref}?tab=documentos`); } }] : []),
          { label: "Nueva tarea", onSelect: () => { router.push(`/admin/agenda?tab=tareas&nueva=1&${ref}`); } },
          { label: "Abrir la ficha completa", onSelect: () => { router.push(row.href); } },
        ]} />
      </div>
    </div>
    {pasos ? <nav className={s.route} aria-label={`Guía de la operación ${op!.folio}`}>
      {pasos.map((paso, i) => <Link key={paso.key} href={opHref} className={s.rstep} data-s={i < actual ? "d" : i === actual ? "n" : ""} title={`${paso.label}: ${i < actual ? "hecho" : i === actual ? "paso actual" : "pendiente"}`} aria-current={i === actual ? "step" : undefined}><i /><span>{paso.label}</span></Link>)}
    </nav> : <span />}
    <div className={b.body}>
      <div className={b.center}>
        {error && <Notice tone="warn">{error}</Notice>}
        {aviso && <p className={b.hint} role="status">{aviso}</p>}
        <section className={b.step} aria-labelledby="persona-sigue">
          <div className={s.top}>
            {!pendiente && paso && <span className={s.big} aria-hidden>{String(actual + 1).padStart(2, "0")}</span>}
            <div>
              <p className={s.kicker}>En qué quedamos</p>
              <h3 id="persona-sigue">{pendiente || (paso ? paso.label : op ? `Su operación va en ${etapaDe(op)}` : "Sin siguiente paso anotado")}</h3>
              <p>{pendiente ? (paso ? `Es lo pendiente con esta persona. Su operación va en el paso ${actual + 1} de ${pasos!.length} de la guía de ${guia}: ${paso.label.toLowerCase()}.` : "Es lo pendiente con esta persona.")
                : paso ? `Es el paso ${actual + 1} de ${pasos!.length} de la guía de ${guia}. Abre la operación para trabajarlo.`
                : op ? "Abre la operación para ver qué toca." : "Anota en qué quedaron para que aparezca en Hoy."}{row.when && <> <span className={s.when} data-late={row.late}>{row.when}</span></>}</p>
            </div>
          </div>
          <div className={b.stepFoot}>
            {op ? <Link href={opHref} className={`${b.onDark} ${s.onDarkLink}`}>Abrir la operación</Link>
              : <Link href={row.kind === "cliente" ? `/admin/operaciones/nueva?clienteId=${encodeURIComponent(row.id)}` : row.href} className={`${b.onDark} ${s.onDarkLink}`}>{row.kind === "cliente" ? "Abrir una operación" : "Atender a esta persona"}</Link>}
            <Link href={`/admin/agenda?tab=tareas&nueva=1&${ref}`} className={`${b.onDark} ${s.onDarkLink}`} data-quiet="true">Anotar en qué quedamos</Link>
          </div>
        </section>

        {(inmuebles.length > 0 || esCliente) && <section aria-labelledby="persona-inmuebles">
          <div className={s.sechead}><h3 id="persona-inmuebles">Sus inmuebles</h3><Pill size="sm" tone="muted">{inmuebles.length}</Pill></div>
          {inmuebles.length ? <div className={s.pinm}>
            {inmuebles.map(({ p, papel }) => { const estado = propertyState(p); return <Link key={p.slug} href={`/admin/propiedades/${encodeURIComponent(p.slug)}/editar`} className={s.pcard}>
              <Thumb src={p.galeria[0]?.src} size={96} className={s.pthumb} />
              <span className={s.ptext}><b>{p.titulo}</b><span className={s.price}>{formatPrecio(p.precio)}</span><span className={s.pmeta}><Pill size="sm" tone={estado.strong ? "warn" : "muted"}>{estado.label}</Pill><span>{papel}</span></span></span>
            </Link>; })}
          </div> : <p className={b.empty}>Todavía no hay inmuebles ligados a esta persona.</p>}
        </section>}

        {operaciones.length > 0 && <section aria-labelledby="persona-operaciones">
          <div className={s.sechead}><h3 id="persona-operaciones">Operaciones</h3><Pill size="sm" tone="muted">{operaciones.length}</Pill>
            {operaciones.length > 1 && <div className={s.opPick}><Desplegable label="Guía y documentos de" value={op?.id ?? ""} onChange={setOpId} options={operaciones.map(o => ({ value: o.id, label: (o.propiedad_slug && tituloInmueble(o.propiedad_slug)) || o.folio, detail: o.folio }))} /></div>}
          </div>
          <div className={s.ops}>
            {operaciones.map(o => { const { stages, current } = stageTrack(o, today); const inm = o.propiedad_slug ? tituloInmueble(o.propiedad_slug) : undefined; return <Link key={o.id} href={`/admin/operaciones/${o.id}`} className={s.oprow}>
              <span className={s.opmain}><StageRail total={stages.length} current={current} /><span className={s.opline}><b>{current + 1} · {stages[current]?.label ?? etapaDe(o)}</b>{inm && <> · {inm}</>}</span></span>
              <span className={s.sub}>{o.folio}</span>
            </Link>; })}
          </div>
        </section>}

        <section aria-labelledby="persona-documentos">
          <div className={s.sechead}><h3 id="persona-documentos">Documentos</h3><Pill size="sm" tone="muted">{documentos.length}</Pill>
            {esCliente && <><Button onClick={() => input.current?.click()} disabled={subiendo}><Upload size={16} aria-hidden />{subiendo ? "Guardando…" : "Agregar archivo"}</Button>
              <input ref={input} type="file" multiple hidden accept={ACEPTA.join(",")} aria-label={`Agregar archivos al perfil de ${row.name}`} onChange={event => { void agregar([...(event.target.files ?? [])]); event.target.value = ""; }} /></>}
            <Segmented label="Mostrar documentos" value={tab} onChange={setTab} options={[{ id: "todos", label: "Todos" }, { id: "recibidos", label: "Recibidos" }, { id: "hechos", label: "Hechos aquí" }]} /></div>
          {docsError && <p className={b.hint} role="status">No se pudieron cargar los documentos de la persona. <button type="button" className="underline" onClick={() => setVuelta(n => n + 1)}>Reintentar</button></p>}
          {visibles.length ? <>
            <div className={s.thead}><span>Documento</span><span>Origen</span><span>Fecha</span><span /></div>
            {visibles.map(d => <div key={d.id} className={s.trow}>
              <div><div className={s.name}>{d.nombre}</div><div className={s.sub}>{d.detalle}</div></div>
              <div><div>{d.origen}</div>{d.version && <div className={s.sub}>{d.version}</div>}</div>
              <div className={`${s.sub} ${s.hm}`}>{corta(d.fecha)}</div>
              <MenuAcciones label={`Acciones de ${d.nombre}`} actions={[{ label: d.clase === "hecho" ? "Abrir el documento" : "Ver el archivo", onSelect: () => { if (d.clase === "hecho") router.push(d.href); else window.open(d.href, "_blank", "noopener"); } }]} />
            </div>)}
          </> : <p className={b.empty}>{documentos.length ? "No hay documentos de este tipo." : esCliente ? "Todavía no tiene documentos. Usa «Agregar archivo», o archívale uno desde la Bandeja." : "Sus documentos se guardan en su perfil cuando empieza su operación."}</p>}
        </section>

        <section aria-labelledby="persona-historia">
          <div className={s.sechead}><h3 id="persona-historia">Lo que ha pasado</h3></div>
          {historia.length ? <ol className={s.timeline}>{historia.map(h => <li key={h.id}><Marca suceso={h} /><span><span className={s.tltext}>{h.texto}</span><span className={s.sub}>{h.detalle}</span></span></li>)}</ol>
            : <p className={b.empty}>Todavía no hay nada anotado con esta persona. Lo que anotes, las citas que pasen y las tareas que termines aparecen aquí.</p>}
        </section>
      </div>
      <aside className={b.inspector} aria-label="Datos de la persona">
        <div className={b.blk}><h3>Datos</h3>
          <div className={s.datos}>
            <Editable etiqueta="Teléfono" muestra={persona?.telefono} vacio="Sin teléfono" inicial={() => persona?.telefono ?? ""}
              onGuardar={v => guardar(() => ({ telefono: v.trim() }), "Se guardó el teléfono.")}>
              {(v, set) => <input aria-label="Teléfono" type="tel" inputMode="tel" autoComplete="off" maxLength={40} autoFocus value={v} onChange={e => set(e.target.value)} />}
            </Editable>
            <Editable etiqueta="Correo" muestra={persona?.email} vacio="Sin correo" inicial={() => persona?.email ?? ""}
              onGuardar={v => guardar(() => ({ email: v.trim() || undefined }), "Se guardó el correo.")}>
              {(v, set) => <input aria-label="Correo" type="email" autoComplete="off" maxLength={254} autoFocus value={v} onChange={e => set(e.target.value)} />}
            </Editable>
            {cliente && <div className={s.dato}><span className={s.datoLabel}>Papel</span>
              <Desplegable hideLabel label="Papel" value={cliente.tipo} onChange={tipo => { if (tipo !== cliente.tipo) void guardar(() => ({ tipo }), `Ahora es ${CLIENTE_TIPO_LABELS[tipo].toLowerCase()}.`).catch(e => setError(errorMessage(e))); }}
                options={(Object.keys(CLIENTE_TIPO_LABELS) as Cliente["tipo"][]).map(t => ({ value: t, label: CLIENTE_TIPO_LABELS[t] }))} />
            </div>}
            {!operaciones.length && <Editable etiqueta="Próximo contacto" vacio="Sin fecha"
              muestra={persona?.perfil?.proximoContacto ? [corta(`${persona.perfil.proximoContacto}T12:00:00Z`), persona.perfil.proximaAccion].filter(Boolean).join(" · ") : undefined}
              inicial={() => ({ fecha: persona?.perfil?.proximoContacto ?? "", que: persona?.perfil?.proximaAccion ?? "" })}
              onGuardar={v => guardar(p => ({ perfil: { ...p.perfil, proximoContacto: v.fecha || undefined, proximaAccion: v.que.trim() || undefined } }), "Se guardó el próximo contacto.")}>
              {(v, set) => <>
                <input type="date" aria-label="Fecha del próximo contacto" autoFocus value={v.fecha} onChange={e => set({ ...v, fecha: e.target.value })} />
                <input type="text" aria-label="Qué toca ese día" placeholder="Qué toca ese día" maxLength={160} value={v.que} onChange={e => set({ ...v, que: e.target.value })} />
              </>}
            </Editable>}
          </div>
        </div>
        {(row.wants || persona?.mensaje) && <div className={b.blk}><h3>Motivo del contacto</h3>
          {row.wants && <p className={s.value}>{row.wants}</p>}
          {persona?.mensaje && <p className={s.muted}>«{persona.mensaje}»</p>}
        </div>}
      </aside>
    </div>
    <UndoNotice current={undo.current} clear={undo.clear} ms={undo.ms} onError={setError} />
  </>;
}

const MARCA = { nota: FileText, cita: CalendarDays, tarea: Check, contacto: MessageCircle } as const;
function Marca({ suceso }: { suceso: Suceso }) {
  if (suceso.autor) return <Avatar name={suceso.autor} size={28} />;
  const Icono = MARCA[suceso.clase];
  return <span className={s.tlicon} aria-hidden><Icono size={14} aria-hidden /></span>;
}

/*
  Campo que se cambia en su lugar: se lee como dato y, al pulsarlo, se vuelve un formulario corto.
  Escape o «Cancelar» lo dejan como estaba; si el servidor no lo acepta, el mensaje queda junto al campo.
*/
function Editable<D>({ etiqueta, muestra, vacio, inicial, onGuardar, children }: {
  etiqueta: string; muestra?: string; vacio: string; inicial: () => D; onGuardar: (valor: D) => Promise<unknown>;
  children: (valor: D, set: (valor: D) => void) => React.ReactNode;
}) {
  const [borrador, setBorrador] = React.useState<{ v: D } | null>(null);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const boton = React.useRef<HTMLButtonElement>(null);
  const cerrar = () => { setBorrador(null); setError(null); requestAnimationFrame(() => boton.current?.focus()); };
  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    if (!borrador) return;
    setGuardando(true); setError(null);
    try { await onGuardar(borrador.v); cerrar(); } catch (e) { setError(errorMessage(e)); } finally { setGuardando(false); }
  }
  if (!borrador) return <div className={s.dato}>
    <span className={s.datoLabel}>{etiqueta}</span>
    <button ref={boton} type="button" className={s.inline} aria-label={`Cambiar ${etiqueta.toLowerCase()}: ${muestra || vacio}`} onClick={() => setBorrador({ v: inicial() })}>
      <span data-empty={!muestra || undefined}>{muestra || vacio}</span><Pencil size={15} aria-hidden />
    </button>
  </div>;
  return <form className={s.datoEdit} aria-label={`Cambiar ${etiqueta.toLowerCase()}`} onSubmit={enviar} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); cerrar(); } }}>
    <span className={s.datoLabel}>{etiqueta}</span>
    {children(borrador.v, v => setBorrador({ v }))}
    {error && <p className={s.datoError} role="alert">{error}</p>}
    <div className={s.datoActs}><Button type="submit" variant="primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button><Button variant="ghost" onClick={cerrar}>Cancelar</Button></div>
  </form>;
}
