"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import { PestanasAsunto, type PedirCambio } from "@/components/panel/asuntos/detalle";
import { LoQueSigue } from "@/components/panel/asuntos/sigue";
import { LoLleva } from "@/components/panel/asuntos/reasignar";
import { useSession } from "@/lib/panel/legado/sesion";
import { FormularioAsunto, type DatosNuevoAsunto } from "@/components/panel/asuntos/formulario";
import { Icono } from "@/components/panel/icons";
import { siguienteFila, useAtajo } from "@/components/panel/kit/atajos";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Ficha } from "@/components/panel/kit/ficha";
import { FiltrarYOrdenar } from "@/components/panel/kit/filtrar-ordenar";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { aTexto, deTexto, diaLargo } from "@/lib/panel/calendario";
import {
  fichaAsunto, filasAsuntos, filtrarAsuntos, nuevoSiguiente, ordenarAsuntos, posponer, textoSigue,
  type EstadoAsunto, type Expediente, type OrdenAsuntos,
} from "@/lib/panel/datos/asuntos";
import { crearExpediente, guardarOperacion, leerExpedientes, leerMiAsesor, reasignarAsunto } from "@/lib/panel/datos/colecciones";
import type { Asesor } from "@/lib/domain/records";
import { rutaPersona } from "@/lib/panel/datos/relacionado";
import type { Task } from "@/lib/tasks";
import { completarTarea } from "@/lib/panel/datos/hoy";

/**
 * Asuntos (PN-04): los expedientes que ya existen, con lo que sigue (su tarea abierta más próxima), la persona y el inmueble.
 * Se crean, cambian de estado (activo, en espera, no se dio, reabrir), marcan documentos y llevan notas con las rutas que ya existen.
 * Título libre, varias personas con papel, guías y dinero llegan con PN-02 y PN-07.
 */
function Asuntos() {
  const [exp, setExp] = useState<{ cargando: boolean; error: string | null; datos: Expediente[] }>({ cargando: true, error: null, datos: [] });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    leerExpedientes<Expediente>(c.signal).then(
      (datos) => setExp({ cargando: false, error: null, datos }),
      (e: unknown) => { if (!(e instanceof DOMException && e.name === "AbortError")) setExp({ cargando: false, error: e instanceof Error ? e.message : "No se pudo cargar.", datos: [] }); },
    );
    return () => c.abort();
  }, [intento]);
  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const tareas = useColeccion<Task>("tareas");
  const asesores = useColeccion<Asesor>("asesores");
  const { avisar } = useAvisos();
  const esDirector = useSession()?.role === "admin";
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const [creando, setCreando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const crear = async (d: DatosNuevoAsunto) => {
    setOcupado(true);
    try {
      const nuevo = await crearExpediente<Expediente>(d);
      setExp((s) => ({ ...s, datos: [nuevo, ...s.datos] }));
      setCreando(false); setVer("activo"); setBuscar("");
      avisar(`Asunto abierto con el folio ${nuevo.folio}`);
      abrir(nuevo.id);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  // N abre «Nuevo asunto». No actúa mientras se escribe.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setCreando(true); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);
  const [hoy] = useState(() => aTexto(new Date()));
  const [ver, setVer] = useState<EstadoAsunto>("activo");
  const [buscar, setBuscar] = useState("");
  const [orden, setOrden] = useState<OrdenAsuntos>("sigue");
  const [sinSiguiente, setSinSiguiente] = useState(false);
  const { abierta, abrir, cerrar } = useFichaEnDireccion();

  const filas = useMemo(
    () => filasAsuntos(exp.datos, { personas: personas.datos, inmuebles: inmuebles.datos, tareas: tareas.datos, hoy }),
    [exp.datos, personas.datos, inmuebles.datos, tareas.datos, hoy],
  );
  const cuentas = useMemo(() => ({
    activo: filas.filter((f) => f.estado === "activo").length,
    espera: filas.filter((f) => f.estado === "espera").length,
    cerrado: filas.filter((f) => f.estado === "cerrado").length,
  }), [filas]);
  // «Lo lleva» (PN-10): el director ve todo y puede quedarse con lo de un asesor o con lo suyo.
  const asesoresEnLista = useMemo(() => filas.map((f) => f.asesorId), [filas]);
  const loLleva = useLoLleva(asesoresEnLista, miAsesor, asesores.datos);
  const visibles = useMemo(() => ordenarAsuntos(filtrarAsuntos(filas.filter((f) => loLleva.pasa(f.asesorId)), buscar, ver, sinSiguiente), orden), [filas, loLleva, buscar, ver, sinSiguiente, orden]);
  const fila = filas.find((f) => f.id === abierta) ?? null;
  const expediente = exp.datos.find((e) => e.id === abierta) ?? null;
  const cargando = exp.cargando;

  // Lo que sigue: tareas ligadas al asunto (la base exige su misma persona, asesor e inmueble).
  const cambiarTarea = async (id: string, cambio: (t: Task) => Task, aviso: string): Promise<boolean> => {
    const previa = tareas.datos.find((t) => t.id === id);
    if (!previa) return false;
    setOcupado(true);
    try {
      await tareas.guardar(id, cambio(previa));
      avisar(aviso, { etiqueta: "Deshacer", alAccionar: () => { tareas.guardar(id, previa).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); } });
      return true;
    } catch (e) { avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo."); return false; }
    finally { setOcupado(false); }
  };
  // Con un asunto abierto (boceto): J y K pasan al siguiente o al anterior de la lista, E marca hecho lo que sigue y P lo pasa a mañana.
  const conFicha = fila !== null && !creando;
  const irA = (paso: 1 | -1) => (e: KeyboardEvent) => {
    if (!fila) return;
    const destino = visibles[siguienteFila(visibles.findIndex((v) => v.id === fila.id), visibles.length, paso)];
    e.preventDefault();
    if (destino && destino.id !== fila.id) abrir(destino.id);
  };
  useAtajo("j", irA(1), { activo: conFicha });
  useAtajo("k", irA(-1), { activo: conFicha });
  useAtajo("e", (e) => {
    if (!fila?.sigue || ocupado) return;
    e.preventDefault();
    void cambiarTarea(fila.sigue.id, (t) => completarTarea(t), "Hecho");
  }, { activo: conFicha });
  useAtajo("p", (e) => {
    const base = deTexto(hoy);
    if (!fila?.sigue || ocupado || !base) return;
    e.preventDefault();
    base.setDate(base.getDate() + 1);
    const manana = aTexto(base);
    void cambiarTarea(fila.sigue.id, (t) => posponer(t, manana), `Pospuesto al ${diaLargo(manana)}`);
  }, { activo: conFicha });
  const anotarSiguiente = async (e: Expediente, texto: string, vence: string | null): Promise<boolean> => {
    setOcupado(true);
    try {
      const t = nuevoSiguiente(e, texto, vence);
      await tareas.guardar(t.id, t);
      avisar("Siguiente paso anotado");
      return true;
    } catch (err) { avisar(err instanceof Error ? err.message : "No se guardó. Vuelve a intentarlo."); return false; }
    finally { setOcupado(false); }
  };

  // Cambios del asunto: se construyen con la versión vigente; si el servidor frena (409) se muestra su motivo tal cual.
  const actual = (id: string) => expRef.current.find((e) => e.id === id) ?? null;
  const expRef = useRef(exp.datos);
  useEffect(() => { expRef.current = exp.datos; }, [exp.datos]);
  const alCambiar: PedirCambio = async (crearCambio, aviso, deshacer) => {
    const id = abierta;
    const e = id ? actual(id) : null;
    if (!e) return false;
    setOcupado(true);
    try {
      const nuevo = await guardarOperacion<Expediente>(e.id, crearCambio(e));
      setExp((s) => ({ ...s, datos: s.datos.map((x) => (x.id === nuevo.id ? nuevo : x)) }));
      avisar(aviso, deshacer ? { etiqueta: "Deshacer", alAccionar: () => {
        const vigente = actual(nuevo.id);
        if (!vigente) return;
        guardarOperacion<Expediente>(vigente.id, deshacer(vigente)).then(
          (r) => setExp((s) => ({ ...s, datos: s.datos.map((x) => (x.id === r.id ? r : x)) })),
          (err: unknown) => avisar(err instanceof Error ? err.message : "No se pudo deshacer."),
        );
      } } : undefined);
      return true;
    } catch (err) {
      avisar(err instanceof Error ? err.message : "No se guardó. Vuelve a intentarlo.");
      return false;
    } finally { setOcupado(false); }
  };

  return (
    <div className="pn-pagina" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <h1 className="pn-h1">Asuntos</h1>
        <Boton variante="secundario" onClick={() => setCreando(true)} aria-keyshortcuts="N">Nuevo asunto</Boton>
      </div>
      <p className="pn-sub">{cargando ? "Cargando…" : `${filas.length} ${filas.length === 1 ? "asunto" : "asuntos"}`}</p>
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <Campo etiqueta="Buscar" placeholder="Persona, inmueble o folio" value={buscar} onChange={(e) => setBuscar(e.target.value)} type="search" autoComplete="off" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 140px" }}>
            <Segmentado etiqueta="Ver" valor={ver} alElegir={setVer} opciones={[
              { valor: "activo", etiqueta: "Activos", cuenta: cuentas.activo },
              { valor: "espera", etiqueta: "En espera", cuenta: cuentas.espera },
              { valor: "cerrado", etiqueta: "Cerrados", cuenta: cuentas.cerrado },
            ]} />
          </div>
          {loLleva.control ? <div style={{ flex: "1 1 140px" }}>{loLleva.control}</div> : null}
          <FiltrarYOrdenar
            orden={orden}
            ordenes={[{ valor: "sigue", etiqueta: "Lo que sigue más pronto" }, { valor: "movidos", etiqueta: "Movidos hace poco" }]}
            alOrdenar={setOrden}
            interruptores={[{ etiqueta: "Solo sin siguiente paso", valor: sinSiguiente, alCambiar: setSinSiguiente }]}
            resultado={visibles.length}
            nombreResultado={["asunto", "asuntos"]}
            alQuitar={() => { setOrden("sigue"); setSinSiguiente(false); }}
          />
        </div>
      </div>
      <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
        {cargando ? <Cargando lineas={5} etiqueta="Cargando asuntos" /> : null}
        {exp.error ? <EstadoError texto={exp.error} alReintentar={() => { setExp((s) => ({ ...s, cargando: true, error: null })); setIntento((n) => n + 1); }} /> : null}
        {!cargando && !exp.error && filas.length === 0 ? <Vacio titulo="Todavía no hay asuntos" texto="Cada venta, renta o trámite que se abra aparece aquí." icono="expediente" accion={<Boton onClick={() => setCreando(true)}>Nuevo asunto</Boton>} /> : null}
        {!cargando && !exp.error && filas.length > 0 && visibles.length === 0 ? <Vacio titulo="Nada coincide" texto="Prueba con otra palabra o cambia la vista." icono="buscar" /> : null}
        {visibles.length ? (
          <GrupoLista>
            {visibles.map((f) => (
              <Fila
                key={f.id}
                izquierda={<span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)" }}><Icono nombre="expediente" tamano={18} /></span>}
                titulo={f.titulo}
                subtitulo={f.linea}
                detalle={textoSigue(f.sigue)}
                tonoDetalle={!f.sigue || f.sigue.vencido ? "aviso" : "normal"}
                alPulsar={() => abrir(f.id)}
                seleccionada={f.id === abierta}
              />
            ))}
          </GrupoLista>
        ) : null}
        <p className="pn-solo-lector" aria-live="polite">{fila && visibles.some((v) => v.id === fila.id) ? `${visibles.findIndex((v) => v.id === fila.id) + 1} de ${visibles.length}: ${fila.titulo}` : ""}</p>
        {visibles.length ? <p className="pn-sub pn-solo-escritorio" style={{ margin: "12px 0 0" }}>Teclado: J y K para moverte, F6 entre la lista y el detalle, E hecho, P a mañana, N nuevo y / buscar.</p> : null}
      </div>
      <HojaAdaptable abierta={fila !== null} titulo={fila?.titulo ?? "Asunto"} alCerrar={() => cerrar()}>
        {fila && expediente ? (
          <>
            {fila.persona?.telefono ? (
              <p style={{ margin: "4px 0 0" }}>
                <a href={`tel:${fila.persona.telefono}`} className="pn-btn pn-btn-secundario">Llamar a {fila.persona.nombre}</a>
              </p>
            ) : null}
            <PestanasAsunto expediente={expediente} estado={fila.estado} ocupado={ocupado} alCambiar={alCambiar} resumen={(
              <>
                <LoQueSigue key={`${fila.id}-${fila.sigue?.id ?? "nada"}`} fila={fila} ocupado={ocupado}
                  alHecho={(id) => void cambiarTarea(id, (t) => completarTarea(t), "Hecho")}
                  alPosponer={(id, f) => cambiarTarea(id, (t) => posponer(t, f), f ? `Pospuesto al ${diaLargo(f)}` : "Sin fecha")}
                  alAnotar={(texto, f) => anotarSiguiente(expediente, texto, f)} />
                <Ficha secciones={fichaAsunto(fila, expediente)} />
                <LoLleva key={`${fila.id}-${expediente.asesor_id}`} asesorId={expediente.asesor_id} asesores={asesores.datos} esDirector={esDirector}
                  alPasar={async (a, motivo) => {
                    try {
                      const movidas = await reasignarAsunto(expediente.id, a, motivo);
                      const nombre = asesores.datos.find((x) => x.id === a)?.nombre ?? "otro asesor";
                      avisar(movidas.length > 1 ? `Pasado a ${nombre}, junto con ${movidas.length - 1} asunto${movidas.length - 1 === 1 ? "" : "s"} del mismo inmueble` : `Pasado a ${nombre}`);
                      setIntento((n) => n + 1); tareas.reintentar();
                      return true;
                    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo pasar. Vuelve a intentarlo."); return false; }
                  }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {fila.persona ? <a className="pn-btn pn-btn-texto" href={rutaPersona(fila.persona.id)}>Abrir a {fila.persona.nombre}</a> : null}
                  {fila.inmueble ? <a className="pn-btn pn-btn-texto" href={`/panel/inmuebles?ver=${encodeURIComponent(fila.inmueble.codigo)}`}>Abrir el inmueble</a> : null}
                </div>
              </>
            )} />
          </>
        ) : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={creando} titulo="Nuevo asunto" descripcion="Tipo, persona e inmueble. Lo demás se completa después." alCerrar={() => setCreando(false)}>
        {creando ? <FormularioAsunto personas={personas.datos} inmuebles={inmuebles.datos} asesores={asesores.datos} miAsesor={miAsesor} ocupado={ocupado} alGuardar={(d) => void crear(d)} /> : null}
      </HojaAdaptable>
    </div>
  );
}

export default function PaginaAsuntos() {
  return <Suspense fallback={<div className="pn-pagina"><Cargando lineas={5} etiqueta="Cargando" /></div>}><Asuntos /></Suspense>;
}
