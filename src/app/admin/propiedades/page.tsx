"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";
import * as React from "react";
import Image from "next/image";
import { InventoryControls } from "@/components/admin/workspace/inventory-controls";
import { emptyInventoryFilters, filterInventory } from "@/lib/admin/workspace";
import { AsyncButton, AsyncSelect } from "@/components/admin/ui";

import Link from "next/link";
import { Pencil, Plus, Star, Trash2, Building2, LayoutGrid, List } from "lucide-react";

import {
  Badge,
  DemoBanner,
  EmptyState,
  PageHeader,
  btnPrimary,
  btnGhost,
} from "@/components/admin/ui";
import {
  ESTADO_LABELS,
  ESTADOS_POR_OPERACION,
  estadoValido,
  OPERACION_LABELS,
  TIPO_LABELS,
  formatPrecio,
  type Property,
} from "@/data/propiedades";
import {
  db,
  removePropiedad,
  upsertPropiedad,
  useCollection,
} from "@/lib/admin/store";

/*
  Inventario: listado operable. Destacada y estado se cambian inline;
  el resto se edita en el formulario completo.
*/
export default function AdminPropiedadesPage() {
  const propiedades = useCollection(db.propiedades);
  const asesores = useCollection(db.asesores);
  const [filters,setFilters] = React.useState(emptyInventoryFilters);
  const [view, setView] = React.useState<"tarjetas" | "lista">("tarjetas");
  const results = filterInventory(propiedades,filters);
  const [page,setPage]=React.useState(0);
  const currentPage=Math.min(page,Math.max(0,Math.ceil(results.length/24)-1));
  const filtered=results.slice(currentPage*24,(currentPage+1)*24);

  async function eliminar(
    slug: string,
    titulo: string,
    version: number | null,
  ) {
    if (
      await confirmAction(`¿Eliminar "${titulo}"? Un administrador podrá recuperarlo desde Historial.`)
    ) {
      await removePropiedad(slug, version);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Cartera de inmuebles"
        description="Disponibilidad, precios y documentación de tu inventario."
        actions={
          <Link href="/admin/propiedades/nueva" className={btnPrimary}>
            <Plus className="size-4" strokeWidth={1.5} /> Nuevo inmueble
          </Link>
        }
      />
      <DemoBanner show />
      <InventoryControls value={filters} onChange={next=>{setFilters(next);setPage(0);}} advisers={asesores} count={results.length}/>
      <div className="admin-view-switch" role="group" aria-label="Vista de inmuebles">
        <button type="button" className={btnGhost} aria-pressed={view === "tarjetas"} onClick={() => setView("tarjetas")}><LayoutGrid size={17} /> Tarjetas</button>
        <button type="button" className={btnGhost} aria-pressed={view === "lista"} onClick={() => setView("lista")}><List size={17} /> Lista</button>
      </div>
      {results.length>24 && <nav aria-label="Páginas de inmuebles" className="flex flex-wrap items-center gap-3"><button type="button" className={btnGhost} disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Anterior</button><span className="text-sm">Página {currentPage+1} de {Math.ceil(results.length/24)}</span><button type="button" className={btnGhost} disabled={(currentPage+1)*24>=results.length} onClick={()=>setPage(currentPage+1)}>Siguiente</button></nav>}
      {propiedades.length > 0 && filtered.length === 0 && <EmptyState title="No hay inmuebles con estos filtros." hint="Prueba otra búsqueda o limpia los filtros."/>}

      {propiedades.length === 0 ? (
        <EmptyState
          title="Sin inmuebles registrados."
          hint="Crea el primero con el botón de arriba."
        />
      ) : (
        <>
          <ul aria-label="Inmuebles" className={view === "tarjetas" ? "admin-properties-grid" : "min-w-0 space-y-3 lg:hidden"}>
            {filtered.map((p) => (
              <li
                key={p.slug}
                className="admin-card admin-property-card min-w-0 [overflow-wrap:anywhere]"
              >
                {p.galeria[0] ? <Image unoptimized width={640} height={420} src={p.galeria[0].src} alt="" className="admin-property-photo" loading="lazy"/> : <div className="admin-property-photo flex items-center justify-center"><Building2 size={40} className="text-muted-foreground" aria-hidden="true"/><span className="sr-only">Sin fotografía</span></div>}
                <div className="admin-property-body">
                <p className="text-xs text-muted-foreground">{p.codigo}</p>
                {propiedades.some((other) => other.slug !== p.slug && other.codigo.trim().toUpperCase() === p.codigo.trim().toUpperCase()) ? (
                  <p className="text-xs font-medium text-destructive">Código duplicado: corrígelo en Editar.</p>
                ) : null}
                <h2>
                  <Link
                    href={`/admin/propiedades/${p.slug}/editar`}
                    className="flex min-h-11 items-center text-base font-semibold text-foreground hover:text-primary-ink"
                  >
                    {p.titulo}
                  </Link>
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={p.publicada ? "green" : "neutral"}>
                    {p.publicada ? "Publicado" : "No publicado"}
                  </Badge>
                  {p.demo ? <Badge tone="amber">Demo</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {p.zona} · {TIPO_LABELS[p.tipo]} · {OPERACION_LABELS[p.operacion]}
                </p>
                <p className="font-mono text-base font-medium text-foreground">
                  {formatPrecio(p.precio)}
                </p>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {p.ficha.recamaras !== undefined && <span>{p.ficha.recamaras} recámaras</span>}
                  {p.ficha.banos !== undefined && <span>{p.ficha.banos} baños</span>}
                  {p.ficha.construccionM2 !== undefined ? <span>{p.ficha.construccionM2} m² construidos</span> : p.ficha.terrenoM2 !== undefined ? <span>{p.ficha.terrenoM2} m² de terreno</span> : null}
                </p>
                <dl className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs text-muted-foreground">Asesor</dt>
                    <dd className="mt-1">
                      {asesores.find((a) => a.id === p.asesorId)?.nombre ?? "Sin asignar"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">PDFs</dt>
                    <dd className="mt-1">{p.documentos?.length ?? 0}</dd>
                  </div>
                </dl>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <PropertyStatus property={p} />
                </div>
                <FeaturedButton property={p} showLabel />
                <PropertyActions
                  property={p}
                  onDelete={() => eliminar(p.slug, p.titulo, db.propiedades.version(p))}
                  showLabels
                />
                </div>
              </li>
            ))}
          </ul>
          {view === "lista" && <div className="hidden min-w-0 overflow-x-auto rounded-lg border border-border bg-card lg:block">
            <table className="w-full min-w-[980px] text-left text-sm [&_td]:px-3 [&_th]:px-3">
              <thead>
                <tr className="border-b border-border font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Inmueble</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Precio</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">PDFs</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr
                    key={p.slug}
                    className="align-middle transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.codigo}
                      {propiedades.some((other) => other.slug !== p.slug && other.codigo.trim().toUpperCase() === p.codigo.trim().toUpperCase()) ? (
                        <span className="block text-xs font-medium text-destructive">Código duplicado</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex w-[260px] items-center gap-2">
                        {p.galeria[0] && <Image unoptimized width={960} height={720} src={p.galeria[0].src} alt="" className="h-14 w-14 shrink-0 rounded object-cover" loading="lazy"/>}
                        <div className="shrink-0"><FeaturedButton property={p} /></div>
                        <div className="min-w-0 flex-1">
                          <p title={p.titulo} className="line-clamp-2 font-medium text-foreground">
                            {p.titulo}
                          </p>
                          <Badge tone={p.publicada ? "green" : "neutral"}>
                            {p.publicada ? "Publicado" : "No publicado"}
                          </Badge>{" "}
                          {p.demo ? <Badge tone="amber">Demo</Badge> : null}
                          <p className="truncate text-xs text-muted-foreground">
                            {p.zona} · {OPERACION_LABELS[p.operacion]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {TIPO_LABELS[p.tipo]}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-foreground">
                      {formatPrecio(p.precio)}
                    </td>
                    <td className="px-4 py-3">
                      <PropertyStatus property={p} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          (p.documentos?.length ?? 0) > 0 ? "green" : "neutral"
                        }
                      >
                        {String(p.documentos?.length ?? 0).padStart(2, "0")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <PropertyActions
                        property={p}
                        onDelete={() => eliminar(p.slug, p.titulo, db.propiedades.version(p))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </>
      )}
    </div>
  );
}

function PropertyStatus({ property }: { property: Property }) {
  return (
    <AsyncSelect
      aria-label={`Estado de ${property.titulo}`}
      value={property.estado}
      onChange={async (value) =>
        await upsertPropiedad(
          { ...property, estado: value as Property["estado"] },
          db.propiedades.version(property),
        )
      }
      className="min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-2 text-base text-foreground lg:min-w-36 lg:text-sm"
    >
      {!estadoValido(property.operacion, property.estado) ? (
        <option value={property.estado} disabled>{ESTADO_LABELS[property.estado]} (incompatible; corrige el estado)</option>
      ) : null}
      {ESTADOS_POR_OPERACION[property.operacion].map((value) => (
        <option key={value} value={value}>{ESTADO_LABELS[value]}</option>
      ))}
    </AsyncSelect>
  );
}

function FeaturedButton({
  property,
  showLabel = false,
}: {
  property: Property;
  showLabel?: boolean;
}) {
  return (
    <AsyncButton
      type="button"
      aria-label={`${property.destacada ? "Quitar de destacadas" : "Marcar destacada"}: ${property.titulo}`}
      aria-pressed={property.destacada}
      onClick={async () =>
        await upsertPropiedad(
          { ...property, destacada: !property.destacada },
          db.propiedades.version(property),
        )
      }
      className={
        "inline-flex items-center justify-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-secondary " +
        (property.destacada ? "text-primary-ink" : "text-muted-foreground")
      }
    >
      <Star
        className="size-4 shrink-0"
        strokeWidth={1.5}
        fill={property.destacada ? "currentColor" : "none"}
      />
      {showLabel ? (property.destacada ? "Destacada" : "Marcar destacada") : null}
    </AsyncButton>
  );
}

function PropertyActions({
  property,
  onDelete,
  showLabels = false,
}: {
  property: Property;
  onDelete: () => Promise<void>;
  showLabels?: boolean;
}) {
  const actionClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-border px-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground";
  return (
    <div
      className={showLabels
        ? "flex min-w-0 flex-wrap items-start gap-2 border-t border-border pt-3"
        : "flex items-start justify-end gap-1.5"}
    >
      <Link
        href={`/inventario/${property.slug}`}
        target="_blank"
        aria-label={`Ver ${property.titulo}`}
        className={actionClass}
      >
        Ver
      </Link>
      <Link
        href={`/admin/propiedades/${property.slug}/editar`}
        aria-label={`Editar ${property.titulo}`}
        className={actionClass}
      >
        <Pencil className="size-3.5 shrink-0" strokeWidth={1.5} />
        {showLabels ? "Editar" : null}
      </Link>
      <AsyncButton
        type="button"
        aria-label={`Eliminar ${property.titulo}`}
        onClick={onDelete}
        className={actionClass + " hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"}
      >
        <Trash2 className="size-3.5 shrink-0" strokeWidth={1.5} />
        {showLabels ? "Eliminar" : null}
      </AsyncButton>
    </div>
  );
}
