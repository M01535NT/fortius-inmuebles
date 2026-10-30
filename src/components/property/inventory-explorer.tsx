"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";

import { PropertyCard } from "@/components/property/property-card";
import {
  OPERACION_LABELS,
  TIPO_LABELS,
  formatPrecio,
  type Operacion,
  type Property,
  type TipoPropiedad,
} from "@/data/propiedades";
import { SEGMENTOS_INMUEBLE, SEGMENTO_LABELS, segmentoInmueble, tiposDeSegmento, type SegmentoInmueble } from "@/lib/inmueble-segmentos";

/*
  Explorador con filtros client-side: operación, tipo, zona, rango de precio
  y ordenamiento. Los filtros se reflejan en la URL con history.replaceState
  (URLs compartibles) SIN useSearchParams: ese hook forzaría un límite de
  Suspense/CSR bailout en toda la página. Conservar esta frontera al ampliar
  el inventario conforme a PLAN_ERP_CRM.md.
*/
type Orden = "recientes" | "precio-asc" | "precio-desc";
type Moneda = "todas" | "MXN" | "USD";

type Filtros = {
  operacion: Operacion | "todas";
  segmento: SegmentoInmueble | "todos"; // atajo Residencial / Comercial / Industrial
  tipo: TipoPropiedad | "todos";
  zona: string; // "todas" o nombre exacto
  moneda: Moneda;
  min: string; // texto del input en la moneda seleccionada
  max: string;
  orden: Orden;
};

const DEFAULTS: Filtros = {
  operacion: "todas",
  segmento: "todos",
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
  const segmento = segmentoInmueble(p.get("segmento"));
  const zona = p.get("zona");
  const orden = p.get("orden");
  const monedaParam = p.get("moneda");
  const usaPrecio = Boolean(p.get("min") || p.get("max") || orden === "precio-asc" || orden === "precio-desc");
  return {
    operacion: op === "venta" || op === "renta" ? op : "todas",
    segmento: segmento ?? "todos",
    tipo: tipo && tipos.includes(tipo) && (!segmento || (tiposDeSegmento(segmento) as readonly string[]).includes(tipo)) ? (tipo as TipoPropiedad) : "todos",
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
  if (f.segmento !== "todos") p.set("segmento", f.segmento);
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
  const [masFiltros, setMasFiltros] = React.useState(false);
  const [vista, setVista] = React.useState<"cuadricula" | "mapa">("cuadricula");
  const [mapaZona, setMapaZona] = React.useState<string | null>(null);
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
      if (key === "segmento") {
        const segmento = value as Filtros["segmento"];
        const conserva = f.tipo !== "todos" && segmento !== "todos" && (tiposDeSegmento(segmento) as readonly string[]).includes(f.tipo);
        return { ...f, segmento, tipo: conserva ? f.tipo : "todos" };
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
      if (filtros.segmento !== "todos" && !(tiposDeSegmento(filtros.segmento) as readonly string[]).includes(p.tipo)) return false;
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
    filtros.segmento !== "todos" ? { key: "segmento", label: SEGMENTO_LABELS[filtros.segmento] } : null,
    filtros.tipo !== "todos" ? { key: "tipo", label: TIPO_LABELS[filtros.tipo] } : null,
    filtros.zona !== "todas" ? { key: "zona", label: filtros.zona } : null,
    filtros.moneda !== "todas" ? { key: "moneda", label: filtros.moneda } : null,
    filtros.min ? { key: "min", label: `Desde ${filtros.min}` } : null,
    filtros.max ? { key: "max", label: `Hasta ${filtros.max}` } : null,
    filtros.orden !== "recientes" ? { key: "orden", label: filtros.orden === "precio-asc" ? "Menor precio" : "Mayor precio" } : null,
  ].filter((filter): filter is { key: keyof Filtros; label: string } => Boolean(filter));

  function clearFilter(key: keyof Filtros) {
    const defaults = { operacion: "todas", segmento: "todos", tipo: "todos", zona: "todas", moneda: "todas", min: "", max: "", orden: "recientes" } as const;
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

  const total = propiedades.length;
  const mapaZonaActiva = mapaZona ?? (filtros.zona !== "todas" ? filtros.zona : resultados[0]?.zona);
  const mapQuery = encodeURIComponent(`${mapaZonaActiva ?? "Tijuana"}, Baja California, México`);
  const zonasResultado = Array.from(new Set(resultados.map((p) => p.zona)));

  return (
    <>
      {/* Cabecera nocturna con los filtros (boceto InventarioNocturno) */}
      <section className="pg-hero inv-hero">
        <div className="pg-container pg-hero-body">
          <p className="pg-eyebrow">{total} {total === 1 ? "propiedad" : "propiedades"}</p>
          <h1 className="pg-title">Propiedades.</h1>
          <p className="pg-lead">Consulta las características de cada inmueble y pregunta por su disponibilidad, documentos y condiciones antes de decidir.</p>

          <div className="inv-filters">
            <div className="inv-segment" role="group" aria-label="Operación">
              {(["todas", "venta", "renta"] as const).map((op) => (
                <button key={op} type="button" aria-pressed={filtros.operacion === op} onClick={() => set("operacion", op)}>
                  {op === "todas" ? "Todas" : OPERACION_LABELS[op]}
                </button>
              ))}
            </div>
            <div className="pg-pills" role="group" aria-label="Segmento">
              <button type="button" aria-pressed={filtros.segmento === "todos"} onClick={() => set("segmento", "todos")} className={"pg-pill" + (filtros.segmento === "todos" ? " is-active" : "")}>Todos</button>
              {SEGMENTOS_INMUEBLE.map((segmento) => (
                <button key={segmento.key} type="button" aria-pressed={filtros.segmento === segmento.key} onClick={() => set("segmento", segmento.key)} className={"pg-pill" + (filtros.segmento === segmento.key ? " is-active" : "")}>{segmento.label}</button>
              ))}
            </div>
            <div className="pg-pills" role="group" aria-label="Tipo de propiedad">
              <button type="button" aria-pressed={filtros.tipo === "todos"} onClick={() => set("tipo", "todos")} className={"pg-pill" + (filtros.tipo === "todos" ? " is-active" : "")}>Todos los tipos</button>
              {tipos.filter((t) => filtros.segmento === "todos" || (tiposDeSegmento(filtros.segmento) as readonly string[]).includes(t)).map((t) => (
                <button key={t} type="button" aria-pressed={filtros.tipo === t} onClick={() => set("tipo", t)} className={"pg-pill" + (filtros.tipo === t ? " is-active" : "")}>{TIPO_LABELS[t]}</button>
              ))}
            </div>
            <label className="inv-select">
              <span>Zona</span>
              <select id="filtro-zona" value={filtros.zona} onChange={(e) => set("zona", e.target.value)}>
                <option value="todas">Todas las zonas</option>
                {zonas.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </label>
            <button type="button" className={"pg-pill" + (masFiltros ? " is-active" : "")} aria-expanded={masFiltros} aria-controls="inv-mas-filtros" onClick={() => setMasFiltros((v) => !v)}>
              <SlidersHorizontal size={16} aria-hidden="true" />Más filtros{activeFilters.filter((f) => ["moneda", "min", "max", "orden"].includes(f.key)).length > 0 ? ` · ${activeFilters.filter((f) => ["moneda", "min", "max", "orden"].includes(f.key)).length}` : ""}
            </button>
            <div className="inv-views" role="group" aria-label="Vista de resultados">
              <button type="button" aria-pressed={vista === "cuadricula"} onClick={() => setVista("cuadricula")}><LayoutGrid size={16} aria-hidden="true" />Cuadrícula</button>
              <button type="button" aria-pressed={vista === "mapa"} onClick={() => setVista("mapa")}><MapIcon size={16} aria-hidden="true" />Con mapa</button>
            </div>
          </div>

          <div id="inv-mas-filtros" className="inv-more" hidden={!masFiltros}>
            <div className="pg-field">
              <label htmlFor="filtro-moneda">Moneda</label>
              <select id="filtro-moneda" value={filtros.moneda} onChange={(e) => set("moneda", e.target.value as Moneda)}>
                <option value="todas">Todas</option>
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="pg-field">
              <label htmlFor="filtro-min">Precio desde {filtros.moneda === "todas" ? "" : `(${filtros.moneda})`}</label>
              <input id="filtro-min" type="number" inputMode="numeric" min={0} placeholder="0" value={filtros.min} onChange={(e) => set("min", e.target.value)} />
            </div>
            <div className="pg-field">
              <label htmlFor="filtro-max">Precio hasta {filtros.moneda === "todas" ? "" : `(${filtros.moneda})`}</label>
              <input id="filtro-max" type="number" inputMode="numeric" min={0} placeholder="Sin límite" value={filtros.max} onChange={(e) => set("max", e.target.value)} />
            </div>
            <div className="pg-field">
              <label htmlFor="filtro-orden">Ordenar por</label>
              <select id="filtro-orden" value={filtros.orden} onChange={(e) => set("orden", e.target.value as Orden)}>
                <option value="recientes">Más recientes</option>
                <option value="precio-asc">Menor precio</option>
                <option value="precio-desc">Mayor precio</option>
              </select>
            </div>
            {min !== null || max !== null ? <p className="inv-note">Al filtrar por precio, las propiedades con valor a consulta no se muestran.</p> : null}
          </div>

          <div className="inv-status">
            <p aria-live="polite" className="inv-count">
              {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"}
            </p>
            {activeFilters.length > 0 ? <div className="inv-active" aria-label="Filtros activos">
              {activeFilters.map((filter) => <button key={filter.key} type="button" onClick={() => clearFilter(filter.key)}>{filter.label}<X size={14} aria-hidden="true" /><span className="sr-only">Quitar filtro</span></button>)}
              {hayFiltros ? <button type="button" className="inv-clear" onClick={() => setFiltros(DEFAULTS)}>Limpiar filtros</button> : null}
            </div> : null}
          </div>
        </div>
      </section>

      <div className="pg-container inv-results">
        {comparadas.length > 0 ? (
          <div className="inv-compare-bar">
            <p>Selecciona hasta 3 propiedades para compararlas.</p>
            <button ref={comparisonButtonRef} type="button" onClick={showComparison} className="pg-btn" style={{ minHeight: 44 }}>
              Ver comparación ({comparadas.length})
            </button>
          </div>
        ) : null}

        {comparacionVisible && propiedadesComparadas.length > 0 ? (
          <section ref={comparisonRef} className="inv-compare" aria-labelledby="comparison-title">
            <div className="pg-head" style={{ marginBottom: 16 }}>
              <h2 id="comparison-title" className="pg-h3">Comparación de inmuebles</h2>
              <button type="button" onClick={() => { setComparacionVisible(false); window.requestAnimationFrame(() => comparisonButtonRef.current?.focus()); }} className="pg-pill">
                <X size={16} aria-hidden="true" /> Cerrar
              </button>
            </div>
            <div className="inv-table-wrap">
              <table className="inv-table" aria-label="Comparación de inmuebles">
                <thead><tr><th>Dato</th>{propiedadesComparadas.map((property) => <th key={property.slug}><Link href={`/inventario/${property.slug}`}>{property.titulo}</Link></th>)}</tr></thead>
                <tbody>
                  {[
                    ["Precio", (property: Property) => formatPrecio(property.precio)],
                    ["Terreno", (property: Property) => property.ficha.terrenoM2 != null ? `${property.ficha.terrenoM2} m²` : "No informado"],
                    ["Construcción", (property: Property) => property.ficha.construccionM2 != null ? `${property.ficha.construccionM2} m²` : "No informado"],
                    ["Recámaras", (property: Property) => property.ficha.recamaras?.toString() ?? "No informado"],
                    ["Estacionamientos", (property: Property) => property.ficha.estacionamientos?.toString() ?? "No informado"],
                    ["Ubicación", (property: Property) => property.zona],
                  ].map(([label, value]) => <tr key={label as string}><th scope="row">{label as string}</th>{propiedadesComparadas.map((property) => <td key={property.slug}>{(value as (property: Property) => string)(property)}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {resultados.length > 0 ? (
          <div className={"inv-layout" + (vista === "mapa" ? " has-map" : "")}>
            <div className="property-catalog-grid inv-grid">
              {resultados.map((p) => (
                <div key={p.slug} className="inv-item" onMouseEnter={() => vista === "mapa" && setMapaZona(p.zona)} onFocusCapture={() => vista === "mapa" && setMapaZona(p.zona)} onClickCapture={(event) => {
                  if ((event.target as HTMLElement).closest("a[href^='/inventario/']")) {
                    window.history.replaceState({ ...window.history.state, fortiusInventoryScroll: window.scrollY }, "", window.location.href);
                    try {
                      window.sessionStorage.setItem("fortius-inventory-return", JSON.stringify({ url: `${window.location.pathname}${window.location.search}`, scrollY: window.scrollY }));
                    } catch {
                      // El enlace de regreso conserva /inventario como alternativa.
                    }
                  }
                }}>
                  <PropertyCard property={p} extra={<label className="inv-compare-choice">
                    <input type="checkbox" checked={comparadas.includes(p.slug)} disabled={!comparadas.includes(p.slug) && comparadas.length >= 3} onChange={() => toggleComparada(p.slug)} />
                    <span>Comparar <span className="sr-only">{p.titulo}</span></span>
                  </label>} />
                </div>
              ))}
            </div>
            {vista === "mapa" ? (
              <aside className="inv-map" aria-label="Mapa de resultados">
                <div className="inv-map-frame">
                  <iframe key={mapQuery} src={`https://www.google.com/maps?q=${mapQuery}&z=13&output=embed`} title={`Mapa de ${mapaZonaActiva ?? "la zona"}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <p className="inv-map-note">Ubicación aproximada por zona. La dirección exacta se comparte al agendar la visita.</p>
                <div className="inv-map-zones" role="group" aria-label="Zonas con resultados">
                  {zonasResultado.map((zona) => <button key={zona} type="button" aria-pressed={mapaZonaActiva === zona} onClick={() => setMapaZona(zona)} className={"pg-pill" + (mapaZonaActiva === zona ? " is-active" : "")}>{zona}<span>{resultados.filter((p) => p.zona === zona).length}</span></button>)}
                </div>
              </aside>
            ) : null}
          </div>
        ) : (
          <div className="pg-empty">
            <h2>No hay propiedades con esos criterios.</h2>
            <p>El inventario cambia con frecuencia. Cuéntanos qué buscas y te avisamos cuando entre algo que encaje.</p>
            <div className="pg-pills" style={{ justifyContent: "center", marginTop: 24 }}>
              {hayFiltros ? <button type="button" onClick={() => setFiltros(DEFAULTS)} className="pg-btn pg-btn-ghost">Limpiar filtros</button> : null}
              <Link href="/contacto" className="pg-btn">Cuéntanos qué buscas</Link>
            </div>
          </div>
        )}

        {/* CTA persistente en mobile */}
        <div className="inv-mobile-cta">
          <Link href="/contacto" className="pg-btn">Cuéntanos qué buscas</Link>
        </div>
      </div>
    </>
  );
}
