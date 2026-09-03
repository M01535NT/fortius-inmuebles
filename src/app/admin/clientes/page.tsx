"use client";
import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  AsyncForm,
  AsyncButton,
  PageHeader,
  Field,
  EmptyState,
  Badge,
  btnPrimary,
  btnGhost,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/ui";
import {
  db,
  useCollection,
  upsert,
  removeById,
  uid,
  type Cliente,
} from "@/lib/admin/store";

const TIPOS: Record<Cliente["tipo"], string> = {
  propietario: "Propietario",
  comprador: "Comprador",
  arrendador: "Arrendador",
  arrendatario: "Arrendatario",
  otro: "Otro",
};
function Editor({
  initial,
  onDone,
}: {
  initial?: Cliente;
  onDone: () => void;
}) {
  const [cliente] = React.useState(initial);
  const [version] = React.useState(() =>
    initial ? db.clientes.version(initial) : null,
  );
  const asesores = useCollection(db.asesores);
  return (
    <AsyncForm
      className="space-y-4 rounded-lg border border-border bg-card p-5"
      onSubmit={async (e) => {
        const data = new FormData(e.currentTarget);
        const v = (key: string) => String(data.get(key) ?? "").trim();
        const now = new Date().toISOString();
        await upsert(
          db.clientes,
          {
            ...cliente,
            id: cliente?.id ?? uid(),
            nombre: v("nombre"),
            telefono: v("telefono"),
            email: v("email") || undefined,
            tipo: v("tipo") as Cliente["tipo"],
            asesorId: v("asesorId") || undefined,
            notas: v("notas"),
            creadoEl: cliente?.creadoEl ?? now,
            actualizadoEl: now,
          },
          version,
        );
        onDone();
      }}
    >
      <h2 className="display-soft text-lg">
        {cliente ? "Editar cliente" : "Nuevo cliente"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="cl-nombre">
          <input
            id="cl-nombre"
            name="nombre"
            required
            defaultValue={cliente?.nombre}
            className={inputClass}
          />
        </Field>
        <Field label="Teléfono" htmlFor="cl-telefono">
          <input
            id="cl-telefono"
            name="telefono"
            type="tel"
            required
            defaultValue={cliente?.telefono}
            className={inputClass}
          />
        </Field>
        <Field label="Correo" htmlFor="cl-email">
          <input
            id="cl-email"
            name="email"
            type="email"
            defaultValue={cliente?.email}
            className={inputClass}
          />
        </Field>
        <Field label="Tipo de cliente" htmlFor="cl-tipo">
          <select
            id="cl-tipo"
            name="tipo"
            defaultValue={cliente?.tipo ?? "otro"}
            className={selectClass}
          >
            {Object.entries(TIPOS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Asesor responsable" htmlFor="cl-asesor">
          <select
            id="cl-asesor"
            name="asesorId"
            defaultValue={cliente?.asesorId ?? ""}
            className={selectClass}
          >
            <option value="">Sin asignar</option>
            {asesores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
                {a.activo ? "" : " (inactivo)"}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notas" htmlFor="cl-notas">
        <textarea
          id="cl-notas"
          name="notas"
          rows={4}
          defaultValue={cliente?.notas}
          className={textareaClass}
        />
      </Field>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={btnPrimary}>
          Guardar cliente
        </button>
        <button type="button" onClick={onDone} className={btnGhost}>
          Cancelar
        </button>
      </div>
    </AsyncForm>
  );
}
export default function ClientesPage() {
  const clientes = useCollection(db.clientes);
  const [editing, setEditing] = React.useState<Cliente | "nuevo" | null>(null);
  const [query, setQuery] = React.useState("");
  const filtered = clientes.filter((c) =>
    (c.nombre + " " + c.telefono + " " + (c.email ?? ""))
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes."
        description="Contactos de operaciones, responsables y seguimiento interno."
        actions={
          <button className={btnPrimary} onClick={() => setEditing("nuevo")}>
            <Plus className="size-4" />
            Nuevo cliente
          </button>
        }
      />
      {editing ? (
        <Editor
          key={editing === "nuevo" ? "nuevo" : editing.id}
          initial={editing === "nuevo" ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      ) : null}
      <input
        type="search"
        aria-label="Buscar cliente"
        placeholder="Nombre, teléfono o correo"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={inputClass + " max-w-md"}
      />
      {filtered.length === 0 ? (
        <EmptyState title="Sin clientes con esos criterios." />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {filtered.map((cliente) => (
            <li
              key={cliente.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {cliente.nombre} <Badge>{TIPOS[cliente.tipo]}</Badge>
                </p>
                <p className="break-words text-sm text-muted-foreground">
                  {cliente.telefono}{" "}
                  {cliente.email ? " · " + cliente.email : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  aria-label={"Editar " + cliente.nombre}
                  className={btnGhost}
                  onClick={() => setEditing(cliente)}
                >
                  <Pencil className="size-4" />
                </button>
                <AsyncButton
                  aria-label={"Eliminar " + cliente.nombre}
                  className={btnGhost}
                  onClick={async () => {
                    if (window.confirm("¿Eliminar a " + cliente.nombre + "?"))
                      await removeById(
                        db.clientes,
                        cliente.id,
                        db.clientes.version(cliente),
                      );
                  }}
                >
                  <Trash2 className="size-4" />
                </AsyncButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
