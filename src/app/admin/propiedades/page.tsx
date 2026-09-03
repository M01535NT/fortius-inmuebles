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
  OPERACION_LABELS,
  TIPO_LABELS,
  formatPrecio,
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
    <div className="space-y-6">
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
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[820px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-border font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
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
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                    {p.codigo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AsyncButton
                        type="button"
                        aria-label={
                          p.destacada
                            ? "Quitar de destacadas"
                            : "Marcar destacada"
                        }
                        aria-pressed={p.destacada}
                        onClick={async () =>
                          await upsertPropiedad(
                            { ...p, destacada: !p.destacada },
                            db.propiedades.version(p),
                          )
                        }
                        className={
                          "shrink-0 transition-colors " +
                          (p.destacada
                            ? "text-primary"
                            : "text-muted-foreground/40 hover:text-muted-foreground")
                        }
                      >
                        <Star
                          className="size-4"
                          strokeWidth={1.5}
                          fill={p.destacada ? "currentColor" : "none"}
                        />
                      </AsyncButton>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {p.titulo}
                        </p>
                        <Badge tone={p.publicada ? "green" : "neutral"}>
                          {p.publicada ? "Publicado" : "No publicado"}
                        </Badge>{" "}
                        {p.demo ? <Badge tone="amber">Demo</Badge> : null}
                        <p className="truncate text-[12px] text-muted-foreground">
                          {p.zona} · {OPERACION_LABELS[p.operacion]}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {TIPO_LABELS[p.tipo]}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12.5px] text-foreground">
                    {formatPrecio(p.precio)}
                  </td>
                  <td className="px-4 py-3">
                    <label className="sr-only" htmlFor={`estado-${p.slug}`}>
                      Estado de {p.titulo}
                    </label>
                    <AsyncSelect
                      id={`estado-${p.slug}`}
                      value={p.estado}
                      onChange={async (value) =>
                        await upsertPropiedad(
                          { ...p, estado: value as typeof p.estado },
                          db.propiedades.version(p),
                        )
                      }
                      className="h-8 rounded-md border border-input bg-background px-2 text-[12.5px] text-foreground"
                    >
                      {Object.entries(ESTADO_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </AsyncSelect>
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
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/inventario/${p.slug}`}
                        target="_blank"
                        className="rounded-md px-2 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/propiedades/${p.slug}/editar`}
                        aria-label={`Editar ${p.titulo}`}
                        className="rounded-md border border-border p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="size-3.5" strokeWidth={1.5} />
                      </Link>
                      <AsyncButton
                        type="button"
                        aria-label={`Eliminar ${p.titulo}`}
                        onClick={() =>
                          eliminar(p.slug, p.titulo, db.propiedades.version(p))
                        }
                        className="rounded-md border border-border p-2 text-foreground/70 transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.5} />
                      </AsyncButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
