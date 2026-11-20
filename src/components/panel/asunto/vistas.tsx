"use client";
import Link from "next/link";
import { useState, type DragEvent } from "react";

import { useCatalogos } from "@/components/panel/datos/catalogos";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { BotonEnlace } from "@/components/panel/kit/boton";
import { cambiarAsunto, diasHasta, fechaCorta, leerAsunto, sumarDias, type EnQueVa, type FilaAsunto } from "@/lib/panel/asuntos/api";
import { useSession } from "@/lib/panel/legado/sesion";

import { useAsuntosFiltrados, useFiltrosAsuntos, type VistaAsuntos } from "./filtros";
import { MenuVistasGuardadas, SelectorVista } from "./lista";
import { Pildora } from "./pildora";
import { useAsuntos } from "./proveedor";

const tono = (fecha: string | null) => {
  if (!fecha) return undefined;
  const n = diasHasta(fecha);
  return n < 0 ? "tarde" : n === 0 ? "hoy" : undefined;
};

/**
 * Asuntos a todo lo ancho (modelo visual, Tablero.dc.html): la barra de 52 px con las vistas, el equipo, los filtros y
 * «Nueva consulta»; abajo el tablero o el tiempo, y al pie lo que se puede hacer con el teclado y el ratón.
 */
export function VistaAmplia({ vista }: { vista: Exclude<VistaAsuntos, "lista"> }) {
  const { asuntos, error, recargar } = useAsuntos();
  const director = useSession()?.role === "admin";
  const { q, setQ, que, setQue, lleva, setLleva } = useFiltrosAsuntos();
  const { lista, opcionesQue, opcionesLleva } = useAsuntosFiltrados();
  const abiertos = lista.filter((a) => a.en_que_va !== "cerrado").length;
  return (
    <div className="as-amplia">
      <div className="as-vbar">
        <h1 className="as-h1-lista">Asuntos</h1>
        {asuntos ? <span className="as-cab-n">{abiertos === 1 ? "1 abierto" : `${abiertos} abiertos`}</span> : null}
        <span className="as-sp" />
        <SelectorVista />
        <label className="as-buscar as-vbuscar">
          <Icono nombre="bus" tamano={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar asuntos" type="search" />
        </label>
        {director && opcionesLleva.length > 2 ? <Pildora etiqueta="Quién lo lleva" valor={lleva} opciones={opcionesLleva} alElegir={setLleva} /> : null}
        <Pildora etiqueta="Qué ver" valor={que} opciones={opcionesQue} alElegir={setQue} titulo={que ? undefined : "Filtrar"} />
        <MenuVistasGuardadas />
        <BotonEnlace href="/panel/consulta" variante="primario" icono="tel" className="as-vnueva">Nueva consulta</BotonEnlace>
      </div>
      {error && !asuntos ? (
        <div className="as-vacio-lista" role="alert">
          <p>{error}</p>
          <button type="button" className="as-btn" onClick={() => void recargar()}>Reintentar</button>
        </div>
      ) : !asuntos ? (
        <div className="as-cargando" aria-busy="true" aria-label="Cargando asuntos">{[0, 1, 2].map((i) => <span key={i} />)}</div>
      ) : vista === "tablero" ? <Tablero lista={lista} /> : <Tiempo lista={lista} />}
      <div className="as-vpie" aria-hidden>
        {vista === "tablero"
          ? "Arrastra una tarjeta para cambiar en qué va · ↩ abrir"
          : "Cada asunto en el día de lo que sigue · ↩ abrir"}
      </div>
    </div>
  );
}

/** Lo que dice una tarjeta o un renglón: folio, qué encargaron y, al director, quién lo lleva. */
function useDatosDe() {
  const cat = useCatalogos();
  const { nombreDe } = useAsuntos();
  const director = useSession()?.role === "admin";
  return (a: FilaAsunto) => [a.folio, a.encargos[0] ? cat.etiqueta("encargo", a.encargos[0]) : null, director ? nombreDe(a.responsable_id) : null]
    .filter(Boolean).join(" · ");
}

/** «Nada por cobrar», «Nada en estudio», «Nada en propuesta». */
const nada = (etiqueta: string) => {
  const t = etiqueta.toLowerCase();
  return /^(en|por) /.test(t) ? `Nada ${t}` : `Nada en ${t}`;
};

/**
 * El tablero (modelo visual): una columna por «En qué va» (sin los cerrados) con su cuenta, y una tarjeta por asunto.
 * Arrastrar una tarjeta a otra columna cambia en qué va, con «Deshacer» en el aviso. Si alguien cambió el asunto en otra
 * ventana, el servidor responde 409: se avisa y el tablero se pone al día.
 */
function Tablero({ lista }: { lista: FilaAsunto[] }) {
  const cat = useCatalogos();
  const { avisar } = useAvisos();
  const { asuntos, recargar, ponerFila } = useAsuntos();
  const datosDe = useDatosDe();
  const [arrastra, setArrastra] = useState<FilaAsunto | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const columnas = cat.opciones("en_que_va").filter((o) => o.valor !== "cerrado");

  async function mover(id: string, destino: EnQueVa) {
    const f = (asuntos ?? []).find((x) => x.id === id);
    if (!f || f.en_que_va === destino) return;
    const nombre = cat.etiqueta("en_que_va", destino).toLowerCase();
    ponerFila({ ...f, en_que_va: destino });
    try {
      await cambiarAsunto({ id: f.id, version: f.version }, { en_que_va: destino });
      await recargar();
      avisar(`${f.nombre} pasó a ${nombre}`, {
        etiqueta: "Deshacer",
        alAccionar: () => void leerAsunto(f.id).then((x) => cambiarAsunto(x, { en_que_va: f.en_que_va })).then(() => recargar(),
          (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")),
      });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo cambiar en qué va.");
      await recargar();
    }
  }

  const soltar = (col: EnQueVa) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setSobre(null);
    setArrastra(null);
    if (id) void mover(id, col);
  };

  return (
    <div className="as-tablero">
      {columnas.map((c) => {
        const col = c.valor as EnQueVa;
        const suyas = lista.filter((a) => a.en_que_va === col);
        const destino = arrastra !== null && arrastra.en_que_va !== col;
        return (
          <section key={col} className="as-col" aria-label={`${c.etiqueta}: ${suyas.length}`} data-sobre={sobre === col || undefined}
            onDragOver={(e) => { if (!destino) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (sobre !== col) setSobre(col); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSobre((s) => (s === col ? null : s)); }}
            onDrop={soltar(col)}>
            <h2><span>{c.etiqueta}</span><span>{suyas.length}</span></h2>
            {suyas.map((a) => {
              const s = a.siguiente;
              return (
                <Link key={a.id} href={`/panel/asuntos/${a.id}`} className="as-tj" draggable data-arrastra={arrastra?.id === a.id || undefined}
                  onDragStart={(e) => { e.dataTransfer.setData("text/plain", a.id); e.dataTransfer.effectAllowed = "move"; setArrastra(a); }}
                  onDragEnd={() => { setArrastra(null); setSobre(null); }}>
                  <b>{a.nombre}</b>
                  <small>{datosDe(a)}</small>
                  {a.en_espera ? <small>En espera{s ? ` · ${s.titulo}` : ""}</small> : s ? (
                    <small><span data-tono={tono(s.fecha)}>{fechaCorta(s.fecha, s.hora)}</span> · {s.titulo}</small>
                  ) : <small data-tono="tarde">Sin siguiente paso</small>}
                </Link>
              );
            })}
            {destino ? <div className="as-hueco">Suelta aquí para pasar a {c.etiqueta}</div> : !suyas.length ? <div className="as-hueco">{nada(c.etiqueta)}</div> : null}
          </section>
        );
      })}
    </div>
  );
}

const DIAS = 14;
const NOMBRE_DIA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/**
 * Los asuntos en el tiempo: cada renglón es un asunto y su marca cae en el día de lo que sigue, de hoy a dos semanas; lo
 * vencido va en «Antes» y lo lejano en «Después». Los que no tienen fecha van abajo. Hoy el servidor solo da la fecha de
 * lo que sigue de cada asunto; con eso se arma.
 */
function Tiempo({ lista }: { lista: FilaAsunto[] }) {
  const datosDe = useDatosDe();
  const abiertos = lista.filter((a) => a.en_que_va !== "cerrado");
  const conFecha = abiertos.filter((a) => a.siguiente?.fecha);
  const sinFecha = abiertos.filter((a) => !a.siguiente?.fecha);
  const dias = Array.from({ length: DIAS }, (_, i) => sumarDias(i));
  const columna = (fecha: string) => { const n = diasHasta(fecha); return n < 0 ? 0 : n >= DIAS ? DIAS + 1 : n + 1; };
  return (
    <div className="as-tiempo">
      <nav className="as-ti-rejilla" aria-label="Asuntos en el tiempo">
        <div className="as-ti-fila as-ti-cab" aria-hidden>
          <span>Asunto</span>
          <span>Antes</span>
          {dias.map((d, i) => {
            const [a, m, dd] = d.split("-").map(Number);
            const sem = new Date(a, m - 1, dd).getDay();
            return <span key={d} data-hoy={i === 0 || undefined} data-finde={sem === 0 || sem === 6 || undefined}>{i === 0 ? "Hoy" : `${NOMBRE_DIA[sem]} ${dd}`}</span>;
          })}
          <span>Después</span>
        </div>
        {conFecha.map((a) => {
          const s = a.siguiente!;
          const c = columna(s.fecha!);
          return (
            <Link key={a.id} href={`/panel/asuntos/${a.id}`} className="as-ti-fila" data-renglon="">
              <span className="as-ti-nombre">
                <b>{a.nombre}</b>
                <small><span data-tono={tono(s.fecha)}>{fechaCorta(s.fecha, s.hora)}</span> · {s.titulo}</small>
                <span className="sr-only">{datosDe(a)}</span>
              </span>
              {c > 1 ? <span className="as-ti-tramo" style={{ gridColumn: `3 / ${c + 3}`, ["--n" as string]: c }} aria-hidden /> : null}
              <span className="as-ti-marca" data-tono={tono(s.fecha)} style={{ gridColumn: `${c + 2}` }} aria-hidden />
            </Link>
          );
        })}
      </nav>
      {sinFecha.length ? (
        <section className="as-ti-sin" aria-label="Sin fecha">
          <h2>Sin fecha <span>{sinFecha.length}</span></h2>
          {sinFecha.map((a) => (
            <Link key={a.id} href={`/panel/asuntos/${a.id}`} className="as-ti-sin-it" data-renglon="">
              <b>{a.nombre}</b>
              <small>{datosDe(a)} · {a.siguiente ? `${a.siguiente.titulo} · sin fecha` : <span data-tono="tarde">Sin siguiente paso</span>}</small>
            </Link>
          ))}
        </section>
      ) : null}
      {!abiertos.length ? <p className="as-m as-nada">Ningún asunto abierto coincide.</p> : null}
    </div>
  );
}
