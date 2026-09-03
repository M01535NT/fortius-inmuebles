"use client";
import { AsyncForm, AsyncButton } from "@/components/admin/ui";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  Badge,
  EmptyState,
  Field,
  PageHeader,
  btnGhost,
  btnPrimary,
  inputClass,
} from "@/components/admin/ui";
import {
  db,
  removeById,
  uid,
  upsert,
  useCollection,
  type Asesor,
} from "@/lib/admin/store";

/*
  Equipo de asesores: perfiles que se muestran en el detalle de propiedad
  y reciben la asignación de leads. Sin fotos hasta tener retratos reales
  (guardrail): el avatar público es un círculo de iniciales.
*/
function Editor({
  asesor: source,
  onDone,
}: {
  asesor?: Asesor;
  onDone: () => void;
}) {
  const [asesor] = React.useState(source);
  const [version] = React.useState(() =>
    source ? db.asesores.version(source) : null,
  );
  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nombre = String(data.get("nombre") ?? "");
    const iniciales = nombre
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
    await upsert(
      db.asesores,
      {
        id: asesor?.id ?? uid(),
        nombre,
        cargo: String(data.get("cargo") ?? ""),
        iniciales: String(data.get("iniciales") ?? "") || iniciales,
        telefono: String(data.get("telefono") ?? "") || undefined,
        whatsapp: String(data.get("whatsapp") ?? "") || undefined,
        email: String(data.get("email") ?? "") || undefined,
        activo: data.get("activo") === "on",
      },
      version,
    );
    onDone();
  }

  return (
    <AsyncForm
      onSubmit={guardar}
      className="space-y-4 rounded-lg border border-border bg-card p-5"
    >
      <h2 className="display-soft text-lg text-foreground">
        {asesor ? `Editando: ${asesor.nombre}` : "Nuevo asesor"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="as-nombre">
          <input
            id="as-nombre"
            name="nombre"
            required
            defaultValue={asesor?.nombre}
            className={inputClass}
          />
        </Field>
        <Field label="Cargo" htmlFor="as-cargo">
          <input
            id="as-cargo"
            name="cargo"
            required
            defaultValue={asesor?.cargo}
            placeholder="Asesor titular · Residencial"
            className={inputClass}
          />
        </Field>
        <Field label="Teléfono" htmlFor="as-telefono">
          <input
            id="as-telefono"
            name="telefono"
            type="tel"
            defaultValue={asesor?.telefono}
            className={inputClass}
          />
        </Field>
        <Field label="WhatsApp (URL)" htmlFor="as-whatsapp">
          <input
            id="as-whatsapp"
            name="whatsapp"
            defaultValue={asesor?.whatsapp}
            placeholder="https://wa.me/52…"
            className={inputClass}
          />
        </Field>
        <Field label="Correo" htmlFor="as-email">
          <input
            id="as-email"
            name="email"
            type="email"
            defaultValue={asesor?.email}
            className={inputClass}
          />
        </Field>
        <Field
          label="Iniciales (avatar)"
          htmlFor="as-iniciales"
          hint="Se calculan del nombre si lo dejas vacío."
        >
          <input
            id="as-iniciales"
            name="iniciales"
            maxLength={3}
            defaultValue={asesor?.iniciales}
            className={inputClass + " max-w-[100px] font-mono uppercase"}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-[13.5px] text-foreground">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={asesor?.activo ?? true}
          className="size-4 accent-[var(--primary)]"
        />
        Activo (asignable y visible en el sitio)
      </label>
      <div className="flex gap-3">
        <button type="submit" className={btnPrimary}>
          Guardar asesor
        </button>
        <button type="button" onClick={onDone} className={btnGhost}>
          Cancelar
        </button>
      </div>
    </AsyncForm>
  );
}

export default function AsesoresPage() {
  const asesores = useCollection(db.asesores);
  const leads = useCollection(db.leads);
  const clientes = useCollection(db.clientes);
  const propiedades = useCollection(db.propiedades);
  const [editando, setEditando] = React.useState<string | "nuevo" | null>(null);

  const asesor =
    editando && editando !== "nuevo"
      ? asesores.find((a) => a.id === editando)
      : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asesores."
        description="El equipo que aparece en el sitio y recibe leads e inmuebles asignados."
        actions={
          <button
            type="button"
            onClick={() => setEditando("nuevo")}
            className={btnPrimary}
          >
            <Plus className="size-4" strokeWidth={1.5} /> Nuevo asesor
          </button>
        }
      />

      {editando ? (
        <Editor
          key={editando}
          asesor={asesor}
          onDone={() => setEditando(null)}
        />
      ) : null}

      {asesores.length === 0 ? (
        <EmptyState title="Sin asesores registrados." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {asesores.map((a) => {
            const leadsAsignados = leads.filter(
              (l) => l.asesorId === a.id,
            ).length;
            const clientesAsignados = clientes.filter(
              (c) => c.asesorId === a.id,
            ).length;
            const inmuebles = propiedades.filter(
              (p) => p.asesorId === a.id,
            ).length;
            return (
              <article
                key={a.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[13px] text-foreground"
                    >
                      {a.iniciales}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14.5px] font-semibold text-foreground">
                        {a.nombre}
                      </p>
                      <p className="truncate text-[12.5px] text-muted-foreground">
                        {a.cargo}
                      </p>
                    </div>
                  </div>
                  <Badge tone={a.activo ? "green" : "neutral"}>
                    {a.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-center">
                  <div>
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      Leads
                    </dt>
                    <dd className="mt-1 font-mono text-xl text-foreground">
                      {String(leadsAsignados).padStart(2, "0")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      Inmuebles
                    </dt>
                    <dd className="mt-1 font-mono text-xl text-foreground">
                      {String(inmuebles).padStart(2, "0")}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex justify-end gap-1.5">
                  <button
                    type="button"
                    aria-label={`Editar ${a.nombre}`}
                    onClick={() => setEditando(a.id)}
                    className="rounded-md border border-border p-2 text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Pencil className="size-3.5" strokeWidth={1.5} />
                  </button>
                  <AsyncButton
                    type="button"
                    aria-label={`Eliminar ${a.nombre}`}
                    onClick={async () => {
                      if (leadsAsignados + inmuebles + clientesAsignados > 0) {
                        window.alert(
                          "Este asesor tiene leads, clientes o inmuebles asignados. Reasígnalos antes de eliminarlo.",
                        );
                        return;
                      }
                      if (window.confirm(`¿Eliminar a ${a.nombre}?`))
                        await removeById(
                          db.asesores,
                          a.id,
                          db.asesores.version(a),
                        );
                    }}
                    className="rounded-md border border-border p-2 text-foreground/70 transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.5} />
                  </AsyncButton>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
