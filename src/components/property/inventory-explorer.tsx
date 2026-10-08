"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { PropertyCard } from "@/components/property/property-card";
import {
  OPERACION_LABELS,
  TIPO_LABELS,
  formatPrecio,
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
  const [comparadas, setComparadas] = React.useState<string[]>([]);
  const [comparisonHydrated, setComparisonHydrated] = React.useState(false);
  const [comparacionVisible, setComparacionVisible] = React.useState(false);
  const inicializado = React.useRef(false);
  const comparisonRef = React.useRef<HTMLElement>(null);
  const comparisonButtonRef = React.useRef<HTMLButtonElement>(null);

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
    try {
      const saved = JSON.parse(window.sessionStorage.getItem("fortius-inventory-comparison") ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restauración única de una preferencia de sesión tras hidratar
      if (Array.isArray(saved)) setComparadas(saved.filter((slug): slug is string => typeof slug === "string" && propiedades.some((property) => property.slug === slug)).slice(0, 3));
    } catch {
      // El inventario funciona aunque el navegador bloquee el almacenamiento.
    }
    setComparisonHydrated(true);
  }, [propiedades]);

  React.useEffect(() => {
    if (!comparisonHydrated) return;
    try {
      window.sessionStorage.setItem("fortius-inventory-comparison", JSON.stringify(comparadas));
    } catch {
      // La selección sigue disponible durante esta visita.
    }
  }, [comparadas, comparisonHydrated]);

  React.useEffect(() => {
    if (!inicializado.current) {
      inicializado.current = true;
      if (window.location.search) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- adopción única de estado externo (URL) tras hidratar
        setFiltros(filtrosDesdeUrl(window.location.search, zonas, tipos));
      }
      let savedScroll = window.history.state?.fortiusInventoryScroll;
      try {
        const savedReturn = JSON.parse(window.sessionStorage.getItem("fortius-inventory-return") ?? "null");
        if (savedReturn?.url === `${window.location.pathname}${window.location.search}` && typeof savedReturn.scrollY === "number") savedScroll = savedReturn.scrollY;
      } catch {
        // La restauración por historial sigue disponible.
      }
      if (typeof savedScroll === "number" && savedScroll > 0) {
        window.requestAnimationFrame(() => window.scrollTo({ top: savedScroll }));
      }
      return;
    }
    window.history.replaceState(window.history.state, "", urlDesdeFiltros(filtros));
  }, [filtros, zonas, tipos]);

  React.useEffect(() => {
    const restore = () => setFiltros(filtrosDesdeUrl(window.location.search, zonas, tipos));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [zonas, tipos]);

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
  const propiedadesComparadas = comparadas
    .map((slug) => propiedades.find((property) => property.slug === slug))
    .filter((property): property is Property => Boolean(property));
  const activeFilters = [
    filtros.operacion !== "todas" ? { key: "operacion", label: OPERACION_LABELS[filtros.operacion] } : null,
    filtros.tipo !== "todos" ? { key: "tipo", label: TIPO_LABELS[filtros.tipo] } : null,
    filtros.zona !== "todas" ? { key: "zona", label: filtros.zona } : null,
    filtros.moneda !== "todas" ? { key: "moneda", label: filtros.moneda } : null,
    filtros.min ? { key: "min", label: `Desde ${filtros.min}` } : null,
    filtros.max ? { key: "max", label: `Hasta ${filtros.max}` } : null,
    filtros.orden !== "recientes" ? { key: "orden", label: filtros.orden === "precio-asc" ? "Menor precio" : "Mayor precio" } : null,
  ].filter((filter): filter is { key: keyof Filtros; label: string } => Boolean(filter));

  function clearFilter(key: keyof Filtros) {
    const defaults = { operacion: "todas", tipo: "todos", zona: "todas", moneda: "todas", min: "", max: "", orden: "recientes" } as const;
    set(key, defaults[key] as Filtros[typeof key]);
  }

  function toggleComparada(slug: string) {
    setComparadas((current) => current.includes(slug)
      ? current.filter((item) => item !== slug)
      : current.length < 3 ? [...current, slug] : current);
  }

  function showComparison() {
    setComparacionVisible(true);
    window.requestAnimationFrame(() => comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

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

        {activeFilters.length > 0 ? <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtros activos">
          {activeFilters.map((filter) => <button key={filter.key} type="button" onClick={() => clearFilter(filter.key)} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border px-3 text-xs text-foreground hover:bg-secondary">{filter.label}<X className="size-3.5" aria-hidden="true" /><span className="sr-only">Quitar filtro</span></button>)}
        </div> : null}
      </div>

      {/* Contador */}
      <p
        aria-live="polite"
        className="mt-5 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground"
      >
        {String(resultados.length).padStart(2, "0")}{" "}
        {resultados.length === 1 ? "resultado" : "resultados"}
      </p>

      {comparadas.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
          <p className="text-sm text-muted-foreground">Selecciona hasta 3 propiedades para compararlas.</p>
          <button ref={comparisonButtonRef} type="button" onClick={showComparison} className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Ver comparación ({comparadas.length})
          </button>
        </div>
      ) : null}

      {comparacionVisible && propiedadesComparadas.length > 0 ? (
        <section ref={comparisonRef} className="scroll-mt-24 border-b border-border py-8" aria-labelledby="comparison-title">
          <div className="flex items-center justify-between gap-4">
            <h2 id="comparison-title" className="display-soft text-2xl text-foreground">Comparación de inmuebles</h2>
            <button type="button" onClick={() => { setComparacionVisible(false); window.requestAnimationFrame(() => comparisonButtonRef.current?.focus()); }} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <X className="size-4" aria-hidden="true" /> Cerrar
            </button>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm" aria-label="Comparación de inmuebles">
              <thead><tr className="border-b border-border"><th className="py-3 pr-5 font-medium text-muted-foreground">Dato</th>{propiedadesComparadas.map((property) => <th key={property.slug} className="px-4 py-3 font-medium text-foreground"><Link href={`/inventario/${property.slug}`} className="underline decoration-primary/40 underline-offset-4">{property.titulo}</Link></th>)}</tr></thead>
              <tbody>
                {[
                  ["Precio", (property: Property) => formatPrecio(property.precio)],
                  ["Terreno", (property: Property) => property.ficha.terrenoM2 != null ? `${property.ficha.terrenoM2} m²` : "No informado"],
                  ["Construcción", (property: Property) => property.ficha.construccionM2 != null ? `${property.ficha.construccionM2} m²` : "No informado"],
                  ["Recámaras", (property: Property) => property.ficha.recamaras?.toString() ?? "No informado"],
                  ["Estacionamientos", (property: Property) => property.ficha.estacionamientos?.toString() ?? "No informado"],
                  ["Ubicación", (property: Property) => property.zona],
                ].map(([label, value]) => <tr key={label as string} className="border-b border-border/70"><th className="py-3 pr-5 font-normal text-muted-foreground">{label as string}</th>{propiedadesComparadas.map((property) => <td key={property.slug} className="px-4 py-3 text-foreground">{(value as (property: Property) => string)(property)}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Grid o vacío */}
      {resultados.length > 0 ? (
        <div className="property-catalog-grid mt-8">
          {resultados.map((p) => (
            <div key={p.slug} onClickCapture={(event) => {
              if ((event.target as HTMLElement).closest("a[href^='/inventario/']")) {
                window.history.replaceState({ ...window.history.state, fortiusInventoryScroll: window.scrollY }, "", window.location.href);
                try {
                  window.sessionStorage.setItem("fortius-inventory-return", JSON.stringify({ url: `${window.location.pathname}${window.location.search}`, scrollY: window.scrollY }));
                } catch {
                  // El enlace de regreso conserva /inventario como alternativa.
                }
              }
            }}>
              <PropertyCard property={p} />
              <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={comparadas.includes(p.slug)} disabled={!comparadas.includes(p.slug) && comparadas.length >= 3} onChange={() => toggleComparada(p.slug)} className="size-4 accent-primary" />
                Comparar {p.titulo}
              </label>
            </div>
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
