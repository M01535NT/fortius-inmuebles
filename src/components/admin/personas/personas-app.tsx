"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Columns3, MessageCircle, Phone, Plus, Search, Upload } from "@/components/admin/icons";
import { Button, ButtonLink, Notice, Pill, Segmented } from "@/components/admin/kit";
import { Desplegable, MenuAcciones } from "@/components/admin/bandeja/desplegable";
import { usePersonStatus } from "@/components/admin/workspace/use-person-status";
import { CLIENTE_TIPO_LABELS } from "@/components/admin/cliente-editor";
import { clientRows, leadRows, matches, type ContactRow } from "@/lib/admin/contacts-view";
import { operationalDate } from "@/lib/admin/operational-date";
import { leadStage, LEAD_STAGE_LABELS } from "@/lib/admin/person-view";
import { PERSON_STATUS_LABEL } from "@/lib/admin/person-status";
import { db, errorMessage, fetchJson, loadAllDossiers, useCollection } from "@/lib/admin/store";
import type { OperationRecord } from "@/lib/admin/operation-view";
import { formatoById } from "@/lib/formatos/catalog";
import { isOwnerRoute, ownerProcess, processPhase, processStageText } from "@/lib/formatos/operation-workflow";
import b from "@/components/admin/bandeja/bandeja.module.css";
import s from "./personas.module.css";

/*
  FLX · Personas (boceto aprobado por el titular el 14/11/2026). Lista a la izquierda y el perfil
  a la derecha: la guía de su operación, un bloque con lo que sigue, sus documentos (los de su
  operación y los que se le archivaron desde la Bandeja) y la columna de datos. Lee lo que ya
  existe; no cambia ninguna regla: la guía se muestra como funciona hoy y los frenos siguen
  hasta FLX-03. Editar, eliminar y el historial completo siguen en la ficha.
*/

type Filtro = "todas" | "prospectos" | "clientes";
type Tab = "todos" | "recibidos" | "hechos";
type Fila = { id: string; nombre: string; detalle: string; origen: string; version?: string; fecha: string; clase: "recibido" | "hecho"; href: string };
type Suelto = { id: string; titulo: string; created_at: string; tipo_documento: string | null };
type ArchivoOperacion = { id: string; titulo: string; created_at: string; deleted_at: string | null };
type Borrador = { id: string; formato_id: string; version: number; updated_at: string };
const ACEPTA = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const corta = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "America/Tijuana" });
const JSON_HEADERS = { "Content-Type": "application/json" };
const tituloFormato = (id: string) => { try { return formatoById(id).title; } catch { return "Formato"; } };

export function PersonasApp({ initialId }: { initialId: string | null }) {
  const leads = useCollection(db.leads), clientes = useCollection(db.clientes), tareas = useCollection(db.tareas), eventos = useCollection(db.eventos), propiedades = useCollection(db.propiedades);
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

  return <div className={b.app} data-detail={showDetail}>
    <aside className={b.list} aria-label="Personas">
      <div className={b.listHead}>
        <div className={b.listHeadRow}><h1>Personas</h1><ButtonLink href="/admin/operaciones/nueva"><Plus size={16} aria-hidden />Nuevo</ButtonLink></div>
        <label className={s.search}><Search size={18} aria-hidden /><span className={b.sr}>Buscar por nombre o teléfono</span><input type="search" placeholder="Buscar por nombre o teléfono" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <Segmented label="Mostrar" value={filtro} onChange={setFiltro} options={[{ id: "todas", label: "Todos" }, { id: "prospectos", label: "Prospectos" }, { id: "clientes", label: "Clientes" }]} />
      </div>
      <div className={b.rows}>
        {!filas.length ? <p className={b.empty}>{query.trim() || filtro !== "todas" ? "Nadie coincide. Prueba con otro nombre o cambia el filtro." : "Todavía no hay personas. Registra a quien llamó con «Nuevo»."}</p>
          : filas.map(r => <button key={clave(r)} type="button" className={b.row} aria-current={clave(r) === (current && clave(current))} onClick={() => abrir(r)}>
            <span className={b.rowA}><b>{r.name}</b>{r.when && <span className={r.late ? s.late : undefined}>{r.when}</span>}</span>
            <span className={b.rowB}>{condicion(r)}</span>
          </button>)}
      </div>
    </aside>
    <main className={b.detail} style={{ gridTemplateRows: "auto auto minmax(0, 1fr)" }}>
      {current
        ? <Perfil key={clave(current)} row={current} sub={condicion(current)} today={today} onBack={() => setShowDetail(false)}
            persona={current.kind === "cliente" ? clientes.find(c => c.id === current.id) : abiertos.find(l => l.id === current.id)}
            operaciones={current.kind === "cliente" ? operaciones.filter(o => o.cliente_id === current.id) : []}
            tituloInmueble={slug => propiedades.find(p => p.slug === slug)?.titulo} etapaDe={etapaDe} />
        : <><span /><span /><div className={b.center}><div className={b.stepView}><div><h3>{selected ? "Esta persona ya no aparece en tus contactos" : "Elige a una persona de la lista"}</h3><p>Aquí verás lo que sigue con ella y sus documentos.</p></div></div></div></>}
    </main>
  </div>;
}

function Perfil({ row, sub, persona, operaciones, today, onBack, tituloInmueble, etapaDe }: {
  row: ContactRow; sub: string; persona?: { telefono?: string; email?: string; mensaje?: string; zona?: string }; operaciones: OperationRecord[]; today: string; onBack: () => void;
  tituloInmueble: (slug: string) => string | undefined; etapaDe: (o: OperationRecord) => string;
}) {
  const router = useRouter();
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
  const inmueble = op?.propiedad_slug ? tituloInmueble(op.propiedad_slug) : undefined;

  return <>
    <div className={b.head}>
      <Button variant="ghost" iconOnly className={b.back} aria-label="Volver a la lista" onClick={onBack}><ArrowLeft size={18} aria-hidden /></Button>
      <div className={b.title}><h2>{row.name}</h2><span>{sub}</span></div>
      <div className={b.actions}>
        {esCliente && <>
          <Button onClick={() => input.current?.click()} disabled={subiendo}><Upload size={16} aria-hidden />{subiendo ? "Guardando…" : "Agregar archivo"}</Button>
          <input ref={input} type="file" multiple hidden accept={ACEPTA.join(",")} aria-label={`Agregar archivos al perfil de ${row.name}`} onChange={event => { void agregar([...(event.target.files ?? [])]); event.target.value = ""; }} />
        </>}
        {op && <ButtonLink variant="primary" href={`${opHref}?tab=documentos`}><Plus size={16} aria-hidden />Crear documento</ButtonLink>}
        <MenuAcciones label="Más acciones" actions={[
          { label: "Abrir la ficha completa", onSelect: () => { router.push(row.href); } },
          { label: "Agendar una cita", onSelect: () => { router.push(`/admin/agenda?nueva=1&${row.kind === "cliente" ? "clienteId" : "leadId"}=${encodeURIComponent(row.id)}`); } },
          { label: "Nueva tarea", onSelect: () => { router.push(`/admin/agenda?tab=tareas&nueva=1&${row.kind === "cliente" ? "clienteId" : "leadId"}=${encodeURIComponent(row.id)}`); } },
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
              <h3 id="persona-sigue">{pendiente || (paso ? paso.label : op ? `Su operación va en ${etapaDe(op)}` : "Sin siguiente paso anotado")}</h3>
              <p>{pendiente ? (paso ? `Es lo pendiente con esta persona. Su operación va en el paso ${actual + 1} de ${pasos!.length} de la guía de ${guia}: ${paso.label.toLowerCase()}.` : "Es lo pendiente con esta persona.")
                : paso ? `Es el paso ${actual + 1} de ${pasos!.length} de la guía de ${guia}. Abre la operación para trabajarlo.`
                : op ? "Abre la operación para ver qué toca." : "Anota en qué quedaron para que aparezca en Hoy."}{row.when && <> <span className={s.when} data-late={row.late}>{row.when}</span></>}</p>
            </div>
          </div>
          <div className={b.stepFoot}>
            {op ? <Link href={opHref} className={`${b.onDark} ${s.onDarkLink}`}>Abrir la operación</Link>
              : <Link href={row.kind === "cliente" ? `/admin/operaciones/nueva?clienteId=${encodeURIComponent(row.id)}` : row.href} className={`${b.onDark} ${s.onDarkLink}`}>{row.kind === "cliente" ? "Abrir una operación" : "Atender a esta persona"}</Link>}
            <Link href={`/admin/agenda?tab=tareas&nueva=1&${row.kind === "cliente" ? "clienteId" : "leadId"}=${encodeURIComponent(row.id)}`} className={`${b.onDark} ${s.onDarkLink}`} data-quiet="true">Anotar en qué quedamos</Link>
          </div>
        </section>
        <section aria-labelledby="persona-documentos">
          <div className={s.sechead}><h3 id="persona-documentos">Documentos</h3><Pill size="sm" tone="muted">{documentos.length}</Pill>
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
      </div>
      <aside className={b.inspector} aria-label="Datos de la persona">
        <div className={b.blk}><h3>En qué quedamos</h3>
          {pendiente ? <><p className={s.value}>{pendiente}</p>{row.when && <div><Pill size="sm" tone={row.late ? "alert" : "warn"}>{row.when}</Pill></div>}</> : <p className={s.muted}>Nada anotado.</p>}
        </div>
        <div className={b.blk}><h3>Contacto</h3>
          <p className={s.value}>{persona?.telefono || "Sin teléfono"}</p>
          {persona?.email && <p className={s.muted}>{persona.email}</p>}
          {digits && <div className={s.contact}><ButtonLink href={`tel:${digits}`}><Phone size={16} aria-hidden />Llamar</ButtonLink><ButtonLink href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden />WhatsApp</ButtonLink></div>}
        </div>
        {operaciones.length > 0 && <div className={b.blk}><h3>Ligado a</h3>
          {operaciones.length > 1 && <Desplegable hideLabel label="Operación que se muestra" value={op?.id ?? ""} onChange={setOpId} options={operaciones.map(o => ({ value: o.id, label: (o.propiedad_slug && tituloInmueble(o.propiedad_slug)) || o.folio, detail: o.folio }))} />}
          {op && <Link href={opHref} className={s.lrow}><Columns3 size={18} aria-hidden /><span><span className={s.value}>{op.operacion === "renta" ? "Renta" : "Venta"}{inmueble ? ` · ${inmueble}` : ""}</span><span className={s.sub}>{op.folio} · {etapaDe(op)}</span></span></Link>}
          {op?.propiedad_slug && <Link href={`/admin/propiedades/${encodeURIComponent(op.propiedad_slug)}/editar`} className={s.lrow}><Building2 size={18} aria-hidden /><span><span className={s.value}>{inmueble ?? "Inmueble"}</span></span></Link>}
        </div>}
        {(row.wants || persona?.mensaje) && <div className={b.blk}><h3>Motivo del contacto</h3>
          {row.wants && <p className={s.value}>{row.wants}</p>}
          {persona?.mensaje && <p className={s.muted}>«{persona.mensaje}»</p>}
        </div>}
      </aside>
    </div>
  </>;
}
