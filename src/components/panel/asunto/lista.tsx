"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { usePreferencia } from "@/components/panel/almacen";
import { useCatalogos } from "@/components/panel/datos/catalogos";
import { useMisPreferencias, type VistaGuardada } from "@/components/panel/datos/use-mis-preferencias";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { BotonEnlace } from "@/components/panel/kit/boton";
import { BotonesDeVista } from "@/components/panel/kit/segmentado";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  cargarEjemplos, diasHasta, EN_QUE_VA, fechaCorta, type EnQueVa,
} from "@/lib/panel/asuntos/api";
import { useSession } from "@/lib/panel/legado/sesion";

import { useAsuntosFiltrados, useFiltrosAsuntos, VISTA_ASUNTOS, VISTAS_ASUNTOS, vistaDe, type VistaAsuntos } from "./filtros";
import { Pildora } from "./pildora";
import { useAsuntos } from "./proveedor";
import { DialogoTexto } from "./ventana";

/** ↑ y ↓ pasan de un asunto a otro; Enter lo abre (es un enlace); Inicio y Fin van al primero y al último. */
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
 * Vistas guardadas (SPEC.md, sección 15): la búsqueda y los filtros de Asuntos con un nombre, para volver a ellos con un
 * toque. Sirve en la lista, el tablero y la vista en el tiempo.
 */
export function MenuVistasGuardadas({ compacto = false }: { compacto?: boolean }) {
  const { avisar } = useAvisos();
  const prefs = useMisPreferencias();
  const { q, setQ, que, setQue, lleva, setLleva } = useFiltrosAsuntos();
  const [nombrando, setNombrando] = useState(false);
  const vistas = (prefs.panel.vistas ?? []).filter((v) => v.lista === "asuntos");
  const filtros: Record<string, string> = Object.fromEntries(Object.entries({ q: q.trim(), que, lleva }).filter(([, v]) => v));
  const conFiltro = Object.keys(filtros).length > 0;
  const aplicada = vistas.find((v) => JSON.stringify(v.filtros) === JSON.stringify(filtros));
  const usarVista = (v: VistaGuardada) => {
    setQ(v.filtros.q ?? "");
    const w = v.filtros.que ?? "";
    setQue(w === "favoritos" || (EN_QUE_VA as readonly string[]).includes(w) ? (w as EnQueVa | "favoritos") : "");
    setLleva(v.filtros.lleva ?? "");
  };
  const guardarVistas = (lista: VistaGuardada[], aviso: string) => {
    const otras = (prefs.panel.vistas ?? []).filter((v) => v.lista !== "asuntos");
    prefs.cambiar({ vistas: [...otras, ...lista].slice(0, 24) }).then(() => avisar(aviso), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo guardar."));
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="as-pil as-vistas" aria-label={aplicada ? `Vista: ${aplicada.nombre}` : "Vistas guardadas"} title="Vistas guardadas">
          <Icono nombre="lista" tamano={14} />{aplicada || !compacto ? <span className="as-pil-t">{aplicada ? aplicada.nombre : "Vistas"}</span> : null}<Icono nombre="down" tamano={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-60">
          {vistas.length ? <DropdownMenuLabel>Mis vistas</DropdownMenuLabel> : null}
          {!vistas.length && !conFiltro ? <DropdownMenuLabel>Filtra la lista y guárdala aquí</DropdownMenuLabel> : null}
          {vistas.map((v) => (
            <DropdownMenuItem key={v.nombre} onSelect={() => usarVista(v)}>
              <Icono nombre={v === aplicada ? "ok" : "lista"} tamano={16} />{v.nombre}
            </DropdownMenuItem>
          ))}
          {vistas.length ? <DropdownMenuSeparator /> : null}
          {conFiltro && !aplicada ? <DropdownMenuItem onSelect={() => setNombrando(true)}><Icono nombre="mas" tamano={16} />Guardar esta vista</DropdownMenuItem> : null}
          {conFiltro ? <DropdownMenuItem onSelect={() => { setQ(""); setQue(""); setLleva(""); }}><Icono nombre="x" tamano={16} />Quitar los filtros</DropdownMenuItem> : null}
          {aplicada ? (
            <DropdownMenuItem peligro onSelect={() => guardarVistas(vistas.filter((v) => v !== aplicada), `Se quitó la vista «${aplicada.nombre}»`)}>
              <Icono nombre="bote" tamano={16} />Borrar la vista «{aplicada.nombre}»
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogoTexto abierto={nombrando} titulo="Guardar esta vista" etiqueta="Nombre de la vista" maximo={60}
        ayuda="Queda en el botón «Vistas» de Asuntos, en cualquier equipo donde entres."
        alCerrar={() => setNombrando(false)}
        alGuardar={(nombre) => guardarVistas([...vistas.filter((v) => v.nombre !== nombre), { lista: "asuntos", nombre, filtros }], `Vista guardada: ${nombre}`)} />
    </>
  );
}

/**
 * La fila de botones «Lista · Tablero · Tiempo» (modelo visual). Con un asunto abierto se ve la lista; elegir Tablero o
 * Tiempo vuelve a Asuntos con esa vista.
 */
export function SelectorVista() {
  const ruta = usePathname();
  const router = useRouter();
  const [guardada, ponerVista] = usePreferencia(VISTA_ASUNTOS, "lista");
  const conAsunto = ruta.startsWith("/admin/asuntos/");
  const valor: VistaAsuntos = conAsunto ? "lista" : vistaDe(guardada);
  return (
    <BotonesDeVista etiqueta="Ver los asuntos como" valor={valor} opciones={VISTAS_ASUNTOS}
      alElegir={(v) => { ponerVista(v === "lista" ? null : v); if (conAsunto && v !== "lista") router.push("/admin/asuntos"); }} />
  );
}

/** La columna de Asuntos (modelo visual): barra con las vistas, buscar, filtros y cada asunto con lo que sigue. */
export function ListaAsuntos() {
  const { asuntos, error, recargar, nombreDe } = useAsuntos();
  const director = useSession()?.role === "admin";
  const ruta = usePathname();
  const { avisar } = useAvisos();
  const { q, setQ, que, setQue, lleva, setLleva } = useFiltrosAsuntos();
  const { base, lista, opcionesQue, opcionesLleva } = useAsuntosFiltrados();
  const [cargando, setCargando] = useState(false);
  const cat = useCatalogos();

  async function ejemplos() {
    setCargando(true);
    try {
      const r = await cargarEjemplos();
      await recargar();
      avisar(r.creados ? `Se cargaron ${r.creados} asuntos de ejemplo` : "Los casos de ejemplo ya estaban");
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
    finally { setCargando(false); }
  }

  return (
    <div className="as-lado">
      <div className="as-fila as-cab">
        <h1 className="as-h1-lista">Asuntos</h1>
        {asuntos ? <span className="as-cab-n" aria-label={`${lista.length} asuntos`}>{lista.length}</span> : null}
        <span className="as-sp" />
        <SelectorVista />
        <BotonEnlace href="/admin/consulta" variante="fantasma" icono="mas" soloIcono aria-label="Nueva consulta" title="Nueva consulta" className="as-cab-mas" />
      </div>
      <label className="as-buscar">
        <Icono nombre="bus" tamano={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar asuntos" type="search" />
      </label>
      <div className="as-fila as-filtros">
        <Pildora etiqueta="Qué ver" valor={que} opciones={opcionesQue} alElegir={setQue} />
        {director && opcionesLleva.length > 2 ? <Pildora etiqueta="Quién lo lleva" valor={lleva} opciones={opcionesLleva} alElegir={setLleva} /> : null}
        <span className="as-sp" />
        <MenuVistasGuardadas compacto />
      </div>

      {error && !asuntos ? (
        <div className="as-vacio-lista" role="alert">
          <p>{error}</p>
          <button type="button" className="as-btn" onClick={() => void recargar()}>Reintentar</button>
        </div>
      ) : !asuntos ? (
        <div className="as-cargando" aria-busy="true" aria-label="Cargando asuntos">{[0, 1, 2, 3].map((i) => <span key={i} />)}</div>
      ) : !base.length ? (
        <div className="as-vacio-lista">
          <Icono nombre="asu" tamano={26} />
          <b>Todavía no hay asuntos</b>
          <p>Nacen de una consulta.</p>
          {director ? (
            <button type="button" className="as-btn" onClick={() => void ejemplos()} aria-disabled={cargando}>
              <Icono nombre="copia" tamano={16} />{cargando ? "Cargando…" : "Cargar los casos de ejemplo"}
            </button>
          ) : null}
        </div>
      ) : !lista.length ? (
        <p className="as-m as-nada">Ningún asunto coincide.</p>
      ) : (
        <nav aria-label="Asuntos" className="as-items" onKeyDown={moverConFlechas}>
          {lista.map((a) => {
            // Fallo 4: cerrado, el renglón dice cómo se cerró, no lo que seguía.
            const s = a.en_que_va === "cerrado" ? null : a.siguiente;
            const n = s?.fecha ? diasHasta(s.fecha) : null;
            const actual = ruta === `/admin/asuntos/${a.id}`;
            // Hallazgo 40: en el renglón solo van «en qué va» y la fecha. Quién lo lleva y si es de ejemplo quedan en el
            // globo y para el lector de pantalla.
            const extra = [director ? `Lo lleva ${nombreDe(a.responsable_id)}` : null, a.es_ejemplo ? "Ejemplo" : null].filter(Boolean).join(" · ");
            // Modelo visual: el nombre y una línea con lo que sigue y su fecha. En qué va, quién lo lleva y si es de
            // ejemplo van en el globo y para el lector de pantalla.
            const queSigue = s ? s.titulo : a.en_que_va === "cerrado" ? `Cerrado: ${cat.etiqueta("resultado_cierre", a.resultado ?? "se_logro").toLowerCase()}` : "Sin siguiente paso";
            const globo = [cat.etiqueta("en_que_va", a.en_que_va), extra].filter(Boolean).join(" · ");
            return (
              <Link key={a.id} href={`/admin/asuntos/${a.id}`} className="as-it" data-renglon="" aria-current={actual ? "page" : undefined} title={globo}>
                <span className="as-it-c">
                  <b>{a.nombre}</b>
                  <small data-falta={!s && a.en_que_va !== "cerrado" ? "" : undefined}>
                    {a.en_espera ? "En espera · " : null}{queSigue}
                    {s?.fecha && !a.en_espera ? <> · <span data-tono={n! < 0 ? "tarde" : n === 0 ? "hoy" : undefined}>{fechaCorta(s.fecha)}</span></> : null}
                  </small>
                  <span className="sr-only">{globo}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      )}
      <div className="as-pie-teclas" aria-hidden><kbd>↑</kbd><kbd>↓</kbd> recorrer · <kbd>↩</kbd> abrir</div>
    </div>
  );
}
