"use client";
import * as React from "react";
import { usePanelPreference } from "./preferences-store";
import { Field, inputClass } from "@/components/admin/ui";
import { Button } from "@/components/admin/kit";
import { X } from "@/components/admin/icons";
import { Disclosure, usePanelNotice } from "@/components/admin/properties/disclosure";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, useSession, type Asesor } from "@/lib/admin/store";
import {
  emptyInventoryFilters,
  type InventoryFilters,
} from "@/lib/admin/workspace";
type View = { name: string; filters: InventoryFilters };
const NO_VIEWS: Array<{ name: string; filters: Record<string, string> }> = [];
const isView = (v: { name: string; filters: Record<string, string> }): v is View =>
  !!v && typeof v.name === "string" && !!v.filters && Object.keys(emptyInventoryFilters).every((k) => typeof v.filters[k] === "string");
function parseViews(raw: string): View[] | undefined {
  try {
    const stored: unknown = JSON.parse(raw);
    const views = Array.isArray(stored) ? (stored as View[]).filter(isView).slice(0, 10).map((v) => ({ name: v.name.slice(0, 60), filters: { ...v.filters } })) : [];
    return views.length ? views : undefined;
  } catch { return undefined; }
}
// Radix Select no admite una opción con valor vacío: «Todos» viaja como ALL y se guarda como "".
const ALL = "todos";

/** Filtro de una lista corta (Radix Select, DEC-52): flechas, letras, Enter y Escape. */
function FilterSelect({ id, label, value, onChange, options, all = "Todos" }: { id: string; label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]>; all?: string }) {
  return <Field label={label} htmlFor={id}>
    <Select value={value || ALL} onValueChange={next => onChange(next === ALL ? "" : next)}>
      <SelectTrigger id={id}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{all}</SelectItem>
        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  </Field>;
}

export function InventoryControls({
  value,
  onChange,
  advisers,
  count,
  hideSearch = false,
}: {
  value: InventoryFilters;
  onChange: (value: InventoryFilters) => void;
  advisers: Asesor[];
  count: number;
  /** Inmuebles ya muestra la búsqueda arriba. */
  hideSearch?: boolean;
}) {
  const session = useSession();
  // UX-02: las vistas guardadas siguen al usuario en cualquier equipo; las de este navegador se suben una vez.
  const legacy = React.useMemo(() => ({ key: `fortius:inventory-views:${session?.id ?? "anonymous"}`, parse: parseViews }), [session?.id]);
  const { value: stored, save } = usePanelPreference("vistasInventario", NO_VIEWS, legacy);
  const views = stored.filter(isView);
  const [name, setName] = React.useState("");
  const { show: notify, inline: notice } = usePanelNotice();
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

  async function persist(next: View[]) {
    notify((await save(next)) ? "Vistas guardadas. Las verás en cualquier equipo." : "No se pudieron guardar las vistas. Revisa tu conexión y vuelve a intentarlo.");
  }
  const change = (field: keyof InventoryFilters, next: string) =>
    onChange({ ...value, [field]: next });
  const active = Object.values(value).filter(Boolean).length;
  return (
    <section
      aria-label="Filtros de inmuebles"
      className="admin-inventory-controls min-w-0 space-y-3 rounded-lg border border-border bg-card p-4"
    >
      {!hideSearch && <Field label="Buscar inmuebles" htmlFor="inventory-query">
        <input
          id="inventory-query"
          type="search"
          className={inputClass}
          value={value.q}
          onChange={(e) => change("q", e.target.value)}
          placeholder="Título, código o zona"
        />
      </Field>}
      {(myAdvisor || active > 0) && <div className="col-span-full flex flex-wrap gap-2">
        {myAdvisor && <Button variant="ghost" onClick={() => onChange({ ...emptyInventoryFilters, advisor: myAdvisor })}>Mis inmuebles</Button>}
        {active > 0 && <Button variant="ghost" onClick={() => onChange({ ...emptyInventoryFilters })}>Limpiar filtros</Button>}
      </div>}
      <Disclosure className="col-span-full" triggerClassName="text-sm font-medium" title={`Filtros y vistas guardadas · ${active} activos`}>
        <div className="grid min-w-0 gap-3 pt-1 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect id="inventory-advisor" label="Asesor" value={value.advisor} onChange={v => change("advisor", v)} options={advisers.map(a => [a.id, a.nombre])} />
          <FilterSelect id="inventory-operation" label="Operación" all="Todas" value={value.operation} onChange={v => change("operation", v)} options={[["venta", "Venta"], ["renta", "Renta"]]} />
          <FilterSelect id="inventory-publication" label="Publicación" all="Todas" value={value.publication} onChange={v => change("publication", v)} options={[["publicada", "Publicadas"], ["borrador", "Pendientes de publicar"]]} />
          <FilterSelect id="inventory-status" label="Estado del inmueble" value={value.status} onChange={v => change("status", v)} options={[["disponible", "Disponible"], ["apartada", "Apartada"], ["vendida", "Vendida"], ["rentada", "Rentada"]]} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => onChange({ ...emptyInventoryFilters, publication: "borrador" })}>Pendientes de publicar</Button>
          <Button variant="ghost" onClick={() => onChange(emptyInventoryFilters)}>Limpiar filtros</Button>
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
          <Button
            disabled={!name.trim()}
            onClick={() => {
              void persist(
                [
                  ...views.filter((v) => v.name !== name.trim()),
                  { name: name.trim(), filters: { ...value } },
                ].slice(-10),
              );
              setName("");
            }}
          >
            Guardar vista
          </Button>
        </div>
        {views.length > 0 && <ul className="mt-3 flex flex-wrap gap-2" aria-label="Vistas guardadas">
          {views.map((v) => (
            <li key={v.name} className="flex items-center rounded-[var(--radius-control)] border border-border">
              <button type="button" className="min-h-11 px-3 text-sm font-medium" onClick={() => onChange(v.filters)}>{v.name}</button>
              <button type="button" aria-label={`Eliminar vista ${v.name}`} className="inline-flex size-11 items-center justify-center border-l border-border text-muted-foreground hover:text-foreground"
                onClick={() => void persist(views.filter((x) => x.name !== v.name))}><X size={16} aria-hidden="true" /></button>
            </li>
          ))}
        </ul>}
        {notice && <div className="mt-2">{notice}</div>}
      </Disclosure>
      <p role="status" className="text-sm text-muted-foreground">
        {count} {count === 1 ? "inmueble" : "inmuebles"}
      </p>
    </section>
  );
}
