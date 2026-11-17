"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import "@/components/panel/asuntos/asuntos.css";
import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import type { PedirCambio } from "@/components/panel/asuntos/detalle";
import { FichaAsunto, type AccionesSigue, type HojaAsunto } from "@/components/panel/asuntos/ficha";
import { FormularioAsunto, type DatosNuevoAsunto } from "@/components/panel/asuntos/formulario";
import { Gesto, Icono } from "@/components/panel/icons";
import { siguienteFila, useAtajo } from "@/components/panel/kit/atajos";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { Hoja } from "@/components/panel/kit/hoja";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { HojaAdaptable, useEsTelefono } from "@/components/panel/ui/hoja-adaptable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/panel/ui/popover";
import { Switch } from "@/components/panel/ui/switch";
import { DetallePersona } from "@/components/panel/personas/detalle-persona";
import { DetalleInmueble } from "@/components/panel/inmuebles/detalle-inmueble";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor } from "@/lib/domain/records";
import { aTexto, deTexto, diaLargo } from "@/lib/panel/calendario";
import {
  avisosDelAsunto, filasAsuntos, filtrarVista, huellaDeEstado, nuevoSiguiente, ordenarAsuntos, pesosCortos, posponer, reabrir, sigueEnFila,
  type AvisoAsunto, type EstadoAsunto, type Expediente, type FilaAsunto, type OrdenAsuntos,
} from "@/lib/panel/datos/asuntos";
import { archivarAsunto, conExtras, guardarAsunto, leerExtrasAsuntos, recuperarAsunto, sincronizarEstados, type TipoAsunto } from "@/lib/panel/datos/asuntos-servidor";
import { personaDeAlta } from "@/components/panel/asuntos/alta-persona";
import { crearExpediente, guardarOperacion, leerExpedientes, leerMiAsesor, reasignarAsunto } from "@/lib/panel/datos/colecciones";
import { completarTarea } from "@/lib/panel/datos/hoy";
import { useSession } from "@/lib/panel/legado/sesion";
import type { Task } from "@/lib/tasks";
import type { Tramite } from "@/lib/tramites";

const ORDENES: { valor: OrdenAsuntos; etiqueta: string }[] = [
  { valor: "sigue", etiqueta: "Lo que sigue, lo más pronto primero" },
  { valor: "movidos", etiqueta: "Movidos hace poco" },
  { valor: "comision", etiqueta: "Comisión para Fortius, mayor primero" },
];
const ESTADOS: { valor: EstadoAsunto; etiqueta: string }[] = [
  { valor: "activo", etiqueta: "Activos" }, { valor: "espera", etiqueta: "En espera" }, { valor: "cerrado", etiqueta: "Cerrados" },
];

/**
 * Asuntos (PN-04), igual al boceto: en escritorio, una tabla de todo el ancho (asunto, lo que sigue, personas y lo que queda
 * para Fortius) y, al abrir uno, un panel de 680 px encima con folio, «3 de 5», anterior y siguiente, ⋯ y cerrar.
 * En el teléfono, tarjetas que se deslizan (derecha: hecho; izquierda: mañana) y el asunto a pantalla completa.
 * Se leen los expedientes que ya existen; lo que necesita la parte nueva del servidor (PN-02) se dibuja y avisa sin error.
 */
function Asuntos() {
  const [exp, setExp] = useState<{ cargando: boolean; error: string | null; datos: Expediente[] }>({ cargando: true, error: null, datos: [] });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    // Título y tipo de PN-02 (o el título que quedó como nota): si no llegan, la lista sigue con lo que hay.
    Promise.all([leerExpedientes<Expediente>(c.signal), leerExtrasAsuntos(c.signal).catch(() => null)]).then(
      ([datos, extras]) => {
        setExp({ cargando: false, error: null, datos: datos.map((e) => conExtras(e, extras)) });
        // Con PN-02 aplicada, los asuntos cuyo estado (columna) no coincide con su etapa y flujo se ponen al día solos.
        if (extras?.disponible && extras.desfasados.length) void sincronizarEstados(extras.desfasados).catch(() => undefined);
      },
      (e: unknown) => { if (!(e instanceof DOMException && e.name === "AbortError")) setExp({ cargando: false, error: e instanceof Error ? e.message : "No se pudo cargar.", datos: [] }); },
    );
    return () => c.abort();
  }, [intento]);
  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const tareas = useColeccion<Task>("tareas");
  const asesores = useColeccion<Asesor>("asesores");
  const tramites = useColeccion<Tramite>("tramites");
  const { avisar } = useAvisos();
  const esDirector = useSession()?.role === "admin";
  const telefono = useEsTelefono();
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const [creando, setCreando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [hojaDe, setHojaDe] = useState<{ id: string | null; hoja: HojaAsunto }>({ id: null, hoja: null });
  const [hoy] = useState(() => aTexto(new Date()));
  const [ver, setVer] = useState<EstadoAsunto>("activo");
  const [buscar, setBuscar] = useState("");
  const [orden, setOrden] = useState<OrdenAsuntos>("sigue");
  const [sinSiguiente, setSinSiguiente] = useState(false);
  const [conAvisos, setConAvisos] = useState(false);
  const [tipos, setTipos] = useState<readonly string[]>([]);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const { abierta, abrir, cerrar } = useFichaEnDireccion();
  // La persona o el inmueble del asunto, abiertos encima sin salir de él. Se olvida al cambiar o cerrar el asunto.
  const [encima, setEncima] = useState<{ asunto: string; clase: "persona" | "inmueble"; id: string } | null>(null);
  const encimaVigente = encima && encima.asunto === abierta ? encima : null;
  const personaEncima = encimaVigente?.clase === "persona" ? personas.datos.find((c) => c.id === encimaVigente.id) ?? null : null;
  const inmuebleEncima = encimaVigente?.clase === "inmueble" ? inmuebles.datos.find((p) => p.slug === encimaVigente.id) ?? null : null;
  // La hoja abierta (Tipo y estado, Posponer…) pertenece a un asunto: al pasar a otro se cierra sola.
  const hoja = hojaDe.id === abierta ? hojaDe.hoja : null;
  const setHoja = (h: HojaAsunto) => setHojaDe({ id: abierta, hoja: h });

  const crear = async (d: DatosNuevoAsunto) => {
    setOcupado(true);
    try {
      // Persona dada de alta en el mismo formulario: primero queda en Personas y después se abre el asunto con ella.
      let clienteId = d.clienteId;
      if (d.personaNueva) {
        const c = personaDeAlta(d.personaNueva, d.tipo === "venta" ? "vende" : d.tipo === "renta" ? "pone_en_renta" : null, miAsesor);
        await personas.guardar(c.id, c);
        clienteId = c.id;
      }
      if (!clienteId) { avisar("Por ahora un asunto se abre con una persona. Elige una o créala en el formulario."); return; }
      const creado = await crearExpediente<Expediente>({ ...d, clienteId });
      // Título y tipo van a sus columnas (PN-02); sin ellas, el título queda como nota «Título: …» y el tipo sale de la operación.
      const r = await guardarAsunto(creado, { titulo: d.titulo.trim(), tipo: d.tipo }).catch(() => null);
      const nuevo: Expediente = r?.expediente ?? { ...creado, titulo: d.titulo.trim() };
      setExp((s) => ({ ...s, datos: [nuevo, ...s.datos] }));
      setCreando(false); setVer("activo"); setBuscar("");
      avisar(`Asunto abierto con el folio ${nuevo.folio}`);
      abrir(nuevo.id);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  useAtajo("n", (e) => { e.preventDefault(); setCreando(true); }, { activo: !creando });
  // «/» busca (boceto).
  const campoBuscar = useRef<HTMLInputElement>(null);
  useAtajo("/", (e) => { e.preventDefault(); campoBuscar.current?.focus(); campoBuscar.current?.select(); }, { activo: !creando && !telefono });

  const filas = useMemo(
    () => filasAsuntos(exp.datos, { personas: personas.datos, inmuebles: inmuebles.datos, tareas: tareas.datos, hoy }),
    [exp.datos, personas.datos, inmuebles.datos, tareas.datos, hoy],
  );
  const porId = useMemo(() => new Map(exp.datos.map((e) => [e.id, e])), [exp.datos]);
  const avisosDe = useMemo(() => new Map<string, AvisoAsunto[]>(exp.datos.map((e) => [e.id, avisosDelAsunto(e, hoy, tramites.datos)])), [exp.datos, hoy, tramites.datos]);
  const cuentaAvisos = useMemo(() => new Map([...avisosDe].map(([k, v]) => [k, v.length])), [avisosDe]);
  // «Lo lleva» (PN-10): el director ve todo y puede quedarse con lo de un asesor o con lo suyo.
  const asesoresEnLista = useMemo(() => filas.map((f) => f.asesorId), [filas]);
  const loLleva = useLoLleva(asesoresEnLista, miAsesor, asesores.datos);
  const propias = useMemo(() => filas.filter((f) => loLleva.pasa(f.asesorId)), [filas, loLleva]);
  const cuentas = useMemo(() => ({
    activo: propias.filter((f) => f.estado === "activo").length,
    espera: propias.filter((f) => f.estado === "espera").length,
    cerrado: propias.filter((f) => f.estado === "cerrado").length,
  }), [propias]);
  const delEstado = useMemo(() => propias.filter((f) => f.estado === ver), [propias, ver]);
  const tiposEnLista = useMemo(() => [...new Set(propias.map((f) => f.tipo))].sort((a, b) => a.localeCompare(b, "es")), [propias]);
  const visibles = useMemo(
    () => ordenarAsuntos(filtrarVista(propias, { consulta: buscar, estado: ver, sinSiguiente, conAvisos, tipos, avisos: cuentaAvisos }), orden),
    [propias, buscar, ver, sinSiguiente, conAvisos, tipos, cuentaAvisos, orden],
  );
  const nFiltros = (sinSiguiente ? 1 : 0) + (conAvisos ? 1 : 0) + tipos.length + (orden !== "sigue" ? 1 : 0);
  const resumenFiltros = [conAvisos ? "con avisos" : "", sinSiguiente ? "sin siguiente paso" : "", tipos.length ? tipos.join(", ") : "", orden !== "sigue" ? (orden === "movidos" ? "movidos hace poco primero" : "mayor comisión primero") : ""].filter(Boolean).join(" · ");
  const limpiar = () => { setSinSiguiente(false); setConAvisos(false); setTipos([]); setOrden("sigue"); };

  const fila = filas.find((f) => f.id === abierta) ?? null;
  const expediente = abierta ? porId.get(abierta) ?? null : null;
  const cargando = exp.cargando;
  const posicion = fila ? visibles.findIndex((v) => v.id === fila.id) : -1;

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
  const manana = () => { const b = deTexto(hoy); if (!b) return null; b.setDate(b.getDate() + 1); return aTexto(b); };
  const hecho = (f: FilaAsunto) => { if (f.sigue && !ocupado) void cambiarTarea(f.sigue.id, (t) => completarTarea(t), "Hecho"); };
  const aManana = (f: FilaAsunto) => { const m = manana(); if (f.sigue && m && !ocupado) void cambiarTarea(f.sigue.id, (t) => posponer(t, m), `Pospuesto al ${diaLargo(m)}`); };
  const anotarSiguiente = async (e: Expediente, texto: string, vence: string | null): Promise<boolean> => {
    setOcupado(true);
    try {
      const t = nuevoSiguiente(e, texto, vence);
      await tareas.guardar(t.id, t);
      avisar(vence ? `Anotado para el ${diaLargo(vence)}` : "Siguiente paso anotado");
      return true;
    } catch (err) { avisar(err instanceof Error ? err.message : "No se guardó. Vuelve a intentarlo."); return false; }
    finally { setOcupado(false); }
  };
  const sigue: AccionesSigue | null = expediente ? {
    alHecho: (id) => void cambiarTarea(id, (t) => completarTarea(t), "Hecho"),
    alPosponer: (id, f) => cambiarTarea(id, (t) => posponer(t, f), f ? `Pospuesto al ${diaLargo(f)}` : "Sin fecha"),
    alAnotar: (texto, f) => anotarSiguiente(expediente, texto, f),
    alEditar: (id, texto, f) => cambiarTarea(id, (t) => { const n = posponer({ ...t, titulo: texto.trim().slice(0, 160) }, f); return n; }, "Lo que sigue cambió"),
  } : null;

  // Con un asunto abierto (boceto): J y K pasan al siguiente o al anterior de la lista, E marca hecho lo que sigue y P lo pasa a mañana.
  const conFicha = fila !== null && !creando && hoja === null;
  const irA = (paso: 1 | -1) => {
    if (!fila) return;
    const destino = visibles[siguienteFila(posicion, visibles.length, paso)];
    if (destino && destino.id !== fila.id) abrir(destino.id);
  };
  useAtajo("j", (e) => { e.preventDefault(); irA(1); }, { activo: conFicha });
  useAtajo("k", (e) => { e.preventDefault(); irA(-1); }, { activo: conFicha });
  useAtajo("e", (e) => { if (fila?.sigue) { e.preventDefault(); hecho(fila); } }, { activo: conFicha });
  useAtajo("p", (e) => { if (fila?.sigue) { e.preventDefault(); aManana(fila); } }, { activo: conFicha });

  // Cambios del asunto: se construyen con la versión vigente; si el servidor responde con un motivo, se muestra tal cual.
  const expRef = useRef(exp.datos);
  useEffect(() => { expRef.current = exp.datos; }, [exp.datos]);
  const actual = (id: string) => expRef.current.find((e) => e.id === id) ?? null;
  const alCambiar: PedirCambio = async (crearCambio, aviso, deshacer) => {
    const id = abierta;
    const e = id ? actual(id) : null;
    if (!e) return false;
    setOcupado(true);
    // El estado se guarda en la etapa y el flujo (como hoy) y, si cambió, se copia a las columnas de PN-02; sin ellas no pasa nada.
    const copiarEstado = (antes: Expediente, despues: Expediente) => {
      if (huellaDeEstado(antes) !== huellaDeEstado(despues)) void sincronizarEstados([despues.id]).catch(() => undefined);
    };
    try {
      const nuevo = await guardarOperacion<Expediente>(e.id, crearCambio(e));
      copiarEstado(e, nuevo);
      setExp((s) => ({ ...s, datos: s.datos.map((x) => (x.id === nuevo.id ? fusionar(x, nuevo) : x)) }));
      avisar(aviso, deshacer ? { etiqueta: "Deshacer", alAccionar: () => {
        const vigente = actual(nuevo.id);
        if (!vigente) return;
        guardarOperacion<Expediente>(vigente.id, deshacer(vigente)).then(
          (r) => { copiarEstado(vigente, r); setExp((s) => ({ ...s, datos: s.datos.map((x) => (x.id === r.id ? fusionar(x, r) : x)) })); },
          (err: unknown) => avisar(err instanceof Error ? err.message : "No se pudo deshacer."),
        );
      } } : undefined);
      return true;
    } catch (err) {
      avisar(err instanceof Error ? err.message : "No se guardó. Vuelve a intentarlo.");
      return false;
    } finally { setOcupado(false); }
  };
  const alPasar = async (a: string, motivo: string) => {
    if (!expediente) return false;
    try {
      const movidas = await reasignarAsunto(expediente.id, a, motivo);
      const nombre = asesores.datos.find((x) => x.id === a)?.nombre ?? "otro asesor";
      avisar(movidas.length > 1 ? `Pasado a ${nombre}, junto con ${movidas.length - 1} asunto${movidas.length - 1 === 1 ? "" : "s"} del mismo inmueble` : `Pasado a ${nombre}`);
      setIntento((n) => n + 1); tareas.reintentar();
      return true;
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo pasar. Vuelve a intentarlo."); return false; }
  };

  // Título y tipo (PN-02). Sin las columnas: el título queda como nota y se lee de ahí; el tipo avisa que llega después.
  const alGuardarAsunto = async (cambio: { titulo?: string; tipo?: TipoAsunto }): Promise<boolean> => {
    const e = abierta ? actual(abierta) : null;
    if (!e) return false;
    setOcupado(true);
    try {
      const r = await guardarAsunto(e, cambio);
      if (!r.guardado) { avisar("Cambiar el tipo llega con la siguiente actualización del servidor. Lo demás del asunto funciona igual."); return false; }
      setExp((s) => ({ ...s, datos: s.datos.map((x) => (x.id === e.id ? (r.expediente ? fusionar(x, r.expediente) : { ...x, titulo: cambio.titulo ?? x.titulo }) : x)) }));
      avisar(cambio.tipo ? "Tipo cambiado" : "Título cambiado");
      return true;
    } catch (err) { avisar(err instanceof Error ? err.message : "No se guardó. Vuelve a intentarlo."); return false; }
    finally { setOcupado(false); }
  };
  // Archivar (boceto): sale de la lista con Deshacer. Es la eliminación recuperable que ya existe; folio, documentos e historial se conservan.
  const archivar = async () => {
    const e = abierta ? actual(abierta) : null;
    if (!e || ocupado) return;
    setOcupado(true);
    try {
      const quitado = await archivarAsunto(e);
      setExp((s) => ({ ...s, datos: s.datos.filter((x) => x.id !== e.id) }));
      cerrar();
      const titulo = filas.find((f) => f.id === e.id)?.titulo ?? "Asunto";
      avisar(`${titulo}: archivado`, { etiqueta: "Deshacer", alAccionar: () => {
        recuperarAsunto(quitado).then(
          (r) => { setExp((s) => ({ ...s, datos: [fusionar(e, r), ...s.datos.filter((x) => x.id !== r.id)] })); avisar("Asunto de vuelta en la lista"); },
          (err: unknown) => avisar(err instanceof Error ? err.message : "No se pudo deshacer."),
        );
      } });
    } catch (err) { avisar(err instanceof Error ? err.message : "No se pudo archivar. Vuelve a intentarlo."); }
    finally { setOcupado(false); }
  };

  // Menú ⋯ del asunto (boceto): título, tipo, en espera o reanudar, cerrar o reabrir, crear documento y archivar.
  const opcionesMenu = fila ? [
    { etiqueta: "Cambiar el título", alElegir: () => setHoja("titulo") },
    { etiqueta: "Cambiar el tipo", alElegir: () => setHoja("meta") },
    fila.estado === "espera"
      ? { etiqueta: "Reanudar", alElegir: () => void alCambiar(reabrir, "Asunto activo de nuevo") }
      : { etiqueta: "Poner en espera", alElegir: () => setHoja("espera") },
    fila.estado === "cerrado"
      ? { etiqueta: "Reabrir", alElegir: () => void alCambiar(reabrir, "Asunto reabierto") }
      : { etiqueta: "Cerrar el asunto", alElegir: () => setHoja("cerrar") },
    { etiqueta: "Crear documento", alElegir: () => setHoja("documento") },
    { etiqueta: "Archivar", alElegir: () => void archivar(), peligro: true },
  ] : [];

  const ficha = fila && expediente && sigue ? (
    <FichaAsunto key={fila.id} fila={fila} expediente={expediente} avisos={avisosDe.get(fila.id) ?? []} telefono={telefono} ocupado={ocupado}
      alCambiar={alCambiar} sigue={sigue} hoja={hoja} setHoja={setHoja}
      personasTodas={personas.datos} alGuardarAsunto={alGuardarAsunto}
      alVerPersona={(id) => setEncima({ asunto: fila.id, clase: "persona", id })}
      alVerInmueble={(slug) => { const s = slug ?? fila.inmueble?.slug; if (s) setEncima({ asunto: fila.id, clase: "inmueble", id: s }); }}
      asesores={asesores.datos} esDirector={esDirector} alPasar={alPasar}
      inmueblesTodos={inmuebles.datos} guardarPersona={personas.guardar} miAsesor={miAsesor} />
  ) : null;

  const encimas = (
    <>
      <HojaAdaptable abierta={personaEncima !== null} titulo={personaEncima?.nombre?.trim() || "Sin nombre"} alCerrar={() => setEncima(null)}
        volver={{ etiqueta: "Volver al asunto", alPulsar: () => setEncima(null) }}>
        {personaEncima ? <DetallePersona persona={personaEncima} personas={personas.datos} guardar={personas.guardar} alAbrirPersona={(id) => setEncima((e) => (e ? { ...e, id } : e))} /> : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={inmuebleEncima !== null} titulo={inmuebleEncima?.titulo ?? "Inmueble"} alCerrar={() => setEncima(null)}
        volver={{ etiqueta: "Volver al asunto", alPulsar: () => setEncima(null) }}>
        {inmuebleEncima ? <DetalleInmueble inmueble={inmuebleEncima} guardar={inmuebles.guardar} personas={personas.datos} guardarPersona={personas.guardar} /> : null}
      </HojaAdaptable>
    </>
  );

  // Teléfono: el asunto ocupa la pantalla, con «‹ Asuntos» arriba (Atrás también regresa: la ficha vive en la dirección).
  if (telefono && fila && ficha) {
    return (
      <div className="as-vista">
        <div className="as-vista-barra">
          <button type="button" className="as-volver" onClick={() => cerrar()}><Gesto nombre="izquierda" tamano={18} />Asuntos</button>
          <span className="as-folio">{fila.folio}</span>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="as-icon" aria-label="Más acciones"><Gesto nombre="puntos" tamano={18} /></DropdownMenuTrigger>
            <DropdownMenuContent>
              <OpcionesDelMenu opciones={opcionesMenu} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="as-vista-cuerpo">{ficha}</div>
        {encimas}
      </div>
    );
  }

  return (
    <div className="as-pagina">
      <div className="as-cabeza">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1>Asuntos</h1>
          <span className="as-cuenta">{cargando ? "Cargando…" : `${cuentas.activo + cuentas.espera} en curso`}</span>
        </div>
        <Boton onClick={() => setCreando(true)} aria-keyshortcuts="N"><Gesto nombre="mas" tamano={16} />Nuevo asunto</Boton>
      </div>

      <div className="as-controles">
        <div className="as-estado">
          <Segmentado etiqueta="Ver" valor={ver} alElegir={setVer} opciones={ESTADOS.map((o) => ({ ...o, cuenta: cuentas[o.valor] }))} />
        </div>
        {loLleva.control ? <div className="as-lleva">{loLleva.control}</div> : null}
        <label className="as-buscar">
          <span>Buscar asunto</span>
          <input ref={campoBuscar} type="search" value={buscar} aria-keyshortcuts="/" onChange={(e) => setBuscar(e.target.value)} placeholder="Título, persona, inmueble o folio" autoComplete="off" />
          <Icono nombre="buscar" tamano={18} aria-hidden />
        </label>
        <Popover open={filtrosAbiertos} onOpenChange={setFiltrosAbiertos}>
          <PopoverTrigger className="as-fbtn" aria-label={nFiltros ? `Filtrar y ordenar (${nFiltros} activos)` : "Filtrar y ordenar"} title="Filtrar y ordenar">
            <Icono nombre="filtrar" tamano={20} aria-hidden />
            {nFiltros ? <span className="as-fb" aria-hidden>{nFiltros}</span> : null}
          </PopoverTrigger>
          <PopoverContent align="end" className="as-fpop">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h2>Filtrar y ordenar</h2>
              <button type="button" className="as-link" aria-disabled={!nFiltros} onClick={() => { if (nFiltros) limpiar(); }}>Limpiar</button>
            </div>
            <div className="as-card">
              <div className="as-swrow">
                <label htmlFor="as-f-avisos"><span>Solo con avisos</span><span>{delEstado.filter((f) => (cuentaAvisos.get(f.id) ?? 0) > 0).length}</span></label>
                <Switch id="as-f-avisos" checked={conAvisos} onCheckedChange={setConAvisos} />
              </div>
              <div className="as-swrow">
                <label htmlFor="as-f-sin"><span>Sin siguiente paso</span><span>{delEstado.filter((f) => !f.sigue).length}</span></label>
                <Switch id="as-f-sin" checked={sinSiguiente} onCheckedChange={setSinSiguiente} />
              </div>
            </div>
            {tiposEnLista.length > 1 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="as-fh" id="as-f-tipo">Tipo</span>
                <div className="as-card" role="group" aria-labelledby="as-f-tipo">
                  {tiposEnLista.map((t) => {
                    const on = tipos.includes(t);
                    return (
                      <button key={t} type="button" className="as-ck" role="checkbox" aria-checked={on} onClick={() => setTipos(on ? tipos.filter((x) => x !== t) : [...tipos, t])}>
                        <span className="as-box" aria-hidden>{on ? <Gesto nombre="palomita" tamano={14} /> : null}</span>
                        <span>{t}</span><span className="as-h">{delEstado.filter((f) => f.tipo === t).length}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <Desplegable etiqueta="Ordenar por" valor={orden} opciones={ORDENES} alElegir={(v) => { if (v) setOrden(v); }} />
            <Boton bloque onClick={() => setFiltrosAbiertos(false)}>{visibles.length ? `Ver ${visibles.length} ${visibles.length === 1 ? "asunto" : "asuntos"}` : "Ningún asunto coincide"}</Boton>
          </PopoverContent>
        </Popover>
      </div>

      {nFiltros ? (
        <div className="as-fsum" aria-live="polite">
          <span>{resumenFiltros.charAt(0).toUpperCase() + resumenFiltros.slice(1)}</span>
          <button type="button" className="as-link" onClick={limpiar}>Limpiar</button>
        </div>
      ) : null}

      {cargando ? <Cargando lineas={5} etiqueta="Cargando asuntos" /> : null}
      {exp.error ? <EstadoError texto={exp.error} alReintentar={() => { setExp((s) => ({ ...s, cargando: true, error: null })); setIntento((n) => n + 1); }} /> : null}
      {!cargando && !exp.error && filas.length === 0 ? (
        <div className="as-card as-vacio">
          <strong>Crea tu primer asunto</strong>
          <span>Basta con el título, por ejemplo «Venta de la casa de Mariana». Personas, inmueble y guía se agregan después, si hacen falta.</span>
          <Boton onClick={() => setCreando(true)}>Nuevo asunto</Boton>
        </div>
      ) : null}
      {!cargando && !exp.error && filas.length > 0 && visibles.length === 0 ? (
        <div className="as-card as-vacio">
          <strong>Ningún asunto coincide</strong>
          <span>Prueba con otra palabra, cambia la vista o limpia los filtros.</span>
          <Boton variante="secundario" onClick={() => setCreando(true)}>Crear uno nuevo</Boton>
        </div>
      ) : null}

      {visibles.length ? (telefono ? (
        <Tarjetas filas={visibles} porId={porId} avisos={cuentaAvisos} abierta={abierta} alAbrir={abrir} alHecho={hecho} alManana={aManana} />
      ) : (
        <div className="as-tbl">
          <div className="as-thead" aria-hidden><span>Asunto</span><span>Lo que sigue</span><span>Personas</span><span>Para Fortius</span></div>
          {visibles.map((f) => {
            const s = sigueEnFila(f, porId.get(f.id) ?? null);
            const n = cuentaAvisos.get(f.id) ?? 0;
            return (
              <button key={f.id} type="button" className="pn-fila as-trow" onClick={() => abrir(f.id)} aria-current={f.id === abierta || undefined}>
                <span className="as-c1">
                  <span className="as-tt">{f.titulo}</span>
                  <span className="as-ty">{f.tipo}{n ? <span className="as-warnline">{n === 1 ? "1 aviso" : `${n} avisos`}</span> : null}</span>
                </span>
                <span className={`as-rnext ${s.clase}`}><span>{s.texto}</span></span>
                <span className="as-c3">{f.persona?.nombre || "—"}</span>
                <span className="as-c4">{f.paraFortius ? pesosCortos(f.paraFortius) : "—"}</span>
              </button>
            );
          })}
        </div>
      )) : null}
      <p className="pn-solo-lector" aria-live="polite">{fila && posicion >= 0 ? `${posicion + 1} de ${visibles.length}: ${fila.titulo}` : ""}</p>
      {visibles.length && !telefono ? (
        <div className="as-teclas" aria-label="Atajos de teclado">
          <span><span className="as-kbd">J</span> <span className="as-kbd">K</span> moverse</span>
          <span><span className="as-kbd">E</span> hecho</span>
          <span><span className="as-kbd">P</span> posponer</span>
          <span><span className="as-kbd">N</span> nuevo</span>
          <span><span className="as-kbd">Enter</span> abrir</span>
          <span><span className="as-kbd">Esc</span> cerrar</span>
          <span><span className="as-kbd">/</span> buscar</span>
        </div>
      ) : null}

      <HojaAdaptable abierta={fila !== null && !telefono} titulo={fila?.titulo ?? "Asunto"} alCerrar={() => cerrar()} anchoPanel={680}
        cabecera={fila ? <><span className="as-folio">{fila.folio}</span>{posicion >= 0 ? <span className="as-pos">{posicion + 1} de {visibles.length}</span> : null}</> : null}
        herramientas={fila ? (
          <>
            <button type="button" className="as-tb" onClick={() => irA(-1)} aria-disabled={posicion <= 0} aria-label="Asunto anterior (K)" title="Anterior (K)"><Gesto nombre="abajo" tamano={18} style={{ transform: "rotate(180deg)" }} /></button>
            <button type="button" className="as-tb" onClick={() => irA(1)} aria-disabled={posicion < 0 || posicion >= visibles.length - 1} aria-label="Asunto siguiente (J)" title="Siguiente (J)"><Gesto nombre="abajo" tamano={18} /></button>
          </>
        ) : null}
        opciones={opcionesMenu}>
        {ficha}
      </HojaAdaptable>
      {encimas}
      <Hoja abierta={creando} titulo="Nuevo asunto" alCerrar={() => setCreando(false)}>
        {creando ? <FormularioAsunto personas={personas.datos} inmuebles={inmuebles.datos} asesores={asesores.datos} miAsesor={miAsesor} ocupado={ocupado} alGuardar={(d) => void crear(d)} /> : null}
      </Hoja>
    </div>
  );
}

/** Teléfono: tarjetas del boceto. Deslizar a la derecha marca hecho lo que sigue (o abre el asunto para anotarlo); a la izquierda, a mañana. */
// Las opciones se pintan en su propio componente: sus acciones leen la versión vigente (ref) solo al elegirse.
function OpcionesDelMenu({ opciones }: { opciones: { etiqueta: string; alElegir: () => void; peligro?: boolean }[] }) {
  return <>{opciones.map((o) => <DropdownMenuItem key={o.etiqueta} peligro={o.peligro} onSelect={o.alElegir}>{o.etiqueta}</DropdownMenuItem>)}</>;
}

function Tarjetas({ filas, porId, avisos, abierta, alAbrir, alHecho, alManana }: {
  filas: readonly FilaAsunto[]; porId: ReadonlyMap<string, Expediente>; avisos: ReadonlyMap<string, number>; abierta: string | null;
  alAbrir: (id: string) => void; alHecho: (f: FilaAsunto) => void; alManana: (f: FilaAsunto) => void;
}) {
  const [arrastre, setArrastre] = useState<{ id: string; dx: number } | null>(null);
  const toque = useRef<{ id: string; x0: number; y0: number; horiz: boolean; pid: number } | null>(null);
  const omitir = useRef(false);
  const amortigua = (dx: number) => { const a = Math.abs(dx); const s = dx < 0 ? -1 : 1; return a <= 110 ? dx : s * (110 + (a - 110) * 0.3); };
  const soltar = (f: FilaAsunto) => {
    const dx = arrastre?.id === f.id ? arrastre.dx : 0;
    toque.current = null;
    setArrastre(null);
    if (Math.abs(dx) < 90) return;
    omitir.current = true;
    if (dx > 0) { if (f.sigue) alHecho(f); else alAbrir(f.id); } else if (f.sigue) alManana(f);
  };
  return (
    <div className="as-tarjetas">
      {filas.map((f) => {
        const s = sigueEnFila(f, porId.get(f.id) ?? null);
        const n = avisos.get(f.id) ?? 0;
        const dx = arrastre?.id === f.id ? arrastre.dx : 0;
        return (
          <div key={f.id} className="as-swrap">
            <div className="as-under" aria-hidden style={{ background: dx > 0 ? "var(--accent)" : dx < 0 ? "var(--warning)" : "transparent" }}>
              <span>{f.sigue ? "Hecho" : "Anotar"}</span><span>Mañana</span>
            </div>
            <button type="button" className="pn-fila as-acard" aria-current={f.id === abierta || undefined}
              style={{ transform: `translateX(${dx}px)`, transition: dx ? "none" : "transform 240ms cubic-bezier(.23,1,.32,1)" }}
              onClick={() => { if (omitir.current) { omitir.current = false; return; } alAbrir(f.id); }}
              onPointerDown={(e) => { if (e.pointerType === "mouse") return; toque.current = { id: f.id, x0: e.clientX, y0: e.clientY, horiz: false, pid: e.pointerId }; }}
              onPointerMove={(e) => {
                const t = toque.current;
                if (!t || t.id !== f.id || e.pointerId !== t.pid) return;
                const mx = e.clientX - t.x0, my = e.clientY - t.y0;
                if (!t.horiz) {
                  if (Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(my)) { t.horiz = true; e.currentTarget.setPointerCapture?.(t.pid); }
                  else if (Math.abs(my) > 8) { toque.current = null; return; } else return;
                }
                setArrastre({ id: f.id, dx: amortigua(mx) });
              }}
              onPointerUp={() => soltar(f)} onPointerCancel={() => { toque.current = null; setArrastre(null); }}>
              <span className="as-atitle">{f.titulo}</span>
              <span className={`as-rnext ${s.clase}`}><span>{s.texto}</span></span>
              <span className="as-ameta">{[f.persona?.nombre, f.inmueble?.titulo, f.tipo].filter(Boolean).join(" · ")}</span>
              {n ? <span className="as-warnline">{n === 1 ? "1 aviso" : `${n} avisos`}</span> : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Lo que mandan las rutas de operación no trae el título ni el tipo de PN-02: se conservan los que ya tenía. */
function fusionar(antes: Expediente, nuevo: Expediente): Expediente {
  return { ...nuevo, titulo: nuevo.titulo ?? antes.titulo ?? null, tipo_asunto: nuevo.tipo_asunto ?? antes.tipo_asunto ?? null };
}

export default function PaginaAsuntos() {
  return <Suspense fallback={<div className="as-pagina"><Cargando lineas={5} etiqueta="Cargando" /></div>}><Asuntos /></Suspense>;
}
