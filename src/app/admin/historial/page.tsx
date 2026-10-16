"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";
import * as React from "react";
import {
  apiRequest,
  errorMessage,
  loadAdminData,
  useSession,
} from "@/lib/admin/store";
import {
  AsyncButton,
  PageHeader,
  btnGhost,
  selectClass,
} from "@/components/admin/ui";
type Entry = {
  id: string;
  collection: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  actor_id: string | null;
  version: number;
  changed_fields?: string[];
  created_at: string;
  restored_at: string | null;
};
const labels: Record<string, string> = {
  propiedades: "Inmuebles",
  posts: "Blog",
  notas: "Notas",
  eventos: "Agenda",
  leads: "Prospectos",
  clientes: "Clientes",
  tareas: "Tareas",
  asesores: "Asesores",
  config: "Configuración",
  contenido: "Contenido",
  archivos: "Archivos",
};
export default function HistoryPage() {
  const session = useSession();
  const [entries, setEntries] = React.useState<Entry[]>([]),
    [deleted, setDeleted] = React.useState(false),
    [collection, setCollection] = React.useState(() =>
      typeof window !== "undefined"
        ? (new URLSearchParams(window.location.search).get("collection") ?? "")
        : "",
    ),
    [record, setRecord] = React.useState(() =>
      typeof window !== "undefined"
        ? (new URLSearchParams(window.location.search).get("record") ?? "")
        : "",
    ),
    [offset, setOffset] = React.useState(0),
    [more, setMore] = React.useState(false),
    [status, setStatus] = React.useState("loading"),
    [error, setError] = React.useState(""),
    [revision, setRevision] = React.useState(0);
  React.useEffect(() => {
    if (session?.role !== "admin") return;
    let active = true;
    const query = new URLSearchParams({
      offset: String(offset),
      collection,
      record,
      deleted: deleted ? "1" : "0",
    });
    apiRequest<{ entries: Entry[]; hasMore: boolean }>(
      `/api/admin/historial?${query}`,
    )
      .then((r) => {
        if (active) {
          setError("");
          setEntries(r.entries);
          setMore(r.hasMore);
          setStatus("ready");
        }
      })
      .catch((e) => {
        if (active) {
          setError(errorMessage(e));
          setStatus("error");
        }
      });
    return () => {
      active = false;
    };
  }, [session?.role, deleted, collection, record, offset, revision]);
  if (session?.role !== "admin")
    return <p role="alert">El historial requiere acceso de administrador.</p>;
  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Historial"
        description="Cambios registrados por el servidor desde la activación del historial."
      />
      <div className="flex flex-wrap gap-2">
        {record && (
          <button
            className={btnGhost}
            onClick={() => {
              setStatus("loading");
              setRecord("");
              setOffset(0);
            }}
          >
            Registro: {record} ×
          </button>
        )}
        <button
          className={btnGhost}
          aria-pressed={!deleted}
          onClick={() => {
            if (!deleted && offset === 0) return;
            setStatus("loading");
            setError("");
            setDeleted(false);
            setOffset(0);
          }}
        >
          Actividad
        </button>
        <button
          className={btnGhost}
          aria-pressed={deleted}
          onClick={() => {
            if (deleted && offset === 0) return;
            setStatus("loading");
            setError("");
            setDeleted(true);
            setOffset(0);
          }}
        >
          Recuperar eliminados
        </button>
        <label className="min-w-0 text-sm">
          Módulo
          <select
            className={selectClass}
            value={collection}
            onChange={(e) => {
              setStatus("loading");
              setError("");
              setCollection(e.target.value);
              setOffset(0);
            }}
          >
            <option value="">Todos</option>
            {Object.entries(labels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {deleted && (
        <p className="text-sm text-muted-foreground">
          Recuperación de inmuebles, artículos, notas y eventos. Los inmuebles y
          artículos vuelven como borradores. Los expedientes se restauran desde
          su módulo.
        </p>
      )}
      {status === "loading" ? (
        <p role="status">Cargando historial…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            className={btnGhost}
            onClick={() => {
              setStatus("loading");
              setRevision((n) => n + 1);
            }}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="min-w-0 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-semibold">
                      {labels[entry.collection] ?? entry.collection} ·{" "}
                      {entry.record_id}
                    </h2>
                    <p className="mt-1 text-sm">
                      {
                        {
                          INSERT: "Creación",
                          UPDATE: "Actualización",
                          DELETE: "Eliminación",
                        }[entry.action]
                      }{" "}
                      · Versión {entry.version}
                    </p>
                    <p className="mt-2 break-words text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString("es-MX")} ·{" "}
                      {entry.actor_id === session.id
                        ? session.email
                        : (entry.actor_id ?? "Recepción pública / sistema")}
                    </p>
                    {!!entry.changed_fields?.length && (
                      <p className="mt-2 break-words text-xs text-muted-foreground">
                        Campos modificados: {entry.changed_fields.join(", ")}
                      </p>
                    )}
                  </div>
                  {deleted && (
                    <AsyncButton
                      className={btnGhost}
                      onClick={async () => {
                        if (
                          !await confirmAction(
                            "¿Restaurar este registro? Los contenidos públicos volverán como borradores.",
                          )
                        )
                          return;
                        await apiRequest("/api/admin/historial", "POST", {
                          historyId: entry.id,
                        });
                        setRevision((n) => n + 1);
                        try {
                          await loadAdminData();
                        } catch {
                          throw new Error(
                            "Registro restaurado. Recarga el panel para actualizar los listados.",
                          );
                        }
                      }}
                    >
                      Restaurar
                    </AsyncButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {!entries.length && <p>Sin movimientos en esta consulta.</p>}
          <div className="flex gap-2">
            <button
              className={btnGhost}
              disabled={offset === 0}
              onClick={() => {
                setStatus("loading");
                setOffset((n) => n - 50);
              }}
            >
              Anterior
            </button>
            <button
              className={btnGhost}
              disabled={!more}
              onClick={() => {
                setStatus("loading");
                setOffset((n) => n + 50);
              }}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
}
