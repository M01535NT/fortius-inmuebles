"use client";
import { AsyncButton, AsyncSelect } from "@/components/admin/ui";

import Link from "next/link";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";

import {
  Badge,
  DemoBanner,
  EmptyState,
  PageHeader,
  btnPrimary,
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

  async function eliminar(
    slug: string,
    titulo: string,
    version: number | null,
  ) {
    if (
      window.confirm(`¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`)
    ) {
      await removePropiedad(slug, version);
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Inmuebles."
        description="Alta, edición y baja del inventario. Los PDFs de cada inmueble se administran dentro de su formulario."
        actions={
          <Link href="/admin/propiedades/nueva" className={btnPrimary}>
            <Plus className="size-4" strokeWidth={1.5} /> Nuevo inmueble
          </Link>
        }
      />
      <DemoBanner />

      {propiedades.length === 0 ? (
        <EmptyState
          title="Sin inmuebles registrados."
          hint="Crea el primero con el botón de arriba."
        />
      ) : (
        <>
          <ul aria-label="Inmuebles" className="min-w-0 space-y-3 lg:hidden">
            {propiedades.map((p) => (
              <li
                key={p.slug}
                className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4 [overflow-wrap:anywhere]"
              >
                <p className="font-mono text-xs text-muted-foreground">{p.codigo}</p>
                {propiedades.some((other) => other.slug !== p.slug && other.codigo.trim().toUpperCase() === p.codigo.trim().toUpperCase()) ? (
                  <p className="text-xs font-medium text-destructive">Código duplicado: corrígelo en Editar.</p>
                ) : null}
                <h2>
                  <Link
                    href={`/admin/propiedades/${p.slug}/editar`}
                    className="flex min-h-11 items-center text-base font-semibold text-foreground hover:text-primary"
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
              </li>
            ))}
          </ul>
          <div className="hidden min-w-0 overflow-x-auto rounded-lg border border-border bg-card lg:block">
            <table className="w-full min-w-[820px] text-left text-sm">
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
                {propiedades.map((p) => (
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
                      <div className="flex items-center gap-2">
                        <FeaturedButton property={p} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
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
          </div>
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
        (property.destacada ? "text-primary" : "text-muted-foreground")
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
