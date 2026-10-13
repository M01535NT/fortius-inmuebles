"use client";
import * as React from "react";
import { useBrowserPreference } from "./browser-preference";
import {
  btnGhost,
  Field,
  inputClass,
  selectClass,
} from "@/components/admin/ui";
import { apiRequest, useSession, type Asesor } from "@/lib/admin/store";
import {
  emptyInventoryFilters,
  type InventoryFilters,
} from "@/lib/admin/workspace";
type View = { name: string; filters: InventoryFilters };
export function InventoryControls({
  value,
  onChange,
  advisers,
  count,
}: {
  value: InventoryFilters;
  onChange: (value: InventoryFilters) => void;
  advisers: Asesor[];
  count: number;
}) {
  const session = useSession();
  const key = `fortius:inventory-views:${session?.id ?? "anonymous"}`;
  const [views, setViews] = useBrowserPreference<View[]>(key, [], (stored) =>
    Array.isArray(stored)
      ? stored
          .filter(
            (v) =>
              v &&
              typeof v.name === "string" &&
              v.filters &&
              Object.keys(emptyInventoryFilters).every(
                (k) => typeof v.filters[k] === "string",
              ),
          )
          .slice(0, 10)
      : [],
  );
  const [name, setName] = React.useState(""),
    [notice, setNotice] = React.useState("");
  const [myAdvisor, setMyAdvisor] = React.useState<string | null>(null);
  React.useEffect(() => {
    let active = true;
    apiRequest<{ asesorId: string | null }>("/api/admin/mi-asesor")
      .then((r) => {
        if (active) setMyAdvisor(r.asesorId);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [session?.id]);

  function persist(next: View[]) {
    setNotice(
      setViews(next)
        ? "Vistas guardadas en este navegador."
        : "No se pudieron guardar las vistas en este navegador.",
    );
  }
  const change = (field: keyof InventoryFilters, next: string) =>
    onChange({ ...value, [field]: next });
  return (
    <section
      aria-label="Filtros de inmuebles"
      className="admin-inventory-controls min-w-0 space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <Field label="Buscar inmuebles" htmlFor="inventory-query">
        <input
          id="inventory-query"
          type="search"
          className={inputClass}
          value={value.q}
          onChange={(e) => change("q", e.target.value)}
          placeholder="Título, código o zona"
        />
      </Field>
      {myAdvisor && (
        <button
          type="button"
          className={btnGhost}
          onClick={() =>
            onChange({ ...emptyInventoryFilters, advisor: myAdvisor })
          }
        >
          Mis inmuebles
        </button>
      )}
      {Object.values(value).some(Boolean) && <button type="button" className={btnGhost} onClick={() => onChange({ ...emptyInventoryFilters })}>Limpiar filtros</button>}
      <details>
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">
          Filtros y vistas guardadas ·{" "}
          {Object.values(value).filter(Boolean).length} activos
        </summary>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Asesor" htmlFor="inventory-advisor">
            <select
              id="inventory-advisor"
              className={selectClass}
              value={value.advisor}
              onChange={(e) => change("advisor", e.target.value)}
            >
              <option value="">Todos</option>
              {advisers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Operación" htmlFor="inventory-operation">
            <select
              id="inventory-operation"
              className={selectClass}
              value={value.operation}
              onChange={(e) => change("operation", e.target.value)}
            >
              <option value="">Todas</option>
              <option value="venta">Venta</option>
              <option value="renta">Renta</option>
            </select>
          </Field>
          <Field label="Publicación" htmlFor="inventory-publication">
            <select
              id="inventory-publication"
              className={selectClass}
              value={value.publication}
              onChange={(e) => change("publication", e.target.value)}
            >
              <option value="">Todas</option>
              <option value="publicada">Publicadas</option>
              <option value="borrador">Pendientes de publicar</option>
            </select>
          </Field>
          <Field label="Estado del inmueble" htmlFor="inventory-status">
            <select
              id="inventory-status"
              className={selectClass}
              value={value.status}
              onChange={(e) => change("status", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="disponible">Disponible</option>
              <option value="apartada">Apartada</option>
              <option value="vendida">Vendida</option>
              <option value="rentada">Rentada</option>
            </select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={btnGhost}
            onClick={() =>
              onChange({ ...emptyInventoryFilters, publication: "borrador" })
            }
          >
            Pendientes de publicar
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => onChange(emptyInventoryFilters)}
          >
            Limpiar filtros
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <Field label="Nombre de la vista" htmlFor="inventory-view-name">
              <input
                id="inventory-view-name"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Ej. Mi cartera en venta"
              />
            </Field>
          </div>
          <button
            type="button"
            className={btnGhost}
            disabled={!name.trim()}
            onClick={() => {
              persist(
                [
                  ...views.filter((v) => v.name !== name.trim()),
                  { name: name.trim(), filters: { ...value } },
                ].slice(-10),
              );
              setName("");
            }}
          >
            Guardar vista
          </button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {views.map((v) => (
            <li key={v.name} className="flex rounded-md border border-border">
              <button
                type="button"
                className="px-3 text-sm"
                onClick={() => onChange(v.filters)}
              >
                {v.name}
              </button>
              <button
                type="button"
                aria-label={`Eliminar vista ${v.name}`}
                className="border-l border-border"
                onClick={() => persist(views.filter((x) => x.name !== v.name))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          {notice}
        </p>
      </details>
      <p role="status" className="text-sm text-muted-foreground">
        {count} {count === 1 ? "inmueble" : "inmuebles"}
      </p>
    </section>
  );
}
