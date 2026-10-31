"use client";
import * as React from "react";
import Link from "next/link";
import { Building2, Key, MapPin, MoreHorizontal, Pencil, Plus, Search, Star, Trash2 } from "@/components/admin/icons";
import { ButtonLink, Card, EmptyBox, Pill, Segmented, Thumb } from "@/components/admin/kit";
import { AsyncButton, AsyncSelect, DemoBanner, inputClass } from "@/components/admin/ui";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { GuidedPage } from "@/components/admin/workspace/guided-page";
import { InventoryControls } from "@/components/admin/workspace/inventory-controls";
import { emptyInventoryFilters, filterInventory, type InventoryFilters } from "@/lib/admin/workspace";
import { ESTADO_LABELS, ESTADOS_POR_OPERACION, OPERACION_LABELS, estadoValido, formatPrecio, type Property } from "@/data/propiedades";
import { db, removePropiedad, upsertPropiedad, useCollection, type AdminProperty } from "@/lib/admin/store";
import { openKeyLoans, prepProgress } from "@/lib/propiedad-seguimiento";
import s from "./properties.module.css";

/*
  Inmuebles en galería (boceto aprobado por el titular, 17/10/2026): tarjetas con la foto,
  la operación y el estado encima, el título, la zona, las medidas y el precio. El estado,
  la marca de destacada, ver, editar y eliminar están en «⋯» de cada inmueble; los filtros
  por asesor, estado, publicación y las vistas guardadas, en «Más filtros». El mapa entra
  después (EXT-09).
*/

const PAGE = 24;

/** Lo que le falta a un inmueble para promoverse: «fotos», «medidas», «precio». Sin faltantes, lista vacía. */
export function propertyGaps(p: Property) {
  const gaps: string[] = [];
  if (!p.galeria?.length) gaps.push("fotos");
  if (p.ficha.construccionM2 === undefined && p.ficha.terrenoM2 === undefined) gaps.push("medidas");
  if (p.precio.modalidad === "consulta") gaps.push("precio");
  return gaps;
}
const gapText = (gaps: string[]) => `${gaps.length === 1 ? "Falta" : "Faltan"} ${gaps.length > 1 ? gaps.slice(0, -1).join(", ") + " y " + gaps.at(-1) : gaps[0]}`;

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
export function propertyState(p: Property) {
  if (p.estado !== "disponible") return { label: ESTADO_LABELS[p.estado], strong: p.estado === "apartada" };
  return { label: p.publicada ? "Publicado" : "Sin publicar", strong: false };
}

export function PropertyList() {
  const properties = useCollection(db.propiedades), advisers = useCollection(db.asesores);
  const [filters, setFilters] = React.useState<InventoryFilters>(emptyInventoryFilters);
  const [page, setPage] = React.useState(0);
  const [missingOnly, setMissingOnly] = React.useState(false);
  const incomplete = properties.filter(p => p.estado !== "vendida" && p.estado !== "rentada" && propertyGaps(p).length > 0);
  const results = filterInventory(properties, filters).filter(p => !missingOnly || propertyGaps(p).length > 0);
  const pages = Math.max(1, Math.ceil(results.length / PAGE));
  const current = Math.min(page, pages - 1);
  const shown = results.slice(current * PAGE, (current + 1) * PAGE);
  const published = properties.filter(p => p.publicada).length;
  const update = (next: InventoryFilters) => { setFilters(next); setPage(0); };
  const extra = [filters.advisor, filters.publication, filters.status].filter(Boolean).length;

  return <GuidedPage title="Inmuebles" subtitle={`${properties.length} ${properties.length === 1 ? "inmueble" : "inmuebles"} · ${published} ${published === 1 ? "publicado" : "publicados"}`} actions={<>
    <button type="button" className={s.gapChip} aria-pressed={missingOnly} onClick={() => { setMissingOnly(on => !on); setPage(0); }}>Les falta algo<span>{incomplete.length}</span></button>
    <Segmented className={s.segmented} label="Operación" value={filters.operation || "todos"} onChange={id => update({ ...filters, operation: id === "todos" ? "" : id })} options={[{ id: "todos", label: "Todos" }, { id: "venta", label: "En venta" }, { id: "renta", label: "En renta" }]} />
    <label className={s.search}><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar colonia, calle o código</span><input type="search" className={inputClass} placeholder="Buscar colonia o calle" value={filters.q} onChange={e => update({ ...filters, q: e.target.value })} /></label>
    <ButtonLink href="/admin/propiedades/nueva" variant="primary"><Plus size={16} aria-hidden="true" />Agregar inmueble</ButtonLink>
  </>}>
    <details className={s.more}>
      <summary>Más filtros{extra > 0 ? ` · ${extra} ${extra === 1 ? "activo" : "activos"}` : ""}</summary>
      <div className="mt-3"><InventoryControls value={filters} onChange={update} advisers={advisers} count={results.length} hideSearch /></div>
    </details>

    {properties.length === 0 ? <EmptyBox title="Todavía no hay inmuebles" action={<Link href="/admin/propiedades/nueva" className="font-semibold underline underline-offset-4">Agregar inmueble</Link>}>Agrégalo aquí o al terminar la entrevista con el propietario.</EmptyBox>
      : shown.length === 0 ? <EmptyBox title="Ningún inmueble coincide">Prueba con otra búsqueda o limpia los filtros.</EmptyBox>
      : <ul aria-label="Inmuebles" className={s.grid}>{shown.map(p => <PropertyItem key={p.slug} property={p} duplicated={properties.some(o => o.slug !== p.slug && o.codigo.trim().toUpperCase() === p.codigo.trim().toUpperCase())} adviser={advisers.find(a => a.id === p.asesorId)?.nombre} />)}</ul>}

    {results.length > PAGE && <nav aria-label="Páginas de inmuebles" className="mt-5 flex flex-wrap items-center gap-3">
      <button type="button" className={s.pageButton} disabled={current === 0} onClick={() => setPage(current - 1)}>Anterior</button>
      <span className="text-sm">Página {current + 1} de {pages}</span>
      <button type="button" className={s.pageButton} disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>Siguiente</button>
    </nav>}
    <div className="mt-6"><DemoBanner /></div>
  </GuidedPage>;
}

function PropertyItem({ property: p, duplicated, adviser }: { property: AdminProperty; duplicated: boolean; adviser?: string }) {
  const state = propertyState(p);
  const lent = openKeyLoans(p.llaves)[0];
  const prep = prepProgress(p), preparing = (p.estado === "evaluacion" || p.estado === "disponible") && prep.done < prep.total;
  const followup = `/admin/propiedades/${p.slug}/seguimiento`;
  const href = `/admin/propiedades/${p.slug}/editar`;
  const pending = p.precio.modalidad === "consulta";
  return <Card as="li" lift className={s.item}>
    <Link href={href} className={s.link}>
      <span className={s.photoWrap}>
        <Thumb src={p.galeria[0]?.src} ratio="4 / 3" className={s.photo} icon={<span className={s.noPhoto}><Building2 size={28} aria-hidden="true" /><span>Sin foto</span></span>} />
        <span className={s.overlay}>
          <span className="flex flex-wrap gap-1.5"><Pill size="sm" className={s.onPhoto}>{OPERACION_LABELS[p.operacion]}</Pill>{p.destacada && <Pill size="sm" tone="brand"><Star size={12} aria-hidden="true" fill="currentColor" />Destacada</Pill>}{p.demo && <Pill size="sm" tone="warn">Demo</Pill>}</span>
          <Pill size="sm" className={s.onPhoto} data-strong={state.strong || undefined}>{state.label}</Pill>
        </span>
      </span>
      <span className={s.body}>
        <span className={s.title}>{p.titulo}</span>
        <span className={s.zone}><MapPin size={14} aria-hidden="true" className="shrink-0" />{[p.zona, p.direccionAproximada].filter(Boolean).join(", ") || "Sin zona"}</span>
        {propertyFacts(p) && <span className={s.meta}>{propertyFacts(p)}</span>}
        {propertyGaps(p).length > 0 && <span className={s.gap}>{gapText(propertyGaps(p))}</span>}
        {duplicated && <span className="text-xs font-semibold text-destructive">Código repetido: corrígelo en Editar.</span>}
        {(lent || preparing) && <span className={s.meta}>{[lent && `Llaves con ${lent.persona}`, preparing && `Preparación ${prep.done} de ${prep.total}`].filter(Boolean).join(" · ")}</span>}
        <span className={s.priceRow}><span className={s.amount} data-pending={pending || undefined}>{formatPrecio(p.precio)}</span><span className={s.meta}>{p.codigo}</span></span>
      </span>
    </Link>
    <details className={s.options}>
      <summary aria-label={`Opciones de ${p.titulo}`}><MoreHorizontal size={20} aria-hidden="true" /></summary>
      <div className={s.optionsBody}>
        <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">Estado<PropertyStatus property={p} /></label>
        <p className="text-sm"><span className="text-muted-foreground">Responsable:</span> <span>{adviser ?? "Sin asignar"}</span> · <span className="text-muted-foreground">PDF:</span> {p.documentos?.length ?? 0}</p>
        <div className="flex flex-wrap gap-2">
          <FeaturedButton property={p} />
          <Link href={`/inventario/${p.slug}`} target="_blank" className={s.action} aria-label={`Ver ${p.titulo} en el sitio`}>Ver en el sitio</Link>
          <Link href={href} className={s.action} aria-label={`Editar ${p.titulo}`}><Pencil size={15} aria-hidden="true" />Editar</Link>
          <Link href={followup} className={s.action} aria-label={`Llaves, preparación y compradores de ${p.titulo}`}><Key size={15} aria-hidden="true" />Llaves y compradores</Link>
          <AsyncButton type="button" className={s.action} aria-label={`Eliminar ${p.titulo}`} onClick={async () => {
            if (await confirmAction(`¿Eliminar "${p.titulo}"? Un administrador podrá recuperarlo desde Historial.`)) await removePropiedad(p.slug, db.propiedades.version(p));
          }}><Trash2 size={15} aria-hidden="true" />Eliminar</AsyncButton>
        </div>
      </div>
    </details>
  </Card>;
}

function PropertyStatus({ property }: { property: Property }) {
  return <AsyncSelect aria-label={`Estado de ${property.titulo}`} value={property.estado}
    onChange={async value => await upsertPropiedad({ ...property, estado: value as Property["estado"] }, db.propiedades.version(property))}
    className="min-h-11 w-full min-w-0 rounded-[10px] border border-input bg-background px-2 text-base text-foreground">
    {!estadoValido(property.operacion, property.estado) && <option value={property.estado} disabled>{ESTADO_LABELS[property.estado]} (no corresponde a la operación; corrígelo)</option>}
    {ESTADOS_POR_OPERACION[property.operacion].map(value => <option key={value} value={value}>{ESTADO_LABELS[value]}</option>)}
  </AsyncSelect>;
}

function FeaturedButton({ property }: { property: Property }) {
  return <AsyncButton type="button" className={s.action} aria-pressed={property.destacada}
    aria-label={`${property.destacada ? "Quitar de destacadas" : "Marcar destacada"}: ${property.titulo}`}
    onClick={async () => await upsertPropiedad({ ...property, destacada: !property.destacada }, db.propiedades.version(property))}>
    <Star size={15} aria-hidden="true" fill={property.destacada ? "currentColor" : "none"} />{property.destacada ? "Destacada" : "Marcar destacada"}
  </AsyncButton>;
}
