"use client";
import * as React from "react";
import Link from "next/link";
import { ClienteEditor, CLIENTE_TIPO_LABELS as TIPOS } from "@/components/admin/cliente-editor";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  AsyncButton,
  PageHeader,
  EmptyState,
  Badge,
  btnPrimary,
  btnGhost,
  inputClass,
} from "@/components/admin/ui";
import {
  db,
  useCollection,
  removeById,
  type Cliente,
} from "@/lib/admin/store";

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
        <ClienteEditor
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
                <p className="font-medium [overflow-wrap:anywhere]">
                  <Link href={`/admin/clientes/${encodeURIComponent(cliente.id)}`} className="inline-flex min-h-11 items-center hover:text-primary-ink">{cliente.nombre}</Link> <Badge>{TIPOS[cliente.tipo]}</Badge>
                </p>
                {cliente.leadId ? <p className="text-xs text-muted-foreground">Convertido desde un lead · perfil e historial conservados</p> : null}
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
                {!cliente.leadId ? <AsyncButton
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
                </AsyncButton> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
