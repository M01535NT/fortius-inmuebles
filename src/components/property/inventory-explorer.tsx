"use client";

import * as React from "react";
import Link from "next/link";

import { PropertyCard } from "@/components/property/property-card";
import {
  OPERACION_LABELS,
  TIPO_LABELS,
  type Operacion,
  type Property,
  type TipoPropiedad,
} from "@/data/propiedades";

/*
  Explorador con filtros client-side: operación, tipo, zona, rango de precio
  y ordenamiento. Los filtros se reflejan en la URL con history.replaceState
  (URLs compartibles) SIN useSearchParams: ese hook forzaría un límite de
  Suspense/CSR bailout en toda la página. El análisis histórico está archivado
  en la sección histórica de docs/fortius-inmuebles-implementation.md.
*/
type Orden = "recientes" | "precio-asc" | "precio-desc";
type Moneda = "todas" | "MXN" | "USD";

type Filtros = {
  operacion: Operacion | "todas";
  tipo: TipoPropiedad | "todos";
  zona: string; // "todas" o nombre exacto
  moneda: Moneda;
  min: string; // texto del input en la moneda seleccionada
  max: string;
  orden: Orden;
};

const DEFAULTS: Filtros = {
  operacion: "todas",
  tipo: "todos",
  zona: "todas",
  moneda: "todas",
  min: "",
  max: "",
  orden: "recientes",
};

function filtrosDesdeUrl(search: string, zonas: string[], tipos: string[]): Filtros {
  const p = new URLSearchParams(search);
  const op = p.get("op");
  const tipo = p.get("tipo");
  const zona = p.get("zona");
  const orden = p.get("orden");
  const monedaParam = p.get("moneda");
  const usaPrecio = Boolean(p.get("min") || p.get("max") || orden === "precio-asc" || orden === "precio-desc");
  return {
    operacion: op === "venta" || op === "renta" ? op : "todas",
    tipo: tipo && tipos.includes(tipo) ? (tipo as TipoPropiedad) : "todos",
    zona: zona && zonas.includes(zona) ? zona : "todas",
    moneda: monedaParam === "MXN" || monedaParam === "USD" ? monedaParam : usaPrecio ? "MXN" : "todas",
    min: /^\d+$/.test(p.get("min") ?? "") ? (p.get("min") as string) : "",
    max: /^\d+$/.test(p.get("max") ?? "") ? (p.get("max") as string) : "",
    orden: orden === "precio-asc" || orden === "precio-desc" ? orden : "recientes",
  };
}

function urlDesdeFiltros(f: Filtros): string {
  const p = new URLSearchParams();
  if (f.operacion !== "todas") p.set("op", f.operacion);
  if (f.tipo !== "todos") p.set("tipo", f.tipo);
  if (f.zona !== "todas") p.set("zona", f.zona);
  if (f.moneda !== "todas") p.set("moneda", f.moneda);
  if (f.min) p.set("min", f.min);
  if (f.max) p.set("max", f.max);
  if (f.orden !== "recientes") p.set("orden", f.orden);
  const qs = p.toString();
  return qs ? `?${qs}` : window.location.pathname;
}

function montoPublico(p: Property): number | null {
  return p.precio.modalidad === "publico" ? p.precio.monto : null;
}

type Props = { propiedades: Property[] };

export function InventoryExplorer({ propiedades }: Props) {
  const [filtros, setFiltros] = React.useState<Filtros>(DEFAULTS);
  const inicializado = React.useRef(false);

  // Derivados de los datos: nunca listas hardcodeadas en paralelo.
  const tipos = React.useMemo(
    () => Array.from(new Set(propiedades.map((p) => p.tipo))),
    [propiedades],
  );
  const zonas = React.useMemo(
    () => Array.from(new Set(propiedades.map((p) => p.zona))).sort(),
    [propiedades],
  );

  /* Hidratar filtros desde la URL una sola vez; después, cada cambio se
     refleja con replaceState (sin recargar ni hacer scroll). Leer la URL en
     el initializer de useState rompería la hidratación (el servidor
     prerenderiza con defaults), así que el único momento seguro es
     post-montaje. */
  React.useEffect(() => {
    if (!inicializado.current) {
      inicializado.current = true;
      if (window.location.search) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- adopción única de estado externo (URL) tras hidratar
        setFiltros(filtrosDesdeUrl(window.location.search, zonas, tipos));
      }
      return;
    }
    window.history.replaceState(null, "", urlDesdeFiltros(filtros));
  }, [filtros, zonas, tipos]);

  function set<K extends keyof Filtros>(key: K, value: Filtros[K]) {
    setFiltros((f) => {
      if (key === "moneda") {
        const moneda = value as Moneda;
        return moneda === "todas"
          ? { ...f, moneda, min: "", max: "", orden: "recientes" }
          : { ...f, moneda };
      }
      const necesitaMoneda =
        (key === "orden" && value !== "recientes") ||
        ((key === "min" || key === "max") && value !== "");
      return { ...f, [key]: value, moneda: necesitaMoneda && f.moneda === "todas" ? "MXN" : f.moneda };
    });
  }

  const min = filtros.min ? Number(filtros.min) : null;
  const max = filtros.max ? Number(filtros.max) : null;

  const resultados = propiedades
    .filter((p) => {
      if (filtros.operacion !== "todas" && p.operacion !== filtros.operacion) return false;
      if (filtros.tipo !== "todos" && p.tipo !== filtros.tipo) return false;
      if (filtros.zona !== "todas" && p.zona !== filtros.zona) return false;
      if (
        filtros.moneda !== "todas" &&
        (p.precio.modalidad !== "publico" || p.precio.moneda !== filtros.moneda)
      ) return false;
      if (min !== null || max !== null) {
        const monto = montoPublico(p);
        if (monto === null) return false; // "a consulta" queda fuera al filtrar por precio
        if (min !== null && monto < min) return false;
        if (max !== null && monto > max) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filtros.orden === "recientes") {
        return b.publicadaEl.localeCompare(a.publicadaEl);
      }
      const ma = montoPublico(a);
      const mb = montoPublico(b);
      if (ma === null && mb === null) return 0;
      if (ma === null) return 1; // consulta siempre al final
      if (mb === null) return -1;
      return filtros.orden === "precio-asc" ? ma - mb : mb - ma;
    });

  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(DEFAULTS);

  const chipBase =
    "inline-flex h-9 items-center rounded-md border px-3.5 text-sm font-medium transition-colors";
  const chipOff = " border-border text-foreground/75 hover:bg-secondary hover:text-foreground";
  const chipOn = " border-primary/50 bg-secondary text-foreground";
  const fieldClass =
    "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground";

  return (
    <div>
      {/* Filtros */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Operación">
            {(["todas", "venta", "renta"] as const).map((op) => (
              <button
                key={op}
                type="button"
                aria-pressed={filtros.operacion === op}
                onClick={() => set("operacion", op)}
                className={chipBase + (filtros.operacion === op ? chipOn : chipOff)}
              >
                {op === "todas" ? "Todas" : OPERACION_LABELS[op]}
              </button>
            ))}
          </div>

          <span aria-hidden="true" className="hidden h-6 w-px bg-border sm:block" />

          <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de propiedad">
            <button
              type="button"
              aria-pressed={filtros.tipo === "todos"}
              onClick={() => set("tipo", "todos")}
              className={chipBase + (filtros.tipo === "todos" ? chipOn : chipOff)}
            >
              Todos
            </button>
            {tipos.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={filtros.tipo === t}
                onClick={() => set("tipo", t)}
                className={chipBase + (filtros.tipo === t ? chipOn : chipOff)}
              >
                {TIPO_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-zona" className="text-sm font-medium text-muted-foreground">
              Zona
            </label>
            <select
              id="filtro-zona"
              value={filtros.zona}
              onChange={(e) => set("zona", e.target.value)}
              className={fieldClass}
            >
              <option value="todas">Todas las zonas</option>
              {zonas.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-moneda" className="text-sm font-medium text-muted-foreground">
              Moneda
            </label>
            <select
              id="filtro-moneda"
              value={filtros.moneda}
              onChange={(e) => set("moneda", e.target.value as Moneda)}
              className={fieldClass}
            >
              <option value="todas">Todas</option>
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-min" className="text-sm font-medium text-muted-foreground">
              Precio desde {filtros.moneda === "todas" ? "" : `(${filtros.moneda})`}
            </label>
            <input
              id="filtro-min"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={filtros.min}
              onChange={(e) => set("min", e.target.value)}
              className={fieldClass + " w-[130px]"}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-max" className="text-sm font-medium text-muted-foreground">
              Precio hasta {filtros.moneda === "todas" ? "" : `(${filtros.moneda})`}
            </label>
            <input
              id="filtro-max"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Sin límite"
              value={filtros.max}
              onChange={(e) => set("max", e.target.value)}
              className={fieldClass + " w-[130px]"}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-orden" className="text-sm font-medium text-muted-foreground">
              Ordenar por
            </label>
            <select
              id="filtro-orden"
              value={filtros.orden}
              onChange={(e) => set("orden", e.target.value as Orden)}
              className={fieldClass}
            >
              <option value="recientes">Más recientes</option>
              <option value="precio-asc">Menor precio</option>
              <option value="precio-desc">Mayor precio</option>
            </select>
          </div>

          {hayFiltros ? (
            <button
              type="button"
              onClick={() => setFiltros(DEFAULTS)}
              className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-primary-ink transition-colors hover:text-foreground"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>

        {min !== null || max !== null ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Al filtrar por precio, las propiedades con valor a consulta no se
            muestran.
          </p>
        ) : null}
      </div>

      {/* Contador */}
      <p
        aria-live="polite"
        className="mt-5 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground"
      >
        {String(resultados.length).padStart(2, "0")}{" "}
        {resultados.length === 1 ? "resultado" : "resultados"}
      </p>

      {/* Grid o vacío */}
      {resultados.length > 0 ? (
        <div className="property-catalog-grid mt-8">
          {resultados.map((p) => (
            <PropertyCard key={p.slug} property={p} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-border p-10 md:p-14">
          <p className="display-soft text-2xl text-foreground">
            No hay propiedades con esos criterios.
          </p>
          <p className="mt-3 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
            El inventario cambia con frecuencia. Cuéntanos qué buscas y te
            avisamos cuando entre algo que encaje.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {hayFiltros ? (
              <button
                type="button"
                onClick={() => setFiltros(DEFAULTS)}
                className="inline-flex h-11 items-center rounded-md border border-border px-5 text-base font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Limpiar filtros
              </button>
            ) : null}
            <Link
              href="/contacto"
              className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-base font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
            >
              Cuéntanos qué buscas
            </Link>
          </div>
        </div>
      )}

      {/* CTA persistente en mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur md:hidden">
        <Link
          href="/contacto"
          className="flex h-12 w-full items-center justify-center rounded-md bg-primary text-base font-semibold text-primary-foreground active:scale-[0.99]"
        >
          Cuéntanos qué buscas
        </Link>
      </div>
    </div>
  );
}
