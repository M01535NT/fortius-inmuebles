"use client";
import * as React from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { apiRequest, db, useCollection } from "@/lib/admin/store";
import { normalizedText } from "@/lib/admin/workspace";
import { btnGhost, inputClass } from "@/components/admin/ui";

export function WorkspaceSearch({ label = "Buscar" }: { label?: string } = {}) {
  const titleId = React.useId();
  const [opened, setOpened] = React.useState(false);
  const properties = useCollection(db.propiedades, opened),
    leads = useCollection(db.leads, opened),
    clients = useCollection(db.clientes, opened),
    tasks = useCollection(db.tareas, opened);
  const dialog = React.useRef<HTMLDialogElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const [query, setQuery] = React.useState("");
  const [dossiers, setDossiers] = React.useState<
    { id: string; folio: string; cliente_id?: string }[]
  >([]);
  const [error, setError] = React.useState("");
  function open() {
    setOpened(true);
    dialog.current?.showModal();
    setError("");
    apiRequest<{ expedientes: { id: string; folio: string; cliente_id?: string }[] }>(
      "/api/admin/expedientes",
    )
      .then((result) => setDossiers(result.expedientes ?? []))
      .catch(() =>
        setError(
          "No se pudieron buscar operaciones. Los demás resultados siguen disponibles.",
        ),
      );
  }
  const results = [
    ...properties.map((p) => ({
      id: `p:${p.slug}`,
      label: p.titulo,
      detail: `Inmueble · ${p.codigo}`,
      text: `${p.titulo} ${p.codigo} ${p.zona}`,
      href: `/admin/propiedades/${p.slug}/editar`,
    })),
    ...leads
      .filter((l) => !l.clienteId)
      .map((l) => ({
        id: `l:${l.id}`,
        label: l.nombre,
        detail: "Prospecto",
        text: `${l.nombre} ${l.telefono} ${l.email ?? ""}`,
        href: `/admin/leads/${l.id}`,
      })),
    ...clients.map((c) => ({
      id: `c:${c.id}`,
      label: c.nombre,
      detail: "Cliente",
      text: `${c.nombre} ${c.telefono} ${c.email ?? ""}`,
      href: `/admin/clientes/${c.id}`,
    })),
    ...tasks.map((t) => ({
      id: `t:${t.id}`,
      label: t.titulo,
      detail: "Tarea",
      text: t.titulo,
      href: `/admin/tareas/${t.id}`,
    })),
    ...dossiers.map((e) => ({
      id: `e:${e.id}`,
      label: clients.find(c => c.id === e.cliente_id)?.nombre ?? e.folio,
      detail: `Operación · ${e.folio}`,
      text: `${e.folio} ${clients.find(c => c.id === e.cliente_id)?.nombre ?? ""}`,
      href: `/admin/operaciones/${encodeURIComponent(e.id)}`,
    })),
  ].filter((item) => normalizedText(item.text).includes(normalizedText(query)));
  const close = () => dialog.current?.close();
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={btnGhost + " admin-search-trigger px-3"}
        aria-label="Buscar en el panel"
        onClick={open}
      >
        <Search size={18} />
        <span className="truncate">{label}</span>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => trigger.current?.focus()}
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-border bg-background p-5 text-foreground shadow-xl backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-xl font-semibold">
            Buscar en el panel
          </h2>
          <button
            type="button"
            className={btnGhost}
            onClick={close}
            aria-label="Cerrar búsqueda"
          >
            <X size={18} />
          </button>
        </div>
        <input
          autoFocus
          type="search"
          aria-label="Buscar personas, inmuebles o folios"
          className={inputClass + " mt-4"}
          placeholder="Nombre, teléfono, código o folio"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {opened && [db.propiedades, db.leads, db.clientes, db.tareas].some(store => store.state().status === "loading" || store.state().status === "idle") && <p role="status">Buscando en tus módulos…</p>}
        {opened && [db.propiedades, db.leads, db.clientes, db.tareas].some(store => store.state().status === "error") && <p role="alert">La búsqueda está incompleta. No se pudo consultar alguno de los módulos.</p>}
        {error && (
          <p role="status" className="mt-3 text-sm">
            {error}
          </p>
        )}
        {query.trim() ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground" role="status">
              {results.length} resultados
              {results.length > 30 ? " · primeros 30" : ""}
            </p>
            <ul className="mt-2 divide-y divide-border">
              {results.slice(0, 30).map((item) => (
                <li key={item.id}>
                  <Link
                    onClick={close}
                    href={item.href}
                    className="block rounded p-3 hover:bg-secondary"
                  >
                    <span className="block break-words font-medium">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.detail}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Crear rápidamente</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                ["Nueva operación", "/admin/operaciones/nueva", ""],
                ["Nuevo prospecto", "/admin/contactos?nuevo=1", "prospecto"],
                ["Nuevo inmueble", "/admin/propiedades/nueva", ""],
                ["Nueva tarea", "/admin/agenda?tab=tareas&nueva=1", "tarea"],
                ["Agendar visita", "/admin/agenda?nueva=1", "visita"],
              ].map(([label, href, action]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => {
                    close();
                    window.dispatchEvent(
                      new CustomEvent("fortius:quick-create", {
                        detail: action,
                      }),
                    );
                  }}
                  className={btnGhost}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
