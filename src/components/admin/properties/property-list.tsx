"use client";
import { usePropertyScope } from "@/lib/admin/staff-scope";
import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Building2, Clock, Key, LayoutGrid, List, MapPin, Plus, Search, Star, UserRound, EMPTY_ART } from "@/components/admin/icons";
import { ActionsMenu, Avatar, ButtonLink, EmptyBox, Kbd, Pill, StageRail, Thumb } from "@/components/admin/kit";
import { Checkbox, ToggleGroup, ToggleGroupItem } from "@/components/ui/controls";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { inputClass } from "@/components/admin/ui";
import { GuidedPage } from "@/components/admin/workspace/guided-page";
import { InventoryControls } from "@/components/admin/workspace/inventory-controls";
import { usePanelPreference } from "@/components/admin/workspace/preferences-store";
import { BulkBar, SelectToggle, useSelection, type BulkAction, type Selection } from "@/components/admin/workspace/bulk";
import { emptyInventoryFilters, filterInventory, type InventoryFilters } from "@/lib/admin/workspace";
import { CAPTURE_STATUS_LABEL, type CaptureStatus } from "@/lib/admin/person-status";
import { usePersonStatus } from "@/components/admin/workspace/use-person-status";
import { ESTADO_LABELS, OPERACION_LABELS, TIPO_LABELS, estadoValido, type Property } from "@/data/propiedades";
type EstadoPropiedad = Property["estado"];
import { db, loadAllDossiers, upsertPropiedad, useCollection, useSession, type AdminProperty } from "@/lib/admin/store";
import { UndoNotice, useUndo, type Undoable } from "@/components/admin/workspace/undo-notice";
import { operationalDate } from "@/lib/admin/operational-date";
import { faltantes, pidenAlgoHoy, type Pendiente } from "@/lib/admin/inmuebles-vitrina";
import { stageTrack, type OperationRecord } from "@/lib/admin/operation-view";
import { isOwnerRoute } from "@/lib/formatos/operation-workflow";
import { typingTarget } from "@/lib/admin/commands";
import { PREP_ITEMS, openKeyLoans, prepState, type PrepItem } from "@/lib/propiedad-seguimiento";
import { seekersFrom } from "@/lib/admin/buyer-matches";
import { demandGroups } from "@/lib/admin/demand";
import { DemandView } from "./demand-view";
import { Disclosure } from "./disclosure";
import { PrecioEnFila } from "./property-inline";
import { PropertySheet, type SheetData } from "./property-sheet";
import s from "./properties.module.css";

/*
  Inmuebles (LV-10f, 15/11/2026): mezcla de las tres direcciones del boceto «Inmuebles en tres
  direcciones». De la Vitrina, el resumen, lo que pide algo hoy con foto, la lista con foto grande,
  la etapa de su asunto y la ficha rápida ancha; de Cartera, el precio en su lugar, la preparación
  en barras, las caras de propietario y responsable y la selección de varios; de Precisión, el
  teclado (J y K para moverse, Enter para abrir, Esc para cerrar). La galería en tarjetas sigue
  como otra forma de ver. Cada inmueble se abre en su ficha rápida; editar la ficha completa y
  su seguimiento siguen en sus páginas.
*/

const PAGE = 24;
// UX-02: lista o galería sigue al usuario; lo que este navegador recordaba se sube una vez.
const LEGACY_VIEW = { key: "fortius.inmuebles.vista.v1", parse: (raw: string) => raw === "tarjetas" ? "tarjetas" as const : raw === "filas" ? "filas" as const : undefined };

/** Lo que le falta a un inmueble para promoverse: «fotos», «medidas», «precio». Sin faltantes, lista vacía. */
export function propertyGaps(p: Property) {
  return faltantes(p);
}
const listText = (items: string[]) => items.length > 1 ? items.slice(0, -1).join(", ") + " y " + items.at(-1) : items[0];
const gapText = (gaps: string[]) => `${gaps.length === 1 ? "Falta" : "Faltan"} ${listText(gaps)}`;

/** Piezas de preparación: cuáles aplican, cuáles están listas y el nombre corto de las que faltan. */
function prepOf(p: Property) {
  const items = (Object.keys(PREP_ITEMS) as PrepItem[]).map(item => ({ item, estado: prepState(p, item).estado })).filter(x => x.estado !== "no_aplica");
  const missing = items.filter(x => x.estado !== "listo").map(x => PREP_ITEMS[x.item].replace("Sesión de fotos", "Fotos").replace("Recorrido 360", "360").replace("Plano o croquis", "Plano").replace("Letrero o lona", "Letrero").replace("Texto del anuncio", "Anuncio").toLowerCase());
  return { items, missing };
}
function prepLine(missing: string[]) {
  if (!missing.length) return "Lista para promover";
  const named = missing.length > 2 ? [...missing.slice(0, 2), `${missing.length - 2} más`] : missing;
  return `Falta ${listText(named)}`;
}

/** «180 m² const. · 220 m² terreno · 3 rec. · 2.5 baños». */
export function propertyFacts(p: Property) {
  const f = p.ficha;
  return [
    f.construccionM2 !== undefined && `${f.construccionM2} m² const.`,
    f.terrenoM2 !== undefined && `${f.terrenoM2} m² terreno`,
    f.recamaras !== undefined && `${f.recamaras} rec.`,
    f.banos !== undefined && `${f.banos} ${f.banos === 1 ? "baño" : "baños"}`,
  ].filter(Boolean).join(" · ");
}

/** Lo que más importa del estado: si ya no está disponible, eso; si lo está, si se ve en el sitio. */
export function propertyState(p: Property, capture?: CaptureStatus | null) {
  // COR-10 (RP-97): mientras se capta, la firma de la intermediación dice si ya está captado.
  if (p.estado === "evaluacion" && capture) return { label: CAPTURE_STATUS_LABEL[capture], strong: false };
  if (p.estado !== "disponible") return { label: ESTADO_LABELS[p.estado], strong: p.estado === "apartada" };
  return { label: p.publicada ? "Publicado" : "Sin publicar", strong: false };
}

const TONE_ICON = { alert: Key, info: UserRound, warn: AlertTriangle } as const;
const ESTADOS_MASIVOS: EstadoPropiedad[] = ["evaluacion", "disponible", "apartada", "vendida", "rentada"];

type Row = { property: AdminProperty; adviser?: { nombre: string; foto?: string }; owner?: string; op?: OperationRecord; pendiente?: Pendiente; duplicated: boolean };

export function PropertyList() {
  const properties = useCollection(db.propiedades), advisers = useCollection(db.asesores), clients = useCollection(db.clientes);
  const session = useSession();
  const router = useRouter();
  const [filters, setFilters] = React.useState<InventoryFilters>(emptyInventoryFilters);
  const [page, setPage] = React.useState(0);
  const [missingOnly, setMissingOnly] = React.useState(false);
  // COR-19: «Buscan y no tenemos» cambia la lista por la demanda sin cubrir.
  const [demand, setDemand] = React.useState(false);
  const [openSlug, setOpenSlug] = React.useState<string | null>(null);
  const leads = useCollection(db.leads);
  const seekers = React.useMemo(() => seekersFrom(leads, clients), [leads, clients]);
  const groups = React.useMemo(() => demandGroups(seekers, properties), [seekers, properties]);
  // La etapa y el propietario salen del asunto abierto del inmueble (si lo tiene).
  const [ops, setOps] = React.useState<OperationRecord[]>([]);
  React.useEffect(() => { let alive = true; loadAllDossiers<OperationRecord>().then(all => { if (alive) setOps(all.filter(o => !o.deleted_at && o.etapa !== "cerrado" && o.flujo?.estado !== "descartada")); }).catch(() => undefined); return () => { alive = false; }; }, []);
  // LV-10f: lo que pide algo hoy, con su motivo y la acción que lo resuelve.
  const today = operationalDate();
  const pendientes = pidenAlgoHoy(properties, seekers, today, instant => operationalDate(new Date(instant)));
  const undo = useUndo();
  const [undoError, setUndoError] = React.useState("");
  const incomplete = properties.filter(p => p.estado !== "vendida" && p.estado !== "rentada" && propertyGaps(p).length > 0);
  const results = filterInventory(properties, filters).filter(p => !missingOnly || propertyGaps(p).length > 0);
  const pages = Math.max(1, Math.ceil(results.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = results.slice(current * PAGE, (current + 1) * PAGE);
  const published = properties.filter(p => p.publicada).length;
  const update = (next: InventoryFilters) => { setFilters(next); setPage(0); };
  const extra = [filters.advisor, filters.publication, filters.status].filter(Boolean).length;
  const { value: view, save: saveView, error: viewError } = usePanelPreference("inmueblesVista", "filas", LEGACY_VIEW);
  const selection = useSelection(React.useMemo(() => shown.map(p => p.slug), [shown]));
  const listRef = React.useRef<HTMLUListElement>(null);

  const rowOf = (p: AdminProperty): Row => {
    const adviser = advisers.find(a => a.id === p.asesorId);
    const op = ops.find(o => o.propiedad_slug === p.slug && isOwnerRoute(o.flujo?.ruta)) ?? ops.find(o => o.propiedad_slug === p.slug);
    const owner = op && isOwnerRoute(op.flujo?.ruta) ? clients.find(c => c.id === op.cliente_id)?.nombre : undefined;
    return { property: p, adviser: adviser && { nombre: adviser.nombre, foto: adviser.perfilPublico?.foto }, owner, op, pendiente: pendientes.find(x => x.property.slug === p.slug),
      duplicated: properties.some(o => o.slug !== p.slug && o.codigo.trim().toUpperCase() === p.codigo.trim().toUpperCase()) };
  };
  const openRow = openSlug ? properties.find(p => p.slug === openSlug) : undefined;
  const capture = usePersonStatus();
  const sheet: SheetData | null = openRow ? { ...rowOf(openRow), facts: propertyFacts(openRow), state: propertyState(openRow, capture.ofProperty(openRow.slug)).label } : null;

  // B · Precisión: J/K (o flechas) se mueven entre los inmuebles; Enter abre la ficha rápida.
  const onListKey = (event: React.KeyboardEvent) => {
    if (typingTarget(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    const down = event.key === "j" || event.key === "J" || event.key === "ArrowDown", up = event.key === "k" || event.key === "K" || event.key === "ArrowUp";
    if (!down && !up) return;
    const buttons = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-open]") ?? [])];
    const at = buttons.findIndex(b => b === document.activeElement || b.contains(document.activeElement));
    const next = buttons[Math.max(0, Math.min(buttons.length - 1, at < 0 ? 0 : at + (down ? 1 : -1)))];
    if (next) { event.preventDefault(); next.focus(); }
  };

  const admin = !session || session.role === "admin";
  const bulkActions: BulkAction[] = [
    { id: "estado", label: "Cambiar estado a…", verb: "Se cambiaron", options: ESTADOS_MASIVOS.map(value => ({ value, label: ESTADO_LABELS[value] })), apply: async (slug, value) => {
      const p = db.propiedades.list().find(x => x.slug === slug);
      if (!p) throw new Error("Ya no existe; puede que lo hayan eliminado.");
      if (p.estado === value) return "sin-cambio";
      if (!estadoValido(p.operacion, value as EstadoPropiedad)) throw new Error(`«${ESTADO_LABELS[value as EstadoPropiedad]}» no corresponde a un inmueble en ${OPERACION_LABELS[p.operacion].toLowerCase()}.`);
      await upsertPropiedad({ ...p, estado: value as EstadoPropiedad }, db.propiedades.version(p));
      return "aplicado";
    } },
    ...(admin ? [{ id: "responsable", label: "Asignar a…", verb: "Se asignaron", options: advisers.map(a => ({ value: a.id, label: a.nombre })), apply: async (slug: string, value: string) => {
      const p = db.propiedades.list().find(x => x.slug === slug);
      if (!p) throw new Error("Ya no existe; puede que lo hayan eliminado.");
      if (p.asesorId === value) return "sin-cambio" as const;
      await upsertPropiedad({ ...p, asesorId: value }, db.propiedades.version(p));
      return "aplicado" as const;
    } } satisfies BulkAction] : []),
  ];

  const attention = pendientes.length;
  return <GuidedPage title="Inmuebles" subtitle={`${properties.length} ${properties.length === 1 ? "inmueble" : "inmuebles"} · ${published} ${published === 1 ? "publicado" : "publicados"}`} actions={<>
    {properties.length > 0 && !demand && <SelectToggle selection={selection} noun="inmuebles" />}
    <ButtonLink href="/admin/propiedades/nueva" variant="primary"><Plus size={16} aria-hidden="true" />Agregar inmueble</ButtonLink>
  </>}>
    {viewError && <p role="alert" className="m-0 text-sm text-destructive">{viewError}</p>}
    {undoError && <p role="alert" className="m-0 text-sm text-destructive">{undoError}</p>}

    {!demand && attention > 0 && !filters.q && <section className={s.vitrina} aria-labelledby="piden-hoy">
      <h2 id="piden-hoy" className={s.vitrinaHead}>Piden algo hoy<span>{attention}</span></h2>
      <ul className={s.vitrinaList}>{pendientes.slice(0, 3).map(x => { const adviser = advisers.find(a => a.id === x.property.asesorId); const Icon = TONE_ICON[x.tono]; return <li key={x.property.slug} className={s.vcard}>
        <Thumb src={x.property.galeria[0]?.src} size={112} className={s.vthumb} />
        <span className={s.vbody}>
          <span className={s.vwhy} data-tone={x.tono}><Icon size={14} aria-hidden="true" />{x.motivo}</span>
          <b>{x.property.titulo}</b>
          {adviser && <span className={s.vwho}><Avatar name={adviser.nombre} src={adviser.perfilPublico?.foto} size={20} />{adviser.nombre}</span>}
          <ButtonLink href={x.href} aria-label={`${x.accion}: ${x.property.titulo}`}>{x.accion}</ButtonLink>
        </span>
      </li>; })}</ul>
      {attention > 3 && <p className={s.vmore}>Y {attention - 3} más con algo pendiente.</p>}
    </section>}

    <div className={s.toolbar}>
      {!demand && <ToggleGroup type="single" className={s.segmented} aria-label="Operación" value={filters.operation || "todos"} onValueChange={id => { if (id) update({ ...filters, operation: id === "todos" ? "" : id }); }}>
        {[["todos", "Todos"], ["venta", "En venta"], ["renta", "En renta"]].map(([id, label]) => <ToggleGroupItem key={id} value={id} className={s.segItem}>{label}</ToggleGroupItem>)}
      </ToggleGroup>}
      {/* Filtros rápidos: uno a la vez, se quitan al pulsarlos de nuevo (shadcn/ui «ToggleGroup»). */}
      <ToggleGroup type="single" className={s.quick} aria-label="Filtros rápidos" value={demand ? "demanda" : missingOnly ? "falta" : ""} onValueChange={id => { setDemand(id === "demanda"); setMissingOnly(id === "falta"); setPage(0); }}>
        <ToggleGroupItem value="falta" className={s.gapChip}>Les falta algo<span>{incomplete.length}</span></ToggleGroupItem>
        <ToggleGroupItem value="demanda" className={s.gapChip}>Buscan y no tenemos<span>{new Set(groups.flatMap(g => g.seekers.map(x => `${x.kind}-${x.id}`))).size}</span></ToggleGroupItem>
      </ToggleGroup>
      {!demand && <label className={s.search}><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar colonia, calle o código</span><input type="search" className={inputClass} placeholder="Buscar colonia, calle o código" value={filters.q} onChange={e => update({ ...filters, q: e.target.value })} /></label>}
      {!demand && <ToggleGroup type="single" className={s.viewSwitch} aria-label="Forma de ver" value={view} onValueChange={id => { if (id === "filas" || id === "tarjetas") void saveView(id); }}>
        <ToggleGroupItem value="filas" className={s.segItem}><List size={16} aria-hidden="true" />Lista</ToggleGroupItem>
        <ToggleGroupItem value="tarjetas" className={s.segItem}><LayoutGrid size={16} aria-hidden="true" />Galería</ToggleGroupItem>
      </ToggleGroup>}
    </div>
    {!demand && <Disclosure className={s.more} title={`Más filtros${extra > 0 ? ` · ${extra} ${extra === 1 ? "activo" : "activos"}` : ""}`}>
      <div className="mt-3"><InventoryControls value={filters} onChange={update} advisers={advisers} count={results.length} hideSearch /></div>
    </Disclosure>}

    {demand ? <DemandView groups={groups} />
      : properties.length === 0 ? <EmptyBox art={{ icon: EMPTY_ART.inmuebles, kind: "empezar" }} title="Todavía no hay inmuebles" steps={["Agrégalo aquí o al terminar la entrevista con el propietario.", "Sube sus fotos y completa la ficha.", "Publícalo en el sitio cuando el propietario lo autorice."]} action={<ButtonLink href="/admin/propiedades/nueva">Agregar inmueble</ButtonLink>}>Los inmuebles que Fortius vende o renta. Solo lo que publicas aparece en el sitio.</EmptyBox>
      : shown.length === 0 ? <EmptyBox art={{ icon: EMPTY_ART.inmuebles, kind: "buscar" }} title="Ningún inmueble coincide">Prueba con otra búsqueda o limpia los filtros.</EmptyBox>
      : <>
        {view === "filas" && <div className={s.listHead} data-pick={selection.on || undefined} aria-hidden="true"><span>Inmueble</span><span>Avance</span><span>Personas</span><span className="text-right">Precio</span><span>Estado</span></div>}
        <ul ref={listRef} aria-label="Inmuebles" data-view={view} className={view === "filas" ? s.list : s.grid} onKeyDown={onListKey}>
          {shown.map((p, i) => <PropertyItem key={p.slug} row={rowOf(p)} view={view} index={i} today={today} selection={selection} offer={undo.offer} onOpen={() => setOpenSlug(p.slug)} onNavigate={href => router.push(href)} />)}
        </ul>
        <p className={s.keys} aria-hidden="true"><span><Kbd>J</Kbd><Kbd>K</Kbd> moverse</span><span><Kbd>Enter</Kbd> abrir</span><span><Kbd>Esc</Kbd> cerrar</span></p>
        {selection.on && <BulkBar selection={selection} targets={shown.map(p => ({ id: p.slug, label: p.titulo }))} actions={bulkActions} noun={{ one: "inmueble seleccionado", many: "inmuebles seleccionados", empty: "Elige inmuebles en la lista" }} />}
      </>}

    {!demand && results.length > PAGE && <nav aria-label="Páginas de inmuebles" className="mt-5 flex flex-wrap items-center gap-3">
      <button type="button" className={s.pageButton} disabled={current === 0} onClick={() => setPage(current - 1)}>Anterior</button>
      <span className="text-sm">Página {current + 1} de {pages}</span>
      <button type="button" className={s.pageButton} disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>Siguiente</button>
    </nav>}
    <PropertySheet data={sheet} today={today} offer={undo.offer} onClose={() => setOpenSlug(null)} />
    <UndoNotice current={undo.current} clear={undo.clear} ms={undo.ms} onError={setUndoError} />
  </GuidedPage>;
}

function PropertyItem({ row, view, index, today, selection, offer, onOpen, onNavigate }: { row: Row; view: "filas" | "tarjetas"; index: number; today: string; selection: Selection; offer: (u: Undoable) => void; onOpen: () => void; onNavigate: (href: string) => void }) {
  const { property: p, adviser, owner, op, duplicated } = row;
  const state = propertyState(p, usePersonStatus().ofProperty(p.slug));
  const scope = usePropertyScope(p);
  const gaps = propertyGaps(p);
  const prep = prepOf(p);
  const active = p.estado === "evaluacion" || p.estado === "disponible";
  const lent = openKeyLoans(p.llaves)[0];
  const track = op ? stageTrack(op, today) : null;
  const slug = encodeURIComponent(p.slug);
  const menu = <ActionsMenu label={`Opciones de ${p.titulo}`} triggerClassName={s.kebab} actions={[
    { label: "Abrir ficha rápida", onSelect: onOpen },
    ...(scope.edit ? [{ label: "Editar ficha", onSelect: () => onNavigate(`/admin/propiedades/${slug}/editar`) }, { label: "Llaves y compradores", onSelect: () => onNavigate(`/admin/propiedades/${slug}/seguimiento`) }] : []),
    { label: "Ver en el sitio", onSelect: () => { window.open(`/inventario/${slug}`, "_blank", "noopener"); } },
  ]} />;
  const price = <PrecioEnFila property={p} editable={scope.edit && p.precio.modalidad !== "consulta"} offer={offer} />;
  const statePill = <Pill size="sm" className={s.statePill} data-tone={state.label === "Publicado" ? "pub" : state.strong ? "strong" : undefined}>{state.label}</Pill>;
  const flags = <>{duplicated && <span className={s.dup}>Código repetido: corrígelo en Editar.</span>}{p.origen === "compartido" && <span className={s.meta}>Compartido</span>}{p.demo && <span className={s.meta}>Ejemplo</span>}</>;
  const style = { "--i": Math.min(index, 12) } as React.CSSProperties;

  if (view === "tarjetas") return <li className={s.card} style={style}>
    {selection.on && <PickBox selection={selection} id={p.slug} label={p.titulo} className={s.cardPick} />}
    <button type="button" data-open className={s.cardOpen} onClick={onOpen} aria-label={`Abrir ${p.titulo}`}>
      <span className={s.photoWrap}>
        <Thumb src={p.galeria[0]?.src} ratio="4 / 3" className={s.photo} icon={<span className={s.noPhoto}><Building2 size={28} aria-hidden="true" /><span>Sin foto</span></span>} />
        <span className={s.overlay}>
          <span className="flex items-center gap-1.5"><Pill size="sm" className={s.onPhoto}>{OPERACION_LABELS[p.operacion]}</Pill>{p.destacada && <span className={s.star} role="img" aria-label="Destacada"><Star size={14} aria-hidden="true" fill="currentColor" /></span>}</span>
          <Pill size="sm" className={s.onPhoto} data-strong={state.strong || undefined}>{state.label}</Pill>
        </span>
      </span>
      <span className={s.body}>
        <span className={s.title}>{p.titulo}</span>
        <span className={s.zone}><MapPin size={14} aria-hidden="true" className="shrink-0" />{[p.zona, p.direccionAproximada].filter(Boolean).join(", ") || "Sin zona"}</span>
        {propertyFacts(p) && <span className={s.meta}>{propertyFacts(p)}</span>}
        {gaps.length > 0 && <span className={s.gap}>{gapText(gaps)}</span>}
        {track && <span className={s.cardRail}><StageRail total={track.stages.length} current={track.current} /><small>{track.current + 1} · {track.stages[track.current]?.label}</small></span>}
      </span>
    </button>
    <div className={s.cardFoot}>{price}{flags}{menu}</div>
  </li>;

  return <li className={s.row} style={style} data-pick={selection.on || undefined} data-picked={selection.selected.has(p.slug) || undefined}>
    {selection.on && <PickBox selection={selection} id={p.slug} label={p.titulo} className={s.pick} />}
    <button type="button" data-open className={s.rowOpen} onClick={onOpen} aria-label={`Abrir ${p.titulo}`}>
      <Thumb src={p.galeria[0]?.src} size={96} className={s.rowThumb} icon={<Building2 size={24} aria-hidden="true" />} />
      <span className={s.rowText}>
        <b className={s.rowTitle}>{p.titulo}{p.destacada && <Star size={13} aria-label="Destacada" className={s.rowStar} fill="currentColor" />}</b>
        <small>{[p.zona, propertyFacts(p).split(" · ")[0]].filter(Boolean).join(" · ") || "Sin zona"}</small>
        <span className={s.rowOp}>{OPERACION_LABELS[p.operacion]} · {TIPO_LABELS[p.tipo] ?? p.tipo}{gaps.length > 0 && <span className={s.gap}> · {gapText(gaps)}</span>}</span>
      </span>
    </button>
    <span className={s.rowStage}>
      {track ? <><StageRail total={track.stages.length} current={track.current} /><small><b>{track.current + 1}</b> · {track.stages[track.current]?.label}</small></> : null}
      {active && prep.items.length > 0 && <span className={s.prep}>
        <span className={s.bars} aria-hidden="true">{prep.items.map(x => <i key={x.item} data-on={x.estado === "listo" || undefined} />)}</span>
        <small data-done={!prep.missing.length || undefined}>{prepLine(prep.missing)}</small>
      </span>}
      {lent && <small className={s.lentRow}><Clock size={12} aria-hidden="true" />Llaves con {lent.persona}</small>}
    </span>
    <span className={s.rowPeople}>
      {owner && <Face name={owner} role="Propietario" />}
      {adviser ? <Face name={adviser.nombre} src={adviser.foto} role="Responsable" /> : <small className={s.meta}>Sin asignar</small>}
    </span>
    <span className={s.rowPrice}>{price}{flags}</span>
    <span className={s.rowState}>{statePill}</span>
    <span className={s.rowMenu}>{menu}</span>
  </li>;
}

/** Casilla de selección (shadcn/ui «Checkbox») con su objetivo de 44 px. */
function PickBox({ selection, id, label, className }: { selection: Selection; id: string; label: string; className?: string }) {
  return <label className={className}><Checkbox checked={selection.selected.has(id)} onCheckedChange={() => selection.toggle(id)} aria-label={`Seleccionar: ${label}`} /></label>;
}

/** Cara con su nombre y papel al pasar el ratón o llegar con el teclado (shadcn/ui «Tooltip»); el lector de pantalla lo oye siempre. */
function Face({ name, src, role }: { name: string; src?: string; role: string }) {
  return <Tooltip><TooltipTrigger asChild>
    <span tabIndex={0} className={s.face}><Avatar name={name} src={src} size={30} /><span className="sr-only">{role}: {name}</span></span>
  </TooltipTrigger><TooltipContent>{role}: {name}</TooltipContent></Tooltip>;
}
