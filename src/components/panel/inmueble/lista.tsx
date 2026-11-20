"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { useCatalogos } from "@/components/panel/datos/catalogos";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import {
  leerInmuebles, NOMBRE_OPERACION, nuevoInmueble, OPERACIONES, precioTexto, publicarVarios,
  type FilaInmueble, type Operacion, type TipoInmueble,
} from "@/lib/panel/inmuebles/api";

import "../asunto/asunto.css";
import "../asunto/caso.css";
import { Pildora } from "../asunto/pildora";
import { FichaInmueble } from "./ficha";
import "./inmueble.css";

type Filtro = "" | "pub" | "no" | "venta" | "renta";
const FILTROS: { valor: Exclude<Filtro, "">; etiqueta: string }[] = [
  { valor: "pub", etiqueta: "Publicados" }, { valor: "no", etiqueta: "Sin publicar" }, { valor: "venta", etiqueta: "En venta" }, { valor: "renta", etiqueta: "En renta" },
];
const pasa = (i: FilaInmueble, f: Filtro) => f === "" || (f === "pub" ? i.publicado : f === "no" ? !i.publicado : i.operacion === f);

/** ↑ y ↓ pasan de un inmueble a otro (como la lista de Asuntos); Enter lo abre. */
function moverConFlechas(e: React.KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
  const filas = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-renglon]"));
  if (!filas.length) return;
  e.preventDefault();
  const i = filas.indexOf(document.activeElement as HTMLElement);
  const j = e.key === "Home" ? 0 : e.key === "End" ? filas.length - 1 : Math.min(filas.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
  filas[j]?.focus();
  filas[j]?.scrollIntoView({ block: "nearest" });
}

/**
 * Inmuebles como el modelo visual («Inmuebles»): la lista en su columna (barra de 52 px, renglones con su portada, el
 * abierto en azul sólido) y la ficha a la derecha. En el teléfono, una a la vez. Varios se eligen con ⇧ (o Ctrl) y clic,
 * o con «Elegir varios», para publicarlos, retirarlos o compartirlos de una vez.
 */
export function ListaInmuebles() {
  const { avisar } = useAvisos();
  const cat = useCatalogos();
  const router = useRouter();
  const params = useSearchParams();
  const abierto = params.get("id");
  const [todos, setTodos] = useState<FilaInmueble[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("");
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  const [eligiendo, setEligiendo] = useState(false);
  // Desde el buscador, «Inmueble nuevo» llega con ?nuevo=1 y abre el alta.
  const [nuevo, setNuevo] = useState(() => params.get("nuevo") === "1");

  const cargar = useCallback(() => leerInmuebles().then((x) => { setTodos(x); setError(null); }, (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar.")), []);
  useEffect(() => { leerInmuebles().then((x) => { setTodos(x); setError(null); }, (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar.")); }, []);

  const abrir = (id: string | null) => router.replace(id ? `/panel/inmuebles?id=${id}` : "/panel/inmuebles", { scroll: false });
  const ver = useMemo(() => (todos ?? []).filter((i) => pasa(i, filtro)), [todos, filtro]);
  const sel = (todos ?? []).filter((i) => elegidos.has(i.id));
  const actual = todos?.find((i) => i.id === abierto) ?? null;
  const alternar = (id: string) => setElegidos((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const terminarSeleccion = () => { setElegidos(new Set()); setEligiendo(false); };

  const lote = async (publicar: boolean) => {
    try {
      const n = await publicarVarios(sel.map((i) => i.id), publicar);
      avisar(publicar ? `${n} publicado${n > 1 ? "s" : ""}` : `${n} retirado${n > 1 ? "s" : ""} del sitio`);
      terminarSeleccion();
      void cargar();
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
  };
  const compartir = () => {
    const t = sel.map((i) => `${i.nombre}${i.colonia ? ` · ${i.colonia}` : ""} · ${precioTexto(i.precio, i.moneda, i.operacion)}`).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, "_blank", "noopener");
  };
  const opcionesFiltro = [
    { valor: "" as Filtro, etiqueta: `Todos${todos ? ` · ${todos.length}` : ""}` },
    ...FILTROS.map((f) => ({ valor: f.valor as Filtro, etiqueta: `${f.etiqueta}${todos ? ` · ${todos.filter((i) => pasa(i, f.valor)).length}` : ""}` })),
  ];
  const seleccionando = eligiendo || elegidos.size > 0;

  return (
    <div className="as-dos in-dos" data-det={Boolean(abierto)}>
      <section className="as-lista" aria-label="Lista de inmuebles">
        <div className="as-lado">
          <div className="as-fila as-cab">
            <h1 className="as-h1-lista">Inmuebles</h1>
            {todos ? <span className="as-cab-n" aria-label={`${ver.length} inmuebles`}>{ver.length}</span> : null}
            <span className="as-sp" />
            <button type="button" className="as-btn as-gho as-ico in-cab-btn" aria-pressed={seleccionando} title={seleccionando ? "Terminar de elegir" : "Elegir varios"}
              aria-label={seleccionando ? "Terminar de elegir" : "Elegir varios"} onClick={() => (seleccionando ? terminarSeleccion() : setEligiendo(true))}>
              <Icono nombre={seleccionando ? "x" : "ok"} tamano={16} />
            </button>
            <button type="button" className="as-btn as-gho as-ico as-cab-mas" aria-label="Nuevo inmueble" title="Nuevo inmueble" onClick={() => setNuevo(true)}>
              <Icono nombre="mas" tamano={16} />
            </button>
          </div>
          <div className="as-fila as-filtros">
            <Pildora etiqueta="Qué ver" valor={filtro} opciones={opcionesFiltro} alElegir={setFiltro} />
          </div>

          {seleccionando ? (
            <div className="in-ban" role="status">
              <span>{sel.length ? `${sel.length} elegido${sel.length > 1 ? "s" : ""}` : "Toca los que quieras"}</span>
              <span className="as-sp" />
              <DropdownMenu>
                <DropdownMenuTrigger className="as-btn as-pri" aria-disabled={!sel.length || undefined}>Hacer con ellos<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={!sel.length} onSelect={() => void lote(true)}><Icono nombre="globo" tamano={16} />Publicar</DropdownMenuItem>
                  <DropdownMenuItem disabled={!sel.length} onSelect={() => void lote(false)}><Icono nombre="x" tamano={16} />Retirar del sitio</DropdownMenuItem>
                  <DropdownMenuItem disabled={!sel.length} onSelect={compartir}><Icono nombre="chat" tamano={16} />Compartir por WhatsApp</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}

          {error && !todos ? (
            <div className="as-vacio-lista" role="alert">
              <p>{error}</p>
              <button type="button" className="as-btn" onClick={() => void cargar()}>Reintentar</button>
            </div>
          ) : !todos ? (
            <div className="as-cargando" aria-busy="true" aria-label="Cargando inmuebles">{[0, 1, 2, 3].map((k) => <span key={k} />)}</div>
          ) : !todos.length ? (
            <div className="as-vacio-lista">
              <Icono nombre="edif" tamano={26} />
              <b>Todavía no hay inmuebles</b>
              <p>Nacen de una consulta o con «Nuevo», cada uno con su asunto.</p>
              <button type="button" className="as-btn as-pri" onClick={() => setNuevo(true)}><Icono nombre="mas" tamano={16} />Nuevo inmueble</button>
            </div>
          ) : !ver.length ? (
            <p className="as-m as-nada">Ningún inmueble coincide.</p>
          ) : (
            <nav aria-label="Inmuebles" className="as-items" onKeyDown={moverConFlechas}>
              {ver.map((i) => {
                const elegido = elegidos.has(i.id);
                const medios = [i.fotos ? `${i.fotos} foto${i.fotos > 1 ? "s" : ""}` : "", i.video ? "video" : "", i.recorrido ? "recorrido 360" : ""].filter(Boolean).join(", ");
                const linea = [i.tipo ? cat.etiqueta("tipo_inmueble", i.tipo) : null, precioTexto(i.precio, i.moneda, i.operacion), i.publicado ? "Publicado" : null].filter(Boolean).join(" · ");
                const globo = [i.colonia, medios || "Sin fotos", i.publicado ? null : "Sin publicar", i.es_ejemplo ? "Ejemplo" : null].filter(Boolean).join(" · ");
                return (
                  <Link key={i.id} href={`/panel/inmuebles?id=${i.id}`} replace scroll={false} className="as-it in-it" data-renglon=""
                    aria-current={i.id === abierto ? "page" : undefined} data-elegido={elegido || undefined} title={globo}
                    onClick={(e) => {
                      if (seleccionando || e.shiftKey || e.metaKey || e.ctrlKey) { e.preventDefault(); alternar(i.id); }
                    }}>
                    {seleccionando ? (
                      <span className="as-ck as-ck-cu in-ck" aria-hidden data-si={elegido || undefined}>{elegido ? <Icono nombre="ok" tamano={12} /> : null}</span>
                    ) : null}
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada al subir */}
                    {i.portada ? <img className="in-fo" src={i.portada} alt="" loading="lazy" /> : <span className="in-fo" aria-hidden><Icono nombre="edif" tamano={15} /></span>}
                    <span className="as-it-c">
                      <b>{i.nombre}</b>
                      <small>{linea}</small>
                      <span className="sr-only">{globo}{seleccionando ? (elegido ? ". Elegido" : ". Sin elegir") : ""}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}
          <div className="as-pie-teclas" aria-hidden><kbd>⇧</kbd> clic elige varios · publicar o retirar de una vez</div>
        </div>
      </section>
      <section className="as-det" aria-label={actual ? `Ficha de ${actual.nombre}` : "Inmueble"}>
        {abierto ? (
          <FichaInmueble key={abierto} id={abierto} enColumna alCambiar={() => void cargar()} alVolver={() => abrir(null)} />
        ) : (
          <div className="as-in as-elige">
            <Icono nombre="edif" tamano={28} />
            <p className="as-m">Elige un inmueble de la lista.</p>
          </div>
        )}
      </section>
      <DialogoNuevo abierto={nuevo} alCerrar={() => { setNuevo(false); if (params.get("nuevo")) router.replace("/panel/inmuebles", { scroll: false }); }} alCrear={async (d) => {
        try {
          const x = await nuevoInmueble(d);
          avisar(`Inmueble ${x.folio} creado con su asunto de captación`);
          await cargar();
          abrir(x.id);
        } catch (e) { avisar(e instanceof Error ? e.message : "No se creó."); }
      }} />
    </div>
  );
}

function DialogoNuevo({ abierto, alCerrar, alCrear }: { abierto: boolean; alCerrar: () => void; alCrear: (d: { nombre: string; tipo?: TipoInmueble; operacion?: Operacion; propietario?: string }) => void }) {
  return (
    <Dialog open={abierto} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>Nuevo inmueble</DialogTitle>
        <DialogDescription>Nace con su asunto de captación. Fotos, datos y documentos van después.</DialogDescription>
        {abierto ? <FormaNuevo alCerrar={alCerrar} alCrear={alCrear} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function FormaNuevo({ alCerrar, alCrear }: { alCerrar: () => void; alCrear: (d: { nombre: string; tipo?: TipoInmueble; operacion?: Operacion; propietario?: string }) => void }) {
  const id = useId();
  const [nombre, setNombre] = useState("");
  const cat = useCatalogos();
  const [tipo, setTipo] = useState<TipoInmueble | "">("");
  const [operacion, setOperacion] = useState<Operacion | "">("");
  const [dueno, setDueno] = useState("");
  const listo = nombre.trim().length > 0;
  return (
    <form className="as-form" onSubmit={(e) => {
      e.preventDefault();
      if (!listo) return;
      alCerrar();
      alCrear({ nombre: nombre.trim(), tipo: tipo || undefined, operacion: operacion || undefined, propietario: dueno.trim() || undefined });
    }}>
      <label className="pn-campo" htmlFor={`${id}-n`}>Nombre
        <input id={`${id}-n`} className="as-inp as-inp-borde" maxLength={160} placeholder="Casa en Playas, Nave en El Florido…" value={nombre} autoFocus onChange={(e) => setNombre(e.target.value)} />
      </label>
      <Desplegable etiqueta="Tipo" valor={tipo} vacio="Elegir" opciones={cat.opciones("tipo_inmueble")} alElegir={setTipo} />
      <Desplegable etiqueta="Operación" valor={operacion} vacio="Elegir" opciones={OPERACIONES.map((o) => ({ valor: o, etiqueta: NOMBRE_OPERACION[o] }))} alElegir={setOperacion} />
      <label className="pn-campo" htmlFor={`${id}-d`}>Propietario (opcional)
        <input id={`${id}-d`} className="as-inp as-inp-borde" maxLength={160} placeholder="Nombre del dueño" value={dueno} onChange={(e) => setDueno(e.target.value)} />
      </label>
      <div className="as-fila as-fin">
        <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
        <button type="submit" className="as-btn as-pri" aria-disabled={!listo}>Crear</button>
      </div>
    </form>
  );
}
