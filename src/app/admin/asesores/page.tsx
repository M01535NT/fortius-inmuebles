"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { AsyncForm, AsyncButton } from "@/components/admin/ui";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "@/components/admin/icons";
import { AdviserAccountLinks } from "@/components/admin/adviser-account-links";

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
  useSession,
  type Asesor,
} from "@/lib/admin/store";

/* Internal assignments and explicitly published profiles are managed separately. */
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
        perfilPublico: {
          publicado: data.get("publicado") === "on",
          descripcion: String(data.get("descripcion") ?? ""),
          ...Object.fromEntries(["foto", "telefono", "whatsapp", "email", "instagram", "facebook", "linkedin"].map(key => [key, String(data.get(`publico-${key}`) ?? "")])),
        },
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
      <fieldset className="space-y-4 rounded-lg border border-border p-4">
        <legend className="px-2 font-semibold">Ficha pública en Nosotros</legend>
        <p className="text-sm text-muted-foreground">Se publican solo si activas la ficha. Los contactos internos no se muestran.</p>
        <Field label="Descripción profesional" htmlFor="as-descripcion"><textarea id="as-descripcion" name="descripcion" maxLength={2000} rows={4} defaultValue={asesor?.perfilPublico?.descripcion} className={inputClass} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {([['foto', 'URL de fotografía pública'], ['telefono', 'Teléfono público'], ['whatsapp', 'WhatsApp público (URL o número)'], ['email', 'Correo público'], ['instagram', 'Instagram (URL)'], ['facebook', 'Facebook (URL)'], ['linkedin', 'LinkedIn (URL)']] as const).map(([key, label]) => <Field key={key} label={label} htmlFor={`as-publico-${key}`}><input id={`as-publico-${key}`} name={`publico-${key}`} type={key === 'email' ? 'email' : ['foto', 'instagram', 'facebook', 'linkedin'].includes(key) ? 'url' : 'text'} defaultValue={asesor?.perfilPublico?.[key]} className={inputClass} /></Field>)}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publicado" defaultChecked={asesor?.perfilPublico?.publicado ?? false} className="size-4" />Publicar esta ficha y sus datos de contacto en Nosotros</label>
      </fieldset>
      <label className="flex items-center gap-2 text-sm text-foreground">
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
  const session = useSession();
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
        title="Equipo"
        description="Quién sale en el sitio y atiende contactos."
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
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-sm text-foreground"
                    >
                      {a.iniciales}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">
                        {a.nombre}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
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
                    <dt className="font-mono text-xs uppercase tracking-[0.06em] text-muted-foreground">
                      Leads
                    </dt>
                    <dd className="mt-1 font-mono text-xl text-foreground">
                      {String(leadsAsignados).padStart(2, "0")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs uppercase tracking-[0.06em] text-muted-foreground">
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
                        throw new Error("Tiene contactos o inmuebles asignados. Reasígnalos antes de eliminarlo.");
                      }
                      if (await confirmAction(`¿Eliminar a ${a.nombre}?`))
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
      <AdviserAccountLinks isAdmin={session?.role === "admin"} advisers={asesores} />
    </div>
  );
}
