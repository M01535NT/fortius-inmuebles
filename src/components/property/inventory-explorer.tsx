"use client";

import * as React from "react";
import Link from "next/link";

import { Boton } from "@/components/sitio/boton";
import { CampoLista, CampoTexto } from "@/components/sitio/campo";
import { Cruz } from "@/components/sitio/iconos";
import { Pastillas } from "@/components/sitio/pestanas";
import { SelectorFrase, type OpcionFrase } from "@/components/sitio/selector-frase";
import { TarjetaPropiedad } from "@/components/sitio/tarjeta-propiedad";
import { formatPrecio, type Property, type TipoPropiedad } from "@/data/propiedades";
import { SEGMENTOS_INMUEBLE, type SegmentoInmueble } from "@/lib/inmueble-segmentos";
import {
  FILTROS_INICIALES,
  filtrosDesdeParams,
  hayFiltros,
  paramsDesdeFiltros,
  POR_PARTE,
  vistaDesdeParams,
  type Filtros,
  type Moneda,
  type OpcionesInventario,
  type Orden,
  type ParteInventario,
  type Vista,
} from "@/lib/inventario-busqueda";

/*
  Inventario, rediseño del sitio (etapa 2, 17/11/2026). La frase es el filtro: «Quiero [comprar o rentar]
  [cualquier propiedad] en [cualquier zona] hasta [cualquier precio]». Debajo, «Más filtros» y una
  barra de resultados que se queda arriba con el conteo, el orden y la vista (cuadrícula, lista o mapa).
  El servidor entrega los inmuebles por partes; «Cargar más» pide la siguiente.
  Los filtros y la vista viven en la dirección con history.replaceState (sin useSearchParams, que
  obligaría a un límite de Suspense en toda la página).
*/

const RETURN_KEY = "fortius-inventory-return";
const COMPARISON_KEY = "fortius-inventory-comparison";

const OPERACIONES: OpcionFrase[] = [
  { valor: "todas", etiqueta: "comprar o rentar" },
  { valor: "venta", etiqueta: "comprar" },
  { valor: "renta", etiqueta: "rentar" },
];

const PLURALES: Record<TipoPropiedad, string> = {
  casa: "casas",
  departamento: "departamentos",
  oficina: "oficinas",
  local: "locales comerciales",
  "nave-industrial": "naves o bodegas",
  terreno: "terrenos",
  plaza: "plazas o conjuntos",
};

const TOPES = {
  venta: [2_000_000, 3_000_000, 5_000_000, 8_000_000, 12_000_000, 20_000_000],
  renta: [15_000, 25_000, 40_000, 80_000, 150_000],
} as const;

const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: "recientes", etiqueta: "Más recientes" },
  { valor: "precio-asc", etiqueta: "Menor precio" },
  { valor: "precio-desc", etiqueta: "Mayor precio" },
  { valor: "superficie", etiqueta: "Mayor superficie" },
];

const VISTAS: { valor: Vista; etiqueta: string }[] = [
  { valor: "cuadricula", etiqueta: "Cuadrícula" },
  { valor: "lista", etiqueta: "Lista" },
  { valor: "mapa", etiqueta: "Mapa" },
];

const pesos = (n: number, moneda: Moneda) => `${moneda === "USD" ? "US$" : "$"}${n.toLocaleString("en-US")}`;

function valorTipo(f: Filtros) {
  return f.tipo !== "todos" ? `tipo:${f.tipo}` : f.segmento !== "todos" ? `seg:${f.segmento}` : "todos";
}

type Props = {
  opciones: OpcionesInventario;
  filtrosIniciales: Filtros;
  vistaInicial: Vista;
  parteInicial: ParteInventario;
};

export function InventoryExplorer({ opciones, filtrosIniciales, vistaInicial, parteInicial }: Props) {
  const [filtros, setFiltros] = React.useState<Filtros>(filtrosIniciales);
  const [vista, setVista] = React.useState<Vista>(vistaInicial);
  const [items, setItems] = React.useState<Property[]>(parteInicial.propiedades);
  const [encontrados, setEncontrados] = React.useState(parteInicial.encontrados);
  const [zonasMapa, setZonasMapa] = React.useState(parteInicial.zonasConResultados);
  const [cargando, setCargando] = React.useState(false);
  const [falla, setFalla] = React.useState(false);
  const [masFiltros, setMasFiltros] = React.useState(false);
  const [comparadas, setComparadas] = React.useState<Property[]>([]);
  const [comparacionVisible, setComparacionVisible] = React.useState(false);
  const [mapaZona, setMapaZona] = React.useState<string | null>(null);
  const peticion = React.useRef<AbortController | null>(null);
  const montado = React.useRef(false);
  const comparisonRef = React.useRef<HTMLElement>(null);
  const comparisonButtonRef = React.useRef<HTMLButtonElement>(null);
  const masFiltrosId = React.useId();

  /** Pide una parte al servidor. `reemplazar` empieza la lista de nuevo (filtros nuevos). */
  const pedir = React.useCallback(async (f: Filtros, desde: number, cuantos: number, reemplazar: boolean) => {
    peticion.current?.abort();
    const control = new AbortController();
    peticion.current = control;
    setCargando(true);
    setFalla(false);
    try {
      const qs = paramsDesdeFiltros(f);
      const respuesta = await fetch(`/api/public/inventario?${qs}${qs ? "&" : ""}desde=${desde}&cuantos=${cuantos}`, { signal: control.signal });
      if (!respuesta.ok) throw new Error("inventario");
      const parte = (await respuesta.json()) as ParteInventario;
      setItems((actuales) => (reemplazar ? parte.propiedades : [...actuales, ...parte.propiedades.filter((p) => !actuales.some((a) => a.slug === p.slug))]));
      setEncontrados(parte.encontrados);
      setZonasMapa(parte.zonasConResultados);
      return parte.propiedades.length;
    } catch (error) {
      if ((error as Error).name !== "AbortError") setFalla(true);
      return 0;
    } finally {
      if (peticion.current === control) setCargando(false);
    }
  }, []);

  /* Al montar: si la dirección trae otra búsqueda (regreso con «atrás»), se adopta; si el visitante
     vuelve de una ficha, se recuperan los inmuebles que ya había cargado y su posición. */
  React.useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const deUrl = filtrosDesdeParams(search);
    const vistaUrl = vistaDesdeParams(search);
    let guardado: { url?: string; scrollY?: number; cargadas?: number } | null = null;
    try { guardado = JSON.parse(window.sessionStorage.getItem(RETURN_KEY) ?? "null"); } catch { guardado = null; }
    const mismaBusqueda = paramsDesdeFiltros(deUrl) === paramsDesdeFiltros(filtrosIniciales);
    const regreso = guardado?.url === `${window.location.pathname}${window.location.search}`;
    const cargadas = regreso && typeof guardado?.cargadas === "number" ? Math.min(guardado.cargadas, 60) : POR_PARTE;
    const scroll = regreso && typeof guardado?.scrollY === "number" ? guardado.scrollY : 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adopción única de la dirección tras hidratar
    if (vistaUrl !== vistaInicial) setVista(vistaUrl);
    const listo = () => { if (scroll > 0) window.requestAnimationFrame(() => window.scrollTo({ top: scroll })); };
    if (!mismaBusqueda) {
      setFiltros(deUrl);
      void pedir(deUrl, 0, cargadas, true).then(listo);
    } else if (cargadas > parteInicial.propiedades.length) {
      void pedir(filtrosIniciales, parteInicial.propiedades.length, cargadas - parteInicial.propiedades.length, false).then(listo);
    } else listo();
    // La comparación guardada en esta visita.
    try {
      const slugs = JSON.parse(window.sessionStorage.getItem(COMPARISON_KEY) ?? "[]");
      if (Array.isArray(slugs) && slugs.length) {
        const validos = slugs.filter((s): s is string => typeof s === "string").slice(0, 3);
        void fetch(`/api/public/inventario?slugs=${encodeURIComponent(validos.join(","))}`)
          .then((r) => (r.ok ? r.json() : { propiedades: [] }))
          .then((data: { propiedades: Property[] }) => setComparadas(validos.map((s) => data.propiedades.find((p) => p.slug === s)).filter((p): p is Property => Boolean(p))))
          .catch(() => undefined);
      }
    } catch {
      // El inventario funciona aunque el navegador bloquee el almacenamiento.
    }
    montado.current = true;
    return () => peticion.current?.abort();
    // Solo al montar: las props iniciales no cambian sin volver a montar (key en la página).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* La dirección refleja filtros y vista, sin recargar ni mover la página. */
  React.useEffect(() => {
    if (!montado.current) return;
    const qs = paramsDesdeFiltros(filtros, vista);
    window.history.replaceState(window.history.state, "", qs ? `?${qs}` : window.location.pathname);
  }, [filtros, vista]);

  React.useEffect(() => {
    if (!montado.current) return;
    try { window.sessionStorage.setItem(COMPARISON_KEY, JSON.stringify(comparadas.map((p) => p.slug))); } catch { /* sigue en la visita */ }
  }, [comparadas]);

  function cambiar(siguiente: Filtros) {
    setFiltros(siguiente);
    setMapaZona(null);
    void pedir(siguiente, 0, POR_PARTE, true);
  }

  function set<K extends keyof Filtros>(clave: K, valor: Filtros[K]) {
    const f = filtros;
    let siguiente: Filtros;
    if (clave === "moneda") {
      const moneda = valor as Moneda;
      siguiente = moneda === "todas" ? { ...f, moneda, min: "", max: "", orden: f.orden.startsWith("precio") ? "recientes" : f.orden } : { ...f, moneda };
    } else {
      const necesitaMoneda = (clave === "orden" && (valor === "precio-asc" || valor === "precio-desc")) || ((clave === "min" || clave === "max") && valor !== "");
      siguiente = { ...f, [clave]: valor, moneda: necesitaMoneda && f.moneda === "todas" ? "MXN" : f.moneda };
    }
    cambiar(siguiente);
  }

  function elegirTipo(valor: string) {
    const [clase, clave] = valor.split(":");
    cambiar(clase === "seg"
      ? { ...filtros, segmento: clave as SegmentoInmueble, tipo: "todos" }
      : clase === "tipo"
        ? { ...filtros, tipo: clave as TipoPropiedad, segmento: "todos" }
        : { ...filtros, tipo: "todos", segmento: "todos" });
  }

  function elegirOperacion(valor: string) {
    const operacion = valor === "venta" || valor === "renta" ? valor : "todas";
    // Los topes de precio de venta y de renta son muy distintos: al cambiar de operación se suelta el tope.
    cambiar({ ...filtros, operacion, max: operacion !== filtros.operacion ? "" : filtros.max });
  }

  const opcionesTipo: OpcionFrase[] = [
    { valor: "todos", etiqueta: "cualquier propiedad" },
    ...SEGMENTOS_INMUEBLE.map((s) => ({ valor: `seg:${s.key}`, etiqueta: s.detalle.toLowerCase() })),
    ...opciones.tipos.map((t) => ({ valor: `tipo:${t}`, etiqueta: PLURALES[t] })),
  ];
  const opcionesZona: OpcionFrase[] = [{ valor: "todas", etiqueta: "cualquier zona" }, ...opciones.zonas.map((z) => ({ valor: z, etiqueta: z }))];
  const monedaPrecio: Moneda = filtros.moneda === "USD" ? "USD" : "MXN";
  const topes = filtros.operacion === "renta" ? TOPES.renta : TOPES.venta;
  const opcionesPrecio: OpcionFrase[] = [
    { valor: "", etiqueta: "cualquier precio" },
    ...topes.map((n) => ({ valor: String(n), etiqueta: `${pesos(n, monedaPrecio)}${filtros.operacion === "renta" ? " al mes" : ""}` })),
  ];

  const extras = [filtros.moneda !== "todas", Boolean(filtros.min)].filter(Boolean).length;
  const conFiltros = hayFiltros(filtros);
  const restantes = Math.max(0, encontrados - items.length);
  const zonaMapa = mapaZona ?? (filtros.zona !== "todas" ? filtros.zona : zonasMapa[0]?.zona) ?? "Tijuana";
  const mapQuery = encodeURIComponent(`${zonaMapa}, Baja California, México`);

  function limpiar() {
    cambiar({ ...FILTROS_INICIALES, orden: filtros.orden });
  }

  function toggleComparada(p: Property) {
    setComparadas((actual) => actual.some((c) => c.slug === p.slug)
      ? actual.filter((c) => c.slug !== p.slug)
      : actual.length < 3 ? [...actual, p] : actual);
  }

  function recordarRegreso(event: React.MouseEvent<HTMLElement>) {
    if (!(event.target as HTMLElement).closest("a[href^='/inventario/']")) return;
    try {
      window.sessionStorage.setItem(RETURN_KEY, JSON.stringify({ url: `${window.location.pathname}${window.location.search}`, scrollY: window.scrollY, cargadas: items.length }));
    } catch {
      // El enlace de regreso conserva /inventario como alternativa.
    }
  }

  const tarjeta = (p: Property, posicion: number) => (
    <div key={p.slug} className="inv2-item" onMouseEnter={() => vista === "mapa" && setMapaZona(p.zona)} onFocusCapture={() => vista === "mapa" && setMapaZona(p.zona)}>
      <TarjetaPropiedad property={p} vista={vista === "mapa" ? "compacta" : vista} prioridad={posicion < 3} />
      {encontrados > 1 ? (
        <label className="inv2-comparar">
          <input type="checkbox" checked={comparadas.some((c) => c.slug === p.slug)} disabled={!comparadas.some((c) => c.slug === p.slug) && comparadas.length >= 3} onChange={() => toggleComparada(p)} />
          <span>Comparar <span className="sr-only">{p.titulo}</span></span>
        </label>
      ) : null}
    </div>
  );

  return (
    <div className="s-contenedor inv2-raiz">
      <h1 className="inv2-frase">
        <span className="inv2-renglon">
          <span className="inv2-gris">Quiero</span>
          <SelectorFrase etiqueta="Operación" opciones={OPERACIONES} valor={filtros.operacion} onCambio={elegirOperacion} />
          <SelectorFrase etiqueta="Tipo de propiedad" opciones={opcionesTipo} valor={valorTipo(filtros)} onCambio={elegirTipo} />
        </span>
        <span className="inv2-renglon">
          <span className="inv2-gris">en</span>
          <SelectorFrase etiqueta="Zona" opciones={opcionesZona} valor={filtros.zona} onCambio={(z) => set("zona", z)} />
          <span className="inv2-gris">hasta</span>
          <SelectorFrase etiqueta="Precio máximo" opciones={opcionesPrecio} valor={filtros.max}
            textoLibre={filtros.max ? pesos(Number(filtros.max), monedaPrecio) : undefined} onCambio={(m) => set("max", m)} />
        </span>
      </h1>

      <div className="inv2-acciones">
        <Boton variante="contorno" tamano="chico" aria-expanded={masFiltros} aria-controls={masFiltrosId} onClick={() => setMasFiltros((v) => !v)}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
          Más filtros{extras ? ` · ${extras}` : ""}
        </Boton>
        {conFiltros ? <button type="button" className="inv2-limpiar" onClick={limpiar}>Limpiar filtros</button> : null}
      </div>

      <div id={masFiltrosId} className="inv2-mas" hidden={!masFiltros}>
        <CampoLista etiqueta="Moneda" value={filtros.moneda} onChange={(e) => set("moneda", e.target.value as Moneda)}
          opciones={[{ valor: "todas", etiqueta: "Cualquiera" }, { valor: "MXN", etiqueta: "Pesos (MXN)" }, { valor: "USD", etiqueta: "Dólares (USD)" }]} />
        <CampoTexto etiqueta={`Precio desde${filtros.moneda === "todas" ? "" : ` (${filtros.moneda})`}`} type="number" inputMode="numeric" min={0} placeholder="0"
          value={filtros.min} onChange={(e) => set("min", e.target.value.replace(/\D/g, ""))} />
        <CampoTexto etiqueta={`Precio hasta${filtros.moneda === "todas" ? "" : ` (${filtros.moneda})`}`} type="number" inputMode="numeric" min={0} placeholder="Sin límite"
          value={filtros.max} onChange={(e) => set("max", e.target.value.replace(/\D/g, ""))} />
        {filtros.min || filtros.max ? <p className="inv2-nota">Al filtrar por precio no aparecen las propiedades con valor a consulta.</p> : null}
      </div>

      <div className="inv2-barra">
        <p className="inv2-cuenta" aria-live="polite">
          {cargando && !items.length ? "Buscando…" : `${encontrados} ${encontrados === 1 ? "propiedad" : "propiedades"}${encontrados !== opciones.total ? ` de ${opciones.total}` : ""}`}
        </p>
        <div className="inv2-controles">
          <label className="inv2-orden">
            <span>Ordenar</span>
            <select value={filtros.orden} onChange={(e) => set("orden", e.target.value as Orden)} className="s-campo-control">
              {ORDENES.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
            </select>
          </label>
          <Pastillas etiqueta="Vista" opciones={VISTAS} valor={vista} onCambio={setVista} />
        </div>
      </div>

      {comparadas.length > 0 ? (
        <div className="inv2-comparar-barra">
          <p>{comparadas.length === 1 ? "Elige otra propiedad para comparar (hasta 3)." : `${comparadas.length} propiedades elegidas para comparar.`}</p>
          {comparadas.length > 1 ? <button ref={comparisonButtonRef} type="button" className="s-btn s-btn-relleno s-btn-chico" onClick={() => { setComparacionVisible(true); window.requestAnimationFrame(() => comparisonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }}>
            Ver comparación
          </button> : null}
          <button type="button" className="inv2-limpiar" onClick={() => { setComparadas([]); setComparacionVisible(false); }}>Quitar todas</button>
        </div>
      ) : null}

      {comparacionVisible && comparadas.length > 1 ? (
        <section ref={comparisonRef} className="inv2-comparacion" aria-labelledby="inv2-comparacion-titulo">
          <div className="inv2-comparacion-cabeza">
            <h2 id="inv2-comparacion-titulo" className="s-h2-bloque">Comparación</h2>
            <Boton variante="contorno" tamano="chico" onClick={() => { setComparacionVisible(false); window.requestAnimationFrame(() => comparisonButtonRef.current?.focus()); }}>
              Cerrar <Cruz size={16} />
            </Boton>
          </div>
          <div className="inv2-tabla-marco">
            <table className="inv2-tabla">
              <thead><tr><th scope="col"><span className="sr-only">Dato</span></th>{comparadas.map((p) => <th key={p.slug} scope="col"><Link href={`/inventario/${p.slug}`}>{p.titulo}</Link></th>)}</tr></thead>
              <tbody>
                {([
                  ["Precio", (p: Property) => formatPrecio(p.precio)],
                  ["Terreno", (p: Property) => (p.ficha.terrenoM2 != null ? `${p.ficha.terrenoM2} m²` : "No informado")],
                  ["Construcción", (p: Property) => (p.ficha.construccionM2 != null ? `${p.ficha.construccionM2} m²` : "No informado")],
                  ["Recámaras", (p: Property) => p.ficha.recamaras?.toString() ?? "No informado"],
                  ["Estacionamientos", (p: Property) => p.ficha.estacionamientos?.toString() ?? "No informado"],
                  ["Ubicación", (p: Property) => p.zona],
                ] as const).map(([dato, valor]) => (
                  <tr key={dato}><th scope="row">{dato}</th>{comparadas.map((p) => <td key={p.slug}>{valor(p)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {falla ? (
        <div className="inv2-vacio" role="alert">
          <p className="inv2-vacio-titulo">No pudimos traer las propiedades.</p>
          <Boton onClick={() => void pedir(filtros, 0, Math.max(POR_PARTE, items.length), true)}>Intentar de nuevo</Boton>
        </div>
      ) : encontrados === 0 && !cargando ? (
        <div className="inv2-vacio">
          <p className="inv2-vacio-titulo">No hay propiedades con esos criterios.</p>
          <p className="s-apoyo">Dinos qué buscas y te avisamos si encontramos algo.</p>
          <div className="inv2-vacio-acciones">
            {conFiltros ? <Boton tamano="grande" onClick={limpiar}>Limpiar filtros</Boton> : null}
            <Boton href="/contacto" variante="contorno" tamano="grande">Cuéntanos qué buscas</Boton>
          </div>
        </div>
      ) : (
        <section aria-labelledby="inv2-resultados" aria-busy={cargando} onClickCapture={recordarRegreso}>
          <h2 id="inv2-resultados" className="sr-only">Resultados</h2>
          {vista === "mapa" ? (
            <div className="inv2-con-mapa">
              <div className="inv2-compactas">{items.map(tarjeta)}</div>
              <aside className="inv2-mapa" aria-label="Mapa de resultados">
                <div className="inv2-mapa-marco">
                  <iframe key={mapQuery} src={`https://www.google.com/maps?q=${mapQuery}&z=13&output=embed`} title={`Mapa de ${zonaMapa}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <p className="inv2-nota">Zona aproximada. La dirección se da al agendar la visita.</p>
                <label className="inv2-orden">
                  <span>Ver en el mapa</span>
                  <select value={zonaMapa} onChange={(e) => setMapaZona(e.target.value)} className="s-campo-control">
                    {zonasMapa.map((z) => <option key={z.zona} value={z.zona}>{z.zona} ({z.cuantos})</option>)}
                  </select>
                </label>
              </aside>
            </div>
          ) : (
            <div className={vista === "lista" ? "inv2-lista" : "inv2-cuadricula"}>{items.map(tarjeta)}</div>
          )}

          <div className="inv2-mas-resultados">
            <p className="s-apoyo" aria-live="polite">Ves {items.length} de {encontrados}.</p>
            {restantes > 0 ? (
              <Boton variante="contorno" tamano="grande" disabled={cargando} aria-disabled={cargando}
                onClick={() => void pedir(filtros, items.length, POR_PARTE, false)}>
                {cargando ? "Cargando…" : `Cargar ${Math.min(POR_PARTE, restantes)} más`}
              </Boton>
            ) : null}
          </div>

          <div className="inv2-invitacion">
            <p>¿No ves lo que buscas?</p>
            <Boton href="/contacto" variante="contorno">Cuéntanos qué buscas</Boton>
          </div>
        </section>
      )}
    </div>
  );
}
