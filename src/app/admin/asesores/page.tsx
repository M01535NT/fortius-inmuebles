"use client";
import { confirmDelete } from "@/components/admin/workspace/confirm";
import { AsyncForm, AsyncButton } from "@/components/admin/ui";

import * as React from "react";
import { Pencil, Plus, Trash2, UserRound } from "@/components/admin/icons";
import { Avatar, Button, Card, EmptyBox, Pill } from "@/components/admin/kit";
import { AdviserAccountLinks } from "@/components/admin/adviser-account-links";
import { SectionBoundary } from "@/components/admin/section-boundary";

import { Field, PageHeader, inputClass } from "@/components/admin/ui";
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
      className="space-y-4 rounded-[var(--radius-card)] border border-[var(--card-edge)] bg-[var(--card)] p-5 shadow-[var(--shadow-rest)]"
    >
      <h2 className="text-lg font-semibold text-foreground">
        {asesor ? `Editar a ${asesor.nombre}` : "Nuevo asesor"}
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
            className={inputClass + " max-w-[100px] uppercase"}
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
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary">Guardar asesor</Button>
        <Button onClick={onDone}>Cancelar</Button>
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
        actions={editando ? undefined : <Button variant="primary" onClick={() => setEditando("nuevo")}><Plus size={17} aria-hidden="true" />Nuevo asesor</Button>}
      />

      {editando ? (
        <Editor
          key={editando}
          asesor={asesor}
          onDone={() => setEditando(null)}
        />
      ) : null}

      {asesores.length === 0 ? (
        <EmptyBox
          icon={<UserRound size={22} aria-hidden="true" />}
          title="Todavía no hay asesores"
          steps={["Registra a cada asesor con su nombre y cargo.", "Asígnale contactos e inmuebles desde cada ficha.", "Si quieres, publica su ficha en Nosotros."]}
        >
          Cada asesor puede atender contactos y salir en el sitio.
        </EmptyBox>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {asesores.map((a) => {
            const leadsAsignados = leads.filter((l) => l.asesorId === a.id).length;
            const clientesAsignados = clientes.filter((c) => c.asesorId === a.id).length;
            const inmuebles = propiedades.filter((p) => p.asesorId === a.id).length;
            return (
              <Card as="li" key={a.id} className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={a.nombre} src={a.perfilPublico?.foto || undefined} size={44} />
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">{a.nombre}</p>
                      <p className="truncate text-sm text-muted-foreground">{a.cargo}</p>
                    </div>
                  </div>
                  <Pill tone={a.activo ? "success" : "muted"}>{a.activo ? "Activo" : "Inactivo"}</Pill>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold tabular-nums text-foreground">{leadsAsignados}</span> {leadsAsignados === 1 ? "contacto" : "contactos"} · <span className="font-semibold tabular-nums text-foreground">{inmuebles}</span> {inmuebles === 1 ? "inmueble" : "inmuebles"}
                </p>
                <div className="mt-auto flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setEditando(a.id)} aria-label={`Editar a ${a.nombre}`}>
                    <Pencil size={16} aria-hidden="true" />Editar
                  </Button>
                  <AsyncButton
                    type="button"
                    aria-label={`Eliminar a ${a.nombre}`}
                    onClick={async () => {
                      if (leadsAsignados + inmuebles + clientesAsignados > 0) {
                        throw new Error("Tiene contactos o inmuebles asignados. Reasígnalos antes de eliminarlo.");
                      }
                      if (await confirmDelete("asesor", `Se elimina a ${a.nombre} del equipo.`, false))
                        await removeById(db.asesores, a.id, db.asesores.version(a));
                    }}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </AsyncButton>
                </div>
              </Card>
            );
          })}
        </ul>
      )}
      <SectionBoundary what="las cuentas de asesores"><AdviserAccountLinks isAdmin={session?.role === "admin"} advisers={asesores} /></SectionBoundary>
    </div>
  );
}
