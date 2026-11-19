"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

import "@/components/panel/configuracion/configuracion.css";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton, BotonEnlace } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Fila, GrupoLista, Tarjeta } from "@/components/panel/kit/lista";
import {
  CLASES_ELIMINADO, NOMBRE_CLASE_ELIMINADO, leerEliminados, recuperarEliminado, type ClaseEliminado, type Eliminado,
} from "@/lib/panel/eliminados";

const fecha = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat("es-MX", { timeZone: "America/Tijuana", day: "numeric", month: "short", year: "numeric" }).format(d);
};

/**
 * Eliminados, con el orden de Configuración (modelo visual «Ajustes»): título, una línea de ayuda, la lista para elegir
 * qué se ve y, por clase, lo eliminado con «Recuperar». Cada quien ve lo que la base le deja ver; lo que solo el director
 * recupera lo dice en el renglón.
 */
export function Eliminados() {
  const { avisar } = useAvisos();
  const [lista, setLista] = useState<Eliminado[] | null>(null);
  const [hayMas, setHayMas] = useState<ClaseEliminado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clase, setClase] = useState<ClaseEliminado | "">("");
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try { const r = await leerEliminados(); setLista(r.eliminados); setHayMas(r.hayMas); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo leer Eliminados."); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const grupos = useMemo(() => CLASES_ELIMINADO
    .filter((c) => !clase || c === clase)
    .map((c) => ({ clase: c, filas: (lista ?? []).filter((x) => x.clase === c) }))
    .filter((g) => g.filas.length), [lista, clase]);

  async function recuperar(x: Eliminado) {
    if (ocupado) return;
    setOcupado(x.id);
    try {
      await recuperarEliminado(x);
      setLista((l) => (l ? l.filter((y) => !(y.clase === x.clase && y.id === x.id)) : l));
      avisar(`Se recuperó «${x.nombre}». Ya está otra vez en ${NOMBRE_CLASE_ELIMINADO[x.clase]}.`);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo recuperar. Vuelve a intentarlo.");
      void cargar();
    } finally { setOcupado(null); }
  }

  // Con «+» cuando la clase llegó al tope: hay más de las que se muestran.
  const cuantos = (c: ClaseEliminado) => `${(lista ?? []).filter((x) => x.clase === c).length}${hayMas.includes(c) ? "+" : ""}`;

  return (
    <div className="pn-pagina pn-conf" style={{ display: "flex", flexDirection: "column" }}>
      <div>
        <h1 className="pn-conf-h1">Eliminados</h1>
        <p className="pn-conf-intro">Lo que se mandó a Eliminados. Recuperar lo regresa a su lugar, tal como estaba.</p>
      </div>
      <Tarjeta className="pn-lista" style={{ padding: "4px 14px 12px" }}>
        <Desplegable etiqueta="Mostrar" valor={clase} vacio={`Todo${lista ? ` · ${lista.length}${hayMas.length ? "+" : ""}` : ""}`}
          opciones={CLASES_ELIMINADO.map((c) => ({ valor: c, etiqueta: lista ? `${NOMBRE_CLASE_ELIMINADO[c]} · ${cuantos(c)}` : NOMBRE_CLASE_ELIMINADO[c] }))}
          alElegir={setClase} />
      </Tarjeta>
      {error ? <EstadoError texto={error} alReintentar={() => void cargar()} />
        : !lista ? <Cargando lineas={4} etiqueta="Cargando Eliminados" />
        : !grupos.length ? (
          <Vacio titulo={clase ? `No hay ${NOMBRE_CLASE_ELIMINADO[clase].toLowerCase()} en Eliminados` : "No hay nada en Eliminados"}
            texto="Lo que se mande a Eliminados aparece aquí y se puede recuperar." icono="bote" />
        )
        : grupos.map((g) => (
          <GrupoLista key={g.clase} titulo={`${NOMBRE_CLASE_ELIMINADO[g.clase]} · ${cuantos(g.clase)}`}>
            {g.filas.map((x) => (
              <Fila key={`${x.clase}-${x.id}`} titulo={x.nombre} subtitulo={x.detalle ?? undefined}
                detalle={x.aviso ?? (x.recuperable ? undefined : x.clase === "guia" ? "La recupera quien la hizo o el director" : "Lo recupera el director")}
                lado={fecha(x.eliminado_el)}
                acciones={x.recuperable ? (
                  <Boton variante="normal" icono="ciclo" deshabilitado={ocupado !== null} onClick={() => void recuperar(x)}
                    aria-label={`Recuperar ${x.nombre}`}>{ocupado === x.id ? "Recuperando…" : "Recuperar"}</Boton>
                ) : undefined} />
            ))}
            {hayMas.includes(g.clase) ? (
              <p className="pn-conf-nota" style={{ padding: "8px 14px" }}>Se muestran los más recientes; hay más en Eliminados.</p>
            ) : null}
          </GrupoLista>
        ))}
      <div className="pn-conf-acciones">
        <BotonEnlace href="/panel/configuracion" variante="texto">Volver a Configuración</BotonEnlace>
      </div>
    </div>
  );
}
